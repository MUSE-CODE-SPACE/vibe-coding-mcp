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

// Core
import { createErrorResponse, ToolError } from './core/errors.js';
import { initializeAI, isAIAvailable } from './core/ai.js';
import {
  validateInput,
  CollectCodeContextSchema,
  SummarizeDesignDecisionsSchema,
  GenerateDevDocumentSchema,
  NormalizeForPlatformSchema,
  PublishDocumentSchema,
  CreateSessionLogSchema,
  AnalyzeCodeSchema,
  SessionHistorySchema,
  ExportSessionSchema,
  ProjectProfileSchema,
  GitSchema,
  SessionStatsSchema,
  AutoTagSchema,
  TemplateSchema,
  BatchSchema,
} from './core/schemas.js';

// Tools
import { collectCodeContext, collectCodeContextSchema } from './tools/collectCodeContext.js';
import { summarizeDesignDecisions, summarizeDesignDecisionsSchema } from './tools/summarizeDesignDecisions.js';
import { generateDevDocument, generateDevDocumentSchema } from './tools/generateDevDocument.js';
import { normalizeForPlatform, normalizeForPlatformSchema } from './tools/normalizeForPlatform.js';
import { publishDocument, publishDocumentSchema } from './tools/publishDocument.js';
import { createSessionLog, createSessionLogSchema } from './tools/createSessionLog.js';
import { analyzeCodeTool, analyzeCodeSchema } from './tools/analyzeCode.js';
import { sessionHistoryTool, sessionHistorySchema } from './tools/sessionHistory.js';
import { exportSessionTool, exportSessionSchema } from './tools/exportSession.js';
import { projectProfileTool, projectProfileSchema } from './tools/projectProfile.js';
import { gitTool, gitSchema } from './tools/git.js';
import { sessionStatsTool, sessionStatsSchema } from './tools/sessionStats.js';
import { autoTagTool, autoTagSchema } from './tools/autoTag.js';
import { templateTool, templateSchema } from './tools/template.js';
import { batchTool, batchSchema } from './tools/batch.js';

// Tool handlers with validation
const toolHandlers = {
  muse_collect_code_context: (args: unknown) => {
    const validated = validateInput(CollectCodeContextSchema, args);
    return collectCodeContext(validated as Parameters<typeof collectCodeContext>[0]);
  },

  muse_summarize_design_decisions: async (args: unknown) => {
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

  muse_analyze_code: async (args: unknown) => {
    const validated = validateInput(AnalyzeCodeSchema, args);
    return analyzeCodeTool(validated as Parameters<typeof analyzeCodeTool>[0]);
  },

  muse_session_history: async (args: unknown) => {
    const validated = validateInput(SessionHistorySchema, args);
    return sessionHistoryTool(validated as Parameters<typeof sessionHistoryTool>[0]);
  },

  muse_export_session: async (args: unknown) => {
    const validated = validateInput(ExportSessionSchema, args);
    return exportSessionTool(validated as Parameters<typeof exportSessionTool>[0]);
  },

  muse_project_profile: async (args: unknown) => {
    const validated = validateInput(ProjectProfileSchema, args);
    return projectProfileTool(validated as Parameters<typeof projectProfileTool>[0]);
  },

  muse_git: async (args: unknown) => {
    const validated = validateInput(GitSchema, args);
    return gitTool(validated as Parameters<typeof gitTool>[0]);
  },

  muse_session_stats: async (args: unknown) => {
    const validated = validateInput(SessionStatsSchema, args);
    return sessionStatsTool(validated as Parameters<typeof sessionStatsTool>[0]);
  },

  muse_auto_tag: async (args: unknown) => {
    const validated = validateInput(AutoTagSchema, args);
    return autoTagTool(validated as Parameters<typeof autoTagTool>[0]);
  },

  muse_template: async (args: unknown) => {
    const validated = validateInput(TemplateSchema, args);
    return templateTool(validated as Parameters<typeof templateTool>[0]);
  },

  muse_batch: async (args: unknown) => {
    const validated = validateInput(BatchSchema, args);
    return batchTool(validated as Parameters<typeof batchTool>[0]);
  },
} as const;

type ToolName = keyof typeof toolHandlers;

function isValidToolName(name: string): name is ToolName {
  return name in toolHandlers;
}

const server = new Server(
  {
    name: 'vibe-coding-mcp',
    version: '2.12.0',
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
      sessionHistorySchema,
      exportSessionSchema,
      projectProfileSchema,
      gitSchema,
      sessionStatsSchema,
      autoTagSchema,
      templateSchema,
      batchSchema,
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
  } catch (error) {
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
