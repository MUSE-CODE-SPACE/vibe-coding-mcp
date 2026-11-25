import { DesignDecision } from '../types/index.js';
import { generateId, getCurrentTimestamp } from '../utils/markdown.js';
import { isAIAvailable, analyzeWithAI, type AIAnalysisResult } from '../core/ai.js';

export interface SummarizeDesignDecisionsInput {
  conversationLog: string;
  projectContext?: string;
  language?: 'en' | 'ko' | 'auto';
  includeImportanceScore?: boolean;
  extractRelatedCode?: boolean;
  maxDecisions?: number;
  useAI?: boolean;  // New: Use Claude AI for enhanced analysis
}

export interface EnhancedDesignDecision extends DesignDecision {
  importance: 'high' | 'medium' | 'low';
  importanceScore: number;
  relatedCode?: string[];
  dependencies?: string[];
  tradeoffs?: string[];
  keywords: string[];
}

export interface SummarizeDesignDecisionsOutput {
  decisions: EnhancedDesignDecision[];
  summary: string;
  stats: {
    totalDecisions: number;
    byCategory: Record<string, number>;
    byImportance: Record<string, number>;
    topKeywords: string[];
  };
  // AI-enhanced fields (only present when useAI=true)
  aiInsights?: string[];
  aiRecommendations?: string[];
  usedAI?: boolean;
}

// 디자인 결정 카테고리 키워드 (영어 + 한국어)
const categoryKeywords: Record<DesignDecision['category'], { en: string[], ko: string[] }> = {
  architecture: {
    en: ['architecture', 'structure', 'layer', 'module', 'component', 'system', 'design', 'microservice', 'monolith', 'serverless'],
    ko: ['아키텍처', '구조', '레이어', '모듈', '컴포넌트', '시스템', '설계', '마이크로서비스']
  },
  implementation: {
    en: ['implement', 'code', 'function', 'method', 'algorithm', 'logic', 'class', 'interface', 'type'],
    ko: ['구현', '코드', '함수', '메서드', '알고리즘', '로직', '클래스', '인터페이스', '타입']
  },
  library: {
    en: ['library', 'package', 'dependency', 'framework', 'sdk', 'api', 'npm', 'pip', 'cargo', 'gem'],
    ko: ['라이브러리', '패키지', '의존성', '프레임워크', '라이브러리 선택']
  },
  pattern: {
    en: ['pattern', 'strategy', 'factory', 'singleton', 'observer', 'mvc', 'mvvm', 'repository', 'decorator', 'adapter'],
    ko: ['패턴', '전략', '팩토리', '싱글톤', '옵저버', '디자인패턴']
  },
  other: { en: [], ko: [] }
};

