import { summarizeDesignDecisions } from '../tools/summarizeDesignDecisions.js';
describe('summarizeDesignDecisions', () => {
    describe('basic functionality', () => {
        it('should extract design decisions from conversation', () => {
            const conversationLog = `
User: Should we use REST or GraphQL?
Assistant: I decided to use REST because it's simpler for our use case.
User: What about the database?
Assistant: I chose PostgreSQL because we need ACID transactions.
      `;
            const result = summarizeDesignDecisions({ conversationLog });
            expect(result.decisions).toBeDefined();
            expect(result.summary).toBeDefined();
            expect(result.stats).toBeDefined();
        });
        it('should identify decision categories', () => {
            const conversationLog = `
I decided to use TypeScript because of type safety.
I chose React for the architecture of the frontend.
      `;
            const result = summarizeDesignDecisions({ conversationLog });
            expect(result.stats.byCategory).toBeDefined();
        });
    });
    describe('Korean language support', () => {
        it('should extract decisions from Korean text', () => {
            const conversationLog = `
React를 선택했습니다. 생태계가 좋기 때문입니다.
Next.js를 사용하기로 했습니다.
      `;
            const result = summarizeDesignDecisions({
                conversationLog,
                language: 'ko'
            });
            expect(result.decisions).toBeDefined();
            expect(result.summary).toBeDefined();
        });
        it('should auto-detect Korean', () => {
            const conversationLog = `
우리는 마이크로서비스 아키텍처를 선택했습니다.
데이터베이스로 PostgreSQL을 사용하기로 결정했습니다.
      `;
            const result = summarizeDesignDecisions({
                conversationLog,
                language: 'auto'
            });
            expect(result.decisions).toBeDefined();
        });
    });
    describe('importance scoring', () => {
        it('should assign importance scores', () => {
            const conversationLog = `
This is a critical decision: We will use microservices architecture.
I decided to add a small utility function for formatting.
      `;
            const result = summarizeDesignDecisions({ conversationLog });
            if (result.decisions.length > 0) {
                expect(result.decisions[0].importance).toBeDefined();
                expect(result.decisions[0].importanceScore).toBeDefined();
            }
        });
        it('should track importance distribution in stats', () => {
            const conversationLog = `
We decided to implement caching.
I chose Express for the server.
      `;
            const result = summarizeDesignDecisions({ conversationLog });
            expect(result.stats.byImportance).toBeDefined();
        });
    });
    describe('keyword extraction', () => {
        it('should extract keywords from decisions', () => {
            const conversationLog = `
We decided to implement caching using Redis for better performance.
The authentication system will use JWT tokens.
      `;
            const result = summarizeDesignDecisions({ conversationLog });
            expect(result.stats.topKeywords).toBeDefined();
            expect(Array.isArray(result.stats.topKeywords)).toBe(true);
        });
    });
    describe('code extraction', () => {
        it('should extract related code blocks', () => {
            const conversationLog = `
I decided to implement the function like this:
\`\`\`typescript
function authenticate(token: string): boolean {
  return validateJWT(token);
}
\`\`\`
      `;
            const result = summarizeDesignDecisions({
                conversationLog,
                extractRelatedCode: true
            });
            expect(result.decisions).toBeDefined();
        });
    });
    describe('statistics', () => {
        it('should include total decisions count', () => {
            const conversationLog = `
I decided to use TypeScript.
I chose React.
      `;
            const result = summarizeDesignDecisions({ conversationLog });
            expect(result.stats.totalDecisions).toBeDefined();
            expect(typeof result.stats.totalDecisions).toBe('number');
        });
        it('should categorize decisions', () => {
            const conversationLog = `
I decided to use the factory pattern for object creation.
I chose Express library for the API.
      `;
            const result = summarizeDesignDecisions({ conversationLog });
            expect(result.stats.byCategory).toBeDefined();
        });
    });
    describe('max decisions limit', () => {
        it('should respect maxDecisions limit', () => {
            const conversationLog = `
I decided to use A. I chose B. I selected C. I picked D. I went with E.
I opted for F. I settled on G. I implemented H. I chose I. I decided J.
      `;
            const result = summarizeDesignDecisions({
                conversationLog,
                maxDecisions: 3
            });
            expect(result.decisions.length).toBeLessThanOrEqual(3);
        });
    });
    describe('edge cases', () => {
        it('should handle empty conversation log', () => {
            const result = summarizeDesignDecisions({ conversationLog: '' });
            expect(result.decisions).toBeDefined();
            expect(result.decisions.length).toBe(0);
        });
        it('should handle conversation with no clear decisions', () => {
            const conversationLog = `
User: Hello!
Assistant: Hi there! How can I help you today?
User: What's the weather like?
      `;
            const result = summarizeDesignDecisions({ conversationLog });
            expect(result.decisions).toBeDefined();
            expect(result.summary).toBeDefined();
        });
    });
    describe('project context', () => {
        it('should include project context in summary', () => {
            const result = summarizeDesignDecisions({
                conversationLog: 'I decided to use TypeScript.',
                projectContext: 'E-commerce platform'
            });
            expect(result.summary).toContain('E-commerce platform');
        });
    });
});
//# sourceMappingURL=summarizeDesignDecisions.test.js.map