import Anthropic from '@anthropic-ai/sdk';
import { logger } from './logger.js';
const aiLogger = logger.child({ tool: 'ai' });
let anthropicClient = null;
/**
 * Initialize the Anthropic client
 */
export function initializeAI() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        aiLogger.warn('ANTHROPIC_API_KEY not set. AI features will be disabled.');
        return false;
    }
    try {
        anthropicClient = new Anthropic({ apiKey });
        aiLogger.info('Anthropic client initialized successfully');
        return true;
    }
    catch (error) {
        aiLogger.error('Failed to initialize Anthropic client', error);
        return false;
    }
}
/**
 * Check if AI features are available
 */
export function isAIAvailable() {
    return anthropicClient !== null;
}
/**
 * Get the Anthropic client instance
 */
export function getAnthropicClient() {
    return anthropicClient;
}
/**
 * Use Claude AI to analyze conversation and extract design decisions
 */
export async function analyzeWithAI(conversationLog, options = {}) {
    if (!anthropicClient) {
        throw new Error('Anthropic client not initialized. Set ANTHROPIC_API_KEY environment variable.');
    }
    const { projectContext, language = 'en', maxDecisions = 10 } = options;
    const systemPrompt = language === 'ko'
        ? `당신은 소프트웨어 설계 결정을 분석하는 전문가입니다.
대화 로그를 분석하여 설계 결정을 추출하고 구조화된 JSON으로 반환하세요.

반드시 다음 JSON 형식으로만 응답하세요:
{
  "decisions": [
    {
      "title": "결정 제목",
      "description": "상세 설명",
      "rationale": "결정 이유",
      "alternatives": ["고려된 대안들"],
      "category": "architecture|implementation|library|pattern|other",
      "importance": "high|medium|low",
      "tradeoffs": ["트레이드오프"],
      "relatedTopics": ["관련 주제"]
    }
  ],
  "summary": "전체 요약",
  "insights": ["핵심 인사이트"],
  "recommendations": ["추천 사항"]
}`
        : `You are an expert at analyzing software design decisions.
Analyze the conversation log and extract design decisions in structured JSON format.

Respond ONLY with JSON in this exact format:
{
  "decisions": [
    {
      "title": "Decision title",
      "description": "Detailed description",
      "rationale": "Reasoning behind the decision",
      "alternatives": ["Considered alternatives"],
      "category": "architecture|implementation|library|pattern|other",
      "importance": "high|medium|low",
      "tradeoffs": ["Trade-offs"],
      "relatedTopics": ["Related topics"]
    }
  ],
  "summary": "Overall summary",
  "insights": ["Key insights"],
  "recommendations": ["Recommendations"]
}`;
    const userPrompt = projectContext
        ? `Project Context: ${projectContext}\n\nConversation Log:\n${conversationLog}\n\nExtract up to ${maxDecisions} design decisions.`
        : `Conversation Log:\n${conversationLog}\n\nExtract up to ${maxDecisions} design decisions.`;
    try {
        aiLogger.info('Sending request to Claude API', {
            logLength: conversationLog.length,
            language,
            maxDecisions
        });
        const response = await anthropicClient.messages.create({
            model: 'claude-sonnet-5-5',
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt }
            ]
        });
        const content = response.content[0];
        if (content.type !== 'text') {
            throw new Error('Unexpected response type from Claude API');
        }
        // Parse JSON response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to extract JSON from Claude response');
        }
        const result = JSON.parse(jsonMatch[0]);
        aiLogger.info('AI analysis completed', {
            decisionsCount: result.decisions.length,
            hasInsights: result.insights?.length > 0
        });
        return result;
    }
    catch (error) {
        aiLogger.error('AI analysis failed', error);
        throw error;
    }
}
/**
 * Generate a summary using AI
 */
export async function generateAISummary(content, options) {
    if (!anthropicClient) {
        throw new Error('Anthropic client not initialized. Set ANTHROPIC_API_KEY environment variable.');
    }
    const { type, language = 'en', maxLength = 500 } = options;
    const prompts = {
        code: language === 'ko'
            ? `다음 코드를 분석하고 ${maxLength}자 이내로 요약하세요. 주요 기능, 구조, 패턴을 설명하세요.`
            : `Analyze the following code and summarize in ${maxLength} characters or less. Explain key functionality, structure, and patterns.`,
        conversation: language === 'ko'
            ? `다음 대화를 분석하고 ${maxLength}자 이내로 요약하세요. 주요 결정사항과 논의 내용을 포함하세요.`
            : `Analyze the following conversation and summarize in ${maxLength} characters or less. Include key decisions and discussion points.`,
        document: language === 'ko'
            ? `다음 문서를 ${maxLength}자 이내로 요약하세요.`
            : `Summarize the following document in ${maxLength} characters or less.`
    };
    try {
        const response = await anthropicClient.messages.create({
            model: 'claude-sonnet-5-5',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: `${prompts[type]}\n\n${content}`
                }
            ]
        });
        const textContent = response.content[0];
        if (textContent.type !== 'text') {
            throw new Error('Unexpected response type');
        }
        return textContent.text;
    }
    catch (error) {
        aiLogger.error('AI summary generation failed', error);
        throw error;
    }
}
/**
 * Analyze code and generate insights using AI
 */
export async function analyzeCodeWithAI(code, options = {}) {
    if (!anthropicClient) {
        throw new Error('Anthropic client not initialized. Set ANTHROPIC_API_KEY environment variable.');
    }
    const { language = 'unknown', analysisType = 'all', outputLanguage = 'en' } = options;
    const systemPrompt = outputLanguage === 'ko'
        ? `당신은 코드 분석 전문가입니다. 코드를 분석하고 JSON 형식으로 결과를 반환하세요.

JSON 형식:
{
  "summary": "코드 요약",
  "issues": [{"type": "타입", "severity": "high|medium|low", "description": "설명", "line": 라인번호}],
  "suggestions": ["개선 제안"],
  "metrics": {"복잡도": "값", "라인수": 숫자}
}`
        : `You are a code analysis expert. Analyze the code and return results in JSON format.

JSON format:
{
  "summary": "Code summary",
  "issues": [{"type": "type", "severity": "high|medium|low", "description": "description", "line": lineNumber}],
  "suggestions": ["improvement suggestions"],
  "metrics": {"complexity": "value", "lines": number}
}`;
    try {
        const response = await anthropicClient.messages.create({
            model: 'claude-sonnet-5-5',
            max_tokens: 2048,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: `Language: ${language}\nAnalysis type: ${analysisType}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``
                }
            ]
        });
        const textContent = response.content[0];
        if (textContent.type !== 'text') {
            throw new Error('Unexpected response type');
        }
        const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to extract JSON from response');
        }
        return JSON.parse(jsonMatch[0]);
    }
    catch (error) {
        aiLogger.error('AI code analysis failed', error);
        throw error;
    }
}
//# sourceMappingURL=ai.js.map