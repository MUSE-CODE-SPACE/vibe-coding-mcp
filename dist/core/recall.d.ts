/**
 * Project recall — turn the captured session history of one project into a
 * short brief an agent can read at the start of a new session ("what did we
 * do here last time, and why?").
 *
 * Used by three surfaces:
 *   - the `SessionStart` hook (`vibe-coding-mcp hook`), which injects the
 *     brief into a fresh Claude Code session as additional context,
 *   - the `muse_recall` MCP tool (optionally with a search query),
 *   - the `vibe-coding-mcp recall` CLI.
 *
 * Reads only the local session store. No network, no LLM.
 */
import { SessionData, StoredSession } from './sessionStorage.js';
export interface RecallOptions {
    /** Project directory. Sessions captured in this directory or below it match. */
    cwd?: string;
    /** Match by project name (directory basename) instead of / in addition to `cwd`. */
    project?: string;
    /** `project` (default) limits to the project above; `all` searches every captured session. */
    scope?: 'project' | 'all';
    /** Free-text query; ranks sessions by relevance instead of recency. */
    query?: string;
    /** Max sessions in the brief. Default 5. */
    limit?: number;
    /** Character budget for the rendered brief. Default 6000. */
    maxChars?: number;
    /** Only sessions started within this many days. */
    sinceDays?: number;
    /** Agent session id to leave out (the session that is asking). */
    excludeAgentSessionId?: string;
    language?: 'en' | 'ko';
}
export interface RecallSession {
    id: string;
    title: string;
    date: string;
    source?: string;
    project?: string;
    gitBranch?: string;
    durationSec?: number;
    asks: string[];
    files: string[];
    decisions: Array<{
        title: string;
        rationale?: string;
    }>;
    commits: Array<{
        hash: string;
        subject: string;
    }>;
    lastResponse?: string;
    score?: number;
}
export interface RecallResult {
    project?: string;
    cwd?: string;
    scope: 'project' | 'all';
    query?: string;
    /** Sessions that matched before `limit` was applied. */
    matched: number;
    sessions: RecallSession[];
    /** Markdown brief (empty string when nothing matched). */
    content: string;
}
/** Does a stored session belong to the project identified by `cwd` / `project`? */
export declare function sessionMatchesProject(s: StoredSession | SessionData, cwd?: string, project?: string): boolean;
/** Pull the "What was asked" bullets back out of a capture summary. */
export declare function extractAsks(summary: string, max?: number): string[];
export declare function extractLastResponse(summary: string): string | undefined;
/** Relevance of one session to the query terms (0 = no match). */
export declare function scoreSession(s: SessionData, terms: string[]): number;
/** Render the brief, dropping trailing sessions that do not fit `maxChars` (the first always fits). */
export declare function renderRecall(result: Omit<RecallResult, 'content'>, maxChars: number, language?: 'en' | 'ko'): string;
/**
 * Collect the sessions relevant to a project (or a query) and render the brief.
 */
export declare function recall(options?: RecallOptions): Promise<RecallResult>;
//# sourceMappingURL=recall.d.ts.map