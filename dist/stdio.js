#!/usr/bin/env node
/**
 * Claude Desktop용 stdio 모드 진입점
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
// Core
import { createErrorResponse, ToolError } from './core/errors.js';
import { initializeAI } from './core/ai.js';
import { validateInput, CollectCodeContextSchema, SummarizeDesignDecisionsSchema, GenerateDevDocumentSchema, NormalizeForPlatformSchema, PublishDocumentSchema, CreateSessionLogSchema, AnalyzeCodeSchema, } from './core/schemas.js';
// Tools
import { collectCodeContext, collectCodeContextSchema } from './tools/collectCodeContext.js';
import { summarizeDesignDecisions, summarizeDesignDecisionsSchema } from './tools/summarizeDesignDecisions.js';
import { generateDevDocument, generateDevDocumentSchema } from './tools/generateDevDocument.js';
import { normalizeForPlatform, normalizeForPlatformSchema } from './tools/normalizeForPlatform.js';
import { publishDocument, publishDocumentSchema } from './tools/publishDocument.js';
import { createSessionLog, createSessionLogSchema } from './tools/createSessionLog.js';
import { analyzeCodeTool, analyzeCodeSchema } from './tools/analyzeCode.js';
// Tool handlers with validation
const toolHandlers = {
    muse_collect_code_context: (args) => {
        const validated = validateInput(CollectCodeContextSchema, args);
        return collectCodeContext(validated);
    },
    muse_summarize_design_decisions: async (args) => {
        const validated = validateInput(SummarizeDesignDecisionsSchema, args);
        return summarizeDesignDecisions(validated);
    },
    muse_generate_dev_document: (args) => {
        const validated = validateInput(GenerateDevDocumentSchema, args);
        return generateDevDocument(validated);
    },
    muse_normalize_for_platform: (args) => {
        const validated = validateInput(NormalizeForPlatformSchema, args);
        return normalizeForPlatform(validated);
    },
    muse_publish_document: async (args) => {
        const validated = validateInput(PublishDocumentSchema, args);
        return publishDocument(validated);
    },
    muse_create_session_log: async (args) => {
        const validated = validateInput(CreateSessionLogSchema, args);
        return createSessionLog(validated);
    },
    muse_analyze_code: async (args) => {
        const validated = validateInput(AnalyzeCodeSchema, args);
        return analyzeCodeTool(validated);
    },
};
function isValidToolName(name) {
    return name in toolHandlers;
}
const server = new Server({
    name: 'vibe-coding-mcp',
    version: '2.5.0',
}, {
    capabilities: {
        tools: {},
    },
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            collectCodeContextSchema,
            summarizeDesignDecisionsSchema,
            generateDevDocumentSchema,
            normalizeForPlatformSchema,
            publishDocumentSchema,
            createSessionLogSchema,
            analyzeCodeSchema,
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        if (!isValidToolName(name)) {
            throw new ToolError(`Unknown tool: ${name}`, 'NOT_FOUND', { tool: name });
        }
        const handler = toolHandlers[name];
        const result = await handler(args);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
// Start stdio transport
async function main() {
    // Initialize AI if ANTHROPIC_API_KEY is available
    const aiEnabled = initializeAI();
    if (aiEnabled) {
        console.error('[vibe-coding-mcp] AI features enabled (ANTHROPIC_API_KEY found)');
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch(console.error);
//# sourceMappingURL=stdio.js.map