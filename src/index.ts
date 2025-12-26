#!/usr/bin/env node

import express, { Request, Response } from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import 'dotenv/config';

// Core
import { createErrorResponse, ToolError } from './core/errors.js';
import {
  validateInput,
  CollectCodeContextSchema,
  SummarizeDesignDecisionsSchema,
  GenerateDevDocumentSchema,
  NormalizeForPlatformSchema,
  PublishDocumentSchema,
  CreateSessionLogSchema,
  AnalyzeCodeSchema,
} from './core/schemas.js';

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
const transports = new Map<string, SSEServerTransport>();

// Tool handlers with validation
const toolHandlers = {
  muse_collect_code_context: (args: unknown) => {
    const validated = validateInput(CollectCodeContextSchema, args);
    return collectCodeContext(validated as Parameters<typeof collectCodeContext>[0]);
  },

  muse_summarize_design_decisions: (args: unknown) => {
    const validated = validateInput(SummarizeDesignDecisionsSchema, args);
    return summarizeDesignDecisions(validated as Parameters<typeof summarizeDesignDecisions>[0]);
  },

  muse_generate_dev_document: (args: unknown) => {
    const validated = validateInput(GenerateDevDocumentSchema, args);
    return generateDevDocument(validated as Parameters<typeof generateDevDocument>[0]);
  },

  muse_normalize_for_platform: (args: unknown) => {
    const validated = validateInput(NormalizeForPlatformSchema, args);
    return normalizeForPlatform(validated as Parameters<typeof normalizeForPlatform>[0]);
  },

  muse_publish_document: async (args: unknown) => {
    const validated = validateInput(PublishDocumentSchema, args);
    return publishDocument(validated as Parameters<typeof publishDocument>[0]);
  },

  muse_create_session_log: async (args: unknown) => {
    const validated = validateInput(CreateSessionLogSchema, args);
    return createSessionLog(validated as Parameters<typeof createSessionLog>[0]);
  },

  muse_analyze_code: (args: unknown) => {
    const validated = validateInput(AnalyzeCodeSchema, args);
    return analyzeCodeTool(validated as Parameters<typeof analyzeCodeTool>[0]);
  },
} as const;

type ToolName = keyof typeof toolHandlers;

function isValidToolName(name: string): name is ToolName {
  return name in toolHandlers;
}

// Create MCP Server instance
function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'vibe-coding-mcp',
      version: '2.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

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
    } catch (error) {
      return createErrorResponse(error);
    }
  });

  return server;
}

// Health check endpoint
app.get('/', (_req: Request, res: Response) => {
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
app.get('/sse', async (_req: Request, res: Response) => {
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
app.post('/message', async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    // Handle direct message without session
    const transport = Array.from(transports.values())[0];
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(400).json({ error: 'No active session' });
    }
    return;
  }

  const transport = transports.get(sessionId);
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Vibe Coding MCP Server v2.0.0 running on http://localhost:${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`Message endpoint: http://localhost:${PORT}/message`);
});
