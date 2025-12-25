#!/usr/bin/env node
/**
 * Claude Desktop용 stdio 모드 진입점
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Tools
import { collectCodeContext, collectCodeContextSchema } from './tools/collectCodeContext.js';
import { summarizeDesignDecisions, summarizeDesignDecisionsSchema } from './tools/summarizeDesignDecisions.js';
import { generateDevDocument, generateDevDocumentSchema } from './tools/generateDevDocument.js';
import { normalizeForPlatform, normalizeForPlatformSchema } from './tools/normalizeForPlatform.js';
import { publishDocument, publishDocumentSchema } from './tools/publishDocument.js';
import { createSessionLog, createSessionLogSchema } from './tools/createSessionLog.js';
import { analyzeCodeTool, analyzeCodeSchema } from './tools/analyzeCode.js';

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
      analyzeCodeSchema,
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
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'summarize_design_decisions': {
        const result = summarizeDesignDecisions(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'generate_dev_document': {
        const result = generateDevDocument(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'normalize_for_platform': {
        const result = normalizeForPlatform(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'publish_document': {
        const result = await publishDocument(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'create_session_log': {
        const result = await createSessionLog(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'analyze_code': {
        const result = analyzeCodeTool(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
