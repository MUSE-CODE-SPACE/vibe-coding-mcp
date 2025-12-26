/**
 * 세션 스토리지 모듈
 * 바이브 코딩 세션을 저장하고 조회하는 기능 제공
 * v2.6: 세션 히스토리 기능
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { logger } from './logger.js';

const storageLogger = logger.child({ module: 'sessionStorage' });

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
    codeBlocks: Array<{ language: string; code: string; filename?: string }>;
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

// Default storage path
const DEFAULT_STORAGE_DIR = process.env.VIBE_CODING_STORAGE_DIR ||
  path.join(process.env.HOME || process.env.USERPROFILE || '.', '.vibe-coding-mcp', 'sessions');

let storageDir = DEFAULT_STORAGE_DIR;

/**
 * Initialize storage directory
 */
export async function initializeStorage(customDir?: string): Promise<void> {
  if (customDir) {
    storageDir = customDir;
  }

  try {
    await fs.mkdir(storageDir, { recursive: true });
    storageLogger.info('Storage initialized', { path: storageDir });
  } catch (error) {
    storageLogger.error('Failed to initialize storage', error as Error);
    throw error;
  }
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `session_${timestamp}_${random}`;
}

/**
 * Get session file path
 */
function getSessionPath(sessionId: string): string {
  return path.join(storageDir, `${sessionId}.json`);
}

/**
 * Save a session
 */
export async function saveSession(data: Omit<SessionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<SessionData> {
  await initializeStorage();

  const sessionId = generateSessionId();
  const now = new Date().toISOString();

  const session: SessionData = {
    id: sessionId,
    createdAt: now,
    updatedAt: now,
    ...data
  };

  const filePath = getSessionPath(sessionId);

  try {
    await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
    storageLogger.info('Session saved', { sessionId, title: session.title });
    return session;
  } catch (error) {
    storageLogger.error('Failed to save session', error as Error);
    throw error;
  }
}

/**
 * Update an existing session
 */
export async function updateSession(sessionId: string, updates: Partial<Omit<SessionData, 'id' | 'createdAt'>>): Promise<SessionData> {
  const existing = await getSession(sessionId);
  if (!existing) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const updated: SessionData = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  const filePath = getSessionPath(sessionId);

  try {
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    storageLogger.info('Session updated', { sessionId });
    return updated;
  } catch (error) {
    storageLogger.error('Failed to update session', error as Error);
    throw error;
  }
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const filePath = getSessionPath(sessionId);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as SessionData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    storageLogger.error('Failed to read session', error as Error);
    throw error;
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const filePath = getSessionPath(sessionId);

  try {
    await fs.unlink(filePath);
    storageLogger.info('Session deleted', { sessionId });
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    storageLogger.error('Failed to delete session', error as Error);
    throw error;
  }
}

/**
 * List all sessions (summary only)
 */
export async function listSessions(options?: {
  limit?: number;
  offset?: number;
  tags?: string[];
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}): Promise<{ sessions: StoredSession[]; total: number }> {
  await initializeStorage();

  const { limit = 50, offset = 0, tags, sortBy = 'updatedAt', sortOrder = 'desc' } = options || {};

  try {
    const files = await fs.readdir(storageDir);
    const sessionFiles = files.filter(f => f.endsWith('.json'));

    const sessions: StoredSession[] = [];

    for (const file of sessionFiles) {
      try {
        const content = await fs.readFile(path.join(storageDir, file), 'utf-8');
        const data = JSON.parse(content) as SessionData;

        // Filter by tags if specified
        if (tags && tags.length > 0) {
          const hasTag = tags.some(tag => data.tags?.includes(tag));
          if (!hasTag) continue;
        }

        sessions.push({
          id: data.id,
          title: data.title,
          summary: data.summary,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          tags: data.tags || [],
          codeContextCount: data.codeContexts?.length || 0,
          designDecisionCount: data.designDecisions?.length || 0,
          metadata: data.metadata
        });
      } catch {
        // Skip invalid files
        continue;
      }
    }

    // Sort
    sessions.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    // Paginate
    const total = sessions.length;
    const paginated = sessions.slice(offset, offset + limit);

    return { sessions: paginated, total };
  } catch (error) {
    storageLogger.error('Failed to list sessions', error as Error);
    throw error;
  }
}

/**
 * Search sessions by keyword
 */
export async function searchSessions(keyword: string, options?: {
  limit?: number;
  searchIn?: ('title' | 'summary' | 'tags')[];
}): Promise<StoredSession[]> {
  const { limit = 20, searchIn = ['title', 'summary', 'tags'] } = options || {};
  const lowerKeyword = keyword.toLowerCase();

  const { sessions } = await listSessions({ limit: 1000 });

  const matches = sessions.filter(session => {
    if (searchIn.includes('title') && session.title.toLowerCase().includes(lowerKeyword)) {
      return true;
    }
    if (searchIn.includes('summary') && session.summary.toLowerCase().includes(lowerKeyword)) {
      return true;
    }
    if (searchIn.includes('tags') && session.tags.some(t => t.toLowerCase().includes(lowerKeyword))) {
      return true;
    }
    return false;
  });

  return matches.slice(0, limit);
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalSessions: number;
  totalCodeContexts: number;
  totalDesignDecisions: number;
  storageDir: string;
  oldestSession?: string;
  newestSession?: string;
}> {
  const { sessions, total } = await listSessions({ limit: 1000 });

  let totalCodeContexts = 0;
  let totalDesignDecisions = 0;

  for (const session of sessions) {
    totalCodeContexts += session.codeContextCount;
    totalDesignDecisions += session.designDecisionCount;
  }

  // Sort by createdAt to find oldest/newest
  const sorted = [...sessions].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return {
    totalSessions: total,
    totalCodeContexts,
    totalDesignDecisions,
    storageDir,
    oldestSession: sorted[0]?.createdAt,
    newestSession: sorted[sorted.length - 1]?.createdAt
  };
}
