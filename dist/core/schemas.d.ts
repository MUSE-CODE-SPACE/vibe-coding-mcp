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
}, z.core.$strip>;
export declare const DesignDecisionSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    rationale: z.ZodString;
    alternatives: z.ZodOptional<z.ZodArray<z.ZodString>>;
    category: z.ZodDefault<z.ZodEnum<{
        architecture: "architecture";
        implementation: "implementation";
        library: "library";
        pattern: "pattern";
        other: "other";
    }>>;
    timestamp: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const CodeContextSchema: z.ZodObject<{
    sessionId: z.ZodString;
    timestamp: z.ZodString;
    codeBlocks: z.ZodArray<z.ZodObject<{
        language: z.ZodDefault<z.ZodString>;
        code: z.ZodString;
        filename: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    conversationSummary: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const SessionLogOptionsSchema: z.ZodObject<{
    logType: z.ZodDefault<z.ZodEnum<{
        daily: "daily";
        session: "session";
    }>>;
    outputPath: z.ZodOptional<z.ZodString>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        markdown: "markdown";
        json: "json";
    }>>>;
}, z.core.$strip>;
export declare const CollectCodeContextSchema: z.ZodObject<{
    codeBlocks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        language: z.ZodDefault<z.ZodString>;
        code: z.ZodString;
        filename: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    rawText: z.ZodOptional<z.ZodString>;
    conversationSummary: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    autoDetectLanguage: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    removeDuplicates: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeStats: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const SummarizeDesignDecisionsSchema: z.ZodObject<{
    conversationLog: z.ZodString;
    projectContext: z.ZodOptional<z.ZodString>;
    language: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        ko: "ko";
        en: "en";
        auto: "auto";
    }>>>;
    includeImportanceScore: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    extractRelatedCode: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    maxDecisions: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    useAI: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const GenerateDevDocumentSchema: z.ZodObject<{
    documentType: z.ZodEnum<{
        README: "README";
        DESIGN: "DESIGN";
        TUTORIAL: "TUTORIAL";
        CHANGELOG: "CHANGELOG";
        API: "API";
        ARCHITECTURE: "ARCHITECTURE";
    }>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    projectName: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodString>;
    license: z.ZodOptional<z.ZodString>;
    language: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        ko: "ko";
        en: "en";
    }>>>;
    features: z.ZodOptional<z.ZodArray<z.ZodString>>;
    installation: z.ZodOptional<z.ZodObject<{
        requirements: z.ZodOptional<z.ZodArray<z.ZodString>>;
        steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    apiReference: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        params: z.ZodOptional<z.ZodArray<z.ZodString>>;
        returns: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    designDecisions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        rationale: z.ZodString;
        alternatives: z.ZodOptional<z.ZodArray<z.ZodString>>;
        category: z.ZodDefault<z.ZodEnum<{
            architecture: "architecture";
            implementation: "implementation";
            library: "library";
            pattern: "pattern";
            other: "other";
        }>>;
        timestamp: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
    codeContexts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        sessionId: z.ZodString;
        timestamp: z.ZodString;
        codeBlocks: z.ZodArray<z.ZodObject<{
            language: z.ZodDefault<z.ZodString>;
            code: z.ZodString;
            filename: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        conversationSummary: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
    changelog: z.ZodOptional<z.ZodArray<z.ZodObject<{
        version: z.ZodString;
        date: z.ZodString;
        changes: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>>;
    includeTableOfContents: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    faq: z.ZodOptional<z.ZodArray<z.ZodObject<{
        question: z.ZodString;
        answer: z.ZodString;
    }, z.core.$strip>>>;
    contributors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        role: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const NormalizeForPlatformSchema: z.ZodObject<{
    document: z.ZodString;
    platform: z.ZodEnum<{
        notion: "notion";
        "github-wiki": "github-wiki";
        obsidian: "obsidian";
    }>;
    options: z.ZodOptional<z.ZodObject<{
        addFrontmatter: z.ZodOptional<z.ZodBoolean>;
        addTimestamp: z.ZodOptional<z.ZodBoolean>;
        customMetadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const PublishDocumentSchema: z.ZodObject<{
    document: z.ZodString;
    platform: z.ZodEnum<{
        notion: "notion";
        "github-wiki": "github-wiki";
        obsidian: "obsidian";
        confluence: "confluence";
        slack: "slack";
        discord: "discord";
    }>;
    title: z.ZodString;
    options: z.ZodOptional<z.ZodObject<{
        filename: z.ZodOptional<z.ZodString>;
        wikiPath: z.ZodOptional<z.ZodString>;
        vaultPath: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
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
        }, z.core.$strip>>;
        conversationSummary: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
    designDecisions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        rationale: z.ZodString;
        alternatives: z.ZodOptional<z.ZodArray<z.ZodString>>;
        category: z.ZodDefault<z.ZodEnum<{
            architecture: "architecture";
            implementation: "implementation";
            library: "library";
            pattern: "pattern";
            other: "other";
        }>>;
        timestamp: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
    duration: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    options: z.ZodOptional<z.ZodObject<{
        logType: z.ZodDefault<z.ZodEnum<{
            daily: "daily";
            session: "session";
        }>>;
        outputPath: z.ZodOptional<z.ZodString>;
        format: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            markdown: "markdown";
            json: "json";
        }>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const AnalyzeCodeSchema: z.ZodObject<{
    code: z.ZodString;
    language: z.ZodOptional<z.ZodEnum<{
        typescript: "typescript";
        javascript: "javascript";
        python: "python";
        go: "go";
    }>>;
    filename: z.ZodOptional<z.ZodString>;
    generateDiagrams: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    diagramTypes: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodEnum<{
        all: "all";
        class: "class";
        dependency: "dependency";
        flowchart: "flowchart";
    }>>>>;
    useAI: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const ExportSessionSchema: z.ZodObject<{
    sessionIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    format: z.ZodEnum<{
        html: "html";
        markdown: "markdown";
        json: "json";
    }>;
    outputPath: z.ZodOptional<z.ZodString>;
    includeMetadata: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeCodeBlocks: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeDesignDecisions: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    template: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        default: "default";
        minimal: "minimal";
        detailed: "detailed";
        report: "report";
    }>>>;
    title: z.ZodOptional<z.ZodString>;
    bundleMultiple: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const ProjectProfileSchema: z.ZodObject<{
    action: z.ZodEnum<{
        create: "create";
        get: "get";
        update: "update";
        delete: "delete";
        list: "list";
        setActive: "setActive";
        getActive: "getActive";
        clone: "clone";
    }>;
    profileId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    newName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    projectPath: z.ZodOptional<z.ZodString>;
    repository: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodString>;
    publishing: z.ZodOptional<z.ZodObject<{
        defaultPlatform: z.ZodOptional<z.ZodEnum<{
            notion: "notion";
            "github-wiki": "github-wiki";
            obsidian: "obsidian";
            confluence: "confluence";
            slack: "slack";
            discord: "discord";
        }>>;
        platformSettings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        autoPublish: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    codeAnalysis: z.ZodOptional<z.ZodObject<{
        defaultLanguage: z.ZodOptional<z.ZodEnum<{
            typescript: "typescript";
            javascript: "javascript";
            python: "python";
            go: "go";
        }>>;
        defaultDiagramTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            all: "all";
            class: "class";
            dependency: "dependency";
            flowchart: "flowchart";
        }>>>;
        excludePatterns: z.ZodOptional<z.ZodArray<z.ZodString>>;
        useAI: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    documentation: z.ZodOptional<z.ZodObject<{
        defaultDocType: z.ZodOptional<z.ZodEnum<{
            README: "README";
            DESIGN: "DESIGN";
            TUTORIAL: "TUTORIAL";
            CHANGELOG: "CHANGELOG";
            API: "API";
            ARCHITECTURE: "ARCHITECTURE";
        }>>;
        language: z.ZodOptional<z.ZodEnum<{
            ko: "ko";
            en: "en";
        }>>;
        author: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
        includeTableOfContents: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    defaultTags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    tagCategories: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        tags: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>>;
    team: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        members: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            role: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodEnum<{
        name: "name";
        createdAt: "createdAt";
        updatedAt: "updatedAt";
    }>>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strip>;
export declare const SessionHistorySchema: z.ZodObject<{
    action: z.ZodEnum<{
        search: "search";
        stats: "stats";
        get: "get";
        update: "update";
        delete: "delete";
        list: "list";
        save: "save";
    }>;
    sessionId: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    codeContexts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        sessionId: z.ZodString;
        timestamp: z.ZodString;
        codeBlocks: z.ZodArray<z.ZodObject<{
            language: z.ZodString;
            code: z.ZodString;
            filename: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        conversationSummary: z.ZodString;
    }, z.core.$strip>>>;
    designDecisions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        rationale: z.ZodString;
        category: z.ZodString;
        timestamp: z.ZodString;
    }, z.core.$strip>>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
    filterTags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    sortBy: z.ZodOptional<z.ZodEnum<{
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        title: "title";
    }>>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
    keyword: z.ZodOptional<z.ZodString>;
    searchIn: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        title: "title";
        summary: "summary";
        tags: "tags";
    }>>>;
}, z.core.$strip>;
export declare const SessionStatsSchema: z.ZodObject<{
    action: z.ZodEnum<{
        tags: "tags";
        overview: "overview";
        languages: "languages";
        timeline: "timeline";
        productivity: "productivity";
        trends: "trends";
    }>;
    since: z.ZodOptional<z.ZodString>;
    until: z.ZodOptional<z.ZodString>;
    period: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        all: "all";
        day: "day";
        week: "week";
        month: "month";
        year: "year";
    }>>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    languages: z.ZodOptional<z.ZodArray<z.ZodString>>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        summary: "summary";
        detailed: "detailed";
        chart: "chart";
    }>>>;
    includeInsights: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    compareWith: z.ZodOptional<z.ZodEnum<{
        previous: "previous";
        average: "average";
    }>>;
}, z.core.$strip>;
export declare const AutoTagSchema: z.ZodObject<{
    action: z.ZodEnum<{
        suggest: "suggest";
        apply: "apply";
        train: "train";
        config: "config";
    }>;
    sessionId: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    codeBlocks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        language: z.ZodDefault<z.ZodString>;
        code: z.ZodString;
        filename: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    maxTags: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    minConfidence: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    includeExisting: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString>>;
    examples: z.ZodOptional<z.ZodArray<z.ZodObject<{
        content: z.ZodString;
        tags: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>>;
    enableAutoTag: z.ZodOptional<z.ZodBoolean>;
    defaultCategories: z.ZodOptional<z.ZodArray<z.ZodString>>;
    customPatterns: z.ZodOptional<z.ZodArray<z.ZodObject<{
        pattern: z.ZodString;
        tags: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>>;
    useAI: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const TemplateSchema: z.ZodObject<{
    action: z.ZodEnum<{
        create: "create";
        get: "get";
        update: "update";
        delete: "delete";
        list: "list";
        apply: "apply";
        preview: "preview";
        import: "import";
        export: "export";
    }>;
    templateId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        document: "document";
        report: "report";
        export: "export";
        "session-log": "session-log";
    }>>;
    content: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    variables: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<{
            string: "string";
            number: "number";
            boolean: "boolean";
            date: "date";
            array: "array";
        }>;
        required: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        default: z.ZodOptional<z.ZodUnknown>;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        json: "json";
        yaml: "yaml";
    }>>>;
    filePath: z.ZodOptional<z.ZodString>;
    filterType: z.ZodOptional<z.ZodEnum<{
        document: "document";
        report: "report";
        export: "export";
        "session-log": "session-log";
    }>>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const BatchSchema: z.ZodObject<{
    action: z.ZodEnum<{
        status: "status";
        preview: "preview";
        execute: "execute";
        cancel: "cancel";
        history: "history";
    }>;
    operations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        tool: z.ZodString;
        params: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        id: z.ZodOptional<z.ZodString>;
        dependsOn: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        sequential: "sequential";
        parallel: "parallel";
    }>>>;
    stopOnError: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    timeout: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    jobId: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        running: "running";
        completed: "completed";
        failed: "failed";
        cancelled: "cancelled";
    }>>;
    includeResults: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeErrors: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const GitSchema: z.ZodObject<{
    action: z.ZodEnum<{
        status: "status";
        log: "log";
        diff: "diff";
        branch: "branch";
        snapshot: "snapshot";
        extractDecisions: "extractDecisions";
        linkToSession: "linkToSession";
    }>;
    repoPath: z.ZodOptional<z.ZodString>;
    includeUntracked: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    author: z.ZodOptional<z.ZodString>;
    since: z.ZodOptional<z.ZodString>;
    until: z.ZodOptional<z.ZodString>;
    grep: z.ZodOptional<z.ZodString>;
    oneline: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    diffType: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        all: "all";
        staged: "staged";
        unstaged: "unstaged";
    }>>>;
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
    patterns: z.ZodOptional<z.ZodArray<z.ZodString>>;
    language: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        ko: "ko";
        en: "en";
        auto: "auto";
    }>>>;
    sessionId: z.ZodOptional<z.ZodString>;
    snapshotType: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        minimal: "minimal";
        full: "full";
    }>>>;
}, z.core.$strip>;
export declare const CaptureTranscriptSchema: z.ZodObject<{
    action: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        list: "list";
        preview: "preview";
        capture: "capture";
    }>>>;
    transcriptPath: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
    all: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodOptional<z.ZodNumber>;
    minPrompts: z.ZodOptional<z.ZodNumber>;
    maxFiles: z.ZodOptional<z.ZodNumber>;
    maxDecisions: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const DigestSchema: z.ZodObject<{
    period: z.ZodOptional<z.ZodEnum<{
        custom: "custom";
        week: "week";
        month: "month";
        today: "today";
        yesterday: "yesterday";
        "last-week": "last-week";
    }>>;
    since: z.ZodOptional<z.ZodString>;
    until: z.ZodOptional<z.ZodString>;
    groupBy: z.ZodOptional<z.ZodEnum<{
        project: "project";
        day: "day";
        tag: "tag";
        none: "none";
    }>>;
    language: z.ZodOptional<z.ZodEnum<{
        ko: "ko";
        en: "en";
    }>>;
    format: z.ZodOptional<z.ZodEnum<{
        markdown: "markdown";
        json: "json";
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    project: z.ZodOptional<z.ZodString>;
    includeFiles: z.ZodOptional<z.ZodBoolean>;
    includeDecisions: z.ZodOptional<z.ZodBoolean>;
    includePrompts: z.ZodOptional<z.ZodBoolean>;
    maxSessions: z.ZodOptional<z.ZodNumber>;
    title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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