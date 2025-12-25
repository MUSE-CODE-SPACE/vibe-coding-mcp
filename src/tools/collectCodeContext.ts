import { CodeBlock, CodeContext } from '../types/index.js';
import { generateId, getCurrentTimestamp, extractCodeBlocks } from '../utils/markdown.js';

export interface CollectCodeContextInput {
  codeBlocks?: CodeBlock[];
  rawText?: string;
  conversationSummary: string;
  tags?: string[];
  autoDetectLanguage?: boolean;
  removeDuplicates?: boolean;
  includeStats?: boolean;
}

export interface CodeStats {
  totalBlocks: number;
  totalLines: number;
  languageBreakdown: Record<string, number>;
  averageLinesPerBlock: number;
}

export interface CollectCodeContextOutput {
  context: CodeContext;
  stats?: CodeStats;
  warnings?: string[];
}

// 언어 감지를 위한 패턴
const languagePatterns: Record<string, RegExp[]> = {
  typescript: [
    /^import\s+.*\s+from\s+['"].*['"];?$/m,
    /:\s*(string|number|boolean|any|void|never)\b/,
    /interface\s+\w+/,
    /type\s+\w+\s*=/,
    /<\w+>/
  ],
  javascript: [
    /^const\s+\w+\s*=/m,
    /^let\s+\w+\s*=/m,
    /^function\s+\w+\s*\(/m,
    /=>\s*{/,
    /require\s*\(/
  ],
  python: [
    /^def\s+\w+\s*\(/m,
    /^class\s+\w+.*:/m,
    /^import\s+\w+$/m,
    /^from\s+\w+\s+import/m,
    /:\s*$/m
  ],
  java: [
    /public\s+(class|interface|enum)/,
    /private\s+\w+\s+\w+;/,
    /System\.out\.println/,
    /@Override/
  ],
  go: [
    /^package\s+\w+$/m,
    /^func\s+\w+\s*\(/m,
    /^import\s+\(/m,
    /:=\s*/
  ],
  rust: [
    /^fn\s+\w+/m,
    /^use\s+\w+/m,
    /^let\s+mut\s+/m,
    /impl\s+\w+/,
    /->.*{$/m
  ],
  sql: [
    /^SELECT\s+/im,
    /^INSERT\s+INTO/im,
    /^CREATE\s+TABLE/im,
    /^UPDATE\s+\w+\s+SET/im
  ],
  html: [
    /^<!DOCTYPE\s+html>/i,
    /<html.*>/i,
    /<div.*>/i,
    /<\/\w+>/
  ],
  css: [
    /^\s*\.\w+\s*{/m,
    /^\s*#\w+\s*{/m,
    /:\s*(flex|grid|block|none);/,
    /@media\s+/
  ],
  json: [
    /^\s*{\s*".*":/m,
    /^\s*\[\s*{/m
  ],
  yaml: [
    /^\w+:\s*$/m,
    /^\s+-\s+\w+:/m
  ],
  bash: [
    /^#!/,
    /^\s*echo\s+/m,
    /\$\{?\w+\}?/,
    /^\s*if\s+\[/m
  ],
  markdown: [
    /^#\s+/m,
    /^\*\*.*\*\*/m,
    /^\[.*\]\(.*\)/m
  ]
};

// 언어 자동 감지
function detectLanguage(code: string): string {
  const scores: Record<string, number> = {};

  for (const [lang, patterns] of Object.entries(languagePatterns)) {
    scores[lang] = 0;
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        scores[lang]++;
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'text';

  const detectedLang = Object.entries(scores).find(([, score]) => score === maxScore);
  return detectedLang ? detectedLang[0] : 'text';
}

// 파일명 추론
function inferFilename(code: string, language: string): string | undefined {
  const extensions: Record<string, string> = {
    typescript: '.ts',
    javascript: '.js',
    python: '.py',
    java: '.java',
    go: '.go',
    rust: '.rs',
    sql: '.sql',
    html: '.html',
    css: '.css',
    json: '.json',
    yaml: '.yaml',
    bash: '.sh',
    markdown: '.md'
  };

  // 클래스나 함수명에서 파일명 추론
  const classMatch = code.match(/(?:class|interface)\s+(\w+)/);
  if (classMatch) {
    return classMatch[1] + (extensions[language] || '.txt');
  }

  const funcMatch = code.match(/(?:function|def|fn|func)\s+(\w+)/);
  if (funcMatch) {
    return funcMatch[1] + (extensions[language] || '.txt');
  }

  return undefined;
}

// 코드 블록 해시 생성 (중복 체크용)
function hashCode(code: string): string {
  const normalized = code.trim().replace(/\s+/g, ' ');
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// 중복 제거
function removeDuplicateBlocks(blocks: CodeBlock[]): CodeBlock[] {
  const seen = new Set<string>();
  return blocks.filter(block => {
    const hash = hashCode(block.code);
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });
}

// 통계 계산
function calculateStats(blocks: CodeBlock[]): CodeStats {
  const languageBreakdown: Record<string, number> = {};
  let totalLines = 0;

  for (const block of blocks) {
    const lines = block.code.split('\n').length;
    totalLines += lines;
    languageBreakdown[block.language] = (languageBreakdown[block.language] || 0) + 1;
  }

  return {
    totalBlocks: blocks.length,
    totalLines,
    languageBreakdown,
    averageLinesPerBlock: blocks.length > 0 ? Math.round(totalLines / blocks.length) : 0
  };
}

// 입력 검증
function validateInput(input: CollectCodeContextInput): string[] {
  const warnings: string[] = [];

  if (!input.conversationSummary || input.conversationSummary.trim().length === 0) {
    warnings.push('Conversation summary is empty');
  }

  if (!input.codeBlocks && !input.rawText) {
    warnings.push('No code blocks or raw text provided');
  }

  if (input.codeBlocks) {
    for (let i = 0; i < input.codeBlocks.length; i++) {
      const block = input.codeBlocks[i];
      if (!block.code || block.code.trim().length === 0) {
        warnings.push(`Code block ${i + 1} is empty`);
      }
    }
  }

  return warnings;
}

export function collectCodeContext(input: CollectCodeContextInput): CollectCodeContextOutput {
  const warnings = validateInput(input);
  let blocks: CodeBlock[] = [];

  // 직접 제공된 코드 블록이 있으면 사용
  if (input.codeBlocks && input.codeBlocks.length > 0) {
    blocks = input.codeBlocks.map(block => ({
      ...block,
      language: block.language || (input.autoDetectLanguage !== false ? detectLanguage(block.code) : 'text'),
      filename: block.filename || inferFilename(block.code, block.language || 'text')
    }));
  }
  // rawText가 있으면 코드 블록 추출
  else if (input.rawText) {
    const extracted = extractCodeBlocks(input.rawText);
    blocks = extracted.map(block => ({
      ...block,
      language: block.language || (input.autoDetectLanguage !== false ? detectLanguage(block.code) : 'text'),
      filename: block.filename || inferFilename(block.code, block.language || 'text')
    }));
  }

  // 중복 제거
  if (input.removeDuplicates !== false && blocks.length > 0) {
    const originalCount = blocks.length;
    blocks = removeDuplicateBlocks(blocks);
    if (blocks.length < originalCount) {
      warnings.push(`Removed ${originalCount - blocks.length} duplicate code block(s)`);
    }
  }

  // 태그 자동 추출 (언어 기반)
  const autoTags = new Set<string>(input.tags || []);
  for (const block of blocks) {
    if (block.language && block.language !== 'text') {
      autoTags.add(block.language);
    }
  }

  const context: CodeContext = {
    sessionId: generateId(),
    timestamp: getCurrentTimestamp(),
    codeBlocks: blocks,
    conversationSummary: input.conversationSummary?.trim() || '',
    tags: Array.from(autoTags)
  };

  const result: CollectCodeContextOutput = { context };

  // 통계 포함
  if (input.includeStats !== false && blocks.length > 0) {
    result.stats = calculateStats(blocks);
  }

  if (warnings.length > 0) {
    result.warnings = warnings;
  }

  return result;
}

export const collectCodeContextSchema = {
  name: 'muse_collect_code_context',
  description: 'Collects code blocks and conversation summaries into a structured context for documentation. Supports automatic language detection, duplicate removal, and statistics.',
  inputSchema: {
    type: 'object',
    properties: {
      codeBlocks: {
        type: 'array',
        description: 'Array of code blocks with language and code content',
        items: {
          type: 'object',
          properties: {
            language: { type: 'string', description: 'Programming language (auto-detected if not provided)' },
            code: { type: 'string', description: 'Code content' },
            filename: { type: 'string', description: 'Optional filename (auto-inferred if not provided)' },
            description: { type: 'string', description: 'Optional description of the code' }
          },
          required: ['code']
        }
      },
      rawText: {
        type: 'string',
        description: 'Raw text containing code blocks to extract (alternative to codeBlocks)'
      },
      conversationSummary: {
        type: 'string',
        description: 'Summary of the conversation or context'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional tags for categorization (language tags auto-added)'
      },
      autoDetectLanguage: {
        type: 'boolean',
        description: 'Automatically detect programming language (default: true)'
      },
      removeDuplicates: {
        type: 'boolean',
        description: 'Remove duplicate code blocks (default: true)'
      },
      includeStats: {
        type: 'boolean',
        description: 'Include code statistics in output (default: true)'
      }
    },
    required: ['conversationSummary']
  }
};
