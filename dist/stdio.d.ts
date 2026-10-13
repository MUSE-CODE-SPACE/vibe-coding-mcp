#!/usr/bin/env node
/**
 * stdio entry point — used by Claude Desktop / Claude Code.
 *
 * Since v2.15.0 the published `vibe-coding-mcp` binary is `dist/cli.js`,
 * which dispatches to `startStdioServer()` when run without a subcommand.
 * This file stays runnable on its own (`node dist/stdio.js`) for anyone who
 * wired that path directly.
 *
 * The tool/resource/prompt registry lives in
 * `src/core/{toolRegistry,resources,prompts}.ts` and is reused verbatim by
 * the HTTP entry point in `src/index.ts`.
 */
export declare function startStdioServer(): Promise<void>;
//# sourceMappingURL=stdio.d.ts.map