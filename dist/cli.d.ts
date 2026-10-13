#!/usr/bin/env node
/**
 * `vibe-coding-mcp` command-line entry point.
 *
 *   vibe-coding-mcp              start the MCP server on stdio (default)
 *   vibe-coding-mcp hook         Claude Code hook: read the hook JSON from stdin,
 *                                capture the transcript, never block Claude
 *   vibe-coding-mcp capture      capture the newest transcript for the cwd by hand
 *   vibe-coding-mcp init         install the Stop + SessionEnd hooks into Claude Code settings
 *   vibe-coding-mcp doctor       check hooks, storage, transcripts, env
 *
 * The `hook` subcommand is the piece that makes auto-capture real: Claude
 * Code pipes `{ session_id, transcript_path, cwd, hook_event_name, … }` to
 * stdin, we parse the transcript JSONL and upsert a session. stdout is kept
 * empty on purpose (Claude Code parses hook stdout), all diagnostics go to
 * stderr, and the exit code is always 0 so a capture failure can never
 * interrupt a coding session.
 */
export {};
//# sourceMappingURL=cli.d.ts.map