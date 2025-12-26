import { exportSessionTool } from '../tools/exportSession.js';
import { sessionHistoryTool } from '../tools/sessionHistory.js';
import * as sessionStorage from '../core/sessionStorage.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
let testDir;
beforeAll(async () => {
    testDir = path.join(os.tmpdir(), `vibe-coding-export-test-${Date.now()}`);
    await sessionStorage.initializeStorage(testDir);
    // 테스트용 세션 생성
    await sessionHistoryTool({
        action: 'save',
        title: 'Test Session 1',
        summary: 'First test session for export',
        tags: ['test', 'export'],
        codeContexts: [
            {
                sessionId: 'ctx-1',
                timestamp: new Date().toISOString(),
                codeBlocks: [
                    { language: 'typescript', code: 'const x = 1;' }
                ],
                conversationSummary: 'Test code'
            }
        ],
        designDecisions: [
            {
                id: 'dd-1',
                title: 'Test Decision',
                description: 'A test decision',
                rationale: 'For testing',
                category: 'implementation',
                timestamp: new Date().toISOString()
            }
        ]
    });
    await sessionHistoryTool({
        action: 'save',
        title: 'Test Session 2',
        summary: 'Second test session',
        tags: ['test']
    });
});
afterAll(async () => {
    try {
        const files = await fs.readdir(testDir);
        for (const file of files) {
            await fs.unlink(path.join(testDir, file));
        }
        await fs.rmdir(testDir);
    }
    catch {
        // Ignore cleanup errors
    }
});
describe('exportSessionTool', () => {
    describe('markdown export', () => {
        it('should export all sessions as markdown', async () => {
            const result = await exportSessionTool({
                format: 'markdown'
            });
            expect(result.success).toBe(true);
            expect(result.format).toBe('markdown');
            expect(result.sessionCount).toBe(2);
            expect(result.content).toContain('Test Session 1');
            expect(result.content).toContain('Test Session 2');
        });
        it('should include code blocks in markdown', async () => {
            const result = await exportSessionTool({
                format: 'markdown',
                includeCodeBlocks: true
            });
            expect(result.success).toBe(true);
            expect(result.content).toContain('```typescript');
            expect(result.content).toContain('const x = 1;');
        });
        it('should include design decisions', async () => {
            const result = await exportSessionTool({
                format: 'markdown',
                includeDesignDecisions: true
            });
            expect(result.success).toBe(true);
            expect(result.content).toContain('Test Decision');
            expect(result.content).toContain('Design Decisions');
        });
        it('should use minimal template', async () => {
            const result = await exportSessionTool({
                format: 'markdown',
                template: 'minimal'
            });
            expect(result.success).toBe(true);
            expect(result.content).not.toContain('Table of Contents');
        });
    });
    describe('json export', () => {
        it('should export as valid JSON', async () => {
            const result = await exportSessionTool({
                format: 'json'
            });
            expect(result.success).toBe(true);
            expect(result.format).toBe('json');
            const parsed = JSON.parse(result.content);
            expect(parsed.exportInfo).toBeDefined();
            expect(parsed.sessions).toHaveLength(2);
        });
        it('should include metadata in JSON', async () => {
            const result = await exportSessionTool({
                format: 'json',
                includeMetadata: true
            });
            const parsed = JSON.parse(result.content);
            expect(parsed.sessions[0].createdAt).toBeDefined();
            expect(parsed.sessions[0].tags).toBeDefined();
        });
    });
    describe('html export', () => {
        it('should export as valid HTML', async () => {
            const result = await exportSessionTool({
                format: 'html'
            });
            expect(result.success).toBe(true);
            expect(result.format).toBe('html');
            expect(result.content).toContain('<!DOCTYPE html>');
            expect(result.content).toContain('Test Session 1');
        });
        it('should include styles in HTML', async () => {
            const result = await exportSessionTool({
                format: 'html'
            });
            expect(result.content).toContain('<style>');
            expect(result.content).toContain('font-family');
        });
    });
    describe('file output', () => {
        it('should save to file when outputPath is provided', async () => {
            const outputPath = path.join(testDir, 'export-test.md');
            const result = await exportSessionTool({
                format: 'markdown',
                outputPath
            });
            expect(result.success).toBe(true);
            expect(result.filePath).toBe(outputPath);
            const fileContent = await fs.readFile(outputPath, 'utf-8');
            expect(fileContent).toContain('Test Session');
        });
    });
    describe('custom options', () => {
        it('should use custom title', async () => {
            const result = await exportSessionTool({
                format: 'markdown',
                title: 'My Custom Export'
            });
            expect(result.content).toContain('# My Custom Export');
        });
        it('should exclude code blocks when disabled', async () => {
            const result = await exportSessionTool({
                format: 'markdown',
                includeCodeBlocks: false
            });
            expect(result.content).not.toContain('```typescript');
        });
    });
    describe('error handling', () => {
        it('should handle no sessions gracefully', async () => {
            // 다른 저장소로 테스트
            const emptyDir = path.join(os.tmpdir(), `empty-${Date.now()}`);
            await sessionStorage.initializeStorage(emptyDir);
            const result = await exportSessionTool({
                format: 'markdown',
                sessionIds: ['non-existent-id']
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('No sessions found');
            // 원래 저장소로 복원
            await sessionStorage.initializeStorage(testDir);
        });
    });
});
//# sourceMappingURL=exportSession.test.js.map