// 결정 패턴 (영어 + 한국어)
const decisionPatterns = {
  en: [
    /(?:decided|chose|selected|picked|went with|using|implemented|opted for|settled on)\s+(.+?)(?:\.|$)/gi,
    /(?:we(?:'ll| will)?|I(?:'ll| will)?)\s+(?:use|go with|implement|choose)\s+(.+?)(?:\.|$)/gi,
    /(?:the (?:best|right|better) (?:choice|option|approach) is)\s+(.+?)(?:\.|$)/gi,
    /(?:let's|we should|I recommend)\s+(?:use|go with|implement)\s+(.+?)(?:\.|$)/gi
  ],
  ko: [
    /(.+?)(?:을|를|으로|로)\s*(?:선택|결정|사용|채택|적용)(?:했|하기로|할)/gi,
    /(.+?)(?:이|가)\s*(?:더 낫|적합|좋|맞)/gi,
    /(?:결정|선택):\s*(.+?)(?:\.|$)/gi,
    /(.+?)(?:을|를)\s*(?:쓰기로|쓰겠)/gi
  ]
};

// 이유 패턴
const rationalePatterns = {
  en: [
    /because\s+(.+?)(?:\.|$)/i,
    /since\s+(.+?)(?:\.|$)/i,
    /(?:the reason|rationale)(?:\s+is)?:?\s*(.+?)(?:\.|$)/i,
    /due to\s+(.+?)(?:\.|$)/i,
    /as\s+(.+?)(?:\.|$)/i,
    /(?:this|it) (?:allows?|enables?|provides?|offers?)\s+(.+?)(?:\.|$)/i
  ],
  ko: [
    /(?:왜냐하면|이유는?|때문에)\s*(.+?)(?:\.|$)/i,
    /(.+?)(?:이기 때문|라서|니까)/i,
    /(?:장점|이점)(?:은|이)?\s*(.+?)(?:\.|$)/i
  ]
};

// 대안 패턴
const alternativePatterns = {
  en: [
    /instead of\s+(.+?)(?:\.|,|$)/gi,
    /rather than\s+(.+?)(?:\.|,|$)/gi,
    /over\s+(.+?)(?:\.|,|but|$)/gi,
    /(?:not|didn't choose|avoided)\s+(.+?)(?:\.|,|$)/gi,
    /compared to\s+(.+?)(?:\.|,|$)/gi
  ],
  ko: [
    /(.+?)(?:대신|말고)/gi,
    /(.+?)(?:보다|보단)\s*(?:낫|좋|적합)/gi,
    /(.+?)(?:은|는)\s*(?:안|않)/gi
  ]
};

// 트레이드오프 패턴
const tradeoffPatterns = {
  en: [
    /(?:trade-?off|downside|drawback|con)(?:\s+is)?:?\s*(.+?)(?:\.|$)/gi,
    /(?:but|however|although)\s+(.+?)(?:\.|$)/gi,
    /(?:at the cost of|sacrifice)\s+(.+?)(?:\.|$)/gi
  ],
  ko: [
    /(?:단점|트레이드오프|대가)(?:은|는|이)?\s*(.+?)(?:\.|$)/gi,
    /(?:하지만|그러나|다만)\s*(.+?)(?:\.|$)/gi
  ]
};

// 코드 블록 추출 (함수 내에서 새 regex 생성)

/**
 * Detects the primary language of the given text
 * @param text - The text to analyze
 * @returns 'ko' if Korean characters make up more than 10% of the text, 'en' otherwise
 */
function detectLanguage(text: string): 'en' | 'ko' {
  const koreanCount = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;

  return koreanCount / totalChars > 0.1 ? 'ko' : 'en';
}

/**
 * Infers the design decision category based on keywords in the text
 * @param text - The decision text to analyze
 * @param lang - The language of the text ('en' or 'ko')
 * @returns The inferred category (architecture, implementation, library, pattern, or other)
 */
function inferCategory(text: string, lang: 'en' | 'ko'): DesignDecision['category'] {
  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === 'other') continue;
    const langKeywords = keywords[lang] || keywords.en;
    if (langKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      return category as DesignDecision['category'];
    }
  }

  return 'other';
}

/**
 * Calculates the importance score of a design decision
 * @param decision - The decision text
 * @param fullText - The full conversation text for context
 * @returns An object containing the importance level and numeric score (0-100)
 */
