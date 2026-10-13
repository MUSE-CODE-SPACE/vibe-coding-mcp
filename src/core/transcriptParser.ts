/**
 * Claude Code transcript parser.
 *
 * Claude Code writes every conversation to
 * `~/.claude/projects/<project-slug>/<session-id>.jsonl`. Each line is one
 * JSON record; the ones we care about are `type: "user"` and
 * `type: "assistant"`, whose `message.content` is either a string or an
 * array of content blocks (`text`, `tool_use`, `tool_result`, `thinking`).
 *
 * This module turns that raw stream into a compact, structured
 * `ParsedTranscript` that the capture engine (`captureSession.ts`) can map
 * onto a stored vibe-coding session — no LLM call required.
 */

import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

/** A file the assistant created or modified via an edit tool. */
export interface FileChange {
  filePath: string;
  /** `write` = whole-file write, `edit` = partial edit, `notebook` = NotebookEdit. */
  kind: 'write' | 'edit' | 'notebook';
  /** Number of times this file was touched in the session. */
  touches: number;
  /** Most recent full-file content (Write) or new_string (Edit). Truncated by `maxSnippetChars`. */
  lastSnippet?: string;
  language: string;
  firstTouchedAt?: string;
  lastTouchedAt?: string;
}

/** A shell command the assistant ran via the Bash tool. */
export interface CommandRun {
  command: string;
  description?: string;
  timestamp?: string;
}

/** A user prompt (human-typed, tool results excluded). */
export interface UserPrompt {
  text: string;
  timestamp?: string;
}

export interface ParsedTranscript {
  /** Claude Code session id (file basename). */
  claudeSessionId?: string;
  cwd?: string;
  gitBranch?: string;
  claudeVersion?: string;
  startedAt?: string;
  endedAt?: string;
  /** Wall-clock seconds between first and last record. */
  durationSec?: number;
  userPrompts: UserPrompt[];
  /** Assistant prose (text blocks only), in order. */
  assistantTexts: string[];
  fileChanges: FileChange[];
  commands: CommandRun[];
  /** Counts of every tool invoked, e.g. { Edit: 12, Bash: 30 }. */
  toolCounts: Record<string, number>;
  /** Number of assistant turns (records of type assistant). */
  assistantTurns: number;
  /** Lines that could not be parsed as JSON. */
  skippedLines: number;
  /** Title Claude Code assigned to the session (`ai-title` record), if any. */
  aiTitle?: string;
}

export interface ParseOptions {
  /** Max characters kept per file snippet. Default 4000. */
  maxSnippetChars?: number;
  /** Max characters kept per user prompt / assistant text. Default 2000. */
  maxTextChars?: number;
  /** Max number of commands kept. Default 200. */
  maxCommands?: number;
}

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);

/** Map a file extension to a fenced-code language id. */
export function languageFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx', mjs: 'javascript', cjs: 'javascript',
    py: 'python', go: 'go', rs: 'rust', java: 'java', kt: 'kotlin', swift: 'swift', rb: 'ruby',
    php: 'php', cs: 'csharp', cpp: 'cpp', cc: 'cpp', c: 'c', h: 'c', hpp: 'cpp',
    md: 'markdown', json: 'json', yml: 'yaml', yaml: 'yaml', toml: 'toml', xml: 'xml',
    html: 'html', css: 'css', scss: 'scss', sql: 'sql', sh: 'bash', zsh: 'bash', bash: 'bash',
    ipynb: 'json', vue: 'vue', svelte: 'svelte', dart: 'dart', lua: 'lua', ex: 'elixir', exs: 'elixir',
  };
  return map[ext] || (ext || 'text');
}

/** Strip Claude Code's injected wrapper tags from a human prompt. */
export function cleanUserText(text: string): string {
  return text
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
    .replace(/<command-name>[\s\S]*?<\/command-name>/g, '')
    .replace(/<command-message>[\s\S]*?<\/command-message>/g, '')
    .replace(/<command-args>[\s\S]*?<\/command-args>/g, '')
    .replace(/<local-command-stdout>[\s\S]*?<\/local-command-stdout>/g, '')
    // Pasted blocks (emails, logs, …) are context, not the ask: collapse them
    // to a short marker so titles and "what was asked" reflect the user's words.
    // Note: Claude Code writes the closing tag with the id too: </pasted_content id="…">
    .replace(/<pasted_content[^>]*>([\s\S]*?)<\/pasted_content[^>]*>/g, (_m, inner: string) => {
      const preview = inner.replace(/\s+/g, ' ').trim().slice(0, 80);
      return preview ? `[pasted: ${preview}…]` : '';
    })
    .replace(/<pasted_content[^>]*>/g, '')
    .replace(/<\/pasted_content[^>]*>/g, '')
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + `\n… [truncated ${text.length - max} chars]`;
}

