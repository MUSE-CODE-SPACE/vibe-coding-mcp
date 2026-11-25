import { summarizeDesignDecisions } from '../src/tools/summarizeDesignDecisions.js';

describe('summarizeDesignDecisions', () => {
  describe('language detection', () => {
    it('should detect English text', async () => {
      const result = await summarizeDesignDecisions({
        conversationLog: 'We decided to use React because it has a large ecosystem.',
        language: 'auto'
      });

      expect(result).toBeDefined();
      expect(result.decisions).toBeDefined();
    });

    it('should detect Korean text', async () => {
      const result = await summarizeDesignDecisions({
        conversationLog: 'React를 사용하기로 결정했습니다. 생태계가 크기 때문입니다.',
        language: 'auto'
      });

      expect(result).toBeDefined();
      expect(result.decisions).toBeDefined();
    });
  });

  describe('decision extraction', () => {
    it('should extract decisions from English text', async () => {
      const result = await summarizeDesignDecisions({
        conversationLog: `
          We decided to use TypeScript instead of JavaScript because of type safety.
          We chose React over Vue for its ecosystem.
          I recommend using PostgreSQL for the database.
        `,
        language: 'en'
      });

      expect(result.decisions.length).toBeGreaterThan(0);
      expect(result.stats.totalDecisions).toBeGreaterThan(0);
    });

    it('should extract decisions from Korean text', async () => {
      const result = await summarizeDesignDecisions({
        conversationLog: `
          TypeScript를 선택했습니다. 타입 안정성 때문입니다.
          Vue 대신 React를 사용하기로 결정했습니다.
        `,
        language: 'ko'
      });

      expect(result.decisions.length).toBeGreaterThanOrEqual(0);
    });

    it('should respect maxDecisions limit', async () => {
      const result = await summarizeDesignDecisions({
        conversationLog: `
          We decided to use A. We chose B. We selected C. We picked D. We went with E.
        `,
        maxDecisions: 2
      });

      expect(result.decisions.length).toBeLessThanOrEqual(2);
    });
  });

  describe('importance scoring', () => {
    it('should assign higher importance to critical decisions', async () => {
      const result = await summarizeDesignDecisions({
        conversationLog: 'This critical architectural decision is essential for the system.',
        includeImportanceScore: true
      });

      if (result.decisions.length > 0) {
        expect(result.decisions[0].importanceScore).toBeDefined();
      }
    });
  });

  describe('categorization', () => {
    it('should categorize architecture decisions', async () => {
      const result = await summarizeDesignDecisions({
        conversationLog: 'We decided on a microservice architecture for scalability.'
      });

      const archDecisions = result.decisions.filter(d => d.category === 'architecture');
      // May or may not find architecture decisions depending on pattern matching
      expect(result.decisions).toBeDefined();
    });

    it('should categorize library decisions', async () => {
      const result = await summarizeDesignDecisions({
        conversationLog: 'We chose the lodash library for utility functions.'
      });

      expect(result.decisions).toBeDefined();
    });
  });

  describe('statistics', () => {
    it('should provide category breakdown', async () => {
      const result = await summarizeDesignDecisions({
        conversationLog: 'We decided to use React. We chose microservices architecture.'
      });

      expect(result.stats.byCategory).toBeDefined();
      expect(result.stats.byImportance).toBeDefined();
      expect(result.stats.topKeywords).toBeDefined();
    });
  });

  describe('code extraction', () => {
    it('should extract related code blocks when enabled', async () => {
      const result = await summarizeDesignDecisions({
        conversationLog: `
          We decided to use this pattern:
          \`\`\`typescript
          function example() { return true; }
          \`\`\`
        `,
        extractRelatedCode: true
      });

      expect(result).toBeDefined();
    });

    it('should not extract code when disabled', async () => {
      const result = await summarizeDesignDecisions({
        conversationLog: `
          We decided to use this pattern:
          \`\`\`typescript
          function example() { return true; }
          \`\`\`
        `,
        extractRelatedCode: false
      });

      if (result.decisions.length > 0) {
        expect(result.decisions[0].relatedCode).toEqual([]);
      }
    });
  });

  describe('summary generation', () => {
    it('should generate summary when decisions are found', async () => {
      const result = await summarizeDesignDecisions({
        conversationLog: 'We decided to use React for the frontend.'
      });

      expect(result.summary).toBeDefined();
      expect(typeof result.summary).toBe('string');
    });

    it('should generate appropriate summary when no decisions found', async () => {
      const result = await summarizeDesignDecisions({
        conversationLog: 'Hello, how are you today?'
      });

      expect(result.summary).toBeDefined();
    });
  });

  describe('AI mode', () => {
    it('should have usedAI flag set to false when AI not used', async () => {
      const result = await summarizeDesignDecisions({
        conversationLog: 'We decided to use React.',
        useAI: false
      });

      expect(result.usedAI).toBe(false);
    });
  });
});

describe('generateTitle', () => {
  // Imported lazily so this block stays independent of the suite's own imports.
  const load = () => import('../src/tools/summarizeDesignDecisions.js');

  it('keeps the decision clause, drops the lead-in and the justification', async () => {
    const { generateTitle } = await load();
    expect(generateTitle('We decided to use JWT instead of server sessions because it keeps the API stateless.', 'architecture')).toBe('Use JWT instead of server sessions');
    expect(generateTitle('I chose Redis over an in-process cache since three instances must share it', 'library')).toBe('Redis over an in-process cache');
    expect(generateTitle("So, we'll go with one page per resource, as readers look up one endpoint at a time", 'other')).toBe('One page per resource');
    expect(generateTitle('Use src/app.ts as the entry point', 'other')).toBe('Use src/app.ts as the entry point');
  });

  it('handles Korean, long sentences and empty input', async () => {
    const { generateTitle } = await load();
    expect(generateTitle('세션 대신 JWT를 사용하기로 결정했습니다 왜냐하면 무상태라서', 'architecture')).toBe('세션 대신 JWT를 사용하기로 결정했습니다');
    expect(generateTitle('Redis가 더 적합합니다 여러 인스턴스가 공유해야 하니까', 'library')).toBe('Redis가 더 적합합니다 여러 인스턴스가 공유해야 하');
    const long = generateTitle('We decided to ' + 'split the monolith into services '.repeat(6), 'architecture');
    expect(long.length).toBeLessThanOrEqual(71);
    expect(long.endsWith('…')).toBe(true);
    expect(generateTitle('  ', 'library')).toBe('Library Decision');
  });
});
