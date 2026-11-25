/**
 * Codex CLI transcript ("rollout") parser.
 *
 * Codex writes each session to
 * `~/.codex/sessions/YYYY/MM/DD/rollout-<timestamp>-<session-id>.jsonl`.
 * Every line is `{ timestamp, type, payload }`:
 *
 *   session_meta                      id, cwd, cli_version
 *   turn_context                      model, cwd
 *   response_item / message           role user | assistant | developer
 *   response_item / custom_tool_call  name "exec": a JavaScript snippet calling
 *                                     `tools.exec_command({cmd})`, `tools.apply_patch("…")`, …
 *   response_item / function_call     older builds: name "shell" | "apply_patch" with JSON arguments
 *   event_msg / token_count           cumulative token usage
 *
 * The format moves between Codex releases, so everything here is
 * best-effort: unknown records are skipped, and a tool call we cannot decode
 * still counts toward `toolCounts`.
 */

import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';

import {
  ParsedTranscript,
  ParseOptions,
  FileChange,
  TranscriptRef,
  emptyTokens,
  languageFromPath,
} from './transcriptParser.js';

interface CodexRecord {
  timestamp?: string;
  type?: string;
  payload?: Record<string, unknown>;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + `\n… [truncated ${text.length - max} chars]`;
}

/** Root of Codex's session store. */
export function codexSessionsDir(): string {
  return path.join(process.env.CODEX_HOME ?? path.join(os.homedir(), '.codex'), 'sessions');
}

/**
 * Decode a JavaScript string literal starting at `src[start]` (a quote
 * character). Template literals stop at the first `${`. Returns `null` when
 * `start` is not a quote.
 */
export function readJsStringLiteral(src: string, start: number): { value: string; end: number } | null {
  const quote = src[start];
  if (quote !== '"' && quote !== "'" && quote !== '`') return null;
  let out = '';
  let i = start + 1;
  while (i < src.length) {
    const ch = src[i];
    if (ch === quote) return { value: out, end: i + 1 };
    if (quote === '`' && ch === '$' && src[i + 1] === '{') return { value: out, end: i };
    if (ch !== '\\') {
      out += ch;
      i += 1;
      continue;
    }
    const next = src[i + 1];
    i += 2;
    switch (next) {
      case 'n': out += '\n'; break;
      case 't': out += '\t'; break;
      case 'r': out += '\r'; break;
      case 'b': out += '\b'; break;
      case 'f': out += '\f'; break;
      case 'v': out += '\v'; break;
      case '0': out += '\0'; break;
      case '\n': break; // line continuation
      case 'x': {
        const hex = src.slice(i, i + 2);
        if (/^[0-9a-fA-F]{2}$/.test(hex)) {
          out += String.fromCharCode(parseInt(hex, 16));
          i += 2;
        }
        break;
      }
      case 'u': {
        if (src[i] === '{') {
          const close = src.indexOf('}', i);
          const cp = close > 0 ? parseInt(src.slice(i + 1, close), 16) : NaN;
          if (Number.isFinite(cp)) {
            out += String.fromCodePoint(cp);
            i = close + 1;
          }
        } else {
          const hex = src.slice(i, i + 4);
          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            out += String.fromCharCode(parseInt(hex, 16));
            i += 4;
          }
        }
        break;
      }
      default:
        if (next !== undefined) out += next;
    }
  }
  return { value: out, end: i };
}

export interface PatchFile {
  filePath: string;
  kind: 'write' | 'edit' | 'delete';
  /** Added lines (`+…`) of this file's hunk(s). */
  added: string;
}

