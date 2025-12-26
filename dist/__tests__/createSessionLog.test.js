import { createSessionLog } from '../tools/createSessionLog.js';
describe('createSessionLog', () => {
    describe('basic functionality', () => {
        it('should create a session log with required fields', async () => {
            const result = await createSessionLog({
                title: 'Test Session',
                summary: 'This is a test summary'
            });
            expect(result.sessionLog).toBeDefined();
            expect(result.sessionLog.sessionId).toBeDefined();
            expect(result.sessionLog.date).toBeDefined();
            expect(result.sessionLog.title).toBe('Test Session');
            expect(result.sessionLog.summary).toBe('This is a test summary');
            expect(result.content).toBeDefined();
        });
        it('should include duration when provided', async () => {
            const result = await createSessionLog({
                title: 'Test Session',
                summary: 'Test summary',
                duration: 3600
            });
            expect(result.sessionLog.duration).toBe(3600);
            expect(result.content).toContain('60 minutes');
        });
    });
    describe('log formats', () => {
        it('should create markdown log by default', async () => {
            const result = await createSessionLog({
                title: 'Test',
                summary: 'Summary'
            });
            expect(result.content).toContain('#');
            expect(result.content).toContain('Test');
        });
        it('should create JSON log when requested', async () => {
            const result = await createSessionLog({
                title: 'Test',
                summary: 'Summary',
                options: {
                    logType: 'session',
                    format: 'json'
                }
            });
            expect(() => JSON.parse(result.content)).not.toThrow();
            const parsed = JSON.parse(result.content);
            expect(parsed.title).toBe('Test');
        });
        it('should create daily log type', async () => {
            const result = await createSessionLog({
                title: 'Daily',
                summary: 'Daily summary',
                options: {
                    logType: 'daily',
                    format: 'markdown'
                }
            });
            expect(result.content).toContain('Daily Vibe Coding Log');
        });
    });
    describe('code contexts', () => {
        it('should include code contexts in log', async () => {
            const result = await createSessionLog({
                title: 'Test',
                summary: 'Summary',
                codeContexts: [
                    {
                        sessionId: '1',
                        timestamp: new Date().toISOString(),
                        codeBlocks: [{ language: 'typescript', code: 'const x = 1;' }],
                        conversationSummary: 'Created a variable'
                    }
                ]
            });
            expect(result.content).toContain('Code Contexts');
            expect(result.content).toContain('const x = 1;');
        });
    });
    describe('design decisions', () => {
        it('should include design decisions in log', async () => {
            const result = await createSessionLog({
                title: 'Test',
                summary: 'Summary',
                designDecisions: [
                    {
                        id: '1',
                        title: 'Use TypeScript',
                        description: 'Decided to use TypeScript',
                        rationale: 'Type safety',
                        alternatives: ['JavaScript'],
                        timestamp: new Date().toISOString(),
                        category: 'implementation'
                    }
                ]
            });
            expect(result.content).toContain('Design Decisions');
            expect(result.content).toContain('Use TypeScript');
        });
    });
    describe('tags', () => {
        it('should include tags in log', async () => {
            const result = await createSessionLog({
                title: 'Test',
                summary: 'Summary',
                tags: ['react', 'typescript', 'api']
            });
            expect(result.sessionLog.tags).toContain('react');
            expect(result.content).toContain('#react');
            expect(result.content).toContain('#typescript');
        });
    });
    describe('edge cases', () => {
        it('should handle empty code contexts array', async () => {
            const result = await createSessionLog({
                title: 'Test',
                summary: 'Summary',
                codeContexts: []
            });
            expect(result.content).toBeDefined();
        });
        it('should handle empty design decisions array', async () => {
            const result = await createSessionLog({
                title: 'Test',
                summary: 'Summary',
                designDecisions: []
            });
            expect(result.content).toBeDefined();
        });
    });
});
//# sourceMappingURL=createSessionLog.test.js.map