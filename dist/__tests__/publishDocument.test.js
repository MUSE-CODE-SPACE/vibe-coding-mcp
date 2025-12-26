import { publishDocument } from '../tools/publishDocument.js';
describe('publishDocument', () => {
    const sampleDocument = `# Test Document

This is a test document for publishing.

## Features
- Feature 1
- Feature 2
`;
    describe('Notion publishing', () => {
        it('should return result for Notion platform', async () => {
            const result = await publishDocument({
                document: sampleDocument,
                title: 'Test Doc',
                platform: 'notion'
            });
            expect(result.result).toBeDefined();
            expect(result.result.platform).toBe('notion');
        });
        it('should handle missing Notion API key gracefully', async () => {
            const result = await publishDocument({
                document: sampleDocument,
                title: 'Test Doc',
                platform: 'notion'
            });
            expect(result.result).toBeDefined();
        });
    });
    describe('GitHub Wiki publishing', () => {
        it('should return result for GitHub Wiki platform', async () => {
            const result = await publishDocument({
                document: sampleDocument,
                title: 'Test Doc',
                platform: 'github-wiki'
            });
            expect(result.result).toBeDefined();
            expect(result.result.platform).toBe('github-wiki');
        });
    });
    describe('Obsidian publishing', () => {
        it('should return result for Obsidian platform', async () => {
            const result = await publishDocument({
                document: sampleDocument,
                title: 'Test Doc',
                platform: 'obsidian'
            });
            expect(result.result).toBeDefined();
            expect(result.result.platform).toBe('obsidian');
        });
        it('should work with vault path option', async () => {
            const result = await publishDocument({
                document: sampleDocument,
                title: 'Test Doc',
                platform: 'obsidian',
                options: {
                    vaultPath: '/path/to/vault'
                }
            });
            expect(result.result).toBeDefined();
        });
    });
    describe('output format', () => {
        it('should include platform in result', async () => {
            const result = await publishDocument({
                document: sampleDocument,
                title: 'Test',
                platform: 'notion'
            });
            expect(result.result.platform).toBe('notion');
        });
        it('should include success status', async () => {
            const result = await publishDocument({
                document: sampleDocument,
                title: 'Test',
                platform: 'obsidian'
            });
            expect(typeof result.result.success).toBe('boolean');
        });
    });
    describe('error handling', () => {
        it('should handle unsupported platform', async () => {
            const result = await publishDocument({
                document: sampleDocument,
                title: 'Test',
                platform: 'unknown-platform'
            });
            expect(result.result.success).toBe(false);
            expect(result.result.error).toContain('Unsupported platform');
        });
    });
});
//# sourceMappingURL=publishDocument.test.js.map