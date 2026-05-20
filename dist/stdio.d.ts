#!/usr/bin/env node
/**
 * stdio entry point — used by Claude Desktop / Claude Code via the
 * `vibe-coding-mcp` binary.
 *
 * As of v2.14.0 this file is a thin transport-bind around the shared
 * `createMcpServer()` factory; the tool/resource/prompt registry lives in
 * `src/core/{toolRegistry,resources,prompts}.ts` and is reused verbatim by
 * the HTTP entry point in `src/index.ts`.
 */
export {};
//# sourceMappingURL=stdio.d.ts.map