interface RawRecord {
  type?: string;
  sessionId?: string;
  cwd?: string;
  gitBranch?: string;
  version?: string;
  timestamp?: string;
  isSidechain?: boolean;
  title?: string;
  message?: {
    role?: string;
    content?: unknown;
  };
}

/**
 * Parse transcript text (JSONL) into a structured object.
 */
export function parseTranscriptText(text: string, options: ParseOptions = {}): ParsedTranscript {
  const maxSnippetChars = options.maxSnippetChars ?? 4000;
  const maxTextChars = options.maxTextChars ?? 2000;
  const maxCommands = options.maxCommands ?? 200;

  const result: ParsedTranscript = {
    userPrompts: [],
    assistantTexts: [],
    fileChanges: [],
    commands: [],
    toolCounts: {},
    assistantTurns: 0,
    skippedLines: 0,
  };

  const fileMap = new Map<string, FileChange>();

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let rec: RawRecord;
    try {
      rec = JSON.parse(trimmed) as RawRecord;
    } catch {
      result.skippedLines += 1;
      continue;
    }

    if (rec.type === 'ai-title' && typeof rec.title === 'string' && !result.aiTitle) {
      result.aiTitle = rec.title;
    }

    if (rec.type !== 'user' && rec.type !== 'assistant') continue;
    // Sub-agent side-chains are summarized by the parent; skip to avoid double counting.
    if (rec.isSidechain) continue;

    // Session-level metadata: first non-empty wins.
    result.claudeSessionId ??= rec.sessionId;
    result.cwd ??= rec.cwd;
    result.gitBranch ??= rec.gitBranch;
    result.claudeVersion ??= rec.version;
    if (rec.timestamp) {
      result.startedAt ??= rec.timestamp;
      result.endedAt = rec.timestamp;
    }

    const content = rec.message?.content;

    if (rec.type === 'user') {
      if (typeof content === 'string') {
        const cleaned = cleanUserText(content);
        if (cleaned) result.userPrompts.push({ text: truncate(cleaned, maxTextChars), timestamp: rec.timestamp });
      } else if (Array.isArray(content)) {
        // A user record that only carries tool_result blocks is not a human prompt.
        const textBlocks = content.filter(
          (b): b is { type: 'text'; text: string } =>
            !!b && typeof b === 'object' && (b as { type?: string }).type === 'text' && typeof (b as { text?: unknown }).text === 'string',
        );
        const joined = cleanUserText(textBlocks.map((b) => b.text).join('\n'));
        if (joined) result.userPrompts.push({ text: truncate(joined, maxTextChars), timestamp: rec.timestamp });
      }
      continue;
    }

    // assistant
    result.assistantTurns += 1;
    if (!Array.isArray(content)) {
      if (typeof content === 'string' && content.trim()) {
        result.assistantTexts.push(truncate(content.trim(), maxTextChars));
      }
      continue;
    }

    for (const block of content) {
      if (!block || typeof block !== 'object') continue;
      const b = block as { type?: string; text?: string; name?: string; input?: Record<string, unknown> };

      if (b.type === 'text' && typeof b.text === 'string' && b.text.trim()) {
        result.assistantTexts.push(truncate(b.text.trim(), maxTextChars));
        continue;
      }

      if (b.type !== 'tool_use' || typeof b.name !== 'string') continue;

      const toolName = b.name;
      result.toolCounts[toolName] = (result.toolCounts[toolName] || 0) + 1;
      const input = (b.input && typeof b.input === 'object' ? b.input : {}) as Record<string, unknown>;

      if (EDIT_TOOLS.has(toolName)) {
        const filePath = typeof input.file_path === 'string'
          ? input.file_path
          : typeof input.notebook_path === 'string'
            ? input.notebook_path
            : undefined;
        if (!filePath) continue;

        const kind: FileChange['kind'] =
          toolName === 'Write' ? 'write' : toolName === 'NotebookEdit' ? 'notebook' : 'edit';

        let snippet: string | undefined;
        if (toolName === 'Write' && typeof input.content === 'string') snippet = input.content;
        else if (toolName === 'Edit' && typeof input.new_string === 'string') snippet = input.new_string;
        else if (toolName === 'NotebookEdit' && typeof input.new_source === 'string') snippet = input.new_source;
        else if (toolName === 'MultiEdit' && Array.isArray(input.edits)) {
          snippet = (input.edits as Array<{ new_string?: string }>)
            .map((e) => e.new_string)
            .filter((s): s is string => typeof s === 'string')
            .join('\n\n');
        }

        const existing = fileMap.get(filePath);
        if (existing) {
          existing.touches += 1;
          existing.lastTouchedAt = rec.timestamp;
          // Prefer a whole-file Write over partial edits for the snapshot.
          if (snippet && (kind === 'write' || existing.kind !== 'write')) {
            existing.lastSnippet = truncate(snippet, maxSnippetChars);
            existing.kind = kind;
          }
        } else {
          const change: FileChange = {
            filePath,
            kind,
            touches: 1,
            language: languageFromPath(filePath),
            firstTouchedAt: rec.timestamp,
            lastTouchedAt: rec.timestamp,
          };
          if (snippet) change.lastSnippet = truncate(snippet, maxSnippetChars);
          fileMap.set(filePath, change);
          result.fileChanges.push(change);
        }
        continue;
      }

      if (toolName === 'Bash' && typeof input.command === 'string' && result.commands.length < maxCommands) {
        result.commands.push({
          command: truncate(input.command, 500),
          description: typeof input.description === 'string' ? input.description : undefined,
          timestamp: rec.timestamp,
        });
      }
    }
  }

  if (result.startedAt && result.endedAt) {
    const ms = new Date(result.endedAt).getTime() - new Date(result.startedAt).getTime();
    if (Number.isFinite(ms) && ms >= 0) result.durationSec = Math.round(ms / 1000);
  }

  return result;
}

