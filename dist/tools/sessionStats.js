/**
 * Session Statistics Dashboard Tool (v2.9)
 * Provides analytics and insights about coding sessions
 */
import { createToolLogger } from '../core/logger.js';
import { listSessions } from '../core/sessionStorage.js';
const logger = createToolLogger('sessionStats');
// Helper functions
function parseDate(dateStr) {
    // Support relative dates like "1 week ago", "last month"
    const now = new Date();
    const lowerStr = dateStr.toLowerCase();
    if (lowerStr.includes('ago')) {
        const match = lowerStr.match(/(\d+)\s*(day|week|month|year)s?\s*ago/);
        if (match) {
            const [, num, unit] = match;
            const amount = parseInt(num, 10);
            switch (unit) {
                case 'day':
                    now.setDate(now.getDate() - amount);
                    break;
                case 'week':
                    now.setDate(now.getDate() - amount * 7);
                    break;
                case 'month':
                    now.setMonth(now.getMonth() - amount);
                    break;
                case 'year':
                    now.setFullYear(now.getFullYear() - amount);
                    break;
            }
            return now;
        }
    }
    // Try parsing as ISO date
    return new Date(dateStr);
}
function getPeriodStart(period) {
    const now = new Date();
    switch (period) {
        case 'day':
            now.setHours(0, 0, 0, 0);
            return now;
        case 'week':
            now.setDate(now.getDate() - now.getDay());
            now.setHours(0, 0, 0, 0);
            return now;
        case 'month':
            now.setDate(1);
            now.setHours(0, 0, 0, 0);
            return now;
        case 'year':
            now.setMonth(0, 1);
            now.setHours(0, 0, 0, 0);
            return now;
        default:
            return new Date(0); // All time
    }
}
function formatPeriodLabel(date, period) {
    switch (period) {
        case 'day':
            return date.toISOString().split('T')[0];
        case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            return `Week of ${weekStart.toISOString().split('T')[0]}`;
        case 'month':
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        case 'year':
            return String(date.getFullYear());
        default:
            return date.toISOString().split('T')[0];
    }
}
function generateInsights(sessions, languages, tags, productivity) {
    const insights = [];
    // Language insights
    if (languages.length > 0) {
        const topLang = languages[0];
        insights.push(`Your primary language is ${topLang.language} (${topLang.percentage.toFixed(1)}% of code blocks)`);
        if (languages.length > 3) {
            insights.push(`You work with ${languages.length} different languages, showing versatility`);
        }
    }
    // Productivity insights
    if (productivity.mostProductiveDay) {
        insights.push(`You're most productive on ${productivity.mostProductiveDay}s`);
    }
    if (productivity.mostProductiveHour >= 0) {
        const hour = productivity.mostProductiveHour;
        const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        insights.push(`Peak coding time is in the ${period} around ${hour}:00`);
    }
    // Tag insights
    if (tags.length > 0) {
        const topTags = tags.slice(0, 3).map(t => t.tag);
        insights.push(`Most common focus areas: ${topTags.join(', ')}`);
    }
    // Session patterns
    if (productivity.averageCodeBlocksPerSession > 5) {
        insights.push('Your sessions are feature-rich with high code output');
    }
    if (productivity.averageDecisionsPerSession > 2) {
        insights.push('You document design decisions well - great for maintainability');
    }
    return insights;
}
// Main tool function
export async function sessionStatsTool(input) {
    const { action, since, until, period = 'all', tags: filterTags, languages: filterLanguages, format = 'summary', includeInsights = true, compareWith, } = input;
    logger.info('Session stats requested', { action, period });
    try {
        // Get all sessions
        const { sessions } = await listSessions({ limit: 10000 });
        // Filter by date range
        let filteredSessions = sessions;
        const periodStart = since ? parseDate(since) : getPeriodStart(period);
        const periodEnd = until ? parseDate(until) : new Date();
        filteredSessions = sessions.filter((s) => {
            const sessionDate = new Date(s.createdAt);
            return sessionDate >= periodStart && sessionDate <= periodEnd;
        });
        // Filter by tags if specified
        if (filterTags && filterTags.length > 0) {
            filteredSessions = filteredSessions.filter((s) => s.tags?.some((t) => filterTags.includes(t)));
        }
        switch (action) {
            case 'overview': {
                // Collect all code blocks and decisions
                let totalCodeBlocks = 0;
                let totalDecisions = 0;
                const languageSet = new Set();
                const tagSet = new Set();
                filteredSessions.forEach((s) => {
                    if (s.codeContexts) {
                        s.codeContexts.forEach((ctx) => {
                            if (ctx.codeBlocks) {
                                totalCodeBlocks += ctx.codeBlocks.length;
                                ctx.codeBlocks.forEach((cb) => {
                                    if (cb.language)
                                        languageSet.add(cb.language);
                                });
                            }
                        });
                    }
                    if (s.designDecisions) {
                        totalDecisions += s.designDecisions.length;
                    }
                    if (s.tags) {
                        s.tags.forEach((t) => tagSet.add(t));
                    }
                });
                const sessionCount = filteredSessions.length;
                return {
                    success: true,
                    action,
                    overview: {
                        totalSessions: sessionCount,
                        totalCodeBlocks,
                        totalDesignDecisions: totalDecisions,
                        totalLanguages: languageSet.size,
                        totalTags: tagSet.size,
                        dateRange: {
                            from: periodStart.toISOString(),
                            to: periodEnd.toISOString(),
                        },
                        averages: {
                            codeBlocksPerSession: sessionCount > 0 ? totalCodeBlocks / sessionCount : 0,
                            decisionsPerSession: sessionCount > 0 ? totalDecisions / sessionCount : 0,
                            tagsPerSession: sessionCount > 0 ? tagSet.size / sessionCount : 0,
                        },
                    },
                    period,
                    generatedAt: new Date().toISOString(),
                };
            }
            case 'languages': {
                const langMap = new Map();
                filteredSessions.forEach((s) => {
                    if (s.codeContexts) {
                        s.codeContexts.forEach((ctx) => {
                            if (ctx.codeBlocks) {
                                ctx.codeBlocks.forEach((cb) => {
                                    const lang = cb.language || 'unknown';
                                    const existing = langMap.get(lang) || { count: 0, lines: 0 };
                                    existing.count++;
                                    existing.lines += (cb.code?.split('\n').length || 0);
                                    langMap.set(lang, existing);
                                });
                            }
                        });
                    }
                });
                const totalBlocks = Array.from(langMap.values()).reduce((sum, v) => sum + v.count, 0);
                const languages = Array.from(langMap.entries())
                    .map(([language, stats]) => ({
                    language,
                    count: stats.count,
                    linesOfCode: stats.lines,
                    percentage: totalBlocks > 0 ? (stats.count / totalBlocks) * 100 : 0,
                }))
                    .filter(l => !filterLanguages || filterLanguages.includes(l.language))
                    .sort((a, b) => b.count - a.count);
                const insights = includeInsights ? [
                    languages.length > 0 ? `Top language: ${languages[0].language} with ${languages[0].count} code blocks` : 'No code blocks found',
                    `Total lines of code: ${languages.reduce((sum, l) => sum + l.linesOfCode, 0)}`,
                ] : undefined;
                return {
                    success: true,
                    action,
                    languages,
                    insights,
                    period,
                    generatedAt: new Date().toISOString(),
                };
            }
            case 'timeline': {
                const timeMap = new Map();
                filteredSessions.forEach((s) => {
                    const date = new Date(s.createdAt);
                    const label = formatPeriodLabel(date, period === 'all' ? 'month' : period);
                    const existing = timeMap.get(label) || { sessions: 0, codeBlocks: 0, decisions: 0 };
                    existing.sessions++;
                    if (s.codeContexts) {
                        s.codeContexts.forEach((ctx) => {
                            existing.codeBlocks += ctx.codeBlocks?.length || 0;
                        });
                    }
                    existing.decisions += s.designDecisions?.length || 0;
                    timeMap.set(label, existing);
                });
                const timeline = Array.from(timeMap.entries())
                    .map(([period, stats]) => ({
                    period,
                    sessionCount: stats.sessions,
                    codeBlockCount: stats.codeBlocks,
                    decisionsCount: stats.decisions,
                }))
                    .sort((a, b) => a.period.localeCompare(b.period));
                return {
                    success: true,
                    action,
                    timeline,
                    period,
                    generatedAt: new Date().toISOString(),
                };
            }
            case 'tags': {
                const tagMap = new Map();
                const tagCoOccurrence = new Map();
                filteredSessions.forEach((s) => {
                    if (s.tags) {
                        s.tags.forEach((tag) => {
                            const existing = tagMap.get(tag) || { count: 0, sessions: new Set() };
                            existing.count++;
                            existing.sessions.add(s.id);
                            tagMap.set(tag, existing);
                            // Track co-occurrence
                            s.tags.forEach((otherTag) => {
                                if (otherTag !== tag) {
                                    if (!tagCoOccurrence.has(tag)) {
                                        tagCoOccurrence.set(tag, new Map());
                                    }
                                    const coMap = tagCoOccurrence.get(tag);
                                    coMap.set(otherTag, (coMap.get(otherTag) || 0) + 1);
                                }
                            });
                        });
                    }
                });
                const totalTags = Array.from(tagMap.values()).reduce((sum, v) => sum + v.count, 0);
                const tags = Array.from(tagMap.entries())
                    .map(([tag, stats]) => {
                    const coMap = tagCoOccurrence.get(tag);
                    const relatedTags = coMap
                        ? Array.from(coMap.entries())
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([t]) => t)
                        : [];
                    return {
                        tag,
                        count: stats.count,
                        percentage: totalTags > 0 ? (stats.count / totalTags) * 100 : 0,
                        relatedTags,
                    };
                })
                    .sort((a, b) => b.count - a.count);
                return {
                    success: true,
                    action,
                    tags,
                    period,
                    generatedAt: new Date().toISOString(),
                };
            }
            case 'productivity': {
                const dayCount = new Map();
                const hourCount = new Map();
                const uniqueDays = new Set();
                let totalCodeBlocks = 0;
                let totalDecisions = 0;
                filteredSessions.forEach((s) => {
                    const date = new Date(s.createdAt);
                    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
                    const hour = date.getHours();
                    const dayKey = date.toISOString().split('T')[0];
                    dayCount.set(dayName, (dayCount.get(dayName) || 0) + 1);
                    hourCount.set(hour, (hourCount.get(hour) || 0) + 1);
                    uniqueDays.add(dayKey);
                    if (s.codeContexts) {
                        s.codeContexts.forEach((ctx) => {
                            totalCodeBlocks += ctx.codeBlocks?.length || 0;
                        });
                    }
                    totalDecisions += s.designDecisions?.length || 0;
                });
                const sessionCount = filteredSessions.length;
                const mostProductiveDay = Array.from(dayCount.entries())
                    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
                const mostProductiveHour = Array.from(hourCount.entries())
                    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? -1;
                const productivity = {
                    averageSessionsPerDay: uniqueDays.size > 0 ? sessionCount / uniqueDays.size : 0,
                    averageCodeBlocksPerSession: sessionCount > 0 ? totalCodeBlocks / sessionCount : 0,
                    averageDecisionsPerSession: sessionCount > 0 ? totalDecisions / sessionCount : 0,
                    mostProductiveDay,
                    mostProductiveHour,
                    totalCodingDays: uniqueDays.size,
                };
                // Generate insights
                const languageStats = await getLanguageStats(filteredSessions);
                const tagStats = await getTagStats(filteredSessions);
                const insights = includeInsights
                    ? generateInsights(filteredSessions, languageStats, tagStats, productivity)
                    : undefined;
                return {
                    success: true,
                    action,
                    productivity,
                    insights,
                    period,
                    generatedAt: new Date().toISOString(),
                };
            }
            case 'trends': {
                // Compare current period with previous period
                const now = new Date();
                let currentStart;
                let previousStart;
                let previousEnd;
                switch (period) {
                    case 'week':
                        currentStart = new Date(now);
                        currentStart.setDate(now.getDate() - 7);
                        previousStart = new Date(currentStart);
                        previousStart.setDate(previousStart.getDate() - 7);
                        previousEnd = currentStart;
                        break;
                    case 'month':
                        currentStart = new Date(now);
                        currentStart.setMonth(now.getMonth() - 1);
                        previousStart = new Date(currentStart);
                        previousStart.setMonth(previousStart.getMonth() - 1);
                        previousEnd = currentStart;
                        break;
                    default:
                        currentStart = new Date(now);
                        currentStart.setDate(now.getDate() - 30);
                        previousStart = new Date(currentStart);
                        previousStart.setDate(previousStart.getDate() - 30);
                        previousEnd = currentStart;
                }
                const currentSessions = sessions.filter((s) => {
                    const d = new Date(s.createdAt);
                    return d >= currentStart && d <= now;
                });
                const previousSessions = sessions.filter((s) => {
                    const d = new Date(s.createdAt);
                    return d >= previousStart && d < previousEnd;
                });
                const calculateMetrics = (sessionList) => {
                    let codeBlocks = 0;
                    let decisions = 0;
                    sessionList.forEach((s) => {
                        if (s.codeContexts) {
                            s.codeContexts.forEach((ctx) => {
                                codeBlocks += ctx.codeBlocks?.length || 0;
                            });
                        }
                        decisions += s.designDecisions?.length || 0;
                    });
                    return { sessions: sessionList.length, codeBlocks, decisions };
                };
                const current = calculateMetrics(currentSessions);
                const previous = calculateMetrics(previousSessions);
                const createTrend = (metric, curr, prev) => {
                    const change = curr - prev;
                    const changePercent = prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;
                    return {
                        metric,
                        current: curr,
                        previous: prev,
                        change,
                        changePercent,
                        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
                    };
                };
                const trends = [
                    createTrend('Sessions', current.sessions, previous.sessions),
                    createTrend('Code Blocks', current.codeBlocks, previous.codeBlocks),
                    createTrend('Design Decisions', current.decisions, previous.decisions),
                ];
                const insights = includeInsights
                    ? trends.map((t) => {
                        if (t.trend === 'up') {
                            return `${t.metric} increased by ${t.changePercent.toFixed(1)}%`;
                        }
                        else if (t.trend === 'down') {
                            return `${t.metric} decreased by ${Math.abs(t.changePercent).toFixed(1)}%`;
                        }
                        return `${t.metric} remained stable`;
                    })
                    : undefined;
                return {
                    success: true,
                    action,
                    trends,
                    insights,
                    period,
                    generatedAt: new Date().toISOString(),
                };
            }
            default:
                return {
                    success: false,
                    action,
                    error: `Unknown action: ${action}`,
                    generatedAt: new Date().toISOString(),
                };
        }
    }
    catch (error) {
        logger.error('Session stats failed', error);
        return {
            success: false,
            action,
            error: error instanceof Error ? error.message : 'Unknown error',
            generatedAt: new Date().toISOString(),
        };
    }
}
// Helper functions for generating insights
async function getLanguageStats(sessions) {
    const langMap = new Map();
    sessions.forEach((s) => {
        if (s.codeContexts) {
            s.codeContexts.forEach((ctx) => {
                if (ctx.codeBlocks) {
                    ctx.codeBlocks.forEach((cb) => {
                        const lang = cb.language || 'unknown';
                        const existing = langMap.get(lang) || { count: 0, lines: 0 };
                        existing.count++;
                        existing.lines += (cb.code?.split('\n').length || 0);
                        langMap.set(lang, existing);
                    });
                }
            });
        }
    });
    const totalBlocks = Array.from(langMap.values()).reduce((sum, v) => sum + v.count, 0);
    return Array.from(langMap.entries())
        .map(([language, stats]) => ({
        language,
        count: stats.count,
        linesOfCode: stats.lines,
        percentage: totalBlocks > 0 ? (stats.count / totalBlocks) * 100 : 0,
    }))
        .sort((a, b) => b.count - a.count);
}
async function getTagStats(sessions) {
    const tagMap = new Map();
    sessions.forEach((s) => {
        if (s.tags) {
            s.tags.forEach((tag) => {
                tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
            });
        }
    });
    const total = Array.from(tagMap.values()).reduce((sum, v) => sum + v, 0);
    return Array.from(tagMap.entries())
        .map(([tag, count]) => ({
        tag,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        relatedTags: [],
    }))
        .sort((a, b) => b.count - a.count);
}
// Schema for MCP registration
export const sessionStatsSchema = {
    name: 'muse_session_stats',
    description: 'Provides analytics and insights about coding sessions. Actions: overview (summary stats), languages (language breakdown), timeline (activity over time), tags (tag analysis), productivity (work patterns), trends (compare periods).',
    inputSchema: {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['overview', 'languages', 'timeline', 'tags', 'productivity', 'trends'],
                description: 'Type of statistics to retrieve',
            },
            since: {
                type: 'string',
                description: 'Start date for filtering (ISO date or relative like "1 week ago")',
            },
            until: {
                type: 'string',
                description: 'End date for filtering',
            },
            period: {
                type: 'string',
                enum: ['day', 'week', 'month', 'year', 'all'],
                description: 'Time period for grouping (default: all)',
            },
            tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter by specific tags',
            },
            languages: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter by specific languages',
            },
            format: {
                type: 'string',
                enum: ['summary', 'detailed', 'chart'],
                description: 'Output format (default: summary)',
            },
            includeInsights: {
                type: 'boolean',
                description: 'Include AI-generated insights (default: true)',
            },
            compareWith: {
                type: 'string',
                enum: ['previous', 'average'],
                description: 'Compare with previous period or average',
            },
        },
        required: ['action'],
    },
};
//# sourceMappingURL=sessionStats.js.map