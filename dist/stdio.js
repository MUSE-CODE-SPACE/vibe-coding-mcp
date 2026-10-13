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
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { pathToFileURL } from 'url';
import { initializeAI } from './core/ai.js';
import { createMcpServer, getCapabilityCounts } from './core/mcpServerFactory.js';
export async function startStdioServer() {
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
// Run only when executed directly (not when imported by cli.ts).
const invokedDirectly = typeof process.argv[1] === 'string' && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
    startStdioServer().catch((err) => {
        console.error('[vibe-coding-mcp] fatal:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=stdio.js.map