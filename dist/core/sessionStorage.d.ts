/**
 * 세션 스토리지 모듈
 * 바이브 코딩 세션을 저장하고 조회하는 기능 제공
 * v2.6: 세션 히스토리 기능
 */
export interface StoredSession {
    id: string;
    title: string;
    summary: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    codeContextCount: number;
    designDecisionCount: number;
    metadata?: Record<string, unknown>;
}
export interface SessionData {
    id: string;
    title: string;
    summary: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    codeContexts: Array<{
        sessionId: string;
        timestamp: string;
        codeBlocks: Array<{
            language: string;
            code: string;
            filename?: string;
        }>;
        conversationSummary: string;
    }>;
    designDecisions: Array<{
        id: string;
        title: string;
        description: string;
        rationale: string;
        category: string;
        timestamp: string;
    }>;
    metadata?: Record<string, unknown>;
}
/**
 * Initialize storage directory
 */
export declare function initializeStorage(customDir?: string): Promise<void>;
/**
 * Save a session
 */
export declare function saveSession(data: Omit<SessionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<SessionData>;
/**
 * Update an existing session
 */
export declare function updateSession(sessionId: string, updates: Partial<Omit<SessionData, 'id' | 'createdAt'>>): Promise<SessionData>;
/**
 * Get a session by ID
 */
export declare function getSession(sessionId: string): Promise<SessionData | null>;
/**
 * Delete a session
 */
export declare function deleteSession(sessionId: string): Promise<boolean>;
/**
 * List all sessions (summary only)
 */
export declare function listSessions(options?: {
    limit?: number;
    offset?: number;
    tags?: string[];
    sortBy?: 'createdAt' | 'updatedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
}): Promise<{
    sessions: StoredSession[];
    total: number;
}>;
/**
 * Search sessions by keyword
 */
export declare function searchSessions(keyword: string, options?: {
    limit?: number;
    searchIn?: ('title' | 'summary' | 'tags')[];
}): Promise<StoredSession[]>;
/**
 * Get storage statistics
 */
export declare function getStorageStats(): Promise<{
    totalSessions: number;
    totalCodeContexts: number;
    totalDesignDecisions: number;
    storageDir: string;
    oldestSession?: string;
    newestSession?: string;
}>;
//# sourceMappingURL=sessionStorage.d.ts.map