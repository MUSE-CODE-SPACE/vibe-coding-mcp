#!/usr/bin/env node
/**
 * Direct tool testing script
 * Run: npm run build && node scripts/test-tools.mjs
 */

import { collectCodeContext } from '../dist/tools/collectCodeContext.js';
import { generateDevDocument } from '../dist/tools/generateDevDocument.js';
import { normalizeForPlatform } from '../dist/tools/normalizeForPlatform.js';
import { summarizeDesignDecisions } from '../dist/tools/summarizeDesignDecisions.js';
import { publishDocument } from '../dist/tools/publishDocument.js';
import { createSessionLog } from '../dist/tools/createSessionLog.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${GREEN}✓${RESET} ${name}`);
    passed++;
  } catch (error) {
    console.log(`${RED}✗${RESET} ${name}`);
    console.log(`  ${RED}Error: ${error.message}${RESET}`);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`${GREEN}✓${RESET} ${name}`);
    passed++;
  } catch (error) {
    console.log(`${RED}✗${RESET} ${name}`);
    console.log(`  ${RED}Error: ${error.message}${RESET}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('\n📦 Testing collectCodeContext...\n');

test('should create context with code blocks', () => {
  const result = collectCodeContext({
    codeBlocks: [{ language: 'typescript', code: 'const x = 1;' }],
    conversationSummary: 'Test summary'
  });
  assert(result.context !== undefined, 'context should be defined');
  assert(result.context.codeBlocks.length === 1, 'should have 1 code block');
});

test('should auto-detect language', () => {
  const result = collectCodeContext({
    codeBlocks: [{ language: '', code: 'interface User { name: string; }' }],
    conversationSummary: 'Test'
  });
  assert(result.context.codeBlocks[0].language === 'typescript', 'should detect TypeScript');
});

test('should remove duplicates', () => {
  const result = collectCodeContext({
    codeBlocks: [
      { language: 'js', code: 'const x = 1;' },
      { language: 'js', code: 'const x = 1;' }
    ],
    conversationSummary: 'Test',
    removeDuplicates: true
  });
  assert(result.context.codeBlocks.length === 1, 'should have 1 block after dedup');
});

console.log('\n📄 Testing generateDevDocument...\n');

test('should generate README', () => {
  const result = generateDevDocument({
    documentType: 'README',
    title: 'Test Project',
    description: 'A test description'
  });
  assert(result.document.includes('# Test Project'), 'should have title');
  assert(result.document.includes('A test description'), 'should have description');
});

test('should generate Korean README', () => {
  const result = generateDevDocument({
    documentType: 'README',
    title: '테스트 프로젝트',
    language: 'ko',
    features: ['기능 1']
  });
  assert(result.document.includes('## 개요'), 'should have Korean headers');
});

test('should include features', () => {
  const result = generateDevDocument({
    documentType: 'README',
    title: 'Test',
    features: ['Feature A', 'Feature B']
  });
  assert(result.document.includes('Feature A'), 'should include features');
});

console.log('\n🔄 Testing normalizeForPlatform...\n');

test('should convert for Notion', () => {
  const result = normalizeForPlatform({
    document: '- [ ] Todo\n- [x] Done',
    platform: 'notion'
  });
  assert(result.normalizedDocument.includes('☐') || result.normalizedDocument.includes('☑'), 'should convert checkboxes');
});

test('should convert for GitHub Wiki', () => {
  const result = normalizeForPlatform({
    document: '[[Page Name]]',
    platform: 'github-wiki',
    options: { preserveLocalLinks: false }
  });
  assert(result.normalizedDocument.includes('[Page Name]'), 'should convert wiki links');
});

test('should add Obsidian frontmatter', () => {
  const result = normalizeForPlatform({
    document: '# Test',
    platform: 'obsidian',
    options: { addFrontmatter: true }
  });
  assert(result.normalizedDocument.includes('---'), 'should have frontmatter');
});

console.log('\n🔍 Testing summarizeDesignDecisions...\n');

test('should extract decisions', () => {
  const result = summarizeDesignDecisions({
    conversationLog: 'I decided to use TypeScript because of type safety.'
  });
  assert(result.decisions !== undefined, 'should have decisions array');
  assert(result.stats !== undefined, 'should have stats');
});

test('should handle empty log', () => {
  const result = summarizeDesignDecisions({ conversationLog: '' });
  assert(result.decisions.length === 0, 'should have no decisions');
});

test('should include project context', () => {
  const result = summarizeDesignDecisions({
    conversationLog: 'I decided to use TypeScript.',
    projectContext: 'E-commerce platform'
  });
  assert(result.summary.includes('E-commerce platform'), 'should include context');
});

console.log('\n📤 Testing publishDocument...\n');

await asyncTest('should publish to Notion (returns result)', async () => {
  const result = await publishDocument({
    document: '# Test',
    title: 'Test',
    platform: 'notion'
  });
  assert(result.result !== undefined, 'should have result');
  assert(result.result.platform === 'notion', 'should be notion platform');
});

await asyncTest('should publish to Obsidian', async () => {
  const result = await publishDocument({
    document: '# Test',
    title: 'Test',
    platform: 'obsidian'
  });
  assert(result.result.platform === 'obsidian', 'should be obsidian platform');
});

await asyncTest('should handle unsupported platform', async () => {
  const result = await publishDocument({
    document: '# Test',
    title: 'Test',
    platform: 'unknown'
  });
  assert(result.result.success === false, 'should fail for unknown platform');
});

console.log('\n📝 Testing createSessionLog...\n');

await asyncTest('should create session log', async () => {
  const result = await createSessionLog({
    title: 'Test Session',
    summary: 'Test summary'
  });
  assert(result.sessionLog !== undefined, 'should have sessionLog');
  assert(result.content !== undefined, 'should have content');
  assert(result.sessionLog.title === 'Test Session', 'should have correct title');
});

await asyncTest('should create JSON format', async () => {
  const result = await createSessionLog({
    title: 'Test',
    summary: 'Summary',
    options: { logType: 'session', format: 'json' }
  });
  const parsed = JSON.parse(result.content);
  assert(parsed.title === 'Test', 'should be valid JSON');
});

await asyncTest('should include tags', async () => {
  const result = await createSessionLog({
    title: 'Test',
    summary: 'Summary',
    tags: ['react', 'typescript']
  });
  assert(result.content.includes('#react'), 'should include tags');
});

console.log('\n' + '='.repeat(50));
console.log(`\n${YELLOW}Test Results:${RESET}`);
console.log(`  ${GREEN}Passed: ${passed}${RESET}`);
console.log(`  ${RED}Failed: ${failed}${RESET}`);
console.log(`  Total: ${passed + failed}\n`);

if (failed > 0) {
  process.exit(1);
}
