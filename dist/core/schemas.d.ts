import { z } from 'zod';
/**
 * Zod schemas for input validation
 * Aligned with existing type definitions in types/index.ts
 */
export declare const CodeBlockSchema: z.ZodObject<{
    language: z.ZodDefault<z.ZodString>;
    code: z.ZodString;
    filename: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    language: string;
    filename?: string | undefined;
    description?: string | undefined;
}, {
    code: string;
    language?: string | undefined;
    filename?: string | undefined;
    description?: string | undefined;
}>;
export declare const DesignDecisionSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    rationale: z.ZodString;
    alternatives: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    category: z.ZodDefault<z.ZodEnum<["architecture", "library", "pattern", "implementation", "other"]>>;
    timestamp: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    description: string;
    id: string;
    title: string;
    rationale: string;
    category: "architecture" | "library" | "pattern" | "implementation" | "other";
    alternatives?: string[] | undefined;
}, {
    description: string;
    id: string;
    title: string;
    rationale: string;
    timestamp?: string | undefined;
    alternatives?: string[] | undefined;
    category?: "architecture" | "library" | "pattern" | "implementation" | "other" | undefined;
}>;
export declare const CodeContextSchema: z.ZodObject<{
    sessionId: z.ZodString;
    timestamp: z.ZodString;
    codeBlocks: z.ZodArray<z.ZodObject<{
        language: z.ZodDefault<z.ZodString>;
        code: z.ZodString;
        filename: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        language: string;
        filename?: string | undefined;
        description?: string | undefined;
    }, {
        code: string;
        language?: string | undefined;
        filename?: string | undefined;
        description?: string | undefined;
    }>, "many">;
    conversationSummary: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    sessionId: string;
    codeBlocks: {
        code: string;
        language: string;
        filename?: string | undefined;
        description?: string | undefined;
    }[];
    conversationSummary: string;
    tags?: string[] | undefined;
}, {
    timestamp: string;
    sessionId: string;
    codeBlocks: {
        code: string;
        language?: string | undefined;
        filename?: string | undefined;
        description?: string | undefined;
    }[];
    conversationSummary: string;
    tags?: string[] | undefined;
}>;
export declare const SessionLogOptionsSchema: z.ZodObject<{
    logType: z.ZodDefault<z.ZodEnum<["daily", "session"]>>;
    outputPath: z.ZodOptional<z.ZodString>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["markdown", "json"]>>>;
}, "strip", z.ZodTypeAny, {
    logType: "daily" | "session";
    format: "markdown" | "json";
    outputPath?: string | undefined;
}, {
    logType?: "daily" | "session" | undefined;
    outputPath?: string | undefined;
    format?: "markdown" | "json" | undefined;
}>;
export declare const CollectCodeContextSchema: z.ZodObject<{
    codeBlocks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        language: z.ZodDefault<z.ZodString>;
        code: z.ZodString;
        filename: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        language: string;
        filename?: string | undefined;
        description?: string | undefined;
    }, {
        code: string;
        language?: string | undefined;
        filename?: string | undefined;
        description?: string | undefined;
    }>, "many">>;
    rawText: z.ZodOptional<z.ZodString>;
    conversationSummary: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    autoDetectLanguage: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    removeDuplicates: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeStats: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    conversationSummary: string;
    autoDetectLanguage: boolean;
    removeDuplicates: boolean;
    includeStats: boolean;
    codeBlocks?: {
        code: string;
        language: string;
        filename?: string | undefined;
        description?: string | undefined;
    }[] | undefined;
    tags?: string[] | undefined;
    rawText?: string | undefined;
}, {
    conversationSummary: string;
    codeBlocks?: {
        code: string;
        language?: string | undefined;
        filename?: string | undefined;
        description?: string | undefined;
    }[] | undefined;
    tags?: string[] | undefined;
    rawText?: string | undefined;
    autoDetectLanguage?: boolean | undefined;
    removeDuplicates?: boolean | undefined;
    includeStats?: boolean | undefined;
}>;
export declare const SummarizeDesignDecisionsSchema: z.ZodObject<{
    conversationLog: z.ZodString;
    projectContext: z.ZodOptional<z.ZodString>;
    language: z.ZodDefault<z.ZodOptional<z.ZodEnum<["en", "ko", "auto"]>>>;
    includeImportanceScore: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    extractRelatedCode: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    maxDecisions: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    useAI: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    language: "en" | "ko" | "auto";
    conversationLog: string;
    includeImportanceScore: boolean;
    extractRelatedCode: boolean;
    maxDecisions: number;
    useAI: boolean;
    projectContext?: string | undefined;
}, {
    conversationLog: string;
    language?: "en" | "ko" | "auto" | undefined;
    projectContext?: string | undefined;
    includeImportanceScore?: boolean | undefined;
    extractRelatedCode?: boolean | undefined;
    maxDecisions?: number | undefined;
    useAI?: boolean | undefined;
}>;
export declare const GenerateDevDocumentSchema: z.ZodObject<{
    documentType: z.ZodEnum<["README", "DESIGN", "TUTORIAL", "CHANGELOG", "API", "ARCHITECTURE"]>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    projectName: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodString>;
    license: z.ZodOptional<z.ZodString>;
    language: z.ZodDefault<z.ZodOptional<z.ZodEnum<["en", "ko"]>>>;
    features: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    installation: z.ZodOptional<z.ZodObject<{
        requirements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        steps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        requirements?: string[] | undefined;
        steps?: string[] | undefined;
    }, {
        requirements?: string[] | undefined;
        steps?: string[] | undefined;
    }>>;
    apiReference: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        params: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        returns: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        params?: string[] | undefined;
        returns?: string | undefined;
    }, {
        name: string;
        description: string;
        params?: string[] | undefined;
        returns?: string | undefined;
    }>, "many">>;
    designDecisions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        rationale: z.ZodString;
        alternatives: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        category: z.ZodDefault<z.ZodEnum<["architecture", "library", "pattern", "implementation", "other"]>>;
        timestamp: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        description: string;
        id: string;
        title: string;
        rationale: string;
        category: "architecture" | "library" | "pattern" | "implementation" | "other";
        alternatives?: string[] | undefined;
    }, {
        description: string;
        id: string;
        title: string;
        rationale: string;
        timestamp?: string | undefined;
        alternatives?: string[] | undefined;
        category?: "architecture" | "library" | "pattern" | "implementation" | "other" | undefined;
    }>, "many">>;
    codeContexts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        sessionId: z.ZodString;
        timestamp: z.ZodString;
        codeBlocks: z.ZodArray<z.ZodObject<{
            language: z.ZodDefault<z.ZodString>;
            code: z.ZodString;
            filename: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            code: string;
            language: string;
            filename?: string | undefined;
            description?: string | undefined;
        }, {
            code: string;
            language?: string | undefined;
            filename?: string | undefined;
            description?: string | undefined;
        }>, "many">;
        conversationSummary: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        sessionId: string;
        codeBlocks: {
            code: string;
            language: string;
            filename?: string | undefined;
            description?: string | undefined;
        }[];
        conversationSummary: string;
        tags?: string[] | undefined;
    }, {
        timestamp: string;
        sessionId: string;
        codeBlocks: {
            code: string;
            language?: string | undefined;
            filename?: string | undefined;
            description?: string | undefined;
        }[];
        conversationSummary: string;
        tags?: string[] | undefined;
    }>, "many">>;
    changelog: z.ZodOptional<z.ZodArray<z.ZodObject<{
        version: z.ZodString;
        date: z.ZodString;
        changes: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        date: string;
        version: string;
        changes: string[];
    }, {
        date: string;
        version: string;
        changes: string[];
    }>, "many">>;
    includeTableOfContents: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    faq: z.ZodOptional<z.ZodArray<z.ZodObject<{
        question: z.ZodString;
        answer: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        question: string;
        answer: string;
    }, {
        question: string;
        answer: string;
    }>, "many">>;
    contributors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        role?: string | undefined;
    }, {
        name: string;
        role?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    language: "en" | "ko";
    documentType: "README" | "DESIGN" | "TUTORIAL" | "CHANGELOG" | "API" | "ARCHITECTURE";
    includeTableOfContents: boolean;
    description?: string | undefined;
    title?: string | undefined;
    projectName?: string | undefined;
    author?: string | undefined;
    version?: string | undefined;
    license?: string | undefined;
    features?: string[] | undefined;
    installation?: {
        requirements?: string[] | undefined;
        steps?: string[] | undefined;
    } | undefined;
    apiReference?: {
        name: string;
        description: string;
        params?: string[] | undefined;
        returns?: string | undefined;
    }[] | undefined;
    designDecisions?: {
        timestamp: string;
        description: string;
        id: string;
        title: string;
        rationale: string;
        category: "architecture" | "library" | "pattern" | "implementation" | "other";
        alternatives?: string[] | undefined;
    }[] | undefined;
    codeContexts?: {
        timestamp: string;
        sessionId: string;
        codeBlocks: {
            code: string;
            language: string;
            filename?: string | undefined;
            description?: string | undefined;
        }[];
        conversationSummary: string;
        tags?: string[] | undefined;
    }[] | undefined;
    changelog?: {
        date: string;
        version: string;
        changes: string[];
    }[] | undefined;
    faq?: {
        question: string;
        answer: string;
    }[] | undefined;
    contributors?: {
        name: string;
        role?: string | undefined;
    }[] | undefined;
}, {
    documentType: "README" | "DESIGN" | "TUTORIAL" | "CHANGELOG" | "API" | "ARCHITECTURE";
    language?: "en" | "ko" | undefined;
    description?: string | undefined;
    title?: string | undefined;
    projectName?: string | undefined;
    author?: string | undefined;
    version?: string | undefined;
    license?: string | undefined;
    features?: string[] | undefined;
    installation?: {
        requirements?: string[] | undefined;
        steps?: string[] | undefined;
    } | undefined;
    apiReference?: {
        name: string;
        description: string;
        params?: string[] | undefined;
        returns?: string | undefined;
    }[] | undefined;
    designDecisions?: {
        description: string;
        id: string;
        title: string;
        rationale: string;
        timestamp?: string | undefined;
        alternatives?: string[] | undefined;
        category?: "architecture" | "library" | "pattern" | "implementation" | "other" | undefined;
    }[] | undefined;
    codeContexts?: {
        timestamp: string;
        sessionId: string;
        codeBlocks: {
            code: string;
            language?: string | undefined;
            filename?: string | undefined;
            description?: string | undefined;
        }[];
        conversationSummary: string;
        tags?: string[] | undefined;
    }[] | undefined;
    changelog?: {
        date: string;
        version: string;
        changes: string[];
    }[] | undefined;
    includeTableOfContents?: boolean | undefined;
    faq?: {
        question: string;
        answer: string;
    }[] | undefined;
    contributors?: {
        name: string;
        role?: string | undefined;
    }[] | undefined;
}>;
export declare const NormalizeForPlatformSchema: z.ZodObject<{
    document: z.ZodString;
    platform: z.ZodEnum<["notion", "github-wiki", "obsidian"]>;
    options: z.ZodOptional<z.ZodObject<{
        addFrontmatter: z.ZodOptional<z.ZodBoolean>;
        addTimestamp: z.ZodOptional<z.ZodBoolean>;
        customMetadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        addFrontmatter?: boolean | undefined;
        addTimestamp?: boolean | undefined;
        customMetadata?: Record<string, string> | undefined;
    }, {
        addFrontmatter?: boolean | undefined;
        addTimestamp?: boolean | undefined;
        customMetadata?: Record<string, string> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    platform: "notion" | "github-wiki" | "obsidian";
    document: string;
    options?: {
        addFrontmatter?: boolean | undefined;
        addTimestamp?: boolean | undefined;
        customMetadata?: Record<string, string> | undefined;
    } | undefined;
}, {
    platform: "notion" | "github-wiki" | "obsidian";
    document: string;
    options?: {
        addFrontmatter?: boolean | undefined;
        addTimestamp?: boolean | undefined;
        customMetadata?: Record<string, string> | undefined;
    } | undefined;
}>;
export declare const PublishDocumentSchema: z.ZodObject<{
    document: z.ZodString;
    platform: z.ZodEnum<["notion", "github-wiki", "obsidian", "confluence", "slack", "discord"]>;
    title: z.ZodString;
    options: z.ZodOptional<z.ZodObject<{
        filename: z.ZodOptional<z.ZodString>;
        wikiPath: z.ZodOptional<z.ZodString>;
        vaultPath: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        filename?: string | undefined;
        tags?: string[] | undefined;
        wikiPath?: string | undefined;
        vaultPath?: string | undefined;
    }, {
        filename?: string | undefined;
        tags?: string[] | undefined;
        wikiPath?: string | undefined;
        vaultPath?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    platform: "notion" | "github-wiki" | "obsidian" | "confluence" | "slack" | "discord";
    title: string;
    document: string;
    options?: {
        filename?: string | undefined;
        tags?: string[] | undefined;
        wikiPath?: string | undefined;
        vaultPath?: string | undefined;
    } | undefined;
}, {
    platform: "notion" | "github-wiki" | "obsidian" | "confluence" | "slack" | "discord";
    title: string;
    document: string;
    options?: {
        filename?: string | undefined;
        tags?: string[] | undefined;
        wikiPath?: string | undefined;
        vaultPath?: string | undefined;
    } | undefined;
}>;
export declare const CreateSessionLogSchema: z.ZodObject<{
    title: z.ZodString;
    summary: z.ZodString;
    codeContexts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        sessionId: z.ZodString;
        timestamp: z.ZodString;
        codeBlocks: z.ZodArray<z.ZodObject<{
            language: z.ZodDefault<z.ZodString>;
            code: z.ZodString;
            filename: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            code: string;
            language: string;
            filename?: string | undefined;
            description?: string | undefined;
        }, {
            code: string;
            language?: string | undefined;
            filename?: string | undefined;
            description?: string | undefined;
        }>, "many">;
        conversationSummary: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        sessionId: string;
        codeBlocks: {
            code: string;
            language: string;
            filename?: string | undefined;
            description?: string | undefined;
        }[];
        conversationSummary: string;
        tags?: string[] | undefined;
    }, {
        timestamp: string;
        sessionId: string;
        codeBlocks: {
            code: string;
            language?: string | undefined;
            filename?: string | undefined;
            description?: string | undefined;
        }[];
        conversationSummary: string;
        tags?: string[] | undefined;
    }>, "many">>;
    designDecisions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        rationale: z.ZodString;
        alternatives: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        category: z.ZodDefault<z.ZodEnum<["architecture", "library", "pattern", "implementation", "other"]>>;
        timestamp: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        description: string;
        id: string;
        title: string;
        rationale: string;
        category: "architecture" | "library" | "pattern" | "implementation" | "other";
        alternatives?: string[] | undefined;
    }, {
        description: string;
        id: string;
        title: string;
        rationale: string;
        timestamp?: string | undefined;
        alternatives?: string[] | undefined;
        category?: "architecture" | "library" | "pattern" | "implementation" | "other" | undefined;
    }>, "many">>;
    duration: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    options: z.ZodOptional<z.ZodObject<{
        logType: z.ZodDefault<z.ZodEnum<["daily", "session"]>>;
        outputPath: z.ZodOptional<z.ZodString>;
        format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["markdown", "json"]>>>;
    }, "strip", z.ZodTypeAny, {
        logType: "daily" | "session";
        format: "markdown" | "json";
        outputPath?: string | undefined;
    }, {
        logType?: "daily" | "session" | undefined;
        outputPath?: string | undefined;
        format?: "markdown" | "json" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    summary: string;
    options?: {
        logType: "daily" | "session";
        format: "markdown" | "json";
        outputPath?: string | undefined;
    } | undefined;
    tags?: string[] | undefined;
    designDecisions?: {
        timestamp: string;
        description: string;
        id: string;
        title: string;
        rationale: string;
        category: "architecture" | "library" | "pattern" | "implementation" | "other";
        alternatives?: string[] | undefined;
    }[] | undefined;
    codeContexts?: {
        timestamp: string;
        sessionId: string;
        codeBlocks: {
            code: string;
            language: string;
            filename?: string | undefined;
            description?: string | undefined;
        }[];
        conversationSummary: string;
        tags?: string[] | undefined;
    }[] | undefined;
    duration?: number | undefined;
}, {
    title: string;
    summary: string;
    options?: {
        logType?: "daily" | "session" | undefined;
        outputPath?: string | undefined;
        format?: "markdown" | "json" | undefined;
    } | undefined;
    tags?: string[] | undefined;
    designDecisions?: {
        description: string;
        id: string;
        title: string;
        rationale: string;
        timestamp?: string | undefined;
        alternatives?: string[] | undefined;
        category?: "architecture" | "library" | "pattern" | "implementation" | "other" | undefined;
    }[] | undefined;
    codeContexts?: {
        timestamp: string;
        sessionId: string;
        codeBlocks: {
            code: string;
            language?: string | undefined;
            filename?: string | undefined;
            description?: string | undefined;
        }[];
        conversationSummary: string;
        tags?: string[] | undefined;
    }[] | undefined;
    duration?: number | undefined;
}>;
export declare const AnalyzeCodeSchema: z.ZodObject<{
    code: z.ZodString;
    language: z.ZodOptional<z.ZodEnum<["typescript", "javascript", "python", "go"]>>;
    filename: z.ZodOptional<z.ZodString>;
    generateDiagrams: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    diagramTypes: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodEnum<["class", "flowchart", "dependency", "all"]>, "many">>>;
    useAI: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    useAI: boolean;
    generateDiagrams: boolean;
    diagramTypes: ("class" | "flowchart" | "dependency" | "all")[];
    language?: "typescript" | "javascript" | "python" | "go" | undefined;
    filename?: string | undefined;
}, {
    code: string;
    language?: "typescript" | "javascript" | "python" | "go" | undefined;
    filename?: string | undefined;
    useAI?: boolean | undefined;
    generateDiagrams?: boolean | undefined;
    diagramTypes?: ("class" | "flowchart" | "dependency" | "all")[] | undefined;
}>;
export declare const SessionHistorySchema: z.ZodObject<{
    action: z.ZodEnum<["save", "get", "update", "delete", "list", "search", "stats"]>;
    sessionId: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    codeContexts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        sessionId: z.ZodString;
        timestamp: z.ZodString;
        codeBlocks: z.ZodArray<z.ZodObject<{
            language: z.ZodString;
            code: z.ZodString;
            filename: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            code: string;
            language: string;
            filename?: string | undefined;
        }, {
            code: string;
            language: string;
            filename?: string | undefined;
        }>, "many">;
        conversationSummary: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        sessionId: string;
        codeBlocks: {
            code: string;
            language: string;
            filename?: string | undefined;
        }[];
        conversationSummary: string;
    }, {
        timestamp: string;
        sessionId: string;
        codeBlocks: {
            code: string;
            language: string;
            filename?: string | undefined;
        }[];
        conversationSummary: string;
    }>, "many">>;
    designDecisions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        rationale: z.ZodString;
        category: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        description: string;
        id: string;
        title: string;
        rationale: string;
        category: string;
    }, {
        timestamp: string;
        description: string;
        id: string;
        title: string;
        rationale: string;
        category: string;
    }>, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
    filterTags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sortBy: z.ZodOptional<z.ZodEnum<["createdAt", "updatedAt", "title"]>>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    keyword: z.ZodOptional<z.ZodString>;
    searchIn: z.ZodOptional<z.ZodArray<z.ZodEnum<["title", "summary", "tags"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    action: "save" | "get" | "update" | "delete" | "list" | "search" | "stats";
    title?: string | undefined;
    sessionId?: string | undefined;
    tags?: string[] | undefined;
    designDecisions?: {
        timestamp: string;
        description: string;
        id: string;
        title: string;
        rationale: string;
        category: string;
    }[] | undefined;
    codeContexts?: {
        timestamp: string;
        sessionId: string;
        codeBlocks: {
            code: string;
            language: string;
            filename?: string | undefined;
        }[];
        conversationSummary: string;
    }[] | undefined;
    summary?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    filterTags?: string[] | undefined;
    sortBy?: "title" | "createdAt" | "updatedAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    keyword?: string | undefined;
    searchIn?: ("title" | "tags" | "summary")[] | undefined;
}, {
    action: "save" | "get" | "update" | "delete" | "list" | "search" | "stats";
    title?: string | undefined;
    sessionId?: string | undefined;
    tags?: string[] | undefined;
    designDecisions?: {
        timestamp: string;
        description: string;
        id: string;
        title: string;
        rationale: string;
        category: string;
    }[] | undefined;
    codeContexts?: {
        timestamp: string;
        sessionId: string;
        codeBlocks: {
            code: string;
            language: string;
            filename?: string | undefined;
        }[];
        conversationSummary: string;
    }[] | undefined;
    summary?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    filterTags?: string[] | undefined;
    sortBy?: "title" | "createdAt" | "updatedAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    keyword?: string | undefined;
    searchIn?: ("title" | "tags" | "summary")[] | undefined;
}>;
export type CollectCodeContextInput = z.infer<typeof CollectCodeContextSchema>;
export type SummarizeDesignDecisionsInput = z.infer<typeof SummarizeDesignDecisionsSchema>;
export type SessionHistoryInput = z.infer<typeof SessionHistorySchema>;
export type GenerateDevDocumentInput = z.infer<typeof GenerateDevDocumentSchema>;
export type NormalizeForPlatformInput = z.infer<typeof NormalizeForPlatformSchema>;
export type PublishDocumentInput = z.infer<typeof PublishDocumentSchema>;
export type CreateSessionLogInput = z.infer<typeof CreateSessionLogSchema>;
export type AnalyzeCodeInput = z.infer<typeof AnalyzeCodeSchema>;
/**
 * Validates input against schema and returns typed result
 */
export declare function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T;
//# sourceMappingURL=schemas.d.ts.map