function calculateImportance(decision: string, fullText: string): { level: 'high' | 'medium' | 'low', score: number } {
  let score = 50; // 기본 점수

  // 강조 표현
  const highImportancePatterns = [
    /critical|crucial|essential|must|required|key|important|major|significant/i,
    /핵심|중요|필수|반드시|꼭/
  ];

  const mediumImportancePatterns = [
    /should|recommend|prefer|better|good|nice/i,
    /좋|권장|추천/
  ];

  for (const pattern of highImportancePatterns) {
    if (pattern.test(decision)) score += 30;
  }

  for (const pattern of mediumImportancePatterns) {
    if (pattern.test(decision)) score += 15;
  }

  // 본문에서 언급 횟수
  const mentionCount = (fullText.match(new RegExp(decision.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
  score += Math.min(mentionCount * 5, 20);

  // 정규화
  score = Math.min(Math.max(score, 0), 100);

  let level: 'high' | 'medium' | 'low';
  if (score >= 70) level = 'high';
  else if (score >= 40) level = 'medium';
  else level = 'low';

  return { level, score };
}

// 제목 생성
/** Lead-ins that announce a decision without being part of it ("We decided to …"). */
const TITLE_LEAD_IN =
  /^(?:(?:so|and|then|ok|okay|well)[,\s]+)?(?:we|i|let's|lets)(?:'ll|'ve|'d|\s+will|\s+have|\s+should)?\s+(?:(?:have|also|just)\s+)*(?:decided|chose|chosen|selected|picked|opted|settled|went|go|recommend)\s+(?:(?:to|for|on|with)\s+)?/i;

/** Where the decision ends and its justification begins. */
const TITLE_CUT =
  /\s+(?:because|since|so that|due to|given that)\b|,\s+(?:as|so|which)\b|[.;:—](?:\s|$)|\s+(?:왜냐하면|이유는)|\s*(?:때문|이라서|라서|니까|이므로|므로)/i;

/**
 * Title for a decision: the decision clause itself, without the lead-in
 * ("We decided to") and without the justification ("because …").
 * "We decided to use JWT instead of sessions because …" → "Use JWT instead of sessions".
 */
export function generateTitle(decision: string, category: string): string {
  const fallback = `${category.charAt(0).toUpperCase() + category.slice(1)} Decision`;
  let title = decision.replace(/\s+/g, ' ').trim();
  title = title.split(TITLE_CUT)[0].trim();
  title = title.replace(TITLE_LEAD_IN, '').replace(/^to\s+/i, '').trim();
  title = title.replace(/^[\s\-*>#`"'(]+|[\s,`"')]+$/g, '');
  if (title.length < 3) return fallback;

  const MAX = 70;
  if (title.length > MAX) {
    const cut = title.slice(0, MAX);
    const lastSpace = cut.lastIndexOf(' ');
    title = (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).replace(/[\s,]+$/, '') + '…';
  }
  return title.charAt(0).toUpperCase() + title.slice(1);
}

// 키워드 추출
function extractKeywords(text: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'or', 'if', 'because', 'until', 'while', 'this', 'that', 'these', 'those', 'it', 'its', 'we', 'our', 'i', 'my', 'you', 'your', 'he', 'his', 'she', 'her', 'they', 'their']);

  const wordCounts = text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

// 관련 코드 추출
function extractRelatedCode(text: string): string[] {
  const codes: string[] = [];
  const codeBlockPattern = /```[\w]*\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockPattern.exec(text)) !== null) {
    if (match[1]?.trim()) {
      codes.push(match[1].trim());
    }
  }

  return codes;
}

// 패턴 매칭 헬퍼
function matchPatterns(text: string, patterns: RegExp[]): string[] {
  const results: string[] = [];

  for (const pattern of patterns) {
    // 글로벌 플래그 제거하여 무한루프 방지
    const regex = new RegExp(pattern.source, pattern.flags.replace('g', ''));
    const match = regex.exec(text);
    if (match && match[1]?.trim()) {
      results.push(match[1].trim());
    }
  }

  return [...new Set(results)];
}

/**
 * Analyzes conversation logs to extract and summarize design decisions
 *
 * @param input - The input parameters
 * @param input.conversationLog - The conversation text to analyze
 * @param input.projectContext - Optional project context for better categorization
 * @param input.language - Language setting ('en', 'ko', or 'auto' for detection)
 * @param input.includeImportanceScore - Whether to include importance scoring
 * @param input.extractRelatedCode - Whether to extract related code blocks
 * @param input.maxDecisions - Maximum number of decisions to extract
 * @param input.useAI - Whether to use Claude AI for enhanced analysis
 * @returns Object containing decisions array, summary text, and statistics
 *
 * @example
 * const result = await summarizeDesignDecisions({
 *   conversationLog: "We decided to use React instead of Vue because...",
 *   language: 'auto',
 *   useAI: true
 * });
 */
export async function summarizeDesignDecisions(input: SummarizeDesignDecisionsInput): Promise<SummarizeDesignDecisionsOutput> {
  // If AI is requested and available, use AI-enhanced analysis
  if (input.useAI && isAIAvailable()) {
    return summarizeWithAI(input);
  }

  return summarizeWithPatterns(input);
}

/**
 * AI-enhanced design decision analysis using Claude
 */
async function summarizeWithAI(input: SummarizeDesignDecisionsInput): Promise<SummarizeDesignDecisionsOutput> {
  const lang = input.language === 'auto' || !input.language
    ? detectLanguage(input.conversationLog)
    : input.language;

  try {
    const aiResult = await analyzeWithAI(input.conversationLog, {
      projectContext: input.projectContext,
      language: lang,
      maxDecisions: input.maxDecisions || 10
    });

    // Convert AI decisions to EnhancedDesignDecision format
    const decisions: EnhancedDesignDecision[] = aiResult.decisions.map(d => ({
      id: generateId(),
      title: d.title,
      description: d.description,
      rationale: d.rationale,
      alternatives: d.alternatives,
      category: d.category,
      timestamp: getCurrentTimestamp(),
      importance: d.importance,
      importanceScore: d.importance === 'high' ? 85 : d.importance === 'medium' ? 55 : 25,
      tradeoffs: d.tradeoffs,
      keywords: d.relatedTopics || [],
      relatedCode: []
    }));

    // Calculate stats
    const byCategory: Record<string, number> = {};
    const byImportance: Record<string, number> = {};
    const allKeywords: string[] = [];

    for (const d of decisions) {
      byCategory[d.category] = (byCategory[d.category] || 0) + 1;
      byImportance[d.importance] = (byImportance[d.importance] || 0) + 1;
      allKeywords.push(...d.keywords);
    }

    const keywordCounts: Record<string, number> = {};
    for (const kw of allKeywords) {
      keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
    }
    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([kw]) => kw);

    return {
      decisions,
      summary: aiResult.summary,
      stats: {
        totalDecisions: decisions.length,
        byCategory,
        byImportance,
        topKeywords
      },
      aiInsights: aiResult.insights,
      aiRecommendations: aiResult.recommendations,
      usedAI: true
    };
  } catch (error) {
    // Fallback to pattern-based analysis if AI fails
    console.warn('AI analysis failed, falling back to pattern-based analysis:', error);
    const result = summarizeWithPatterns(input);
    return { ...result, usedAI: false };
  }
}

/**
 * Pattern-based design decision analysis (original implementation)
 */
function summarizeWithPatterns(input: SummarizeDesignDecisionsInput): SummarizeDesignDecisionsOutput {
  const lang = input.language === 'auto' || !input.language
    ? detectLanguage(input.conversationLog)
    : input.language;

  const patterns = decisionPatterns[lang] || decisionPatterns.en;
  const rationale = rationalePatterns[lang] || rationalePatterns.en;
  const alternatives = alternativePatterns[lang] || alternativePatterns.en;
  const tradeoffs = tradeoffPatterns[lang] || tradeoffPatterns.en;

  const decisions: EnhancedDesignDecision[] = [];
  const lines = input.conversationLog.split('\n').filter(line => line.trim());
  const relatedCodes = input.extractRelatedCode !== false
    ? extractRelatedCode(input.conversationLog)
    : [];

  // 결정 문장 찾기
  const decisionSentences: Set<string> = new Set();

  for (const line of lines) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      if (regex.test(line)) {
        decisionSentences.add(line.trim());
        break;
      }
    }
  }

  // 결정을 EnhancedDesignDecision으로 변환
  const maxDecisions = input.maxDecisions || 20;
  let count = 0;

  for (const sentence of decisionSentences) {
    if (count >= maxDecisions) break;

    const category = inferCategory(sentence, lang);
    const importance = calculateImportance(sentence, input.conversationLog);
    const extractedRationale = matchPatterns(sentence, rationale);
    const extractedAlternatives = matchPatterns(sentence, alternatives);
    const extractedTradeoffs = matchPatterns(sentence, tradeoffs);

    // 키워드 추출
    const keywords = sentence
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 5);

    decisions.push({
      id: generateId(),
      title: generateTitle(sentence, category),
      description: sentence,
      rationale: extractedRationale[0] || 'Rationale not explicitly stated',
      alternatives: extractedAlternatives,
      timestamp: getCurrentTimestamp(),
      category,
      importance: importance.level,
      importanceScore: importance.score,
      relatedCode: relatedCodes.filter(code =>
        keywords.some(kw => code.toLowerCase().includes(kw))
      ).slice(0, 2),
      tradeoffs: extractedTradeoffs,
      keywords
    });

    count++;
  }

  // 중요도 순으로 정렬
  decisions.sort((a, b) => b.importanceScore - a.importanceScore);

  // 통계 생성
  const byCategory: Record<string, number> = {};
  const byImportance: Record<string, number> = {};
  const allKeywords: string[] = [];

  for (const d of decisions) {
    byCategory[d.category] = (byCategory[d.category] || 0) + 1;
    byImportance[d.importance] = (byImportance[d.importance] || 0) + 1;
    allKeywords.push(...d.keywords);
  }

  // 상위 키워드 추출
  const keywordCounts: Record<string, number> = {};
  for (const kw of allKeywords) {
    keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
  }
  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([kw]) => kw);

  // 요약 생성
  let summary = '';
  if (decisions.length === 0) {
    summary = lang === 'ko'
      ? '대화에서 명시적인 디자인 결정을 찾지 못했습니다.'
      : 'No explicit design decisions were identified in the conversation.';
  } else {
    const highCount = byImportance['high'] || 0;
    summary = lang === 'ko'
      ? `총 ${decisions.length}개의 디자인 결정을 발견했습니다. 중요도 높음: ${highCount}개.\n주요 카테고리: ${Object.entries(byCategory).map(([k, v]) => `${k}(${v})`).join(', ')}`
      : `Found ${decisions.length} design decision(s). High importance: ${highCount}.\nCategories: ${Object.entries(byCategory).map(([k, v]) => `${k}(${v})`).join(', ')}`;

    if (input.projectContext) {
      summary += `\n\nProject Context: ${input.projectContext}`;
    }
  }

  return {
    decisions,
    summary,
    stats: {
      totalDecisions: decisions.length,
      byCategory,
      byImportance,
      topKeywords
    },
    usedAI: false
  };
}

export const summarizeDesignDecisionsSchema = {
  name: 'muse_summarize_design_decisions',
  description: 'Extracts and analyzes key architectural and design decisions from conversation logs. Supports both English and Korean, with importance scoring and keyword extraction. Set useAI=true for Claude-powered enhanced analysis.',
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
      },
      language: {
        type: 'string',
        enum: ['en', 'ko', 'auto'],
        description: 'Language of the conversation (default: auto-detect)'
      },
      includeImportanceScore: {
        type: 'boolean',
        description: 'Include importance scoring for each decision (default: true)'
      },
      extractRelatedCode: {
        type: 'boolean',
        description: 'Extract related code blocks (default: true)'
      },
      maxDecisions: {
        type: 'number',
        description: 'Maximum number of decisions to extract (default: 20)'
      },
      useAI: {
        type: 'boolean',
        description: 'Use Claude AI for enhanced analysis. Requires ANTHROPIC_API_KEY environment variable. (default: false)'
      }
    },
    required: ['conversationLog']
  }
};
