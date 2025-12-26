import { CodeBlock, CodeContext } from '../types/index.js';
export interface CollectCodeContextInput {
    codeBlocks?: CodeBlock[];
    rawText?: string;
    conversationSummary: string;
    tags?: string[];
    autoDetectLanguage?: boolean;
    removeDuplicates?: boolean;
    includeStats?: boolean;
}
export interface CodeStats {
    totalBlocks: number;
    totalLines: number;
    languageBreakdown: Record<string, number>;
    averageLinesPerBlock: number;
}
export interface CollectCodeContextOutput {
    context: CodeContext;
    stats?: CodeStats;
    warnings?: string[];
}
export declare function collectCodeContext(input: CollectCodeContextInput): CollectCodeContextOutput;
export declare const collectCodeContextSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            codeBlocks: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        language: {
                            type: string;
                            description: string;
                        };
                        code: {
                            type: string;
                            description: string;
                        };
                        filename: {
                            type: string;
                            description: string;
                        };
                        description: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            rawText: {
                type: string;
                description: string;
            };
            conversationSummary: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            autoDetectLanguage: {
                type: string;
                description: string;
            };
            removeDuplicates: {
                type: string;
                description: string;
            };
            includeStats: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=collectCodeContext.d.ts.map