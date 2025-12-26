import { normalizeForPlatform } from '../tools/normalizeForPlatform.js';
describe('normalizeForPlatform', () => {
    const sampleDocument = `# Test Document

This is a test with [[internal link]] and ![image](local.png).

## Code Block

\`\`\`ts
const x: number = 1;
\`\`\`

- [ ] Todo item
- [x] Done item

> **Note**: This is a note.
`;
    describe('Notion conversion', () => {
        it('should convert checkboxes for Notion', () => {
            const result = normalizeForPlatform({
                document: '- [ ] Todo\n- [x] Done',
                platform: 'notion'
            });
            expect(result.normalizedDocument).toContain('☐');
            expect(result.normalizedDocument).toContain('☑');
        });
        it('should warn about footnotes', () => {
            const result = normalizeForPlatform({
                document: 'Text with footnote[^1]\n\n[^1]: Footnote content',
                platform: 'notion'
            });
            expect(result.warnings).toContain('Footnotes were removed (not supported by Notion)');
        });
        it('should convert code block language identifiers', () => {
            const result = normalizeForPlatform({
                document: '```ts\nconst x = 1;\n```',
                platform: 'notion',
                options: { convertCodeBlocks: true }
            });
            expect(result.normalizedDocument).toContain('```typescript');
        });
    });
    describe('GitHub Wiki conversion', () => {
        it('should convert Obsidian links to GitHub Wiki style', () => {
            const result = normalizeForPlatform({
                document: '[[Page Name]]',
                platform: 'github-wiki',
                options: { preserveLocalLinks: false }
            });
            expect(result.normalizedDocument).toContain('[Page Name](Page-Name)');
        });
        it('should convert note callouts', () => {
            const result = normalizeForPlatform({
                document: '> [!NOTE]\n> Important note',
                platform: 'github-wiki'
            });
            expect(result.normalizedDocument).toContain('**Note**');
        });
    });
    describe('Obsidian conversion', () => {
        it('should add frontmatter when requested', () => {
            const result = normalizeForPlatform({
                document: '# Test',
                platform: 'obsidian',
                options: {
                    addFrontmatter: true,
                    frontmatterData: { title: 'Test Doc' }
                }
            });
            expect(result.normalizedDocument).toContain('---');
            expect(result.normalizedDocument).toContain('title: Test Doc');
            expect(result.normalizedDocument).toContain('created:');
        });
        it('should add tags to frontmatter', () => {
            const result = normalizeForPlatform({
                document: '# Test',
                platform: 'obsidian',
                options: {
                    addFrontmatter: true,
                    addTags: ['tag1', 'tag2']
                }
            });
            expect(result.normalizedDocument).toContain('tags:');
            expect(result.normalizedDocument).toContain('- tag1');
        });
        it('should convert standard markdown to Obsidian callouts', () => {
            const result = normalizeForPlatform({
                document: '> **Warning**: Be careful!',
                platform: 'obsidian'
            });
            expect(result.normalizedDocument).toContain('[!warning]');
        });
    });
    describe('HTML stripping', () => {
        it('should strip HTML tags when requested', () => {
            const result = normalizeForPlatform({
                document: '<p>Paragraph</p><strong>Bold</strong>',
                platform: 'notion',
                options: { stripHtml: true }
            });
            expect(result.normalizedDocument).not.toContain('<p>');
            expect(result.normalizedDocument).toContain('**Bold**');
        });
    });
    describe('line wrapping', () => {
        it('should wrap long lines', () => {
            const longLine = 'This is a very long line that should be wrapped at some point because it exceeds the maximum line length specified in the options.';
            const result = normalizeForPlatform({
                document: longLine,
                platform: 'notion',
                options: { maxLineLength: 40 }
            });
            const lines = result.normalizedDocument.split('\n');
            expect(lines.every(line => line.length <= 50)).toBe(true); // some tolerance
        });
    });
    describe('statistics', () => {
        it('should collect document statistics', () => {
            const result = normalizeForPlatform({
                document: sampleDocument,
                platform: 'notion'
            });
            expect(result.stats).toBeDefined();
            expect(result.stats.headingsCount).toBe(2);
            expect(result.stats.codeBlocksCount).toBe(1);
            expect(result.stats.originalLength).toBeGreaterThan(0);
        });
    });
    describe('image conversion', () => {
        it('should convert Obsidian images for Notion', () => {
            const result = normalizeForPlatform({
                document: '![[image.png]]',
                platform: 'notion',
                options: { convertImages: true }
            });
            expect(result.normalizedDocument).toContain('![image.png]');
        });
        it('should convert to Obsidian image syntax', () => {
            const result = normalizeForPlatform({
                document: '![alt](local/image.png)',
                platform: 'obsidian',
                options: { convertImages: true }
            });
            expect(result.normalizedDocument).toContain('![[local/image.png]]');
        });
    });
    describe('changes tracking', () => {
        it('should track applied changes', () => {
            const result = normalizeForPlatform({
                document: '# Test\n- [ ] Item',
                platform: 'notion',
                options: {
                    stripHtml: false,
                    convertCodeBlocks: true
                }
            });
            expect(result.changes).toBeDefined();
            expect(Array.isArray(result.changes)).toBe(true);
        });
    });
    describe('empty document handling', () => {
        it('should warn on empty document', () => {
            const result = normalizeForPlatform({
                document: '',
                platform: 'notion'
            });
            expect(result.warnings).toContain('Empty document provided');
        });
    });
});
//# sourceMappingURL=normalizeForPlatform.test.js.map