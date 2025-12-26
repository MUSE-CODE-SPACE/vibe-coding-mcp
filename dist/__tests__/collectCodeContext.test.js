import { collectCodeContext } from '../tools/collectCodeContext.js';
describe('collectCodeContext', () => {
    describe('basic functionality', () => {
        it('should create a context with provided code blocks', () => {
            const result = collectCodeContext({
                codeBlocks: [
                    { language: 'typescript', code: 'const x = 1;' }
                ],
                conversationSummary: 'Test summary'
            });
            expect(result.context).toBeDefined();
            expect(result.context.codeBlocks).toHaveLength(1);
            expect(result.context.conversationSummary).toBe('Test summary');
            expect(result.context.sessionId).toBeDefined();
            expect(result.context.timestamp).toBeDefined();
        });
        it('should extract code blocks from raw text', () => {
            const rawText = `
Here is some code:
\`\`\`javascript
function hello() {
  console.log('Hello');
}
\`\`\`
      `;
            const result = collectCodeContext({
                rawText,
                conversationSummary: 'Extracted from raw text'
            });
            expect(result.context.codeBlocks).toHaveLength(1);
            expect(result.context.codeBlocks[0].language).toBe('javascript');
        });
    });
    describe('language detection', () => {
        it('should auto-detect TypeScript', () => {
            const result = collectCodeContext({
                codeBlocks: [
                    { language: '', code: 'interface User { name: string; age: number; }' }
                ],
                conversationSummary: 'TypeScript detection',
                autoDetectLanguage: true
            });
            expect(result.context.codeBlocks[0].language).toBe('typescript');
        });
        it('should auto-detect Python', () => {
            const result = collectCodeContext({
                codeBlocks: [
                    { language: '', code: 'def hello():\n    print("Hello")' }
                ],
                conversationSummary: 'Python detection',
                autoDetectLanguage: true
            });
            expect(result.context.codeBlocks[0].language).toBe('python');
        });
        it('should auto-detect SQL', () => {
            const result = collectCodeContext({
                codeBlocks: [
                    { language: '', code: 'SELECT * FROM users WHERE id = 1' }
                ],
                conversationSummary: 'SQL detection'
            });
            expect(result.context.codeBlocks[0].language).toBe('sql');
        });
    });
    describe('duplicate removal', () => {
        it('should remove duplicate code blocks', () => {
            const result = collectCodeContext({
                codeBlocks: [
                    { language: 'javascript', code: 'const x = 1;' },
                    { language: 'javascript', code: 'const x = 1;' },
                    { language: 'javascript', code: 'const y = 2;' }
                ],
                conversationSummary: 'Duplicate test',
                removeDuplicates: true
            });
            expect(result.context.codeBlocks).toHaveLength(2);
            expect(result.warnings).toContain('Removed 1 duplicate code block(s)');
        });
        it('should keep duplicates when removeDuplicates is false', () => {
            const result = collectCodeContext({
                codeBlocks: [
                    { language: 'javascript', code: 'const x = 1;' },
                    { language: 'javascript', code: 'const x = 1;' }
                ],
                conversationSummary: 'Keep duplicates',
                removeDuplicates: false
            });
            expect(result.context.codeBlocks).toHaveLength(2);
        });
    });
    describe('statistics', () => {
        it('should include stats when includeStats is true', () => {
            const result = collectCodeContext({
                codeBlocks: [
                    { language: 'javascript', code: 'const x = 1;\nconst y = 2;' },
                    { language: 'python', code: 'x = 1' }
                ],
                conversationSummary: 'Stats test',
                includeStats: true
            });
            expect(result.stats).toBeDefined();
            expect(result.stats?.totalBlocks).toBe(2);
            expect(result.stats?.languageBreakdown).toEqual({
                javascript: 1,
                python: 1
            });
        });
    });
    describe('tags', () => {
        it('should auto-add language tags', () => {
            const result = collectCodeContext({
                codeBlocks: [
                    { language: 'typescript', code: 'const x: number = 1;' }
                ],
                conversationSummary: 'Tag test',
                tags: ['custom-tag']
            });
            expect(result.context.tags).toContain('custom-tag');
            expect(result.context.tags).toContain('typescript');
        });
    });
    describe('validation', () => {
        it('should warn on empty summary', () => {
            const result = collectCodeContext({
                codeBlocks: [{ language: 'js', code: 'x' }],
                conversationSummary: ''
            });
            expect(result.warnings).toContain('Conversation summary is empty');
        });
        it('should warn on empty code block', () => {
            const result = collectCodeContext({
                codeBlocks: [{ language: 'js', code: '' }],
                conversationSummary: 'Test'
            });
            expect(result.warnings).toContain('Code block 1 is empty');
        });
    });
});
//# sourceMappingURL=collectCodeContext.test.js.map