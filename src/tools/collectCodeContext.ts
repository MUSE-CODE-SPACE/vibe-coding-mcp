import { CodeBlock, CodeContext } from '../types/index.js';
import { generateId, getCurrentTimestamp, extractCodeBlocks } from '../utils/markdown.js';

export interface CollectCodeContextInput {
  codeBlocks?: CodeBlock[];
  rawText?: string;
  conversationSummary: string;
  tags?: string[];
}

export interface CollectCodeContextOutput {
  context: CodeContext;
}

export function collectCodeContext(input: CollectCodeContextInput): CollectCodeContextOutput {
  let blocks: CodeBlock[] = [];

  // 직접 제공된 코드 블록이 있으면 사용
  if (input.codeBlocks && input.codeBlocks.length > 0) {
    blocks = input.codeBlocks;
  }
  // rawText가 있으면 코드 블록 추출
  else if (input.rawText) {
    blocks = extractCodeBlocks(input.rawText);
  }

  const context: CodeContext = {
    sessionId: generateId(),
    timestamp: getCurrentTimestamp(),
    codeBlocks: blocks,
    conversationSummary: input.conversationSummary,
    tags: input.tags
  };

  return { context };
}

export const collectCodeContextSchema = {
  name: 'collect_code_context',
  description: 'Collects code blocks and conversation summaries into a structured context for documentation.',
  inputSchema: {
    type: 'object',
    properties: {
      codeBlocks: {
        type: 'array',
        description: 'Array of code blocks with language and code content',
        items: {
          type: 'object',
          properties: {
            language: { type: 'string', description: 'Programming language' },
            code: { type: 'string', description: 'Code content' },
            filename: { type: 'string', description: 'Optional filename' },
            description: { type: 'string', description: 'Optional description' }
          },
          required: ['language', 'code']
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
        description: 'Optional tags for categorization'
      }
    },
    required: ['conversationSummary']
  }
};
