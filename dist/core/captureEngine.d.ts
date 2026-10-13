/**
 * Capture engine — turns a parsed Claude Code transcript into a stored
 * vibe-coding session, idempotently.
 *
 * Idempotency key: `metadata.claudeSessionId`. Because the Claude Code `Stop`
 * hook fires at the end of *every* turn, the same transcript is captured
 * many times over a session's lifetime; every capture after the first is an
 * update of the same stored session, not a new one.
 */
import { ParsedTranscript, ParseOptions } from './transcriptParser.js';
import { SessionData, StoredSession } from './sessionStorage.js';
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
/** Build the human-readable title for a parsed transcript. */
export declare function buildTitle(parsed: ParsedTranscript): string;
/** Build the summary paragraph + "what was asked" bullets. */
export declare function buildSummary(parsed: ParsedTranscript, cwd?: string): string;
/** Derive tags: fixed markers + project name + top languages. */
export declare function buildTags(parsed: ParsedTranscript, cwd?: string, extra?: string[]): string[];
/** Map file changes to code contexts (one per file). */
export declare function buildCodeContexts(parsed: ParsedTranscript, cwd: string | undefined, maxFiles: number): SessionData['codeContexts'];
/** Run the pattern-based design-decision extractor over the conversation. */
export declare function buildDesignDecisions(parsed: ParsedTranscript, maxDecisions: number): Promise<SessionData['designDecisions']>;
/** Locate an already-captured session for a Claude Code session id. */
export declare function findSessionByClaudeId(claudeSessionId: string): Promise<StoredSession | null>;
/**
 * Capture one transcript file into the session store.
 */
export declare function captureTranscript(transcriptPath: string, options?: CaptureOptions): Promise<CaptureResult>;
/**
 * Capture the newest transcript for a working directory.
 */
export declare function captureLatestForCwd(cwd: string, options?: CaptureOptions): Promise<CaptureResult | null>;
//# sourceMappingURL=captureEngine.d.ts.map