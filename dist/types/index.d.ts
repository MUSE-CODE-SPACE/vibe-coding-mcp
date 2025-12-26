export interface CodeBlock {
    language: string;
    code: string;
    filename?: string;
    description?: string;
}
export interface CodeContext {
    sessionId: string;
    timestamp: string;
    codeBlocks: CodeBlock[];
    conversationSummary: string;
    tags?: string[];
}
export interface DesignDecision {
    id: string;
    title: string;
    description: string;
    rationale: string;
    alternatives?: string[];
    timestamp: string;
    category: 'architecture' | 'implementation' | 'library' | 'pattern' | 'other';
}
export type DocumentType = 'README' | 'DESIGN' | 'TUTORIAL' | 'CHANGELOG' | 'API' | 'ARCHITECTURE';
export type Platform = 'notion' | 'github-wiki' | 'obsidian' | 'confluence' | 'slack' | 'discord';
export type Language = 'ko' | 'en';
export interface SessionLog {
    sessionId: string;
    date: string;
    title: string;
    summary: string;
    codeContexts: CodeContext[];
    designDecisions: DesignDecision[];
    duration?: number;
    tags?: string[];
}
export interface DocumentOptions {
    type: DocumentType;
    title?: string;
    includeCodeBlocks?: boolean;
    includeDesignDecisions?: boolean;
    customSections?: Record<string, string>;
}
export interface PublishOptions {
    platform: Platform;
    parentPageId?: string;
    wikiPath?: string;
    vaultPath?: string;
    filename?: string;
}
export interface PublishResult {
    success: boolean;
    platform: Platform;
    url?: string;
    filePath?: string;
    error?: string;
}
export interface SessionLogOptions {
    logType: 'daily' | 'session';
    outputPath?: string;
    format?: 'markdown' | 'json';
}
//# sourceMappingURL=index.d.ts.map