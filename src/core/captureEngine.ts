/**
 * Capture engine — turns a parsed Claude Code transcript into a stored
 * vibe-coding session, idempotently.
 *
 * Idempotency key: `metadata.claudeSessionId`. Because the Claude Code `Stop`
 * hook fires at the end of *every* turn, the same transcript is captured
 * many times over a session's lifetime; every capture after the first is an
 * update of the same stored session, not a new one.
 */

import * as path from 'path';
import { promises as fs } from 'fs';
import {
  parseTranscriptFile,
  findLatestTranscript,
  isCodeLanguage,
  ParsedTranscript,
  ParseOptions,
  TokenUsage,
  TranscriptSource,
  TranscriptRef,
  listAllClaudeTranscripts,
} from './transcriptParser.js';
import { listCodexTranscripts } from './codexParser.js';
import {
  listSessions,
  saveSession,
  updateSession,
  getSession,
  getStorageDir,
  writeFileAtomic,
  SessionData,
  StoredSession,
} from './sessionStorage.js';
import { execGit } from '../utils/gitExecutor.js';
import { summarizeDesignDecisions } from '../tools/summarizeDesignDecisions.js';
import { logger } from './logger.js';

const captureLogger = logger.child({ module: 'captureEngine' });

export interface CaptureOptions extends ParseOptions {
  /** Hook event that triggered the capture (`Stop`, `SessionEnd`, `manual`, …). */
  hookEvent?: string;
  /** Override cwd (used for the project tag + transcript discovery). */
  cwd?: string;
  /** Parse + build but do not write to storage. */
  dryRun?: boolean;
  /** Skip sessions with fewer human prompts than this. Default 1. */
  minPrompts?: number;
  /** Max file changes stored as code contexts. Default 40. */
  maxFiles?: number;
  /** Max design decisions extracted. Default 10. */
  maxDecisions?: number;
  /** Extra tags to attach. */
  extraTags?: string[];
  /** Attach git commits made in the project during the session window. Default true. */
  linkCommits?: boolean;
}

/** A git commit made while the session was running. */
export interface SessionCommit {
  hash: string;
  date: string;
  subject: string;
}

export interface CaptureResult {
  status: 'created' | 'updated' | 'skipped' | 'dry-run';
  sessionId?: string;
  claudeSessionId?: string;
  transcriptPath: string;
  title: string;
  stats: {
    prompts: number;
    assistantTurns: number;
    filesChanged: number;
    commands: number;
    designDecisions: number;
    durationSec?: number;
    commits: number;
    tokens: number;
  };
  reason?: string;
  /** The session body as it was (or would be) stored. */
  session?: Omit<SessionData, 'id' | 'createdAt' | 'updatedAt'>;
}

/** Metadata shape written by the capture engine. */
export interface CaptureMetadata {
  source: TranscriptSource;
  /** Session id assigned by the agent (Claude Code or Codex) — the idempotency key. */
  agentSessionId?: string;
  /** Same id, Claude Code sessions only (kept for pre-2.16 readers). */
  claudeSessionId?: string;
  transcriptPath: string;
  cwd?: string;
  project?: string;
  gitBranch?: string;
  claudeVersion?: string;
  startedAt?: string;
  endedAt?: string;
  /** Active seconds (idle gaps > 30 min excluded). */
  durationSec?: number;
  /** First record → last record. */
  wallClockSec?: number;
  promptCount: number;
  assistantTurns: number;
  filesTouched: string[];
  commandCount: number;
  toolCounts: Record<string, number>;
  hookEvent?: string;
  capturedAt: string;
  captureCount: number;
  /** API-reported token usage for the main conversation. */
  tokens?: TokenUsage;
  /** Model id → number of API responses. */
  models?: Record<string, number>;
  /** Commits made in the project between the first and last record. */
  commits?: SessionCommit[];
  [key: string]: unknown;
}

function firstLine(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  // Prefer the user's own words over a pasted-content marker.
  return lines.find((l) => !l.startsWith('[pasted:')) ?? lines[0] ?? '';
}

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

function relativeTo(cwd: string | undefined, filePath: string): string {
  if (!cwd) return filePath;
  const rel = path.relative(cwd, filePath);
  return rel && !rel.startsWith('..') ? rel : filePath;
}

