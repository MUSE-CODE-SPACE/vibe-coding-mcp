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
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { initializeAI } from './core/ai.js';
import { createMcpServer, getCapabilityCounts } from './core/mcpServerFactory.js';
async function main() {
    // Initialize AI if ANTHROPIC_API_KEY is available
    const aiEnabled = initializeAI();
    if (aiEnabled) {
        console.error('[vibe-coding-mcp] AI features enabled (ANTHROPIC_API_KEY found)');
    }
    const server = createMcpServer();
    const counts = getCapabilityCounts();
    console.error(`[vibe-coding-mcp] stdio transport ready — ${counts.tools} tools, ${counts.resources} resources, ${counts.prompts} prompts`);
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error('[vibe-coding-mcp] fatal:', err);
    process.exit(1);
});
//# sourceMappingURL=stdio.js.map