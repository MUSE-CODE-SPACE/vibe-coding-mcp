#!/usr/bin/env node
/**
 * HTTP entry point — Streamable HTTP transport.
 *
 * A transport-bind around the shared `createMcpServer()` factory, so it
 * exposes exactly the same tools, resources and prompts as the stdio entry
 * point in `src/stdio.ts`.
 *
 * Environment:
 *   PORT                  listen port (default 3000)
 *   HOST                  bind address (default 127.0.0.1 — local only; set 0.0.0.0 to expose)
 *   MCP_AUTH_TOKEN        when set, `/mcp` requires `Authorization: Bearer <token>`
 *   MCP_ALLOWED_ORIGINS   comma-separated browser origins allowed by CORS (default: none)
 *   MCP_SESSION_TTL_MIN   idle minutes before an MCP session is closed (default 60)
 */
export {};
//# sourceMappingURL=index.d.ts.map