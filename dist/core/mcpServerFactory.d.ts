/**
 * MCP server factory — builds a fully-wired `McpServer` instance using the
 * high-level `@modelcontextprotocol/sdk` API. Used by both entry points
 * (`src/index.ts` and `src/stdio.ts`) so they expose an identical surface:
 * 15 tools, 3 resources (one of which is a template), 3 prompts.
 *
 * High-level vs low-level: previously both entry points constructed a
 * low-level `Server` and registered request handlers for
 * `ListToolsRequestSchema` / `CallToolRequestSchema`. We now use
 * `McpServer.registerTool()`, `.resource()`, and `.prompt()` — the SDK turns
 * those registrations into the same JSON-RPC surface, but adds first-class
 * resources and prompts support along the way.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
declare const SERVER_NAME = "vibe-coding-mcp";
declare const SERVER_VERSION = "2.14.0";
/**
 * Build a new `McpServer` instance populated with all 15 tools, the resource
 * set, and the prompt set. The returned server is not yet connected to a
 * transport — caller is responsible for `server.connect(transport)`.
 */
export declare function createMcpServer(): McpServer;
/** Counts surfaced for smoke-testing + observability. */
export declare function getCapabilityCounts(): {
    tools: number;
    resources: number;
    prompts: number;
};
export { SERVER_NAME, SERVER_VERSION };
//# sourceMappingURL=mcpServerFactory.d.ts.map