function formatDuration(sec?: number): string {
  if (sec === undefined) return 'unknown duration';
  if (sec < 60) return `${sec}s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

/** Build the human-readable title for a parsed transcript. */
export function buildTitle(parsed: ParsedTranscript): string {
  if (parsed.aiTitle?.trim()) return clip(parsed.aiTitle, 100);
  const first = parsed.userPrompts[0]?.text;
  if (first) {
    const line = firstLine(first);
    if (line) return clip(line, 100);
  }
  const date = (parsed.startedAt ?? new Date().toISOString()).slice(0, 10);
  return `${parsed.source === 'codex' ? 'Codex' : 'Claude Code'} session ${date}`;
}

/** Build the summary paragraph + "what was asked" bullets. */
export function buildSummary(parsed: ParsedTranscript, cwd?: string, commits: SessionCommit[] = []): string {
  const files = parsed.fileChanges;
  const topFiles = [...files]
    .sort((a, b) => b.touches - a.touches)
    .slice(0, 8)
    .map((f) => relativeTo(cwd, f.filePath));

  const lines: string[] = [];
  lines.push(
    `${parsed.userPrompts.length} prompt(s), ${parsed.assistantTurns} assistant turn(s), ` +
      `${files.length} file(s) changed, ${parsed.commands.length} command(s) run, ${formatDuration(parsed.durationSec)}.`,
  );
  if (topFiles.length) lines.push(`Files: ${topFiles.join(', ')}${files.length > 8 ? `, +${files.length - 8} more` : ''}`);
  if (commits.length) lines.push(`Commits: ${commits.slice(0, 6).map((c) => `${c.hash} ${clip(c.subject, 70)}`).join('; ')}${commits.length > 6 ? `; +${commits.length - 6} more` : ''}`);

  const asks = parsed.userPrompts.slice(0, 6).map((p) => `- ${clip(firstLine(p.text) || p.text, 160)}`);
  if (asks.length) {
    lines.push('');
    lines.push('What was asked:');
    lines.push(...asks);
    if (parsed.userPrompts.length > 6) lines.push(`- … +${parsed.userPrompts.length - 6} more prompt(s)`);
  }

  const lastAnswer = parsed.assistantTexts[parsed.assistantTexts.length - 1];
  if (lastAnswer) {
    lines.push('');
    lines.push(`Last response: ${clip(lastAnswer, 300)}`);
  }
  return lines.join('\n');
}

/** Derive tags: fixed markers + project name + top languages. */
export function buildTags(parsed: ParsedTranscript, cwd?: string, extra: string[] = []): string[] {
  const tags = new Set<string>([parsed.source ?? 'claude-code', 'auto-capture']);
  const projectDir = cwd ?? parsed.cwd;
  if (projectDir) {
    const name = path.basename(projectDir).toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
    if (name) tags.add(name);
  }
  const langCount = new Map<string, number>();
  for (const f of parsed.fileChanges) {
    // Data/doc formats and bare unknown extensions (`txt`, `srt`, `lock`) are not language tags.
    if (!isCodeLanguage(f.language)) continue;
    langCount.set(f.language, (langCount.get(f.language) || 0) + f.touches);
  }
  [...langCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([lang]) => tags.add(lang));
  extra.forEach((t) => t && tags.add(t));
  return [...tags];
}

/** Map file changes to code contexts (one per file). */
export function buildCodeContexts(
  parsed: ParsedTranscript,
  cwd: string | undefined,
  maxFiles: number,
): SessionData['codeContexts'] {
  const sid = parsed.claudeSessionId ?? parsed.source ?? 'claude-code';
  return [...parsed.fileChanges]
    .sort((a, b) => b.touches - a.touches)
    .slice(0, maxFiles)
    .map((f) => {
      const rel = relativeTo(cwd, f.filePath);
      const verb = f.kind === 'write' ? 'Wrote' : f.kind === 'notebook' ? 'Edited notebook' : 'Edited';
      return {
        sessionId: sid,
        timestamp: f.lastTouchedAt ?? parsed.endedAt ?? new Date().toISOString(),
        codeBlocks: f.lastSnippet
          ? [{ language: f.language, code: f.lastSnippet, filename: rel }]
          : [],
        conversationSummary: `${verb} \`${rel}\` (${f.touches} ${f.touches === 1 ? 'change' : 'changes'})`,
      };
    });
}

