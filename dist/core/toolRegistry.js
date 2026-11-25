/**
 * Shared tool registry — single source of truth for all 18 MCP tools.
 *
 * Both entry points (`src/index.ts` HTTP transport and `src/stdio.ts` stdio
 * transport) import from this module so they expose an identical capability
 * surface. Adding/removing a tool is a single-line change here.
 */
import { createErrorResponse, ToolError } from './errors.js';
import { validateInput, CollectCodeContextSchema, SummarizeDesignDecisionsSchema, GenerateDevDocumentSchema, NormalizeForPlatformSchema, PublishDocumentSchema, CreateSessionLogSchema, AnalyzeCodeSchema, SessionHistorySchema, ExportSessionSchema, ProjectProfileSchema, GitSchema, SessionStatsSchema, AutoTagSchema, TemplateSchema, BatchSchema, CaptureTranscriptSchema, DigestSchema, RecallSchema, } from './schemas.js';
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
import { captureTranscriptTool, captureTranscriptSchema } from '../tools/captureTranscript.js';
import { digestTool, digestSchema } from '../tools/digest.js';
import { recallTool, recallSchema } from '../tools/recall.js';
/**
 * All 18 tools, in display order. Edit this array to add/remove/reorder
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
    {
        descriptor: captureTranscriptSchema,
        inputZodSchema: CaptureTranscriptSchema,
        handler: async (args) => {
            const validated = validateInput(CaptureTranscriptSchema, args);
            return captureTranscriptTool(validated);
        },
    },
    {
        descriptor: digestSchema,
        inputZodSchema: DigestSchema,
        handler: async (args) => {
            const validated = validateInput(DigestSchema, args);
            return digestTool(validated);
        },
    },
    {
        descriptor: recallSchema,
        inputZodSchema: RecallSchema,
        handler: async (args) => {
            const validated = validateInput(RecallSchema, args);
            return recallTool(validated);
        },
    },
];
const LOCAL_READ = { readOnlyHint: true, openWorldHint: false };
export const TOOL_ANNOTATIONS = {
    muse_collect_code_context: { title: 'Collect code context', ...LOCAL_READ },
    // May call the Anthropic API when useAI=true.
    muse_summarize_design_decisions: { title: 'Summarize design decisions', readOnlyHint: true, openWorldHint: true },
    muse_generate_dev_document: { title: 'Generate dev document', ...LOCAL_READ },
    muse_normalize_for_platform: { title: 'Normalize for platform', ...LOCAL_READ },
    muse_publish_document: { title: 'Publish document', readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    muse_create_session_log: { title: 'Create session log', ...LOCAL_READ },
    muse_analyze_code: { title: 'Analyze code', ...LOCAL_READ },
    muse_session_history: { title: 'Session history', readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    muse_export_session: { title: 'Export session', readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    muse_project_profile: { title: 'Project profile', readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    muse_git: { title: 'Git', readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    muse_session_stats: { title: 'Session statistics', ...LOCAL_READ },
    muse_auto_tag: { title: 'Auto-tag sessions', readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    muse_template: { title: 'Document templates', readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    muse_batch: { title: 'Batch operations', readOnlyHint: false, destructiveHint: true, openWorldHint: true },
    muse_capture_transcript: { title: 'Capture transcript', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    muse_digest: { title: 'Digest / report', ...LOCAL_READ },
    muse_recall: { title: 'Recall project history', ...LOCAL_READ },
};
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