/**
 * muse_digest — roll captured sessions over a time window into one
 * Markdown report (daily standup, weekly report, monthly retro), grouped by
 * day / project / tag. Reads only the local session store.
 */
import { SessionData } from '../core/sessionStorage.js';
export type DigestPeriod = 'today' | 'yesterday' | 'week' | 'last-week' | 'month' | 'custom';
export type DigestGroupBy = 'day' | 'project' | 'tag' | 'none';
export interface DigestInput {
    period?: DigestPeriod;
    since?: string;
    until?: string;
    groupBy?: DigestGroupBy;
    language?: 'en' | 'ko';
    format?: 'markdown' | 'json';
    tags?: string[];
    project?: string;
    includeFiles?: boolean;
    includeDecisions?: boolean;
    includePrompts?: boolean;
    maxSessions?: number;
    title?: string;
}
export interface DigestSessionSummary {
    id: string;
    title: string;
    date: string;
    project?: string;
    gitBranch?: string;
    durationSec?: number;
    promptCount?: number;
    filesTouched: string[];
    decisionTitles: string[];
    tags: string[];
}
export interface DigestOutput {
    success: boolean;
    period: DigestPeriod;
    range: {
        since: string;
        until: string;
    };
    totals: {
        sessions: number;
        durationSec: number;
        filesTouched: number;
        uniqueFiles: number;
        designDecisions: number;
        prompts: number;
        projects: string[];
    };
    groups: Array<{
        key: string;
        sessions: DigestSessionSummary[];
    }>;
    topFiles: Array<{
        file: string;
        sessions: number;
    }>;
    content?: string;
    message?: string;
    error?: string;
}
export declare function resolveRange(input: DigestInput, now?: Date): {
    since: Date;
    until: Date;
    period: DigestPeriod;
};
export declare function renderDigestMarkdown(out: Omit<DigestOutput, 'content' | 'success'>, fullSessions: Map<string, SessionData>, input: DigestInput): string;
export declare function digestTool(input: DigestInput): Promise<DigestOutput>;
export declare const digestSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            period: {
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
            groupBy: {
                type: string;
                enum: string[];
                description: string;
            };
            language: {
                type: string;
                enum: string[];
                description: string;
            };
            format: {
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
            project: {
                type: string;
                description: string;
            };
            includeFiles: {
                type: string;
                description: string;
            };
            includeDecisions: {
                type: string;
                description: string;
            };
            includePrompts: {
                type: string;
                description: string;
            };
            maxSessions: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
        };
    };
};
//# sourceMappingURL=digest.d.ts.map