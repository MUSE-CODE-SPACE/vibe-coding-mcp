import { generateDevDocument } from '../tools/generateDevDocument.js';

describe('generateDevDocument', () => {
  describe('README generation', () => {
    it('should generate a basic README', () => {
      const result = generateDevDocument({
        documentType: 'README',
        title: 'Test Project',
        description: 'A test project description'
      });

      expect(result.document).toContain('# Test Project');
      expect(result.document).toContain('A test project description');
      expect(result.documentType).toBe('README');
      expect(result.generatedAt).toBeDefined();
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('should include table of contents when requested', () => {
      const result = generateDevDocument({
        documentType: 'README',
        title: 'Test',
        includeTableOfContents: true
      });

      expect(result.document).toContain('## Table of Contents');
    });

    it('should include features list', () => {
      const result = generateDevDocument({
        documentType: 'README',
        title: 'Test',
        features: ['Feature 1', 'Feature 2', 'Feature 3']
      });

      expect(result.document).toContain('## Features');
      expect(result.document).toContain('- Feature 1');
      expect(result.document).toContain('- Feature 2');
      expect(result.document).toContain('- Feature 3');
    });

    it('should include custom installation steps', () => {
      const result = generateDevDocument({
        documentType: 'README',
        title: 'Test',
        installation: {
          requirements: ['Node.js 18+', 'npm'],
          steps: ['npm install', 'npm run build']
        }
      });

      expect(result.document).toContain('npm install');
      expect(result.document).toContain('npm run build');
      expect(result.document).toContain('Node.js 18+');
    });

    it('should include badges', () => {
      const result = generateDevDocument({
        documentType: 'README',
        title: 'Test',
        badges: [
          { label: 'version', message: '1.0.0', color: 'blue' }
        ]
      });

      expect(result.document).toContain('img.shields.io');
    });

    it('should include API reference', () => {
      const result = generateDevDocument({
        documentType: 'README',
        title: 'Test',
        apiReference: [
          {
            name: 'myFunction',
            description: 'Does something',
            params: ['arg1: string', 'arg2: number'],
            returns: 'boolean'
          }
        ]
      });

      expect(result.document).toContain('`myFunction`');
      expect(result.document).toContain('Does something');
      expect(result.document).toContain('arg1: string');
      expect(result.document).toContain('**Returns:** boolean');
    });

    it('should include FAQ section', () => {
      const result = generateDevDocument({
        documentType: 'README',
        title: 'Test',
        faq: [
          { question: 'How does it work?', answer: 'It works well.' }
        ]
      });

      expect(result.document).toContain('## FAQ');
      expect(result.document).toContain('How does it work?');
      expect(result.document).toContain('It works well.');
    });
  });

  describe('Korean language support', () => {
    it('should use Korean headers when language is ko', () => {
      const result = generateDevDocument({
        documentType: 'README',
        title: '테스트 프로젝트',
        language: 'ko',
        features: ['기능 1']
      });

      expect(result.document).toContain('## 개요');
      expect(result.document).toContain('## 기능');
      expect(result.document).toContain('## 설치');
    });
  });

  describe('DESIGN document', () => {
    it('should generate a design document with metadata table', () => {
      const result = generateDevDocument({
        documentType: 'DESIGN',
        title: 'System Design',
        author: 'Test Author',
        version: '1.0'
      });

      expect(result.document).toContain('# System Design');
      expect(result.document).toContain('**Author**');
      expect(result.document).toContain('Test Author');
      expect(result.document).toContain('**Version**');
    });
  });

  describe('TUTORIAL document', () => {
    it('should generate a tutorial with steps', () => {
      const result = generateDevDocument({
        documentType: 'TUTORIAL',
        title: 'Getting Started',
        codeContexts: [
          {
            sessionId: '1',
            timestamp: new Date().toISOString(),
            codeBlocks: [{ language: 'bash', code: 'npm install' }],
            conversationSummary: 'First, install dependencies',
            tags: ['setup']
          }
        ]
      });

      expect(result.document).toContain('# Getting Started');
      expect(result.document).toContain('Step 1');
      expect(result.document).toContain('npm install');
    });
  });

  describe('CHANGELOG document', () => {
    it('should generate a changelog', () => {
      const result = generateDevDocument({
        documentType: 'CHANGELOG',
        version: '1.0.0',
        codeContexts: [
          {
            sessionId: '1',
            timestamp: new Date().toISOString(),
            codeBlocks: [],
            conversationSummary: 'Added new feature X'
          }
        ]
      });

      expect(result.document).toContain('# Changelog');
      expect(result.document).toContain('[1.0.0]');
      expect(result.document).toContain('Added new feature X');
    });
  });

  describe('output metadata', () => {
    it('should include sections list', () => {
      const result = generateDevDocument({
        documentType: 'README',
        title: 'Test'
      });

      expect(result.sections).toBeDefined();
      expect(result.sections.length).toBeGreaterThan(0);
    });

    it('should calculate word count', () => {
      const result = generateDevDocument({
        documentType: 'README',
        title: 'Test',
        description: 'This is a description with multiple words.'
      });

      expect(result.wordCount).toBeGreaterThan(10);
    });
  });
});
