/**
 * muse_recall — "what did we do in this project before, and why?"
 *
 * Returns a compact brief of earlier captured sessions for a project
 * (newest first), or — with `query` — the sessions most relevant to a
 * question, ranked across titles, decisions, touched files, commit subjects
 * and summaries.
 */
import { RecallSession } from '../core/recall.js';
export interface RecallInput {
    query?: string;
    cwd?: string;
    project?: string;
    scope?: 'project' | 'all';
    limit?: number;
    maxChars?: number;
    sinceDays?: number;
    language?: 'en' | 'ko';
}
export interface RecallOutput {
    success: boolean;
    project?: string;
    cwd?: string;
    scope: 'project' | 'all';
    query?: string;
    matched: number;
    sessions: RecallSession[];
    content: string;
    message?: string;
    error?: string;
}
export declare function recallTool(input: RecallInput): Promise<RecallOutput>;
export declare const recallSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            cwd: {
                type: string;
                description: string;
            };
            project: {
                type: string;
                description: string;
            };
            scope: {
                type: string;
                enum: string[];
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            maxChars: {
                type: string;
                description: string;
            };
            sinceDays: {
                type: string;
                description: string;
            };
            language: {
                type: string;
                enum: string[];
                description: string;
            };
        };
    };
};
//# sourceMappingURL=recall.d.ts.map