/**
 * 세션 히스토리 도구
 * 바이브 코딩 세션을 저장, 조회, 검색하는 기능
 * v2.6: 세션 히스토리 관리
 */
import { SessionData, StoredSession } from '../core/sessionStorage.js';
export type SessionHistoryAction = 'save' | 'get' | 'update' | 'delete' | 'list' | 'search' | 'stats';
export interface SessionHistoryInput {
    action: SessionHistoryAction;
    title?: string;
    summary?: string;
    tags?: string[];
    codeContexts?: SessionData['codeContexts'];
    designDecisions?: SessionData['designDecisions'];
    metadata?: Record<string, unknown>;
    sessionId?: string;
    limit?: number;
    offset?: number;
    filterTags?: string[];
    sortBy?: 'createdAt' | 'updatedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
    keyword?: string;
    searchIn?: ('title' | 'summary' | 'tags')[];
}
export interface SessionHistoryOutput {
    success: boolean;
    action: SessionHistoryAction;
    session?: SessionData;
    sessions?: StoredSession[];
    total?: number;
    stats?: {
        totalSessions: number;
        totalCodeContexts: number;
        totalDesignDecisions: number;
        storageDir: string;
        oldestSession?: string;
        newestSession?: string;
    };
    message?: string;
    error?: string;
}
export declare function sessionHistoryTool(input: SessionHistoryInput): Promise<SessionHistoryOutput>;
export declare const sessionHistorySchema: {
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
            title: {
                type: string;
                description: string;
            };
            summary: {
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
            codeContexts: {
                type: string;
                description: string;
            };
            designDecisions: {
                type: string;
                description: string;
            };
            metadata: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            offset: {
                type: string;
                description: string;
            };
            filterTags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            sortBy: {
                type: string;
                enum: string[];
                description: string;
            };
            sortOrder: {
                type: string;
                enum: string[];
                description: string;
            };
            keyword: {
                type: string;
                description: string;
            };
            searchIn: {
                type: string;
                items: {
                    type: string;
                    enum: string[];
                };
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=sessionHistory.d.ts.map