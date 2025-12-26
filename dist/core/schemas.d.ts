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
export declare const ExportSessionSchema: z.ZodObject<{
    sessionIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    format: z.ZodEnum<["markdown", "json", "html"]>;
    outputPath: z.ZodOptional<z.ZodString>;
    includeMetadata: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeCodeBlocks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeDesignDecisions: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    template: z.ZodDefault<z.ZodOptional<z.ZodEnum<["default", "minimal", "detailed", "report"]>>>;
    title: z.ZodOptional<z.ZodString>;
    bundleMultiple: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    format: "markdown" | "json" | "html";
    includeMetadata: boolean;
    includeCodeBlocks: boolean;
    includeDesignDecisions: boolean;
    template: "default" | "minimal" | "detailed" | "report";
    bundleMultiple: boolean;
    title?: string | undefined;
    outputPath?: string | undefined;
    sessionIds?: string[] | undefined;
}, {
    format: "markdown" | "json" | "html";
    title?: string | undefined;
    outputPath?: string | undefined;
    sessionIds?: string[] | undefined;
    includeMetadata?: boolean | undefined;
    includeCodeBlocks?: boolean | undefined;
    includeDesignDecisions?: boolean | undefined;
    template?: "default" | "minimal" | "detailed" | "report" | undefined;
    bundleMultiple?: boolean | undefined;
}>;
export declare const ProjectProfileSchema: z.ZodObject<{
    action: z.ZodEnum<["create", "get", "update", "delete", "list", "setActive", "getActive", "clone"]>;
    profileId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    newName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    projectPath: z.ZodOptional<z.ZodString>;
    repository: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodString>;
    publishing: z.ZodOptional<z.ZodObject<{
        defaultPlatform: z.ZodOptional<z.ZodEnum<["notion", "github-wiki", "obsidian", "confluence", "slack", "discord"]>>;
        platformSettings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        autoPublish: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        defaultPlatform?: "notion" | "github-wiki" | "obsidian" | "confluence" | "slack" | "discord" | undefined;
        platformSettings?: Record<string, unknown> | undefined;
        autoPublish?: boolean | undefined;
    }, {
        defaultPlatform?: "notion" | "github-wiki" | "obsidian" | "confluence" | "slack" | "discord" | undefined;
        platformSettings?: Record<string, unknown> | undefined;
        autoPublish?: boolean | undefined;
    }>>;
    codeAnalysis: z.ZodOptional<z.ZodObject<{
        defaultLanguage: z.ZodOptional<z.ZodEnum<["typescript", "javascript", "python", "go"]>>;
        defaultDiagramTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<["class", "flowchart", "dependency", "all"]>, "many">>;
        excludePatterns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        useAI: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        useAI?: boolean | undefined;
        defaultLanguage?: "typescript" | "javascript" | "python" | "go" | undefined;
        defaultDiagramTypes?: ("class" | "flowchart" | "dependency" | "all")[] | undefined;
        excludePatterns?: string[] | undefined;
    }, {
        useAI?: boolean | undefined;
        defaultLanguage?: "typescript" | "javascript" | "python" | "go" | undefined;
        defaultDiagramTypes?: ("class" | "flowchart" | "dependency" | "all")[] | undefined;
        excludePatterns?: string[] | undefined;
    }>>;
    documentation: z.ZodOptional<z.ZodObject<{
        defaultDocType: z.ZodOptional<z.ZodEnum<["README", "DESIGN", "TUTORIAL", "CHANGELOG", "API", "ARCHITECTURE"]>>;
        language: z.ZodOptional<z.ZodEnum<["en", "ko"]>>;
        author: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        includeTableOfContents: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        language?: "en" | "ko" | undefined;
        author?: string | undefined;
        license?: string | undefined;
        includeTableOfContents?: boolean | undefined;
        defaultDocType?: "README" | "DESIGN" | "TUTORIAL" | "CHANGELOG" | "API" | "ARCHITECTURE" | undefined;
    }, {
        language?: "en" | "ko" | undefined;
        author?: string | undefined;
        license?: string | undefined;
        includeTableOfContents?: boolean | undefined;
        defaultDocType?: "README" | "DESIGN" | "TUTORIAL" | "CHANGELOG" | "API" | "ARCHITECTURE" | undefined;
    }>>;
    defaultTags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tagCategories: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        tags: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        tags: string[];
    }, {
        name: string;
        tags: string[];
    }>, "many">>;
    team: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        members: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            role: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            role?: string | undefined;
            email?: string | undefined;
        }, {
            name: string;
            role?: string | undefined;
            email?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        members?: {
            name: string;
            role?: string | undefined;
            email?: string | undefined;
        }[] | undefined;
    }, {
        name: string;
        members?: {
            name: string;
            role?: string | undefined;
            email?: string | undefined;
        }[] | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodEnum<["createdAt", "updatedAt", "name"]>>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    action: "create" | "get" | "update" | "delete" | "list" | "setActive" | "getActive" | "clone";
    name?: string | undefined;
    description?: string | undefined;
    version?: string | undefined;
    profileId?: string | undefined;
    newName?: string | undefined;
    projectPath?: string | undefined;
    repository?: string | undefined;
    publishing?: {
        defaultPlatform?: "notion" | "github-wiki" | "obsidian" | "confluence" | "slack" | "discord" | undefined;
        platformSettings?: Record<string, unknown> | undefined;
        autoPublish?: boolean | undefined;
    } | undefined;
    codeAnalysis?: {
        useAI?: boolean | undefined;
        defaultLanguage?: "typescript" | "javascript" | "python" | "go" | undefined;
        defaultDiagramTypes?: ("class" | "flowchart" | "dependency" | "all")[] | undefined;
        excludePatterns?: string[] | undefined;
    } | undefined;
    documentation?: {
        language?: "en" | "ko" | undefined;
        author?: string | undefined;
        license?: string | undefined;
        includeTableOfContents?: boolean | undefined;
        defaultDocType?: "README" | "DESIGN" | "TUTORIAL" | "CHANGELOG" | "API" | "ARCHITECTURE" | undefined;
    } | undefined;
    defaultTags?: string[] | undefined;
    tagCategories?: {
        name: string;
        tags: string[];
    }[] | undefined;
    team?: {
        name: string;
        members?: {
            name: string;
            role?: string | undefined;
            email?: string | undefined;
        }[] | undefined;
    } | undefined;
    metadata?: Record<string, unknown> | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    sortBy?: "name" | "createdAt" | "updatedAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}, {
    action: "create" | "get" | "update" | "delete" | "list" | "setActive" | "getActive" | "clone";
    name?: string | undefined;
    description?: string | undefined;
    version?: string | undefined;
    profileId?: string | undefined;
    newName?: string | undefined;
    projectPath?: string | undefined;
    repository?: string | undefined;
    publishing?: {
        defaultPlatform?: "notion" | "github-wiki" | "obsidian" | "confluence" | "slack" | "discord" | undefined;
        platformSettings?: Record<string, unknown> | undefined;
        autoPublish?: boolean | undefined;
    } | undefined;
    codeAnalysis?: {
        useAI?: boolean | undefined;
        defaultLanguage?: "typescript" | "javascript" | "python" | "go" | undefined;
        defaultDiagramTypes?: ("class" | "flowchart" | "dependency" | "all")[] | undefined;
        excludePatterns?: string[] | undefined;
    } | undefined;
    documentation?: {
        language?: "en" | "ko" | undefined;
        author?: string | undefined;
        license?: string | undefined;
        includeTableOfContents?: boolean | undefined;
        defaultDocType?: "README" | "DESIGN" | "TUTORIAL" | "CHANGELOG" | "API" | "ARCHITECTURE" | undefined;
    } | undefined;
    defaultTags?: string[] | undefined;
    tagCategories?: {
        name: string;
        tags: string[];
    }[] | undefined;
    team?: {
        name: string;
        members?: {
            name: string;
            role?: string | undefined;
            email?: string | undefined;
        }[] | undefined;
    } | undefined;
    metadata?: Record<string, unknown> | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    sortBy?: "name" | "createdAt" | "updatedAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
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
    action: "get" | "update" | "delete" | "list" | "save" | "search" | "stats";
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
    sortBy?: "title" | "createdAt" | "updatedAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    filterTags?: string[] | undefined;
    keyword?: string | undefined;
    searchIn?: ("title" | "tags" | "summary")[] | undefined;
}, {
    action: "get" | "update" | "delete" | "list" | "save" | "search" | "stats";
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
    sortBy?: "title" | "createdAt" | "updatedAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    filterTags?: string[] | undefined;
    keyword?: string | undefined;
    searchIn?: ("title" | "tags" | "summary")[] | undefined;
}>;
export declare const SessionStatsSchema: z.ZodObject<{
    action: z.ZodEnum<["overview", "languages", "timeline", "tags", "productivity", "trends"]>;
    since: z.ZodOptional<z.ZodString>;
    until: z.ZodOptional<z.ZodString>;
    period: z.ZodDefault<z.ZodOptional<z.ZodEnum<["day", "week", "month", "year", "all"]>>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["summary", "detailed", "chart"]>>>;
    includeInsights: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    compareWith: z.ZodOptional<z.ZodEnum<["previous", "average"]>>;
}, "strip", z.ZodTypeAny, {
    format: "summary" | "detailed" | "chart";
    action: "tags" | "overview" | "languages" | "timeline" | "productivity" | "trends";
    period: "all" | "day" | "week" | "month" | "year";
    includeInsights: boolean;
    tags?: string[] | undefined;
    languages?: string[] | undefined;
    since?: string | undefined;
    until?: string | undefined;
    compareWith?: "previous" | "average" | undefined;
}, {
    action: "tags" | "overview" | "languages" | "timeline" | "productivity" | "trends";
    tags?: string[] | undefined;
    format?: "summary" | "detailed" | "chart" | undefined;
    languages?: string[] | undefined;
    since?: string | undefined;
    until?: string | undefined;
    period?: "all" | "day" | "week" | "month" | "year" | undefined;
    includeInsights?: boolean | undefined;
    compareWith?: "previous" | "average" | undefined;
}>;
export declare const AutoTagSchema: z.ZodObject<{
    action: z.ZodEnum<["suggest", "apply", "train", "config"]>;
    sessionId: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
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
    maxTags: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    minConfidence: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    includeExisting: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    examples: z.ZodOptional<z.ZodArray<z.ZodObject<{
        content: z.ZodString;
        tags: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        tags: string[];
        content: string;
    }, {
        tags: string[];
        content: string;
    }>, "many">>;
    enableAutoTag: z.ZodOptional<z.ZodBoolean>;
    defaultCategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    customPatterns: z.ZodOptional<z.ZodArray<z.ZodObject<{
        pattern: z.ZodString;
        tags: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        pattern: string;
        tags: string[];
    }, {
        pattern: string;
        tags: string[];
    }>, "many">>;
    useAI: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    useAI: boolean;
    action: "suggest" | "apply" | "train" | "config";
    maxTags: number;
    minConfidence: number;
    includeExisting: boolean;
    sessionId?: string | undefined;
    codeBlocks?: {
        code: string;
        language: string;
        filename?: string | undefined;
        description?: string | undefined;
    }[] | undefined;
    content?: string | undefined;
    categories?: string[] | undefined;
    examples?: {
        tags: string[];
        content: string;
    }[] | undefined;
    enableAutoTag?: boolean | undefined;
    defaultCategories?: string[] | undefined;
    customPatterns?: {
        pattern: string;
        tags: string[];
    }[] | undefined;
}, {
    action: "suggest" | "apply" | "train" | "config";
    sessionId?: string | undefined;
    codeBlocks?: {
        code: string;
        language?: string | undefined;
        filename?: string | undefined;
        description?: string | undefined;
    }[] | undefined;
    useAI?: boolean | undefined;
    content?: string | undefined;
    maxTags?: number | undefined;
    minConfidence?: number | undefined;
    includeExisting?: boolean | undefined;
    categories?: string[] | undefined;
    examples?: {
        tags: string[];
        content: string;
    }[] | undefined;
    enableAutoTag?: boolean | undefined;
    defaultCategories?: string[] | undefined;
    customPatterns?: {
        pattern: string;
        tags: string[];
    }[] | undefined;
}>;
export declare const TemplateSchema: z.ZodObject<{
    action: z.ZodEnum<["create", "get", "update", "delete", "list", "apply", "preview", "import", "export"]>;
    templateId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["document", "session-log", "export", "report"]>>;
    content: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    variables: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<["string", "number", "boolean", "array", "date"]>;
        required: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        default: z.ZodOptional<z.ZodUnknown>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: "string" | "number" | "boolean" | "date" | "array";
        required: boolean;
        description?: string | undefined;
        default?: unknown;
    }, {
        name: string;
        type: "string" | "number" | "boolean" | "date" | "array";
        description?: string | undefined;
        default?: unknown;
        required?: boolean | undefined;
    }>, "many">>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["json", "yaml"]>>>;
    filePath: z.ZodOptional<z.ZodString>;
    filterType: z.ZodOptional<z.ZodEnum<["document", "session-log", "export", "report"]>>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    format: "json" | "yaml";
    action: "create" | "get" | "update" | "delete" | "list" | "apply" | "preview" | "import" | "export";
    name?: string | undefined;
    description?: string | undefined;
    type?: "document" | "report" | "export" | "session-log" | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    content?: string | undefined;
    templateId?: string | undefined;
    variables?: {
        name: string;
        type: "string" | "number" | "boolean" | "date" | "array";
        required: boolean;
        description?: string | undefined;
        default?: unknown;
    }[] | undefined;
    data?: Record<string, unknown> | undefined;
    filePath?: string | undefined;
    filterType?: "document" | "report" | "export" | "session-log" | undefined;
}, {
    action: "create" | "get" | "update" | "delete" | "list" | "apply" | "preview" | "import" | "export";
    name?: string | undefined;
    description?: string | undefined;
    type?: "document" | "report" | "export" | "session-log" | undefined;
    format?: "json" | "yaml" | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    content?: string | undefined;
    templateId?: string | undefined;
    variables?: {
        name: string;
        type: "string" | "number" | "boolean" | "date" | "array";
        description?: string | undefined;
        default?: unknown;
        required?: boolean | undefined;
    }[] | undefined;
    data?: Record<string, unknown> | undefined;
    filePath?: string | undefined;
    filterType?: "document" | "report" | "export" | "session-log" | undefined;
}>;
export declare const BatchSchema: z.ZodObject<{
    action: z.ZodEnum<["execute", "preview", "status", "cancel", "history"]>;
    operations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        tool: z.ZodString;
        params: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        id: z.ZodOptional<z.ZodString>;
        dependsOn: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        tool: string;
        params: Record<string, unknown>;
        id?: string | undefined;
        dependsOn?: string[] | undefined;
    }, {
        tool: string;
        params: Record<string, unknown>;
        id?: string | undefined;
        dependsOn?: string[] | undefined;
    }>, "many">>;
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<["sequential", "parallel"]>>>;
    stopOnError: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    timeout: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    jobId: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["pending", "running", "completed", "failed", "cancelled"]>>;
    includeResults: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeErrors: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    action: "status" | "preview" | "execute" | "cancel" | "history";
    limit: number;
    mode: "sequential" | "parallel";
    stopOnError: boolean;
    timeout: number;
    includeResults: boolean;
    includeErrors: boolean;
    status?: "pending" | "running" | "completed" | "failed" | "cancelled" | undefined;
    operations?: {
        tool: string;
        params: Record<string, unknown>;
        id?: string | undefined;
        dependsOn?: string[] | undefined;
    }[] | undefined;
    jobId?: string | undefined;
}, {
    action: "status" | "preview" | "execute" | "cancel" | "history";
    status?: "pending" | "running" | "completed" | "failed" | "cancelled" | undefined;
    limit?: number | undefined;
    operations?: {
        tool: string;
        params: Record<string, unknown>;
        id?: string | undefined;
        dependsOn?: string[] | undefined;
    }[] | undefined;
    mode?: "sequential" | "parallel" | undefined;
    stopOnError?: boolean | undefined;
    timeout?: number | undefined;
    jobId?: string | undefined;
    includeResults?: boolean | undefined;
    includeErrors?: boolean | undefined;
}>;
export declare const GitSchema: z.ZodObject<{
    action: z.ZodEnum<["status", "log", "diff", "branch", "snapshot", "extractDecisions", "linkToSession"]>;
    repoPath: z.ZodOptional<z.ZodString>;
    includeUntracked: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    author: z.ZodOptional<z.ZodString>;
    since: z.ZodOptional<z.ZodString>;
    until: z.ZodOptional<z.ZodString>;
    grep: z.ZodOptional<z.ZodString>;
    oneline: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    diffType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["staged", "unstaged", "all"]>>>;
    fromRef: z.ZodOptional<z.ZodString>;
    toRef: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
    contextLines: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    stat: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeRemote: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    verbose: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeDiff: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeLog: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    logLimit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    includeStash: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    patterns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    language: z.ZodDefault<z.ZodOptional<z.ZodEnum<["en", "ko", "auto"]>>>;
    sessionId: z.ZodOptional<z.ZodString>;
    snapshotType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["minimal", "full"]>>>;
}, "strip", z.ZodTypeAny, {
    language: "en" | "ko" | "auto";
    action: "status" | "log" | "diff" | "branch" | "snapshot" | "extractDecisions" | "linkToSession";
    limit: number;
    includeUntracked: boolean;
    oneline: boolean;
    diffType: "all" | "staged" | "unstaged";
    contextLines: number;
    stat: boolean;
    includeRemote: boolean;
    verbose: boolean;
    includeDiff: boolean;
    includeLog: boolean;
    logLimit: number;
    includeStash: boolean;
    snapshotType: "minimal" | "full";
    path?: string | undefined;
    sessionId?: string | undefined;
    author?: string | undefined;
    since?: string | undefined;
    until?: string | undefined;
    repoPath?: string | undefined;
    grep?: string | undefined;
    fromRef?: string | undefined;
    toRef?: string | undefined;
    patterns?: string[] | undefined;
}, {
    action: "status" | "log" | "diff" | "branch" | "snapshot" | "extractDecisions" | "linkToSession";
    language?: "en" | "ko" | "auto" | undefined;
    path?: string | undefined;
    sessionId?: string | undefined;
    author?: string | undefined;
    limit?: number | undefined;
    since?: string | undefined;
    until?: string | undefined;
    repoPath?: string | undefined;
    includeUntracked?: boolean | undefined;
    grep?: string | undefined;
    oneline?: boolean | undefined;
    diffType?: "all" | "staged" | "unstaged" | undefined;
    fromRef?: string | undefined;
    toRef?: string | undefined;
    contextLines?: number | undefined;
    stat?: boolean | undefined;
    includeRemote?: boolean | undefined;
    verbose?: boolean | undefined;
    includeDiff?: boolean | undefined;
    includeLog?: boolean | undefined;
    logLimit?: number | undefined;
    includeStash?: boolean | undefined;
    patterns?: string[] | undefined;
    snapshotType?: "minimal" | "full" | undefined;
}>;
export type CollectCodeContextInput = z.infer<typeof CollectCodeContextSchema>;
export type SummarizeDesignDecisionsInput = z.infer<typeof SummarizeDesignDecisionsSchema>;
export type SessionHistoryInput = z.infer<typeof SessionHistorySchema>;
export type ExportSessionInput = z.infer<typeof ExportSessionSchema>;
export type GitInput = z.infer<typeof GitSchema>;
export type ProjectProfileInput = z.infer<typeof ProjectProfileSchema>;
export type GenerateDevDocumentInput = z.infer<typeof GenerateDevDocumentSchema>;
export type NormalizeForPlatformInput = z.infer<typeof NormalizeForPlatformSchema>;
export type PublishDocumentInput = z.infer<typeof PublishDocumentSchema>;
export type CreateSessionLogInput = z.infer<typeof CreateSessionLogSchema>;
export type AnalyzeCodeInput = z.infer<typeof AnalyzeCodeSchema>;
export type SessionStatsInput = z.infer<typeof SessionStatsSchema>;
export type AutoTagInput = z.infer<typeof AutoTagSchema>;
export type TemplateInput = z.infer<typeof TemplateSchema>;
export type BatchInput = z.infer<typeof BatchSchema>;
/**
 * Validates input against schema and returns typed result
 */
export declare function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T;
//# sourceMappingURL=schemas.d.ts.map