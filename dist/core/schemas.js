import { z } from 'zod';
/**
 * Zod schemas for input validation
 * Aligned with existing type definitions in types/index.ts
 */
// Common schemas - matching existing types
export const CodeBlockSchema = z.object({
    language: z.string().default('text'),
    code: z.string(),
    filename: z.string().optional(),
    description: z.string().optional()
});
export const DesignDecisionSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    rationale: z.string(),
    alternatives: z.array(z.string()).optional(),
    category: z.enum(['architecture', 'library', 'pattern', 'implementation', 'other']).default('other'),
    timestamp: z.string().default(() => new Date().toISOString())
});
export const CodeContextSchema = z.object({
    sessionId: z.string(),
    timestamp: z.string(),
    codeBlocks: z.array(CodeBlockSchema),
    conversationSummary: z.string(),
    tags: z.array(z.string()).optional()
});
export const SessionLogOptionsSchema = z.object({
    logType: z.enum(['daily', 'session']).default('session'),
    outputPath: z.string().optional(),
    format: z.enum(['markdown', 'json']).optional().default('markdown')
});
// Tool input schemas - matching existing tool interfaces
export const CollectCodeContextSchema = z.object({
    codeBlocks: z.array(CodeBlockSchema).optional(),
    rawText: z.string().optional(),
    conversationSummary: z.string().min(1, 'Conversation summary is required'),
    tags: z.array(z.string()).optional(),
    autoDetectLanguage: z.boolean().optional().default(true),
    removeDuplicates: z.boolean().optional().default(true),
    includeStats: z.boolean().optional().default(false)
});
export const SummarizeDesignDecisionsSchema = z.object({
    conversationLog: z.string().min(1, 'Conversation log is required'),
    projectContext: z.string().optional(),
    language: z.enum(['en', 'ko', 'auto']).optional().default('auto'),
    includeImportanceScore: z.boolean().optional().default(true),
    extractRelatedCode: z.boolean().optional().default(true),
    maxDecisions: z.number().min(1).max(50).optional().default(20),
    useAI: z.boolean().optional().default(false)
});
export const GenerateDevDocumentSchema = z.object({
    documentType: z.enum(['README', 'DESIGN', 'TUTORIAL', 'CHANGELOG', 'API', 'ARCHITECTURE']),
    title: z.string().optional(),
    description: z.string().optional(),
    projectName: z.string().optional(),
    author: z.string().optional(),
    version: z.string().optional(),
    license: z.string().optional(),
    language: z.enum(['en', 'ko']).optional().default('en'),
    features: z.array(z.string()).optional(),
    installation: z.object({
        requirements: z.array(z.string()).optional(),
        steps: z.array(z.string()).optional()
    }).optional(),
    apiReference: z.array(z.object({
        name: z.string(),
        description: z.string(),
        params: z.array(z.string()).optional(),
        returns: z.string().optional()
    })).optional(),
    designDecisions: z.array(DesignDecisionSchema).optional(),
    codeContexts: z.array(CodeContextSchema).optional(),
    changelog: z.array(z.object({
        version: z.string(),
        date: z.string(),
        changes: z.array(z.string())
    })).optional(),
    includeTableOfContents: z.boolean().optional().default(false),
    faq: z.array(z.object({
        question: z.string(),
        answer: z.string()
    })).optional(),
    contributors: z.array(z.object({
        name: z.string(),
        role: z.string().optional()
    })).optional()
});
export const NormalizeForPlatformSchema = z.object({
    document: z.string().min(1, 'Document is required'),
    platform: z.enum(['notion', 'github-wiki', 'obsidian']),
    options: z.object({
        addFrontmatter: z.boolean().optional(),
        addTimestamp: z.boolean().optional(),
        customMetadata: z.record(z.string()).optional()
    }).optional()
});
export const PublishDocumentSchema = z.object({
    document: z.string().min(1, 'Document is required'),
    platform: z.enum(['notion', 'github-wiki', 'obsidian', 'confluence', 'slack', 'discord']),
    title: z.string().min(1, 'Title is required'),
    options: z.object({
        filename: z.string().optional(),
        wikiPath: z.string().optional(),
        vaultPath: z.string().optional(),
        tags: z.array(z.string()).optional()
    }).optional()
});
export const CreateSessionLogSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    summary: z.string().min(1, 'Summary is required'),
    codeContexts: z.array(CodeContextSchema).optional(),
    designDecisions: z.array(DesignDecisionSchema).optional(),
    duration: z.number().optional(),
    tags: z.array(z.string()).optional(),
    options: SessionLogOptionsSchema.optional()
});
export const AnalyzeCodeSchema = z.object({
    code: z.string().min(1, 'Code is required'),
    language: z.enum(['typescript', 'javascript', 'python', 'go']).optional(),
    filename: z.string().optional(),
    generateDiagrams: z.boolean().optional().default(true),
    diagramTypes: z.array(z.enum(['class', 'flowchart', 'dependency', 'all'])).optional().default(['all']),
    useAI: z.boolean().optional().default(false)
});
export const SessionHistorySchema = z.object({
    action: z.enum(['save', 'get', 'update', 'delete', 'list', 'search', 'stats']),
    sessionId: z.string().optional(),
    title: z.string().optional(),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
    codeContexts: z.array(z.object({
        sessionId: z.string(),
        timestamp: z.string(),
        codeBlocks: z.array(z.object({
            language: z.string(),
            code: z.string(),
            filename: z.string().optional()
        })),
        conversationSummary: z.string()
    })).optional(),
    designDecisions: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        rationale: z.string(),
        category: z.string(),
        timestamp: z.string()
    })).optional(),
    metadata: z.record(z.unknown()).optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
    filterTags: z.array(z.string()).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    keyword: z.string().optional(),
    searchIn: z.array(z.enum(['title', 'summary', 'tags'])).optional()
});
/**
 * Validates input against schema and returns typed result
 */
export function validateInput(schema, input) {
    const result = schema.safeParse(input);
    if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`Validation failed: ${errors}`);
    }
    return result.data;
}
//# sourceMappingURL=schemas.js.map