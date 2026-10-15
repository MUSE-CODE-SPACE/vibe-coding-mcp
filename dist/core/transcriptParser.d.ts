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
    /**
     * Active seconds: the sum of gaps between consecutive records, excluding any
     * gap longer than `idleGapSec` (a session resumed the next morning is not a
     * 20-hour session). See `wallClockSec` for first-to-last.
     */
    durationSec?: number;
    /** Wall-clock seconds between first and last record. */
    wallClockSec?: number;
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
    /** Gaps between records longer than this are treated as idle and excluded from `durationSec`. Default 1800 (30 min). */
    idleGapSec?: number;
}
export declare function isCodeLanguage(lang: string): boolean;
/** Map a file extension to a fenced-code language id. */
export declare function languageFromPath(filePath: string): string;
/** Strip Claude Code's injected wrapper tags from a human prompt. */
export declare function cleanUserText(text: string): string;
/**
 * Parse transcript text (JSONL) into a structured object.
 */
export declare function parseTranscriptText(text: string, options?: ParseOptions): ParsedTranscript;
/**
 * Parse a transcript file from disk.
 */
export declare function parseTranscriptFile(filePath: string, options?: ParseOptions): Promise<ParsedTranscript>;
/** Expand a leading `~` to the home directory. */
export declare function expandHome(p: string): string;
/** Root of Claude Code's per-project transcript store. */
export declare function claudeProjectsDir(): string;
/**
 * Claude Code derives the per-project folder name by replacing every
 * non-alphanumeric character of the absolute cwd with `-`.
 */
export declare function projectSlug(cwd: string): string;
/**
 * Find the most recently modified transcript for a working directory.
 * Returns `null` if the project folder does not exist or holds no `.jsonl`.
 */
export declare function findLatestTranscript(cwd: string): Promise<string | null>;
/** List all transcripts for a working directory, newest first. */
export declare function listTranscripts(cwd: string): Promise<Array<{
    path: string;
    modifiedAt: string;
    sizeBytes: number;
}>>;
//# sourceMappingURL=transcriptParser.d.ts.map