/**
 * Shared tool registry — single source of truth for all 15 MCP tools.
 *
 * Both entry points (`src/index.ts` HTTP transport and `src/stdio.ts` stdio
 * transport) import from this module so they expose an identical capability
 * surface. Adding/removing a tool is a single-line change here.
 */

import { z } from 'zod';

import { createErrorResponse, ToolError } from './errors.js';
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
} from './schemas.js';

// Tool implementations
import { collectCodeContext, collectCodeContextSchema } from '../tools/collectCodeContext.js';
import {
  summarizeDesignDecisions,
  summarizeDesignDecisionsSchema,
} from '../tools/summarizeDesignDecisions.js';
import { generateDevDocument, generateDevDocumentSchema } from '../tools/generateDevDocument.js';
import { normalizeForPlatform, normalizeForPlatformSchema } from '../tools/normalizeForPlatform.js';
import { publishDocument, publishDocumentSchema } from '../tools/publishDocument.js';
import { createSessionLog, createSessionLogSchema } from '../tools/createSessionLog.js';
import { analyzeCodeTool, analyzeCodeSchema } from '../tools/analyzeCode.js';
import { sessionHistoryTool, sessionHistorySchema } from '../tools/sessionHistory.js';
import { exportSessionTool, exportSessionSchema } from '../tools/exportSession.js';
import { projectProfileTool, projectProfileSchema } from '../tools/projectProfile.js';
import { gitTool, gitSchema } from '../tools/git.js';
import { sessionStatsTool, sessionStatsSchema } from '../tools/sessionStats.js';
import { autoTagTool, autoTagSchema } from '../tools/autoTag.js';
import { templateTool, templateSchema } from '../tools/template.js';
import { batchTool, batchSchema } from '../tools/batch.js';

/**
 * MCP-style tool definition object (the JSON-schema descriptor that ships
 * over the wire to clients via `tools/list`).
 */
export interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema: unknown;
}

/**
 * A registered tool — pairs the public JSON-schema descriptor with the
 * server-side handler (which validates input via a Zod schema then dispatches
 * to the underlying tool implementation).
 */
export interface RegisteredTool {
  /** Descriptor returned by `tools/list`. */
  descriptor: ToolDescriptor;
  /** Zod schema used to validate `tools/call` arguments. */
  inputZodSchema: z.ZodTypeAny;
  /** Validated-input handler. Returns the tool's structured result object. */
  handler: (args: unknown) => unknown | Promise<unknown>;
}

/**
 * All 15 tools, in display order. Edit this array to add/remove/reorder
 * capabilities. The order here is the order clients see in `tools/list`.
 */
