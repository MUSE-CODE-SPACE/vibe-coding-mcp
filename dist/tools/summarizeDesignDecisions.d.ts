import { DesignDecision } from '../types/index.js';
export interface SummarizeDesignDecisionsInput {
    conversationLog: string;
    projectContext?: string;
    language?: 'en' | 'ko' | 'auto';
    includeImportanceScore?: boolean;
    extractRelatedCode?: boolean;
    maxDecisions?: number;
}
export interface EnhancedDesignDecision extends DesignDecision {
    importance: 'high' | 'medium' | 'low';
    importanceScore: number;
    relatedCode?: string[];
    dependencies?: string[];
    tradeoffs?: string[];
    keywords: string[];
}
export interface SummarizeDesignDecisionsOutput {
    decisions: EnhancedDesignDecision[];
    summary: string;
    stats: {
        totalDecisions: number;
        byCategory: Record<string, number>;
        byImportance: Record<string, number>;
        topKeywords: string[];
    };
}
export declare function summarizeDesignDecisions(input: SummarizeDesignDecisionsInput): SummarizeDesignDecisionsOutput;
export declare const summarizeDesignDecisionsSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            conversationLog: {
                type: string;
                description: string;
            };
            projectContext: {
                type: string;
                description: string;
            };
            language: {
                type: string;
                enum: string[];
                description: string;
            };
            includeImportanceScore: {
                type: string;
                description: string;
            };
            extractRelatedCode: {
                type: string;
                description: string;
            };
            maxDecisions: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=summarizeDesignDecisions.d.ts.map