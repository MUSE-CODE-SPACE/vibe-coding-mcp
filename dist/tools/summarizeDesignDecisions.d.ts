import { DesignDecision } from '../types/index.js';
export interface SummarizeDesignDecisionsInput {
    conversationLog: string;
    projectContext?: string;
    language?: 'en' | 'ko' | 'auto';
    includeImportanceScore?: boolean;
    extractRelatedCode?: boolean;
    maxDecisions?: number;
    useAI?: boolean;
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
    aiInsights?: string[];
    aiRecommendations?: string[];
    usedAI?: boolean;
}
/**
 * Title for a decision: the decision clause itself, without the lead-in
 * ("We decided to") and without the justification ("because …").
 * "We decided to use JWT instead of sessions because …" → "Use JWT instead of sessions".
 */
export declare function generateTitle(decision: string, category: string): string;
/**
 * Analyzes conversation logs to extract and summarize design decisions
 *
 * @param input - The input parameters
 * @param input.conversationLog - The conversation text to analyze
 * @param input.projectContext - Optional project context for better categorization
 * @param input.language - Language setting ('en', 'ko', or 'auto' for detection)
 * @param input.includeImportanceScore - Whether to include importance scoring
 * @param input.extractRelatedCode - Whether to extract related code blocks
 * @param input.maxDecisions - Maximum number of decisions to extract
 * @param input.useAI - Whether to use Claude AI for enhanced analysis
 * @returns Object containing decisions array, summary text, and statistics
 *
 * @example
 * const result = await summarizeDesignDecisions({
 *   conversationLog: "We decided to use React instead of Vue because...",
 *   language: 'auto',
 *   useAI: true
 * });
 */
export declare function summarizeDesignDecisions(input: SummarizeDesignDecisionsInput): Promise<SummarizeDesignDecisionsOutput>;
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
            useAI: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=summarizeDesignDecisions.d.ts.map