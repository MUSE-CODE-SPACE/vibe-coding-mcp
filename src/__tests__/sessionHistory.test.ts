import { sessionHistoryTool } from '../tools/sessionHistory.js';
import * as sessionStorage from '../core/sessionStorage.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

// Create a temp directory for tests
let testDir: string;

beforeAll(async () => {
  testDir = path.join(os.tmpdir(), `vibe-coding-test-${Date.now()}`);
  await sessionStorage.initializeStorage(testDir);
});

afterAll(async () => {
  // Clean up test directory
  try {
    const files = await fs.readdir(testDir);
    for (const file of files) {
      await fs.unlink(path.join(testDir, file));
    }
    await fs.rmdir(testDir);
  } catch {
    // Ignore cleanup errors
  }
});

describe('sessionHistoryTool', () => {
  let savedSessionId: string;

  describe('save action', () => {
    it('should save a new session', async () => {
      const result = await sessionHistoryTool({
        action: 'save',
        title: 'Test Session',
        summary: 'This is a test session',
        tags: ['test', 'example'],
        codeContexts: [
          {
            sessionId: 'ctx-1',
            timestamp: new Date().toISOString(),
            codeBlocks: [{ language: 'typescript', code: 'const x = 1;' }],
            conversationSummary: 'Test context'
          }
        ],
        designDecisions: [
          {
            id: 'dd-1',
            title: 'Use TypeScript',
            description: 'Chose TypeScript for type safety',
            rationale: 'Better maintainability',
            category: 'implementation',
            timestamp: new Date().toISOString()
          }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('save');
      expect(result.session).toBeDefined();
      expect(result.session?.title).toBe('Test Session');
      expect(result.session?.id).toMatch(/^session_/);

      savedSessionId = result.session!.id;
    });

    it('should fail without required fields', async () => {
      const result = await sessionHistoryTool({
        action: 'save',
        title: 'Only Title'
        // missing summary
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('summary');
    });
  });

  describe('get action', () => {
    it('should retrieve a session by ID', async () => {
      const result = await sessionHistoryTool({
        action: 'get',
        sessionId: savedSessionId
      });

      expect(result.success).toBe(true);
      expect(result.session?.title).toBe('Test Session');
      expect(result.session?.tags).toContain('test');
    });

    it('should fail for non-existent session', async () => {
      const result = await sessionHistoryTool({
        action: 'get',
        sessionId: 'non-existent-id'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail without sessionId', async () => {
      const result = await sessionHistoryTool({
        action: 'get'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('sessionId');
    });
  });

  describe('update action', () => {
    it('should update an existing session', async () => {
      const result = await sessionHistoryTool({
        action: 'update',
        sessionId: savedSessionId,
        title: 'Updated Test Session',
        tags: ['test', 'updated']
      });

      expect(result.success).toBe(true);
      expect(result.session?.title).toBe('Updated Test Session');
      expect(result.session?.tags).toContain('updated');
    });

    it('should fail for non-existent session', async () => {
      const result = await sessionHistoryTool({
        action: 'update',
        sessionId: 'non-existent-id',
        title: 'New Title'
      });

      expect(result.success).toBe(false);
    });
  });

  describe('list action', () => {
    beforeAll(async () => {
      // Add more sessions for list testing
      await sessionHistoryTool({
        action: 'save',
        title: 'Session 2',
        summary: 'Second session',
        tags: ['second']
      });
      await sessionHistoryTool({
        action: 'save',
        title: 'Session 3',
        summary: 'Third session with special',
        tags: ['third', 'special']
      });
    });

    it('should list all sessions', async () => {
      const result = await sessionHistoryTool({
        action: 'list'
      });

      expect(result.success).toBe(true);
      expect(result.sessions).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(3);
    });

    it('should filter by tags', async () => {
      const result = await sessionHistoryTool({
        action: 'list',
        filterTags: ['special']
      });

      expect(result.success).toBe(true);
      expect(result.sessions?.length).toBe(1);
      expect(result.sessions?.[0].tags).toContain('special');
    });

    it('should support pagination', async () => {
      const result = await sessionHistoryTool({
        action: 'list',
        limit: 2,
        offset: 0
      });

      expect(result.success).toBe(true);
      expect(result.sessions?.length).toBeLessThanOrEqual(2);
    });
  });

  describe('search action', () => {
    it('should search sessions by keyword in title', async () => {
      const result = await sessionHistoryTool({
        action: 'search',
        keyword: 'Updated',
        searchIn: ['title']
      });

      expect(result.success).toBe(true);
      expect(result.sessions?.length).toBeGreaterThanOrEqual(1);
    });

    it('should search sessions by keyword in summary', async () => {
      const result = await sessionHistoryTool({
        action: 'search',
        keyword: 'special',
        searchIn: ['summary']
      });

      expect(result.success).toBe(true);
      expect(result.sessions?.length).toBeGreaterThanOrEqual(1);
    });

    it('should fail without keyword', async () => {
      const result = await sessionHistoryTool({
        action: 'search'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('keyword');
    });
  });

  describe('stats action', () => {
    it('should return storage statistics', async () => {
      const result = await sessionHistoryTool({
        action: 'stats'
      });

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats?.totalSessions).toBeGreaterThanOrEqual(3);
      expect(result.stats?.storageDir).toBe(testDir);
    });
  });

  describe('delete action', () => {
    it('should delete a session', async () => {
      // First save a session to delete
      const saveResult = await sessionHistoryTool({
        action: 'save',
        title: 'To Delete',
        summary: 'This will be deleted'
      });

      const deleteResult = await sessionHistoryTool({
        action: 'delete',
        sessionId: saveResult.session!.id
      });

      expect(deleteResult.success).toBe(true);

      // Verify it's deleted
      const getResult = await sessionHistoryTool({
        action: 'get',
        sessionId: saveResult.session!.id
      });

      expect(getResult.success).toBe(false);
      expect(getResult.error).toContain('not found');
    });

    it('should fail for non-existent session', async () => {
      const result = await sessionHistoryTool({
        action: 'delete',
        sessionId: 'non-existent-id'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});
