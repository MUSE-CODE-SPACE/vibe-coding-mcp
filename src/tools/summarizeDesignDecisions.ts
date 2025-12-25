import { DesignDecision } from '../types/index.js';
import { generateId, getCurrentTimestamp } from '../utils/markdown.js';

export interface SummarizeDesignDecisionsInput {
  conversationLog: string;
  projectContext?: string;
}

export interface SummarizeDesignDecisionsOutput {
  decisions: DesignDecision[];
  summary: string;
}

// 디자인 결정 카테고리 키워드
const categoryKeywords: Record<DesignDecision['category'], string[]> = {
  architecture: ['architecture', 'structure', 'layer', 'module', 'component', 'system', 'design'],
  implementation: ['implement', 'code', 'function', 'method', 'algorithm', 'logic'],
  library: ['library', 'package', 'dependency', 'framework', 'sdk', 'api'],
  pattern: ['pattern', 'strategy', 'factory', 'singleton', 'observer', 'mvc', 'mvvm'],
  other: []
};

// 텍스트에서 카테고리 추론
function inferCategory(text: string): DesignDecision['category'] {
  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === 'other') continue;
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category as DesignDecision['category'];
    }
  }

  return 'other';
}

// 결정 패턴 매칭
const decisionPatterns = [
  /(?:decided|chose|selected|picked|went with|using|implemented)\s+(.+?)(?:\.|$)/gi,
  /(?:because|since|as)\s+(.+?)(?:\.|$)/gi,
  /(?:instead of|rather than|over)\s+(.+?)(?:\.|$)/gi,
  /(?:the reason|rationale|why)(?:\s+is)?\s*:?\s*(.+?)(?:\.|$)/gi
];

export function summarizeDesignDecisions(input: SummarizeDesignDecisionsInput): SummarizeDesignDecisionsOutput {
  const decisions: DesignDecision[] = [];
  const lines = input.conversationLog.split('\n').filter(line => line.trim());

  // 결정 관련 문장 찾기
  const decisionSentences: string[] = [];

  for (const line of lines) {
    for (const pattern of decisionPatterns) {
      const matches = line.match(pattern);
      if (matches) {
        decisionSentences.push(line.trim());
        break;
      }
    }
  }

  // 유니크한 결정들을 DesignDecision으로 변환
  const uniqueDecisions = [...new Set(decisionSentences)];

  for (let i = 0; i < uniqueDecisions.length; i++) {
    const sentence = uniqueDecisions[i];

    decisions.push({
      id: generateId(),
      title: `Decision ${i + 1}`,
      description: sentence,
      rationale: extractRationale(sentence, input.conversationLog),
      alternatives: extractAlternatives(sentence, input.conversationLog),
      timestamp: getCurrentTimestamp(),
      category: inferCategory(sentence)
    });
  }

  // 전체 요약 생성
  const summary = generateSummary(decisions, input.projectContext);

  return { decisions, summary };
}

function extractRationale(decision: string, fullText: string): string {
  const rationalePatterns = [
    /because\s+(.+?)(?:\.|$)/i,
    /since\s+(.+?)(?:\.|$)/i,
    /the reason is\s+(.+?)(?:\.|$)/i
  ];

  for (const pattern of rationalePatterns) {
    const match = decision.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return 'Rationale not explicitly stated';
}

function extractAlternatives(decision: string, fullText: string): string[] {
  const alternatives: string[] = [];
  const altPatterns = [
    /instead of\s+(.+?)(?:\.|,|$)/gi,
    /rather than\s+(.+?)(?:\.|,|$)/gi,
    /over\s+(.+?)(?:\.|,|$)/gi
  ];

  for (const pattern of altPatterns) {
    const matches = decision.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        alternatives.push(match[1].trim());
      }
    }
  }

  return alternatives;
}

function generateSummary(decisions: DesignDecision[], projectContext?: string): string {
  if (decisions.length === 0) {
    return 'No explicit design decisions were identified in the conversation.';
  }

  const categories = decisions.reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let summary = `Found ${decisions.length} design decision(s).\n`;
  summary += `Categories: ${Object.entries(categories).map(([k, v]) => `${k}: ${v}`).join(', ')}`;

  if (projectContext) {
    summary += `\n\nProject Context: ${projectContext}`;
  }

  return summary;
}

export const summarizeDesignDecisionsSchema = {
  name: 'summarize_design_decisions',
  description: 'Extracts key architectural and design decisions from conversation logs.',
  inputSchema: {
    type: 'object',
    properties: {
      conversationLog: {
        type: 'string',
        description: 'The full conversation log text to analyze'
      },
      projectContext: {
        type: 'string',
        description: 'Optional context about the project for better categorization'
      }
    },
    required: ['conversationLog']
  }
};
