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

// Tools
import { collectCodeContext, collectCodeContextSchema } from './tools/collectCodeContext.js';
import { summarizeDesignDecisions, summarizeDesignDecisionsSchema } from './tools/summarizeDesignDecisions.js';
import { generateDevDocument, generateDevDocumentSchema } from './tools/generateDevDocument.js';
import { normalizeForPlatform, normalizeForPlatformSchema } from './tools/normalizeForPlatform.js';
import { publishDocument, publishDocumentSchema } from './tools/publishDocument.js';
import { createSessionLog, createSessionLogSchema } from './tools/createSessionLog.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Store active transports
const transports = new Map<string, SSEServerTransport>();

// Create MCP Server instance
function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'vibe-coding-mcp',
      version: '1.0.0',
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
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'collect_code_context': {
          const result = collectCodeContext(args as any);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'summarize_design_decisions': {
          const result = summarizeDesignDecisions(args as any);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'generate_dev_document': {
          const result = generateDevDocument(args as any);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'normalize_for_platform': {
          const result = normalizeForPlatform(args as any);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'publish_document': {
          const result = await publishDocument(args as any);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'create_session_log': {
          const result = await createSessionLog(args as any);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: errorMessage }),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'vibe-coding-mcp',
    version: '1.0.0',
    description: 'MCP server for vibe coding documentation',
    status: 'running',
    tools: [
      'collect_code_context',
      'summarize_design_decisions',
      'generate_dev_document',
      'normalize_for_platform',
      'publish_document',
      'create_session_log'
    ]
  });
});

// SSE endpoint for MCP connection
app.get('/sse', async (req: Request, res: Response) => {
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
  console.log(`Vibe Coding MCP Server running on http://localhost:${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`Message endpoint: http://localhost:${PORT}/message`);
});