/** Run the pattern-based design-decision extractor over the conversation. */
export async function buildDesignDecisions(
  parsed: ParsedTranscript,
  maxDecisions: number,
): Promise<SessionData['designDecisions']> {
  const corpus = [
    ...parsed.userPrompts.map((p) => p.text),
    ...parsed.assistantTexts,
  ].join('\n\n');
  if (corpus.trim().length < 40) return [];
  try {
    const out = await summarizeDesignDecisions({
      conversationLog: corpus,
      language: 'auto',
      includeImportanceScore: true,
      extractRelatedCode: false,
      // Over-fetch: the rationale filter below drops most candidates.
      maxDecisions: Math.min(50, maxDecisions * 4),
      useAI: false,
    });
    // The pattern extractor is generous (any "X is better" sentence); for
    // unattended capture keep only decisions that come with a stated reason,
    // which is what makes them worth recalling later.
    return out.decisions
      .filter((d) => d.rationale && d.rationale !== 'Rationale not explicitly stated')
      .map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      rationale: d.rationale,
      category: d.category,
      timestamp: d.timestamp,
    })).slice(0, maxDecisions);
  } catch (err) {
    captureLogger.warn('Design decision extraction failed', { error: (err as Error).message });
    return [];
  }
}

// ---------------------------------------------------------------------------
// capture index: agent session id → stored session id
// ---------------------------------------------------------------------------

/** Not `.json`, so `listSessions()` never mistakes it for a session. */
const INDEX_FILE = 'capture-index.idx';

