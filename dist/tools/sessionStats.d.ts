/**
 * Session Statistics Dashboard Tool (v2.9)
 * Provides analytics and insights about coding sessions
 */
import type { SessionStatsInput } from '../core/schemas.js';
export type StatsAction = 'overview' | 'languages' | 'timeline' | 'tags' | 'productivity' | 'trends';
interface LanguageStat {
    language: string;
    count: number;
    linesOfCode: number;
    percentage: number;
}
interface TimelineStat {
    period: string;
    sessionCount: number;
    codeBlockCount: number;
    decisionsCount: number;
}
interface TagStat {
    tag: string;
    count: number;
    percentage: number;
    relatedTags: string[];
}
interface ProductivityStat {
    averageSessionsPerDay: number;
    averageCodeBlocksPerSession: number;
    averageDecisionsPerSession: number;
    mostProductiveDay: string;
    mostProductiveHour: number;
    totalCodingDays: number;
}
interface TrendStat {
    metric: string;
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
}
export interface SessionStatsOutput {
    success: boolean;
    action: StatsAction;
    overview?: {
        totalSessions: number;
        totalCodeBlocks: number;
        totalDesignDecisions: number;
        totalLanguages: number;
        totalTags: number;
        dateRange: {
            from: string;
            to: string;
        };
        averages: {
            codeBlocksPerSession: number;
            decisionsPerSession: number;
            tagsPerSession: number;
        };
    };
    languages?: LanguageStat[];
    timeline?: TimelineStat[];
    tags?: TagStat[];
    productivity?: ProductivityStat;
    trends?: TrendStat[];
    insights?: string[];
    period?: string;
    generatedAt: string;
    message?: string;
    error?: string;
}
export declare function sessionStatsTool(input: SessionStatsInput): Promise<SessionStatsOutput>;
export declare const sessionStatsSchema: {
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
            since: {
                type: string;
                description: string;
            };
            until: {
                type: string;
                description: string;
            };
            period: {
                type: string;
                enum: string[];
                description: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            languages: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            format: {
                type: string;
                enum: string[];
                description: string;
            };
            includeInsights: {
                type: string;
                description: string;
            };
            compareWith: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
};
export {};
//# sourceMappingURL=sessionStats.d.ts.map