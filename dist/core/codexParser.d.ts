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
import { ParsedTranscript, ParseOptions, TranscriptRef } from './transcriptParser.js';
/** Root of Codex's session store. */
export declare function codexSessionsDir(): string;
/**
 * Decode a JavaScript string literal starting at `src[start]` (a quote
 * character). Template literals stop at the first `${`. Returns `null` when
 * `start` is not a quote.
 */
export declare function readJsStringLiteral(src: string, start: number): {
    value: string;
    end: number;
} | null;
export interface PatchFile {
    filePath: string;
    kind: 'write' | 'edit' | 'delete';
    /** Added lines (`+…`) of this file's hunk(s). */
    added: string;
}
/** Split an `apply_patch` envelope into per-file entries. */
export declare function parseApplyPatch(patch: string): PatchFile[];
/** Calls found inside one `exec` JavaScript snippet. */
export declare function parseExecScript(script: string): {
    tools: string[];
    commands: string[];
    patches: string[];
};
/**
 * Parse a Codex rollout (JSONL text) into the same `ParsedTranscript` shape
 * the Claude Code parser produces.
 */
export declare function parseCodexTranscriptText(text: string, options?: ParseOptions): ParsedTranscript;
/** Every Codex rollout on this machine, newest first. */
export declare function listCodexTranscripts(sinceMs?: number): Promise<TranscriptRef[]>;
//# sourceMappingURL=codexParser.d.ts.map