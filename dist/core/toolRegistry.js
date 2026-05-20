/**
 * Shared tool registry — single source of truth for all 15 MCP tools.
 *
 * Both entry points (`src/index.ts` HTTP transport and `src/stdio.ts` stdio
 * transport) import from this module so they expose an identical capability
 * surface. Adding/removing a tool is a single-line change here.
 */
import { createErrorResponse, ToolError } from './errors.js';
import { validateInput, CollectCodeContextSchema, SummarizeDesignDecisionsSchema, GenerateDevDocumentSchema, NormalizeForPlatformSchema, PublishDocumentSchema, CreateSessionLogSchema, AnalyzeCodeSchema, SessionHistorySchema, ExportSessionSchema, ProjectProfileSchema, GitSchema, SessionStatsSchema, AutoTagSchema, TemplateSchema, BatchSchema, } from './schemas.js';
// Tool implementations
import { collectCodeContext, collectCodeContextSchema } from '../tools/collectCodeContext.js';
import { summarizeDesignDecisions, summarizeDesignDecisionsSchema, } from '../tools/summarizeDesignDecisions.js';
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
 * All 15 tools, in display order. Edit this array to add/remove/reorder
 * capabilities. The order here is the order clients see in `tools/list`.
 */
export const TOOL_REGISTRY = [
    {
        descriptor: collectCodeContextSchema,
        inputZodSchema: CollectCodeContextSchema,
        handler: (args) => {
            const validated = validateInput(CollectCodeContextSchema, args);
            return collectCodeContext(validated);
        },
    },
    {
        descriptor: summarizeDesignDecisionsSchema,
        inputZodSchema: SummarizeDesignDecisionsSchema,
        handler: async (args) => {
            const validated = validateInput(SummarizeDesignDecisionsSchema, args);
            return summarizeDesignDecisions(validated);
        },
    },
    {
        descriptor: generateDevDocumentSchema,
        inputZodSchema: GenerateDevDocumentSchema,
        handler: (args) => {
            const validated = validateInput(GenerateDevDocumentSchema, args);
            return generateDevDocument(validated);
        },
    },
    {
        descriptor: normalizeForPlatformSchema,
        inputZodSchema: NormalizeForPlatformSchema,
        handler: (args) => {
            const validated = validateInput(NormalizeForPlatformSchema, args);
            return normalizeForPlatform(validated);
        },
    },
    {
        descriptor: publishDocumentSchema,
        inputZodSchema: PublishDocumentSchema,
        handler: async (args) => {
            const validated = validateInput(PublishDocumentSchema, args);
            return publishDocument(validated);
        },
    },
    {
        descriptor: createSessionLogSchema,
        inputZodSchema: CreateSessionLogSchema,
        handler: async (args) => {
            const validated = validateInput(CreateSessionLogSchema, args);
            return createSessionLog(validated);
        },
    },
    {
        descriptor: analyzeCodeSchema,
        inputZodSchema: AnalyzeCodeSchema,
        handler: async (args) => {
            const validated = validateInput(AnalyzeCodeSchema, args);
            return analyzeCodeTool(validated);
        },
    },
    {
        descriptor: sessionHistorySchema,
        inputZodSchema: SessionHistorySchema,
        handler: async (args) => {
            const validated = validateInput(SessionHistorySchema, args);
            return sessionHistoryTool(validated);
        },
    },
    {
        descriptor: exportSessionSchema,
        inputZodSchema: ExportSessionSchema,
        handler: async (args) => {
            const validated = validateInput(ExportSessionSchema, args);
            return exportSessionTool(validated);
        },
    },
    {
        descriptor: projectProfileSchema,
        inputZodSchema: ProjectProfileSchema,
        handler: async (args) => {
            const validated = validateInput(ProjectProfileSchema, args);
            return projectProfileTool(validated);
        },
    },
    {
        descriptor: gitSchema,
        inputZodSchema: GitSchema,
        handler: async (args) => {
            const validated = validateInput(GitSchema, args);
            return gitTool(validated);
        },
    },
    {
        descriptor: sessionStatsSchema,
        inputZodSchema: SessionStatsSchema,
        handler: async (args) => {
            const validated = validateInput(SessionStatsSchema, args);
            return sessionStatsTool(validated);
        },
    },
    {
        descriptor: autoTagSchema,
        inputZodSchema: AutoTagSchema,
        handler: async (args) => {
            const validated = validateInput(AutoTagSchema, args);
            return autoTagTool(validated);
        },
    },
    {
        descriptor: templateSchema,
        inputZodSchema: TemplateSchema,
        handler: async (args) => {
            const validated = validateInput(TemplateSchema, args);
            return templateTool(validated);
        },
    },
    {
        descriptor: batchSchema,
        inputZodSchema: BatchSchema,
        handler: async (args) => {
            const validated = validateInput(BatchSchema, args);
            return batchTool(validated);
        },
    },
];
/** All tool names exposed by the server. */
export function getToolNames() {
    return TOOL_REGISTRY.map((t) => t.descriptor.name);
}
/** All tool descriptors (for `tools/list`). */
export function getToolDescriptors() {
    return TOOL_REGISTRY.map((t) => t.descriptor);
}
/** Look up a registered tool by its public name. */
export function findTool(name) {
    return TOOL_REGISTRY.find((t) => t.descriptor.name === name);
}
/**
 * Wraps a tool handler invocation into the MCP `tools/call` result envelope.
 * Used by the low-level transport adapter (kept for backward compatibility);
 * the high-level `McpServer.tool()` registration in `mcpServerFactory.ts`
 * uses the handler directly.
 */
export async function callToolByName(name, args) {
    try {
        const tool = findTool(name);
        if (!tool) {
            throw new ToolError(`Unknown tool: ${name}`, 'NOT_FOUND', { tool: name });
        }
        const result = await tool.handler(args);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
    }
    catch (error) {
        return createErrorResponse(error);
    }
}
//# sourceMappingURL=toolRegistry.js.map