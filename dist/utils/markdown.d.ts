import { CodeBlock, DesignDecision, Platform } from '../types/index.js';
export declare function codeBlockToMarkdown(block: CodeBlock): string;
export declare function designDecisionToMarkdown(decision: DesignDecision): string;
export declare function extractCodeBlocks(text: string): CodeBlock[];
export declare function normalizeMarkdownForPlatform(markdown: string, platform: Platform): string;
export declare function generateId(): string;
export declare function getCurrentTimestamp(): string;
export declare function formatDate(date?: Date): string;
//# sourceMappingURL=markdown.d.ts.map