/** Split an `apply_patch` envelope into per-file entries. */
export function parseApplyPatch(patch: string): PatchFile[] {
  const files: PatchFile[] = [];
  let current: PatchFile | null = null;
  const added: string[] = [];
  const flush = () => {
    if (current) {
      current.added = added.join('\n');
      files.push(current);
    }
    added.length = 0;
  };
  for (const line of patch.split('\n')) {
    const header = /^\*\*\* (Add|Update|Delete) File: (.+)$/.exec(line.trimEnd());
    if (header) {
      flush();
      current = {
        filePath: header[2].trim(),
        kind: header[1] === 'Add' ? 'write' : header[1] === 'Delete' ? 'delete' : 'edit',
        added: '',
      };
      continue;
    }
    if (!current) continue;
    if (line.startsWith('*** ')) continue; // Move to / End Patch / End of File
    if (line.startsWith('+')) added.push(line.slice(1));
  }
  flush();
  return files;
}

/** Calls found inside one `exec` JavaScript snippet. */
export function parseExecScript(script: string): { tools: string[]; commands: string[]; patches: string[] } {
  const tools: string[] = [];
  const commands: string[] = [];
  const patches: string[] = [];
  const callRe = /tools\.([A-Za-z0-9_]+)\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = callRe.exec(script)) !== null) {
    const name = m[1];
    tools.push(name);
    const argStart = m.index + m[0].length;

    if (name === 'exec_command') {
      // tools.exec_command({cmd:"…", …}) — the key may be quoted.
      const window = script.slice(argStart, argStart + 400);
      const key = /["']?(?:cmd|command)["']?\s*:\s*/.exec(window);
      if (key) {
        const lit = readJsStringLiteral(script, argStart + key.index + key[0].length);
        if (lit?.value.trim()) commands.push(lit.value);
      }
    } else if (name === 'apply_patch') {
      let i = argStart;
      while (i < script.length && /\s/.test(script[i])) i += 1;
      const lit = readJsStringLiteral(script, i);
      if (lit?.value.includes('*** ')) patches.push(lit.value);
    }
  }
  return { tools, commands, patches };
}

