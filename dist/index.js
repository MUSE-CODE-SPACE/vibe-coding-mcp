#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import 'dotenv/config';
// Core
import { createErrorResponse, ToolError } from './core/errors.js';
import { validateInput, CollectCodeContextSchema, SummarizeDesignDecisionsSchema, GenerateDevDocumentSchema, NormalizeForPlatformSchema, PublishDocumentSchema, CreateSessionLogSchema, AnalyzeCodeSchema, } from './core/schemas.js';
// Tools
import { collectCodeContext, collectCodeContextSchema } from './tools/collectCodeContext.js';
import { summarizeDesignDecisions, summarizeDesignDecisionsSchema } from './tools/summarizeDesignDecisions.js';
import { generateDevDocument, generateDevDocumentSchema } from './tools/generateDevDocument.js';
import { normalizeForPlatform, normalizeForPlatformSchema } from './tools/normalizeForPlatform.js';
import { publishDocument, publishDocumentSchema } from './tools/publishDocument.js';
import { createSessionLog, createSessionLogSchema } from './tools/createSessionLog.js';
import { analyzeCodeTool, analyzeCodeSchema } from './tools/analyzeCode.js';
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(cors());
app.use(express.json());
// Store active transports
const transports = new Map();
// Tool handlers with validation
const toolHandlers = {
    muse_collect_code_context: (args) => {
        const validated = validateInput(CollectCodeContextSchema, args);
        return collectCodeContext(validated);
    },
    muse_summarize_design_decisions: (args) => {
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
    muse_analyze_code: (args) => {
        const validated = validateInput(AnalyzeCodeSchema, args);
        return analyzeCodeTool(validated);
    },
};
function isValidToolName(name) {
    return name in toolHandlers;
}
// Create MCP Server instance
function createMCPServer() {
    const server = new Server({
        name: 'vibe-coding-mcp',
        version: '2.0.0',
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
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    return server;
}
// Health check endpoint
app.get('/', (_req, res) => {
    res.json({
        name: 'vibe-coding-mcp',
        version: '2.0.0',
        description: 'MCP server for vibe coding documentation - Enhanced with AST analysis, Mermaid diagrams, multi-language support',
        status: 'running',
        tools: Object.keys(toolHandlers),
        features: [
            'AST parsing (TypeScript, Python, Go)',
            'Mermaid diagram generation',
            'Multi-language support (Korean/English)',
            'Multiple document types (README, DESIGN, TUTORIAL, CHANGELOG, API, ARCHITECTURE)',
            'Multiple platforms (Notion, GitHub Wiki, Obsidian, Confluence, Slack, Discord)',
            'Input validation with Zod',
            'Structured error handling'
        ]
    });
});
// SSE endpoint for MCP connection
app.get('/sse', async (_req, res) => {
    console.log('New SSE connection established');
    const transport = new SSEServerTransport('/message', res);
    const sessionId = crypto.randomUUID();
    transports.set(sessionId, transport);
    const server = createMCPServer();
    res.on('close', () => {
        console.log('SSE connection closed');
        transports.delete(sessionId);
    });
    await server.connect(transport);
});
// Message endpoint for MCP communication
app.post('/message', async (req, res) => {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
        // Handle direct message without session
        const transport = Array.from(transports.values())[0];
        if (transport) {
            await transport.handlePostMessage(req, res);
        }
        else {
            res.status(400).json({ error: 'No active session' });
        }
        return;
    }
    const transport = transports.get(sessionId);
    if (transport) {
        await transport.handlePostMessage(req, res);
    }
    else {
        res.status(404).json({ error: 'Session not found' });
    }
});
// Start server
app.listen(PORT, () => {
    console.log(`Vibe Coding MCP Server v2.0.0 running on http://localhost:${PORT}`);
    console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
    console.log(`Message endpoint: http://localhost:${PORT}/message`);
});
//# sourceMappingURL=index.js.map