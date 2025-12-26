/**
 * AI Auto-tagging Tool (v2.10)
 * Automatically suggests and applies tags to sessions based on content analysis
 */
import { createToolLogger } from '../core/logger.js';
import { getSession, updateSession } from '../core/sessionStorage.js';
import { isAIAvailable, getAnthropicClient } from '../core/ai.js';
const logger = createToolLogger('autoTag');
// Default patterns for tag detection
const DEFAULT_PATTERNS = [
    // Language patterns
    { patterns: [/typescript|\.ts\b/i], tags: ['typescript'], category: 'language' },
    { patterns: [/javascript|\.js\b/i], tags: ['javascript'], category: 'language' },
    { patterns: [/python|\.py\b/i], tags: ['python'], category: 'language' },
    { patterns: [/go\s+|golang|\.go\b/i], tags: ['go'], category: 'language' },
    { patterns: [/rust|\.rs\b/i], tags: ['rust'], category: 'language' },
    { patterns: [/react|jsx|tsx/i], tags: ['react'], category: 'framework' },
    { patterns: [/vue|\.vue\b/i], tags: ['vue'], category: 'framework' },
    { patterns: [/angular/i], tags: ['angular'], category: 'framework' },
    { patterns: [/next\.?js|nextjs/i], tags: ['nextjs'], category: 'framework' },
    { patterns: [/express/i], tags: ['express'], category: 'framework' },
    { patterns: [/fastapi/i], tags: ['fastapi'], category: 'framework' },
    // Concept patterns
    { patterns: [/auth|authentication|login|oauth|jwt/i], tags: ['authentication'], category: 'feature' },
    { patterns: [/api|endpoint|rest|graphql/i], tags: ['api'], category: 'feature' },
    { patterns: [/database|sql|mongodb|postgres|mysql/i], tags: ['database'], category: 'feature' },
    { patterns: [/test|testing|jest|pytest|unittest/i], tags: ['testing'], category: 'practice' },
    { patterns: [/deploy|ci\/cd|docker|kubernetes/i], tags: ['devops'], category: 'practice' },
    { patterns: [/security|vulnerability|xss|csrf|injection/i], tags: ['security'], category: 'concern' },
    { patterns: [/performance|optimization|cache|speed/i], tags: ['performance'], category: 'concern' },
    { patterns: [/refactor|clean\s*code|improve/i], tags: ['refactoring'], category: 'activity' },
    { patterns: [/bug|fix|issue|error|debug/i], tags: ['bugfix'], category: 'activity' },
    { patterns: [/feature|implement|add|new/i], tags: ['feature'], category: 'activity' },
    { patterns: [/design|architecture|pattern|structure/i], tags: ['design'], category: 'activity' },
    { patterns: [/documentation|readme|docs/i], tags: ['documentation'], category: 'activity' },
    // Korean patterns
    { patterns: [/인증|로그인|OAuth/i], tags: ['authentication'], category: 'feature' },
    { patterns: [/데이터베이스|DB|쿼리/i], tags: ['database'], category: 'feature' },
    { patterns: [/테스트|검증/i], tags: ['testing'], category: 'practice' },
    { patterns: [/배포|CI\/CD/i], tags: ['devops'], category: 'practice' },
    { patterns: [/보안|취약점/i], tags: ['security'], category: 'concern' },
    { patterns: [/성능|최적화|캐시/i], tags: ['performance'], category: 'concern' },
    { patterns: [/리팩토링|개선/i], tags: ['refactoring'], category: 'activity' },
    { patterns: [/버그|수정|오류/i], tags: ['bugfix'], category: 'activity' },
    { patterns: [/기능|구현|추가/i], tags: ['feature'], category: 'activity' },
    { patterns: [/설계|아키텍처|패턴/i], tags: ['design'], category: 'activity' },
];
// In-memory config storage (in real implementation, this would be persisted)
let tagConfig = {
    enableAutoTag: true,
    defaultCategories: ['language', 'framework', 'feature', 'practice', 'concern', 'activity'],
    customPatterns: [],
};
// Pattern-based tag detection
function detectTagsFromContent(content, codeBlocks, categories) {
    const suggestions = [];
    const foundTags = new Set();
    // Combine all text for analysis
    let fullText = content;
    if (codeBlocks) {
        codeBlocks.forEach((cb) => {
            if (cb.language)
                fullText += ` ${cb.language}`;
            if (cb.code)
                fullText += ` ${cb.code}`;
        });
    }
    // Check default patterns
    DEFAULT_PATTERNS.forEach(({ patterns, tags, category }) => {
        if (categories && !categories.includes(category))
            return;
        patterns.forEach((pattern) => {
            if (pattern.test(fullText)) {
                tags.forEach((tag) => {
                    if (!foundTags.has(tag)) {
                        foundTags.add(tag);
                        suggestions.push({
                            tag,
                            confidence: 0.8,
                            reason: `Detected from pattern: ${pattern.source}`,
                            category,
                        });
                    }
                });
            }
        });
    });
    // Check custom patterns
    tagConfig.customPatterns.forEach(({ pattern, tags }) => {
        try {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(fullText)) {
                tags.forEach((tag) => {
                    if (!foundTags.has(tag)) {
                        foundTags.add(tag);
                        suggestions.push({
                            tag,
                            confidence: 0.9,
                            reason: `Matched custom pattern: ${pattern}`,
                            category: 'custom',
                        });
                    }
                });
            }
        }
        catch {
            // Invalid regex, skip
        }
    });
    // Detect languages from code blocks
    if (codeBlocks) {
        codeBlocks.forEach((cb) => {
            if (cb.language && !foundTags.has(cb.language)) {
                foundTags.add(cb.language);
                suggestions.push({
                    tag: cb.language,
                    confidence: 1.0,
                    reason: 'Detected from code block language',
                    category: 'language',
                });
            }
        });
    }
    return suggestions.sort((a, b) => b.confidence - a.confidence);
}
// AI-based tag suggestion
async function suggestTagsWithAI(content, codeBlocks, maxTags = 5) {
    const client = getAnthropicClient();
    if (!client) {
        throw new Error('AI client not available');
    }
    // Prepare context
    let context = `Content: ${content.slice(0, 2000)}`;
    if (codeBlocks && codeBlocks.length > 0) {
        context += `\n\nCode blocks (${codeBlocks.length} total):\n`;
        codeBlocks.slice(0, 3).forEach((cb, i) => {
            context += `\n${i + 1}. Language: ${cb.language || 'unknown'}\n`;
            context += `Code snippet: ${cb.code?.slice(0, 500) || 'N/A'}...\n`;
        });
    }
    const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: `Analyze this coding session content and suggest up to ${maxTags} relevant tags.

${context}

Return ONLY a JSON array of tag suggestions with this format:
[{"tag": "tag-name", "confidence": 0.9, "reason": "brief reason", "category": "category-name"}]

Categories: language, framework, feature, practice, concern, activity, library, pattern
Confidence: 0.0 to 1.0
Keep tags lowercase, single words or hyphenated.`,
            },
        ],
    });
    // Parse response
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
        return [];
    }
    try {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.slice(0, maxTags);
    }
    catch {
        return [];
    }
}
// Main tool function
export async function autoTagTool(input) {
    const { action, sessionId, content, codeBlocks, maxTags = 5, minConfidence = 0.7, includeExisting = true, categories, examples, enableAutoTag, defaultCategories, customPatterns, useAI = false, } = input;
    logger.info('Auto-tag requested', { action, sessionId, useAI });
    try {
        switch (action) {
            case 'suggest': {
                let textContent = content || '';
                let blocks = codeBlocks;
                // If sessionId provided, get session content
                if (sessionId) {
                    const session = await getSession(sessionId);
                    if (!session) {
                        return {
                            success: false,
                            action,
                            usedAI: false,
                            error: `Session not found: ${sessionId}`,
                        };
                    }
                    textContent = `${session.title}\n${session.summary}`;
                    if (session.codeContexts) {
                        blocks = [];
                        session.codeContexts.forEach((ctx) => {
                            if (ctx.codeBlocks) {
                                blocks.push(...ctx.codeBlocks);
                            }
                            textContent += `\n${ctx.conversationSummary}`;
                        });
                    }
                }
                if (!textContent && (!blocks || blocks.length === 0)) {
                    return {
                        success: false,
                        action,
                        usedAI: false,
                        error: 'No content provided for tagging. Provide content, codeBlocks, or sessionId.',
                    };
                }
                let suggestions;
                let usedAIForSuggestion = false;
                if (useAI && isAIAvailable()) {
                    try {
                        suggestions = await suggestTagsWithAI(textContent, blocks, maxTags);
                        usedAIForSuggestion = true;
                        // Supplement with pattern-based if AI returned few results
                        if (suggestions.length < maxTags) {
                            const patternSuggestions = detectTagsFromContent(textContent, blocks, categories);
                            const existingTags = new Set(suggestions.map((s) => s.tag));
                            patternSuggestions.forEach((ps) => {
                                if (!existingTags.has(ps.tag) && suggestions.length < maxTags) {
                                    suggestions.push(ps);
                                }
                            });
                        }
                    }
                    catch (aiError) {
                        logger.warn('AI tagging failed, falling back to patterns', { error: aiError });
                        suggestions = detectTagsFromContent(textContent, blocks, categories);
                    }
                }
                else {
                    suggestions = detectTagsFromContent(textContent, blocks, categories);
                }
                // Filter by confidence
                suggestions = suggestions
                    .filter((s) => s.confidence >= minConfidence)
                    .slice(0, maxTags);
                return {
                    success: true,
                    action,
                    suggestions,
                    sessionId,
                    usedAI: usedAIForSuggestion,
                    message: `Found ${suggestions.length} tag suggestions`,
                };
            }
            case 'apply': {
                if (!sessionId) {
                    return {
                        success: false,
                        action,
                        usedAI: false,
                        error: 'sessionId is required for apply action',
                    };
                }
                const session = await getSession(sessionId);
                if (!session) {
                    return {
                        success: false,
                        action,
                        usedAI: false,
                        error: `Session not found: ${sessionId}`,
                    };
                }
                // Get suggestions first
                let textContent = `${session.title}\n${session.summary}`;
                const blocks = [];
                if (session.codeContexts) {
                    session.codeContexts.forEach((ctx) => {
                        if (ctx.codeBlocks) {
                            blocks.push(...ctx.codeBlocks);
                        }
                        textContent += `\n${ctx.conversationSummary}`;
                    });
                }
                let suggestions;
                let usedAIForSuggestion = false;
                if (useAI && isAIAvailable()) {
                    try {
                        suggestions = await suggestTagsWithAI(textContent, blocks, maxTags);
                        usedAIForSuggestion = true;
                    }
                    catch {
                        suggestions = detectTagsFromContent(textContent, blocks, categories);
                    }
                }
                else {
                    suggestions = detectTagsFromContent(textContent, blocks, categories);
                }
                // Filter and get tags to apply
                const newTags = suggestions
                    .filter((s) => s.confidence >= minConfidence)
                    .slice(0, maxTags)
                    .map((s) => s.tag);
                // Merge with existing tags if requested
                const existingTags = session.tags || [];
                const allTags = includeExisting
                    ? [...new Set([...existingTags, ...newTags])]
                    : [...new Set(newTags)];
                // Update session
                await updateSession(sessionId, { tags: allTags });
                return {
                    success: true,
                    action,
                    suggestions,
                    appliedTags: allTags,
                    sessionId,
                    usedAI: usedAIForSuggestion,
                    message: `Applied ${newTags.length} new tags to session`,
                };
            }
            case 'train': {
                if (!examples || examples.length === 0) {
                    return {
                        success: false,
                        action,
                        usedAI: false,
                        error: 'examples are required for train action',
                    };
                }
                // Convert examples to patterns
                let patternsAdded = 0;
                examples.forEach(({ content: exContent, tags }) => {
                    // Extract keywords from content
                    const words = exContent
                        .toLowerCase()
                        .split(/\s+/)
                        .filter((w) => w.length > 3)
                        .slice(0, 5);
                    if (words.length > 0) {
                        const pattern = words.join('|');
                        tagConfig.customPatterns.push({ pattern, tags });
                        patternsAdded++;
                    }
                });
                return {
                    success: true,
                    action,
                    trained: true,
                    patternsAdded,
                    usedAI: false,
                    message: `Added ${patternsAdded} new patterns from ${examples.length} examples`,
                };
            }
            case 'config': {
                // Update config if values provided
                if (enableAutoTag !== undefined) {
                    tagConfig.enableAutoTag = enableAutoTag;
                }
                if (defaultCategories) {
                    tagConfig.defaultCategories = defaultCategories;
                }
                if (customPatterns) {
                    tagConfig.customPatterns = customPatterns;
                }
                return {
                    success: true,
                    action,
                    config: { ...tagConfig },
                    usedAI: false,
                    message: 'Configuration updated successfully',
                };
            }
            default:
                return {
                    success: false,
                    action,
                    usedAI: false,
                    error: `Unknown action: ${action}`,
                };
        }
    }
    catch (error) {
        logger.error('Auto-tag failed', error);
        return {
            success: false,
            action,
            usedAI: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
// Schema for MCP registration
export const autoTagSchema = {
    name: 'muse_auto_tag',
    description: 'Automatically suggests and applies tags to sessions. Actions: suggest (recommend tags), apply (add tags to session), train (learn from examples), config (configure tagging behavior).',
    inputSchema: {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['suggest', 'apply', 'train', 'config'],
                description: 'Action to perform',
            },
            sessionId: {
                type: 'string',
                description: 'Session ID to analyze or update (for suggest/apply)',
            },
            content: {
                type: 'string',
                description: 'Text content to analyze for tags',
            },
            codeBlocks: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        language: { type: 'string' },
                        code: { type: 'string' },
                    },
                },
                description: 'Code blocks to analyze',
            },
            maxTags: {
                type: 'number',
                description: 'Maximum number of tags to suggest (default: 5)',
            },
            minConfidence: {
                type: 'number',
                description: 'Minimum confidence threshold 0-1 (default: 0.7)',
            },
            includeExisting: {
                type: 'boolean',
                description: 'Include existing tags when applying (default: true)',
            },
            categories: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter suggestions by category',
            },
            examples: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        content: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['content', 'tags'],
                },
                description: 'Training examples for train action',
            },
            enableAutoTag: {
                type: 'boolean',
                description: 'Enable/disable auto-tagging (for config)',
            },
            defaultCategories: {
                type: 'array',
                items: { type: 'string' },
                description: 'Default categories to use (for config)',
            },
            customPatterns: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        pattern: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string' } },
                    },
                },
                description: 'Custom patterns for tag detection (for config)',
            },
            useAI: {
                type: 'boolean',
                description: 'Use AI for tag suggestions (default: false)',
            },
        },
        required: ['action'],
    },
};
//# sourceMappingURL=autoTag.js.map