/** Injected context blocks that sit in user-role messages but were not typed by the human. */
function isInjectedUserText(text: string): boolean {
  const t = text.trimStart();
  return (
    t.startsWith('<environment_context') ||
    t.startsWith('<user_instructions') ||
    t.startsWith('<codex_internal_context') ||
    t.startsWith('<turn_aborted') ||
    t.startsWith('<user_shell_command') ||
    t.startsWith('# AGENTS.md instructions')
  );
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/**
 * Parse a Codex rollout (JSONL text) into the same `ParsedTranscript` shape
 * the Claude Code parser produces.
 */
export function parseCodexTranscriptText(text: string, options: ParseOptions = {}): ParsedTranscript {
  const maxSnippetChars = options.maxSnippetChars ?? 4000;
  const maxTextChars = options.maxTextChars ?? 2000;
  const maxCommands = options.maxCommands ?? 200;
  const idleGapSec = options.idleGapSec ?? 1800;

  const result: ParsedTranscript = {
    source: 'codex',
    tokens: emptyTokens(),
    models: {},
    userPrompts: [],
    assistantTexts: [],
    fileChanges: [],
    commands: [],
    toolCounts: {},
    assistantTurns: 0,
    skippedLines: 0,
  };

  const fileMap = new Map<string, FileChange>();
  let prevTs: number | undefined;
  let activeSec = 0;
  let currentModel: string | undefined;
  let lastUsage: Record<string, unknown> | undefined;

  const count = (tool: string) => {
    result.toolCounts[tool] = (result.toolCounts[tool] || 0) + 1;
  };
  const addCommand = (command: string, timestamp?: string) => {
    if (result.commands.length >= maxCommands || !command.trim()) return;
    result.commands.push({ command: truncate(command, 500), timestamp });
  };
  const addPatch = (patch: string, timestamp?: string) => {
    for (const f of parseApplyPatch(patch)) {
      if (f.kind === 'delete') continue;
      const abs = path.isAbsolute(f.filePath) || !result.cwd ? f.filePath : path.join(result.cwd, f.filePath);
      const kind: FileChange['kind'] = f.kind === 'write' ? 'write' : 'edit';
      const existing = fileMap.get(abs);
      if (existing) {
        existing.touches += 1;
        existing.lastTouchedAt = timestamp;
        if (f.added && (kind === 'write' || existing.kind !== 'write')) {
          existing.lastSnippet = truncate(f.added, maxSnippetChars);
          existing.kind = kind;
        }
      } else {
        const change: FileChange = {
          filePath: abs,
          kind,
          touches: 1,
          language: languageFromPath(abs),
          firstTouchedAt: timestamp,
          lastTouchedAt: timestamp,
        };
        if (f.added) change.lastSnippet = truncate(f.added, maxSnippetChars);
        fileMap.set(abs, change);
        result.fileChanges.push(change);
      }
    }
  };

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let rec: CodexRecord;
    try {
      rec = JSON.parse(trimmed) as CodexRecord;
    } catch {
      result.skippedLines += 1;
      continue;
    }
    const p = rec.payload && typeof rec.payload === 'object' ? rec.payload : {};

    if (rec.timestamp) {
      result.startedAt ??= rec.timestamp;
      result.endedAt = rec.timestamp;
      const ts = new Date(rec.timestamp).getTime();
      if (Number.isFinite(ts)) {
        if (prevTs !== undefined) {
          const gap = (ts - prevTs) / 1000;
          if (gap >= 0 && gap <= idleGapSec) activeSec += gap;
        }
        prevTs = ts;
      }
    }

    if (rec.type === 'session_meta') {
      if (typeof p.id === 'string') result.claudeSessionId ??= p.id;
      if (typeof p.cwd === 'string') result.cwd ??= p.cwd;
      if (typeof p.cli_version === 'string') result.claudeVersion ??= p.cli_version;
      const git = p.git as { branch?: unknown } | undefined;
      if (git && typeof git.branch === 'string') result.gitBranch ??= git.branch;
      continue;
    }

    if (rec.type === 'turn_context') {
      if (typeof p.model === 'string') currentModel = p.model;
      if (typeof p.cwd === 'string') result.cwd ??= p.cwd;
      continue;
    }

    if (rec.type === 'token_usage_record') {
      if (currentModel) result.models[currentModel] = (result.models[currentModel] || 0) + 1;
      continue;
    }

    if (rec.type === 'event_msg') {
      if (p.type === 'token_count') {
        const info = p.info as { total_token_usage?: Record<string, unknown> } | undefined;
        if (info?.total_token_usage) lastUsage = info.total_token_usage;
      }
      continue;
    }

    if (rec.type !== 'response_item') continue;

    if (p.type === 'message') {
      const content = Array.isArray(p.content) ? (p.content as Array<Record<string, unknown>>) : [];
      if (p.role === 'assistant') {
        result.assistantTurns += 1;
        for (const c of content) {
          if (typeof c.text === 'string' && c.text.trim()) result.assistantTexts.push(truncate(c.text.trim(), maxTextChars));
        }
        continue;
      }
      if (p.role !== 'user') continue;

      const passthrough = p.internal_chat_message_metadata_passthrough as { content_item_kinds?: unknown } | undefined;
      const kinds = Array.isArray(passthrough?.content_item_kinds) ? (passthrough!.content_item_kinds as unknown[]) : undefined;
      const parts: string[] = [];
      content.forEach((c, idx) => {
        if (typeof c.text !== 'string') return;
        const kind = kinds && kinds.length === content.length ? kinds[idx] : undefined;
        if (kind === 'user.goal') {
          const goal = /User set the goal: "([\s\S]*?)"\s*\n/.exec(c.text);
          if (goal) parts.push(goal[1]);
          return;
        }
        if (kind !== undefined ? kind !== 'user.text' : isInjectedUserText(c.text)) return;
        if (isInjectedUserText(c.text)) return;
        parts.push(c.text);
      });
      const joined = parts.join('\n').trim();
      if (joined) result.userPrompts.push({ text: truncate(joined, maxTextChars), timestamp: rec.timestamp });
      continue;
    }

    if (p.type === 'custom_tool_call' || p.type === 'function_call' || p.type === 'local_shell_call') {
      const name = typeof p.name === 'string' ? p.name : String(p.type);
      const input = typeof p.input === 'string' ? p.input : '';
      let args: Record<string, unknown> = {};
      if (typeof p.arguments === 'string') {
        try {
          const parsed = JSON.parse(p.arguments) as unknown;
          if (parsed && typeof parsed === 'object') args = parsed as Record<string, unknown>;
        } catch {
          /* not JSON */
        }
      }

      if (name === 'exec' && input) {
        const script = parseExecScript(input);
        if (!script.tools.length) count('exec');
        script.tools.forEach(count);
        script.commands.forEach((c) => addCommand(c, rec.timestamp));
        script.patches.forEach((patch) => addPatch(patch, rec.timestamp));
        continue;
      }

      count(name);
      if (name === 'apply_patch') {
        const patch = input || (typeof args.input === 'string' ? args.input : typeof args.patch === 'string' ? args.patch : '');
        if (patch) addPatch(patch, rec.timestamp);
      } else if (name === 'shell' || name === 'exec_command' || name === 'local_shell' || p.type === 'local_shell_call') {
        const action = p.action as { command?: unknown } | undefined;
        const raw = args.command ?? args.cmd ?? action?.command;
        if (typeof raw === 'string') addCommand(raw, rec.timestamp);
        else if (Array.isArray(raw)) {
          const argv = raw.filter((a): a is string => typeof a === 'string');
          // ["bash", "-lc", "<script>"] → keep the script.
          const script = argv.length >= 3 && /^-l?c$/.test(argv[1]) ? argv.slice(2).join(' ') : argv.join(' ');
          if (script.includes('*** Begin Patch')) addPatch(script, rec.timestamp);
          else addCommand(script, rec.timestamp);
        }
      }
    }
  }

  if (lastUsage) {
    const inputAll = num(lastUsage.input_tokens);
    const cached = num(lastUsage.cached_input_tokens);
    result.tokens.cacheRead = cached;
    result.tokens.cacheWrite = num(lastUsage.cache_write_input_tokens);
    // OpenAI-style accounting: `input_tokens` already includes the cached part.
    result.tokens.input = Math.max(0, inputAll - cached);
    result.tokens.output = num(lastUsage.output_tokens);
    result.tokens.total = num(lastUsage.total_tokens) || inputAll + result.tokens.output;
  }
  if (!Object.keys(result.models).length && currentModel) result.models[currentModel] = 1;

  if (result.startedAt && result.endedAt) {
    const ms = new Date(result.endedAt).getTime() - new Date(result.startedAt).getTime();
    if (Number.isFinite(ms) && ms >= 0) {
      result.wallClockSec = Math.round(ms / 1000);
      result.durationSec = Math.round(activeSec);
    }
  }
  return result;
}

/** Every Codex rollout on this machine, newest first. */
export async function listCodexTranscripts(sinceMs = 0): Promise<TranscriptRef[]> {
  const out: TranscriptRef[] = [];
  const walk = async (dir: string, depth: number): Promise<void> => {
    let entries: import('fs').Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (depth < 4) await walk(full, depth + 1);
      } else if (e.isFile() && e.name.endsWith('.jsonl')) {
        try {
          const st = await fs.stat(full);
          if (st.mtimeMs < sinceMs) continue;
          out.push({ path: full, modifiedAt: st.mtime.toISOString(), sizeBytes: st.size, source: 'codex' });
        } catch {
          /* ignore */
        }
      }
    }
  };
  await walk(codexSessionsDir(), 0);
  return out.sort((a, b) => (a.modifiedAt < b.modifiedAt ? 1 : -1));
}
