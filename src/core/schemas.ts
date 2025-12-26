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

export const ExportSessionSchema = z.object({
  sessionIds: z.array(z.string()).optional(),
  format: z.enum(['markdown', 'json', 'html']),
  outputPath: z.string().optional(),
  includeMetadata: z.boolean().optional().default(true),
  includeCodeBlocks: z.boolean().optional().default(true),
  includeDesignDecisions: z.boolean().optional().default(true),
  template: z.enum(['default', 'minimal', 'detailed', 'report']).optional().default('default'),
  title: z.string().optional(),
  bundleMultiple: z.boolean().optional().default(true)
});

export const ProjectProfileSchema = z.object({
  action: z.enum(['create', 'get', 'update', 'delete', 'list', 'setActive', 'getActive', 'clone']),
  profileId: z.string().optional(),
  name: z.string().optional(),
  newName: z.string().optional(),
  description: z.string().optional(),
  projectPath: z.string().optional(),
  repository: z.string().optional(),
  version: z.string().optional(),
  publishing: z.object({
    defaultPlatform: z.enum(['notion', 'github-wiki', 'obsidian', 'confluence', 'slack', 'discord']).optional(),
    platformSettings: z.record(z.unknown()).optional(),
    autoPublish: z.boolean().optional()
  }).optional(),
  codeAnalysis: z.object({
    defaultLanguage: z.enum(['typescript', 'javascript', 'python', 'go']).optional(),
    defaultDiagramTypes: z.array(z.enum(['class', 'flowchart', 'dependency', 'all'])).optional(),
    excludePatterns: z.array(z.string()).optional(),
    useAI: z.boolean().optional()
  }).optional(),
  documentation: z.object({
    defaultDocType: z.enum(['README', 'DESIGN', 'TUTORIAL', 'CHANGELOG', 'API', 'ARCHITECTURE']).optional(),
    language: z.enum(['en', 'ko']).optional(),
    author: z.string().optional(),
    license: z.string().optional(),
    includeTableOfContents: z.boolean().optional()
  }).optional(),
  defaultTags: z.array(z.string()).optional(),
  tagCategories: z.array(z.object({
    name: z.string(),
    tags: z.array(z.string())
  })).optional(),
  team: z.object({
    name: z.string(),
    members: z.array(z.object({
      name: z.string(),
      role: z.string().optional(),
      email: z.string().optional()
    })).optional()
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
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

// Session Statistics Schema (v2.9)
export const SessionStatsSchema = z.object({
  action: z.enum(['overview', 'languages', 'timeline', 'tags', 'productivity', 'trends']),

  // Time range options
  since: z.string().optional(),
  until: z.string().optional(),
  period: z.enum(['day', 'week', 'month', 'year', 'all']).optional().default('all'),

  // Filter options
  tags: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),

  // Output options
  format: z.enum(['summary', 'detailed', 'chart']).optional().default('summary'),
  includeInsights: z.boolean().optional().default(true),

  // Comparison
  compareWith: z.enum(['previous', 'average']).optional()
});

// AI Auto-tagging Schema (v2.10)
export const AutoTagSchema = z.object({
  action: z.enum(['suggest', 'apply', 'train', 'config']),

  // For suggest/apply actions
  sessionId: z.string().optional(),
  content: z.string().optional(),
  codeBlocks: z.array(CodeBlockSchema).optional(),

  // Tagging options
  maxTags: z.number().min(1).max(20).optional().default(5),
  minConfidence: z.number().min(0).max(1).optional().default(0.7),
  includeExisting: z.boolean().optional().default(true),
  categories: z.array(z.string()).optional(),

  // For train action
  examples: z.array(z.object({
    content: z.string(),
    tags: z.array(z.string())
  })).optional(),

  // For config action
  enableAutoTag: z.boolean().optional(),
  defaultCategories: z.array(z.string()).optional(),
  customPatterns: z.array(z.object({
    pattern: z.string(),
    tags: z.array(z.string())
  })).optional(),

  // AI options
  useAI: z.boolean().optional().default(false)
});

// Custom Templates Schema (v2.11)
export const TemplateSchema = z.object({
  action: z.enum(['create', 'get', 'update', 'delete', 'list', 'apply', 'preview', 'import', 'export']),

  // Template identification
  templateId: z.string().optional(),
  name: z.string().optional(),

  // Template definition
  type: z.enum(['document', 'session-log', 'export', 'report']).optional(),
  content: z.string().optional(),
  description: z.string().optional(),

  // Template variables
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'array', 'date']),
    required: z.boolean().optional().default(false),
    default: z.unknown().optional(),
    description: z.string().optional()
  })).optional(),

  // For apply action
  data: z.record(z.unknown()).optional(),

  // For import/export
  format: z.enum(['json', 'yaml']).optional().default('json'),
  filePath: z.string().optional(),

  // List options
  filterType: z.enum(['document', 'session-log', 'export', 'report']).optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
});

// Batch Operations Schema (v2.12)
export const BatchSchema = z.object({
  action: z.enum(['execute', 'preview', 'status', 'cancel', 'history']),

  // Batch job definition
  operations: z.array(z.object({
    tool: z.string(),
    params: z.record(z.unknown()),
    id: z.string().optional(),
    dependsOn: z.array(z.string()).optional()
  })).optional(),

  // Execution options
  mode: z.enum(['sequential', 'parallel']).optional().default('sequential'),
  stopOnError: z.boolean().optional().default(true),
  timeout: z.number().min(1000).max(600000).optional().default(60000),

  // For status/cancel actions
  jobId: z.string().optional(),

  // For history action
  limit: z.number().optional().default(20),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional(),

  // Output options
  includeResults: z.boolean().optional().default(true),
  includeErrors: z.boolean().optional().default(true)
});

export const GitSchema = z.object({
  action: z.enum(['status', 'log', 'diff', 'branch', 'snapshot', 'extractDecisions', 'linkToSession']),
  repoPath: z.string().optional(),

  // Status options
  includeUntracked: z.boolean().optional().default(true),

  // Log options
  limit: z.number().min(1).max(500).optional().default(20),
  author: z.string().optional(),
  since: z.string().optional(),
  until: z.string().optional(),
  grep: z.string().optional(),
  oneline: z.boolean().optional().default(false),

  // Diff options
  diffType: z.enum(['staged', 'unstaged', 'all']).optional().default('all'),
  fromRef: z.string().optional(),
  toRef: z.string().optional(),
  path: z.string().optional(),
  contextLines: z.number().min(0).max(20).optional().default(3),
  stat: z.boolean().optional().default(true),

  // Branch options
  includeRemote: z.boolean().optional().default(true),
  verbose: z.boolean().optional().default(false),

  // Snapshot options
  includeDiff: z.boolean().optional().default(true),
  includeLog: z.boolean().optional().default(true),
  logLimit: z.number().min(1).max(100).optional().default(10),
  includeStash: z.boolean().optional().default(false),

  // Extract decisions options
  patterns: z.array(z.string()).optional(),
  language: z.enum(['en', 'ko', 'auto']).optional().default('auto'),

  // Link to session options
  sessionId: z.string().optional(),
  snapshotType: z.enum(['minimal', 'full']).optional().default('minimal')
});

// Type exports from schemas
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
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Validation failed: ${errors}`);
  }

  return result.data;
}