/**
 * Parse a transcript file from disk.
 */
export async function parseTranscriptFile(filePath: string, options?: ParseOptions): Promise<ParsedTranscript> {
  const resolved = expandHome(filePath);
  const text = await fs.readFile(resolved, 'utf-8');
  const parsed = parseTranscriptText(text, options);
  parsed.claudeSessionId ??= path.basename(resolved, '.jsonl');
  return parsed;
}

/** Expand a leading `~` to the home directory. */
export function expandHome(p: string): string {
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

/** Root of Claude Code's per-project transcript store. */
export function claudeProjectsDir(): string {
  return process.env.CLAUDE_CONFIG_DIR
    ? path.join(process.env.CLAUDE_CONFIG_DIR, 'projects')
    : path.join(os.homedir(), '.claude', 'projects');
}

/**
 * Claude Code derives the per-project folder name by replacing every
 * non-alphanumeric character of the absolute cwd with `-`.
 */
export function projectSlug(cwd: string): string {
  return path.resolve(cwd).replace(/[^a-zA-Z0-9]/g, '-');
}

/**
 * Find the most recently modified transcript for a working directory.
 * Returns `null` if the project folder does not exist or holds no `.jsonl`.
 */
export async function findLatestTranscript(cwd: string): Promise<string | null> {
  const dir = path.join(claudeProjectsDir(), projectSlug(cwd));
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return null;
  }
  let best: { file: string; mtime: number } | null = null;
  for (const name of entries) {
    if (!name.endsWith('.jsonl')) continue;
    const full = path.join(dir, name);
    try {
      const st = await fs.stat(full);
      if (!best || st.mtimeMs > best.mtime) best = { file: full, mtime: st.mtimeMs };
    } catch {
      /* ignore */
    }
  }
  return best?.file ?? null;
}

/** List all transcripts for a working directory, newest first. */
export async function listTranscripts(cwd: string): Promise<Array<{ path: string; modifiedAt: string; sizeBytes: number }>> {
  const dir = path.join(claudeProjectsDir(), projectSlug(cwd));
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  const out: Array<{ path: string; modifiedAt: string; sizeBytes: number }> = [];
  for (const name of entries) {
    if (!name.endsWith('.jsonl')) continue;
    const full = path.join(dir, name);
    try {
      const st = await fs.stat(full);
      out.push({ path: full, modifiedAt: st.mtime.toISOString(), sizeBytes: st.size });
    } catch {
      /* ignore */
    }
  }
  return out.sort((a, b) => (a.modifiedAt < b.modifiedAt ? 1 : -1));
}
