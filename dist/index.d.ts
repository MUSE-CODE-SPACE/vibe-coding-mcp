#!/usr/bin/env node
/**
 * HTTP entry point — Streamable HTTP transport (MCP 2025-03-26).
 *
 * As of v2.14.0 this file is a transport-bind around the shared
 * `createMcpServer()` factory. It exposes the *same* 15 tools, 3 resources,
 * and 3 prompts as the stdio entry point in `src/stdio.ts` — the old SSE /
 * 7-tool drift is gone.
 *
 * The previous `SSEServerTransport` (deprecated in the MCP spec) has been
 * replaced with `StreamableHTTPServerTransport`. The SSE GET endpoint is
 * preserved as a compatibility shim that points clients at `/mcp`.
 */
import 'dotenv/config';
//# sourceMappingURL=index.d.ts.map