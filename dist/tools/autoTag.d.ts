/**
 * AI Auto-tagging Tool (v2.10)
 * Automatically suggests and applies tags to sessions based on content analysis
 */
import type { AutoTagInput } from '../core/schemas.js';
export type AutoTagAction = 'suggest' | 'apply' | 'train' | 'config';
interface TagSuggestion {
    tag: string;
    confidence: number;
    reason: string;
    category?: string;
}
interface TagConfig {
    enableAutoTag: boolean;
    defaultCategories: string[];
    customPatterns: Array<{
        pattern: string;
        tags: string[];
    }>;
}
export interface AutoTagOutput {
    success: boolean;
    action: AutoTagAction;
    suggestions?: TagSuggestion[];
    appliedTags?: string[];
    sessionId?: string;
    trained?: boolean;
    patternsAdded?: number;
    config?: TagConfig;
    usedAI: boolean;
    message?: string;
    error?: string;
}
export declare function autoTagTool(input: AutoTagInput): Promise<AutoTagOutput>;
export declare const autoTagSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            sessionId: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            codeBlocks: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        language: {
                            type: string;
                        };
                        code: {
                            type: string;
                        };
                    };
                };
                description: string;
            };
            maxTags: {
                type: string;
                description: string;
            };
            minConfidence: {
                type: string;
                description: string;
            };
            includeExisting: {
                type: string;
                description: string;
            };
            categories: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            examples: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        content: {
                            type: string;
                        };
                        tags: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                    };
                    required: string[];
                };
                description: string;
            };
            enableAutoTag: {
                type: string;
                description: string;
            };
            defaultCategories: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            customPatterns: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        pattern: {
                            type: string;
                        };
                        tags: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                    };
                };
                description: string;
            };
            useAI: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export {};
//# sourceMappingURL=autoTag.d.ts.map