export const TOOL_REGISTRY: readonly RegisteredTool[] = [
  {
    descriptor: collectCodeContextSchema as ToolDescriptor,
    inputZodSchema: CollectCodeContextSchema,
    handler: (args) => {
      const validated = validateInput(CollectCodeContextSchema, args);
      return collectCodeContext(validated as Parameters<typeof collectCodeContext>[0]);
    },
  },
  {
    descriptor: summarizeDesignDecisionsSchema as ToolDescriptor,
    inputZodSchema: SummarizeDesignDecisionsSchema,
    handler: async (args) => {
      const validated = validateInput(SummarizeDesignDecisionsSchema, args);
      return summarizeDesignDecisions(validated as Parameters<typeof summarizeDesignDecisions>[0]);
    },
  },
  {
    descriptor: generateDevDocumentSchema as ToolDescriptor,
    inputZodSchema: GenerateDevDocumentSchema,
    handler: (args) => {
      const validated = validateInput(GenerateDevDocumentSchema, args);
      return generateDevDocument(validated as Parameters<typeof generateDevDocument>[0]);
    },
  },
  {
    descriptor: normalizeForPlatformSchema as ToolDescriptor,
    inputZodSchema: NormalizeForPlatformSchema,
    handler: (args) => {
      const validated = validateInput(NormalizeForPlatformSchema, args);
      return normalizeForPlatform(validated as Parameters<typeof normalizeForPlatform>[0]);
    },
  },
  {
    descriptor: publishDocumentSchema as ToolDescriptor,
    inputZodSchema: PublishDocumentSchema,
    handler: async (args) => {
      const validated = validateInput(PublishDocumentSchema, args);
      return publishDocument(validated as Parameters<typeof publishDocument>[0]);
    },
  },
  {
    descriptor: createSessionLogSchema as ToolDescriptor,
    inputZodSchema: CreateSessionLogSchema,
    handler: async (args) => {
      const validated = validateInput(CreateSessionLogSchema, args);
      return createSessionLog(validated as Parameters<typeof createSessionLog>[0]);
    },
  },
  {
    descriptor: analyzeCodeSchema as ToolDescriptor,
    inputZodSchema: AnalyzeCodeSchema,
    handler: async (args) => {
      const validated = validateInput(AnalyzeCodeSchema, args);
      return analyzeCodeTool(validated as Parameters<typeof analyzeCodeTool>[0]);
    },
  },
  {
    descriptor: sessionHistorySchema as ToolDescriptor,
    inputZodSchema: SessionHistorySchema,
    handler: async (args) => {
      const validated = validateInput(SessionHistorySchema, args);
      return sessionHistoryTool(validated as Parameters<typeof sessionHistoryTool>[0]);
    },
  },
  {
    descriptor: exportSessionSchema as ToolDescriptor,
    inputZodSchema: ExportSessionSchema,
    handler: async (args) => {
      const validated = validateInput(ExportSessionSchema, args);
      return exportSessionTool(validated as Parameters<typeof exportSessionTool>[0]);
    },
  },
  {
    descriptor: projectProfileSchema as ToolDescriptor,
    inputZodSchema: ProjectProfileSchema,
    handler: async (args) => {
      const validated = validateInput(ProjectProfileSchema, args);
      return projectProfileTool(validated as Parameters<typeof projectProfileTool>[0]);
    },
  },
  {
    descriptor: gitSchema as ToolDescriptor,
    inputZodSchema: GitSchema,
    handler: async (args) => {
      const validated = validateInput(GitSchema, args);
      return gitTool(validated as Parameters<typeof gitTool>[0]);
    },
  },
  {
    descriptor: sessionStatsSchema as ToolDescriptor,
    inputZodSchema: SessionStatsSchema,
    handler: async (args) => {
      const validated = validateInput(SessionStatsSchema, args);
      return sessionStatsTool(validated as Parameters<typeof sessionStatsTool>[0]);
    },
  },
  {
    descriptor: autoTagSchema as ToolDescriptor,
    inputZodSchema: AutoTagSchema,
    handler: async (args) => {
      const validated = validateInput(AutoTagSchema, args);
      return autoTagTool(validated as Parameters<typeof autoTagTool>[0]);
    },
  },
  {
    descriptor: templateSchema as ToolDescriptor,
    inputZodSchema: TemplateSchema,
    handler: async (args) => {
      const validated = validateInput(TemplateSchema, args);
      return templateTool(validated as Parameters<typeof templateTool>[0]);
    },
  },
  {
    descriptor: batchSchema as ToolDescriptor,
    inputZodSchema: BatchSchema,
    handler: async (args) => {
      const validated = validateInput(BatchSchema, args);
      return batchTool(validated as Parameters<typeof batchTool>[0]);
    },
  },
] as const;

/** All tool names exposed by the server. */
export function getToolNames(): string[] {
  return TOOL_REGISTRY.map((t) => t.descriptor.name);
}

/** All tool descriptors (for `tools/list`). */
export function getToolDescriptors(): ToolDescriptor[] {
  return TOOL_REGISTRY.map((t) => t.descriptor);
}

/** Look up a registered tool by its public name. */
export function findTool(name: string): RegisteredTool | undefined {
  return TOOL_REGISTRY.find((t) => t.descriptor.name === name);
}

/**
 * Wraps a tool handler invocation into the MCP `tools/call` result envelope.
 * Used by the low-level transport adapter (kept for backward compatibility);
 * the high-level `McpServer.tool()` registration in `mcpServerFactory.ts`
 * uses the handler directly.
 */
export async function callToolByName(
  name: string,
  args: unknown,
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  try {
    const tool = findTool(name);
    if (!tool) {
      throw new ToolError(`Unknown tool: ${name}`, 'NOT_FOUND', { tool: name });
    }
    const result = await tool.handler(args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return createErrorResponse(error);
  }
}