async function readCaptureIndex(): Promise<Record<string, string>> {
  try {
    const parsed = JSON.parse(await fs.readFile(path.join(getStorageDir(), INDEX_FILE), 'utf-8')) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

async function rememberCapture(agentSessionId: string, sessionId: string): Promise<void> {
  try {
    const index = await readCaptureIndex();
    if (index[agentSessionId] === sessionId) return;
    index[agentSessionId] = sessionId;
    await writeFileAtomic(path.join(getStorageDir(), INDEX_FILE), JSON.stringify(index));
  } catch (err) {
    // The index is only an accelerator; a full scan still finds the session.
    captureLogger.warn('Could not update capture index', { error: (err as Error).message });
  }
}

function matchesAgentId(meta: Record<string, unknown> | undefined, id: string): boolean {
  return meta?.agentSessionId === id || meta?.claudeSessionId === id;
}

/**
 * Locate an already-captured session for an agent session id (Claude Code or
 * Codex). The `Stop` hook calls this after every turn, so it first consults a
 * small index file and only falls back to scanning the whole store on a miss.
 */
export async function findSessionByClaudeId(agentSessionId: string): Promise<StoredSession | null> {
  const indexed = (await readCaptureIndex())[agentSessionId];
  if (indexed) {
    const hit = await getSession(indexed).catch(() => null);
    if (hit && matchesAgentId(hit.metadata, agentSessionId)) {
      return {
        id: hit.id,
        title: hit.title,
        summary: hit.summary,
        createdAt: hit.createdAt,
        updatedAt: hit.updatedAt,
        tags: hit.tags ?? [],
        codeContextCount: hit.codeContexts?.length ?? 0,
        designDecisionCount: hit.designDecisions?.length ?? 0,
        metadata: hit.metadata,
      };
    }
  }
  const { sessions } = await listSessions({ limit: 100000 });
  const found = sessions.find((s) => matchesAgentId(s.metadata, agentSessionId)) ?? null;
  if (found) await rememberCapture(agentSessionId, found.id);
  return found;
}

/**
 * Commits made in `cwd`'s repository between the session's first and last
 * record (plus a short grace period for a commit that lands right after the
 * final turn). Returns `[]` when `cwd` is not a git repository or git is
 * unavailable — capture never fails because of this.
 */
export async function collectCommits(
  cwd: string | undefined,
  startedAt: string | undefined,
  endedAt: string | undefined,
  max = 30,
): Promise<SessionCommit[]> {
  if (!cwd || !startedAt || !endedAt) return [];
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
  try {
    const res = await execGit(
      [
        'log',
        `--since=${new Date(start).toISOString()}`,
        `--until=${new Date(end + 120_000).toISOString()}`,
        '--no-merges',
        `--max-count=${max}`,
        '--format=%h%x09%cI%x09%s',
      ],
      { cwd, timeout: 5000 },
    );
    if (res.exitCode !== 0) return [];
    return res.stdout
      .split('\n')
      .map((l) => l.split('\t'))
      .filter((parts) => parts.length >= 3 && parts[0])
      .map(([hash, date, ...subject]) => ({ hash, date, subject: subject.join('\t').slice(0, 200) }))
      .reverse();
  } catch {
    return [];
  }
}

/**
 * Capture one transcript file into the session store.
 */
export async function captureTranscript(transcriptPath: string, options: CaptureOptions = {}): Promise<CaptureResult> {
  const parsed = await parseTranscriptFile(transcriptPath, options);
  const cwd = options.cwd ?? parsed.cwd;
  const minPrompts = options.minPrompts ?? 1;
  const title = buildTitle(parsed);

  const stats = {
    prompts: parsed.userPrompts.length,
    assistantTurns: parsed.assistantTurns,
    filesChanged: parsed.fileChanges.length,
    commands: parsed.commands.length,
    designDecisions: 0,
    durationSec: parsed.durationSec,
    commits: 0,
    tokens: parsed.tokens?.total ?? 0,
  };

  if (parsed.userPrompts.length < minPrompts && parsed.fileChanges.length === 0) {
    return {
      status: 'skipped',
      claudeSessionId: parsed.claudeSessionId,
      transcriptPath,
      title,
      stats,
      reason: `fewer than ${minPrompts} prompt(s) and no file changes`,
    };
  }

  const designDecisions = await buildDesignDecisions(parsed, options.maxDecisions ?? 10);
  stats.designDecisions = designDecisions.length;

  const existing = parsed.claudeSessionId ? await findSessionByClaudeId(parsed.claudeSessionId) : null;
  const previousCount = Number(existing?.metadata?.captureCount ?? 0);

  const commits = options.linkCommits === false ? [] : await collectCommits(cwd, parsed.startedAt, parsed.endedAt);
  stats.commits = commits.length;
  const source: TranscriptSource = parsed.source ?? 'claude-code';

  const metadata: CaptureMetadata = {
    source,
    agentSessionId: parsed.claudeSessionId,
    claudeSessionId: source === 'claude-code' ? parsed.claudeSessionId : undefined,
    transcriptPath,
    cwd,
    project: cwd ? path.basename(cwd) : undefined,
    gitBranch: parsed.gitBranch,
    claudeVersion: parsed.claudeVersion,
    startedAt: parsed.startedAt,
    endedAt: parsed.endedAt,
    durationSec: parsed.durationSec,
    wallClockSec: parsed.wallClockSec,
    promptCount: parsed.userPrompts.length,
    assistantTurns: parsed.assistantTurns,
    filesTouched: parsed.fileChanges.map((f) => relativeTo(cwd, f.filePath)),
    commandCount: parsed.commands.length,
    toolCounts: parsed.toolCounts,
    hookEvent: options.hookEvent,
    capturedAt: new Date().toISOString(),
    captureCount: previousCount + 1,
    commands: parsed.commands.slice(0, 50).map((c) => c.command),
    tokens: parsed.tokens?.total ? parsed.tokens : undefined,
    models: parsed.models && Object.keys(parsed.models).length ? parsed.models : undefined,
    commits: commits.length ? commits : undefined,
  };

  const body: Omit<SessionData, 'id' | 'createdAt' | 'updatedAt'> = {
    title,
    summary: buildSummary(parsed, cwd, commits),
    tags: buildTags(parsed, cwd, options.extraTags),
    codeContexts: buildCodeContexts(parsed, cwd, options.maxFiles ?? 40),
    designDecisions,
    metadata,
  };

  if (options.dryRun) {
    return { status: 'dry-run', sessionId: existing?.id, claudeSessionId: parsed.claudeSessionId, transcriptPath, title, stats, session: body };
  }

  if (existing) {
    // Preserve user-added tags on update.
    const mergedTags = [...new Set([...(existing.tags ?? []), ...body.tags])];
    const updated = await updateSession(existing.id, { ...body, tags: mergedTags });
    captureLogger.info('Session updated from transcript', { sessionId: updated.id, claudeSessionId: parsed.claudeSessionId });
    return { status: 'updated', sessionId: updated.id, claudeSessionId: parsed.claudeSessionId, transcriptPath, title, stats, session: body };
  }

  const created = await saveSession(body);
  if (parsed.claudeSessionId) await rememberCapture(parsed.claudeSessionId, created.id);
  captureLogger.info('Session created from transcript', { sessionId: created.id, claudeSessionId: parsed.claudeSessionId });
  return { status: 'created', sessionId: created.id, claudeSessionId: parsed.claudeSessionId, transcriptPath, title, stats, session: body };
}

/**
 * Capture the newest transcript for a working directory.
 */
export async function captureLatestForCwd(cwd: string, options: CaptureOptions = {}): Promise<CaptureResult | null> {
  const transcript = await findLatestTranscript(cwd);
  if (!transcript) return null;
  return captureTranscript(transcript, { ...options, cwd: options.cwd ?? cwd });
}

export interface SyncOptions {
  /** Which agents' transcripts to scan. Default `all`. */
  agent?: 'claude' | 'codex' | 'all';
  /** Only transcripts modified within this many days. Default 30. */
  days?: number;
  /** Stop after this many captures (skips do not count). */
  limit?: number;
  dryRun?: boolean;
  extraTags?: string[];
  /** Called after each transcript (CLI progress). */
  onResult?: (result: CaptureResult) => void;
}

export interface SyncResult {
  scanned: number;
  /** Already captured and not modified since. */
  upToDate: number;
  created: number;
  updated: number;
  skipped: number;
  failed: Array<{ transcriptPath: string; error: string }>;
  results: CaptureResult[];
}

/** Agent session id encoded in a transcript file name. */
function idFromFileName(ref: TranscriptRef): string {
  const base = path.basename(ref.path, '.jsonl');
  // Codex: rollout-2026-11-23T23-48-56-<uuid>
  return ref.source === 'codex' ? base.slice(-36) : base;
}

/**
 * Capture every Claude Code / Codex transcript on this machine that is new or
 * has changed since it was last captured. This is the hook-free path: run it
 * once to backfill history, or on a schedule for agents that have no hooks.
 */
export async function syncTranscripts(options: SyncOptions = {}): Promise<SyncResult> {
  const agent = options.agent ?? 'all';
  const sinceMs = Date.now() - (options.days ?? 30) * 86_400_000;

  const refs: TranscriptRef[] = [];
  if (agent !== 'codex') refs.push(...(await listAllClaudeTranscripts(sinceMs)));
  if (agent !== 'claude') refs.push(...(await listCodexTranscripts(sinceMs)));
  refs.sort((a, b) => (a.modifiedAt < b.modifiedAt ? -1 : 1)); // oldest first

  const { sessions } = await listSessions({ limit: 100000 });
  const capturedAt = new Map<string, number>();
  for (const s of sessions) {
    const id = (s.metadata?.agentSessionId ?? s.metadata?.claudeSessionId) as string | undefined;
    const at = typeof s.metadata?.capturedAt === 'string' ? new Date(s.metadata.capturedAt).getTime() : NaN;
    if (id && Number.isFinite(at)) capturedAt.set(id, at);
  }

  const out: SyncResult = { scanned: refs.length, upToDate: 0, created: 0, updated: 0, skipped: 0, failed: [], results: [] };
  let captured = 0;
  for (const ref of refs) {
    const last = capturedAt.get(idFromFileName(ref));
    if (last !== undefined && new Date(ref.modifiedAt).getTime() <= last) {
      out.upToDate += 1;
      continue;
    }
    if (options.limit && captured >= options.limit) break;
    try {
      const result = await captureTranscript(ref.path, { hookEvent: 'sync', dryRun: options.dryRun, extraTags: options.extraTags });
      if (result.status === 'created' || result.status === 'dry-run') out.created += 1;
      else if (result.status === 'updated') out.updated += 1;
      else out.skipped += 1;
      if (result.status !== 'skipped') captured += 1;
      // Keep the returned payload small: the full session body is in the store.
      const slim = { ...result, session: undefined };
      out.results.push(slim);
      options.onResult?.(slim);
    } catch (err) {
      out.failed.push({ transcriptPath: ref.path, error: (err as Error).message });
    }
  }
  return out;
}
