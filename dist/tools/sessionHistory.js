/**
 * 세션 히스토리 도구
 * 바이브 코딩 세션을 저장, 조회, 검색하는 기능
 * v2.6: 세션 히스토리 관리
 */
import { saveSession, getSession, updateSession, deleteSession, listSessions, searchSessions, getStorageStats } from '../core/sessionStorage.js';
export async function sessionHistoryTool(input) {
    const { action } = input;
    try {
        switch (action) {
            case 'save': {
                if (!input.title || !input.summary) {
                    return {
                        success: false,
                        action,
                        error: 'title and summary are required for save action'
                    };
                }
                const session = await saveSession({
                    title: input.title,
                    summary: input.summary,
                    tags: input.tags || [],
                    codeContexts: input.codeContexts || [],
                    designDecisions: input.designDecisions || [],
                    metadata: input.metadata
                });
                return {
                    success: true,
                    action,
                    session,
                    message: `Session saved: ${session.id}`
                };
            }
            case 'get': {
                if (!input.sessionId) {
                    return {
                        success: false,
                        action,
                        error: 'sessionId is required for get action'
                    };
                }
                const session = await getSession(input.sessionId);
                if (!session) {
                    return {
                        success: false,
                        action,
                        error: `Session not found: ${input.sessionId}`
                    };
                }
                return {
                    success: true,
                    action,
                    session,
                    message: `Session retrieved: ${session.title}`
                };
            }
            case 'update': {
                if (!input.sessionId) {
                    return {
                        success: false,
                        action,
                        error: 'sessionId is required for update action'
                    };
                }
                const updates = {};
                if (input.title !== undefined)
                    updates.title = input.title;
                if (input.summary !== undefined)
                    updates.summary = input.summary;
                if (input.tags !== undefined)
                    updates.tags = input.tags;
                if (input.codeContexts !== undefined)
                    updates.codeContexts = input.codeContexts;
                if (input.designDecisions !== undefined)
                    updates.designDecisions = input.designDecisions;
                if (input.metadata !== undefined)
                    updates.metadata = input.metadata;
                const session = await updateSession(input.sessionId, updates);
                return {
                    success: true,
                    action,
                    session,
                    message: `Session updated: ${session.id}`
                };
            }
            case 'delete': {
                if (!input.sessionId) {
                    return {
                        success: false,
                        action,
                        error: 'sessionId is required for delete action'
                    };
                }
                const deleted = await deleteSession(input.sessionId);
                if (!deleted) {
                    return {
                        success: false,
                        action,
                        error: `Session not found: ${input.sessionId}`
                    };
                }
                return {
                    success: true,
                    action,
                    message: `Session deleted: ${input.sessionId}`
                };
            }
            case 'list': {
                const { sessions, total } = await listSessions({
                    limit: input.limit,
                    offset: input.offset,
                    tags: input.filterTags,
                    sortBy: input.sortBy,
                    sortOrder: input.sortOrder
                });
                return {
                    success: true,
                    action,
                    sessions,
                    total,
                    message: `Found ${total} session(s)`
                };
            }
            case 'search': {
                if (!input.keyword) {
                    return {
                        success: false,
                        action,
                        error: 'keyword is required for search action'
                    };
                }
                const sessions = await searchSessions(input.keyword, {
                    limit: input.limit,
                    searchIn: input.searchIn
                });
                return {
                    success: true,
                    action,
                    sessions,
                    total: sessions.length,
                    message: `Found ${sessions.length} session(s) matching "${input.keyword}"`
                };
            }
            case 'stats': {
                const stats = await getStorageStats();
                return {
                    success: true,
                    action,
                    stats,
                    message: `Storage contains ${stats.totalSessions} session(s)`
                };
            }
            default:
                return {
                    success: false,
                    action,
                    error: `Unknown action: ${action}`
                };
        }
    }
    catch (error) {
        return {
            success: false,
            action,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
export const sessionHistorySchema = {
    name: 'muse_session_history',
    description: 'Manages vibe coding session history. Save, retrieve, search, and manage past coding sessions with their code contexts and design decisions.',
    inputSchema: {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['save', 'get', 'update', 'delete', 'list', 'search', 'stats'],
                description: 'Action to perform: save (create new), get (retrieve by ID), update (modify existing), delete (remove), list (get all), search (find by keyword), stats (storage statistics)'
            },
            sessionId: {
                type: 'string',
                description: 'Session ID (required for get, update, delete actions)'
            },
            title: {
                type: 'string',
                description: 'Session title (required for save, optional for update)'
            },
            summary: {
                type: 'string',
                description: 'Session summary (required for save, optional for update)'
            },
            tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags for categorization'
            },
            codeContexts: {
                type: 'array',
                description: 'Array of code context objects'
            },
            designDecisions: {
                type: 'array',
                description: 'Array of design decision objects'
            },
            metadata: {
                type: 'object',
                description: 'Additional metadata'
            },
            limit: {
                type: 'number',
                description: 'Maximum results to return (for list/search, default: 50)'
            },
            offset: {
                type: 'number',
                description: 'Number of results to skip (for list, default: 0)'
            },
            filterTags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter by tags (for list)'
            },
            sortBy: {
                type: 'string',
                enum: ['createdAt', 'updatedAt', 'title'],
                description: 'Sort field (for list, default: updatedAt)'
            },
            sortOrder: {
                type: 'string',
                enum: ['asc', 'desc'],
                description: 'Sort order (for list, default: desc)'
            },
            keyword: {
                type: 'string',
                description: 'Search keyword (required for search action)'
            },
            searchIn: {
                type: 'array',
                items: { type: 'string', enum: ['title', 'summary', 'tags'] },
                description: 'Fields to search in (for search, default: all)'
            }
        },
        required: ['action']
    }
};
//# sourceMappingURL=sessionHistory.js.map