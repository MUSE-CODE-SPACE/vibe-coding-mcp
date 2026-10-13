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
import {
  parseTranscriptFile,
  findLatestTranscript,
  ParsedTranscript,
  ParseOptions,
} from './transcriptParser.js';
import { listSessions, saveSession, updateSession, SessionData, StoredSession } from './sessionStorage.js';
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
  };
  reason?: string;
  /** The session body as it was (or would be) stored. */
  session?: Omit<SessionData, 'id' | 'createdAt' | 'updatedAt'>;
}

/** Metadata shape written by the capture engine. */
export interface CaptureMetadata {
  source: 'claude-code';
  claudeSessionId?: string;
  transcriptPath: string;
  cwd?: string;
  project?: string;
  gitBranch?: string;
  claudeVersion?: string;
  startedAt?: string;
  endedAt?: string;
  durationSec?: number;
  promptCount: number;
  assistantTurns: number;
  filesTouched: string[];
  commandCount: number;
  toolCounts: Record<string, number>;
  hookEvent?: string;
  capturedAt: string;
  captureCount: number;
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
  return `Claude Code session ${date}`;
}

/** Build the summary paragraph + "what was asked" bullets. */
export function buildSummary(parsed: ParsedTranscript, cwd?: string): string {
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
  const tags = new Set<string>(['claude-code', 'auto-capture']);
  const projectDir = cwd ?? parsed.cwd;
  if (projectDir) {
    const name = path.basename(projectDir).toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
    if (name) tags.add(name);
  }
  const langCount = new Map<string, number>();
  for (const f of parsed.fileChanges) {
    if (['text', 'json', 'markdown', 'yaml', 'toml', 'xml'].includes(f.language)) continue;
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
  const sid = parsed.claudeSessionId ?? 'claude-code';
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
      maxDecisions,
      useAI: false,
    });
    return out.decisions.map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      rationale: d.rationale,
      category: d.category,
      timestamp: d.timestamp,
    }));
  } catch (err) {
    captureLogger.warn('Design decision extraction failed', { error: (err as Error).message });
    return [];
  }
}

/** Locate an already-captured session for a Claude Code session id. */
export async function findSessionByClaudeId(claudeSessionId: string): Promise<StoredSession | null> {
  const { sessions } = await listSessions({ limit: 10000 });
  return sessions.find((s) => s.metadata?.claudeSessionId === claudeSessionId) ?? null;
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

  const metadata: CaptureMetadata = {
    source: 'claude-code',
    claudeSessionId: parsed.claudeSessionId,
    transcriptPath,
    cwd,
    project: cwd ? path.basename(cwd) : undefined,
    gitBranch: parsed.gitBranch,
    claudeVersion: parsed.claudeVersion,
    startedAt: parsed.startedAt,
    endedAt: parsed.endedAt,
    durationSec: parsed.durationSec,
    promptCount: parsed.userPrompts.length,
    assistantTurns: parsed.assistantTurns,
    filesTouched: parsed.fileChanges.map((f) => relativeTo(cwd, f.filePath)),
    commandCount: parsed.commands.length,
    toolCounts: parsed.toolCounts,
    hookEvent: options.hookEvent,
    capturedAt: new Date().toISOString(),
    captureCount: previousCount + 1,
    commands: parsed.commands.slice(0, 50).map((c) => c.command),
  };

  const body: Omit<SessionData, 'id' | 'createdAt' | 'updatedAt'> = {
    title,
    summary: buildSummary(parsed, cwd),
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
