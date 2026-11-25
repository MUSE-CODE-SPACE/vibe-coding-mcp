/**
 * muse_recall — "what did we do in this project before, and why?"
 *
 * Returns a compact brief of earlier captured sessions for a project
 * (newest first), or — with `query` — the sessions most relevant to a
 * question, ranked across titles, decisions, touched files, commit subjects
 * and summaries.
 */

import { recall, RecallSession } from '../core/recall.js';
import { expandHome } from '../core/transcriptParser.js';

export interface RecallInput {
  query?: string;
  cwd?: string;
  project?: string;
  scope?: 'project' | 'all';
  limit?: number;
  maxChars?: number;
  sinceDays?: number;
  language?: 'en' | 'ko';
}

export interface RecallOutput {
  success: boolean;
  project?: string;
  cwd?: string;
  scope: 'project' | 'all';
  query?: string;
  matched: number;
  sessions: RecallSession[];
  content: string;
  message?: string;
  error?: string;
}

export async function recallTool(input: RecallInput): Promise<RecallOutput> {
  const scope = input.scope ?? 'project';
  try {
    const result = await recall({
      ...input,
      scope,
      cwd: input.cwd ? expandHome(input.cwd) : undefined,
    });
    return {
      success: true,
      ...result,
      message: result.sessions.length
        ? `${result.sessions.length} of ${result.matched} matching session(s). Fetch one in full with muse_session_history (action=get, sessionId).`
        : scope === 'project'
          ? `No captured sessions for ${result.project ?? result.cwd ?? 'this project'}${input.query ? ` matching "${input.query}"` : ''}. ` +
            'Try scope=all, or backfill with muse_capture_transcript (action=sync).'
          : 'No captured sessions matched. Backfill with muse_capture_transcript (action=sync).',
    };
  } catch (error) {
    return {
      success: false,
      scope,
      matched: 0,
      sessions: [],
      content: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const recallSchema = {
  name: 'muse_recall',
  description:
    'Recall earlier coding sessions for a project from the local session store: what was asked, which files changed, ' +
    'design decisions and their rationale, commits made, and how the session ended. Without `query` it returns the most recent ' +
    'sessions of the project at `cwd`; with `query` it ranks sessions by relevance (titles, decisions, file paths, commit subjects, summaries). ' +
    'Use it before starting work in a project you have touched before, or to answer "why did we do X?" / "when did we change file Y?". Read-only.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'What to look for, e.g. "auth token refresh" or "src/core/cache.ts". Omit for the latest sessions.' },
      cwd: { type: 'string', description: 'Project directory (defaults to the server process cwd). Sessions captured there or in a sub-directory match.' },
      project: { type: 'string', description: 'Match by project name (directory basename) instead of cwd.' },
      scope: { type: 'string', enum: ['project', 'all'], description: 'project (default) or all captured sessions on this machine.' },
      limit: { type: 'number', description: 'Max sessions returned (default 5).' },
      maxChars: { type: 'number', description: 'Character budget for the Markdown brief (default 6000).' },
      sinceDays: { type: 'number', description: 'Only sessions started within this many days.' },
      language: { type: 'string', enum: ['en', 'ko'], description: 'Heading language (default en).' },
    },
  },
};
