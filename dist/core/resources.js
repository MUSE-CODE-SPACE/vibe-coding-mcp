/**
 * MCP Resources — read-only contextual data exposed via `resources/list` and
 * `resources/read`. Resources let Claude UI surface vibe-coding state with
 * @-mentions / slash commands without the LLM having to call a tool first.
 *
 * Registered URIs:
 *   - `vibe-coding://sessions/list`        — list of captured sessions
 *   - `vibe-coding://sessions/{id}`        — full detail for one session (template)
 *   - `vibe-coding://config`               — current platform configuration
 *   - `vibe-coding://sessions/today`       — sessions captured today (v2.15)
 *   - `vibe-coding://search/{query}`       — keyword search across sessions (v2.15, template)
 */
import { listSessions, getSession, searchSessions } from './sessionStorage.js';
import { validateConfiguration } from './config.js';
/**
 * Static resources (fixed URI, returned by `resources/list`).
 */
export const STATIC_RESOURCE_DESCRIPTORS = [
    {
        uri: 'vibe-coding://sessions/list',
        name: 'sessions-list',
        description: 'List of all captured vibe coding sessions (id, title, tags, timestamps).',
        mimeType: 'application/json',
    },
    {
        uri: 'vibe-coding://sessions/today',
        name: 'sessions-today',
        description: 'Sessions captured today (local date) — the input for a daily log or standup.',
        mimeType: 'application/json',
    },
    {
        uri: 'vibe-coding://config',
        name: 'config',
        description: 'Current publishing platform configuration — which platforms (Notion, GitHub Wiki, Obsidian, Confluence, Slack, Discord) are fully configured via environment variables and which are missing required secrets.',
        mimeType: 'application/json',
    },
];
/**
 * Resource templates — URIs with variables (RFC 6570). Listed separately
 * by `resources/templates/list`.
 */
export const RESOURCE_TEMPLATE_DESCRIPTORS = [
    {
        uriTemplate: 'vibe-coding://sessions/{id}',
        name: 'session-detail',
        description: 'Full read-only detail of one captured session (code contexts, design decisions, metadata).',
        mimeType: 'application/json',
    },
    {
        uriTemplate: 'vibe-coding://search/{query}',
        name: 'session-search',
        description: 'Keyword search across session titles, summaries, tags and touched file paths. Example: vibe-coding://search/auth%20refactor',
        mimeType: 'application/json',
    },
];
/** Read the `sessions/list` resource. */
export async function readSessionsList(uri) {
    const { sessions, total } = await listSessions({ limit: 200 });
    const body = {
        total,
        sessions: sessions.map((s) => ({
            id: s.id,
            title: s.title,
            tags: s.tags,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            codeContextCount: s.codeContextCount,
            designDecisionCount: s.designDecisionCount,
        })),
    };
    return { uri, mimeType: 'application/json', text: JSON.stringify(body, null, 2) };
}
/** Local YYYY-MM-DD for a Date. */
function localDate(d) {
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().slice(0, 10);
}
/** Read the `sessions/today` resource. */
export async function readSessionsToday(uri) {
    const today = localDate(new Date());
    const { sessions } = await listSessions({ limit: 1000, sortBy: 'updatedAt', sortOrder: 'desc' });
    const todays = sessions.filter((s) => {
        const started = typeof s.metadata?.startedAt === 'string' ? s.metadata.startedAt : s.createdAt;
        return localDate(new Date(started)) === today;
    });
    const body = {
        date: today,
        total: todays.length,
        sessions: todays.map((s) => ({
            id: s.id,
            title: s.title,
            tags: s.tags,
            project: s.metadata?.project,
            durationSec: s.metadata?.durationSec,
            filesTouched: s.metadata?.filesTouched,
            designDecisionCount: s.designDecisionCount,
            updatedAt: s.updatedAt,
        })),
    };
    return { uri, mimeType: 'application/json', text: JSON.stringify(body, null, 2) };
}
/** Read a `search/{query}` resource. */
export async function readSearch(uri, rawQuery) {
    let query = rawQuery;
    try {
        query = decodeURIComponent(rawQuery);
    }
    catch {
        /* keep raw */
    }
    const q = query.trim().toLowerCase();
    const byText = q ? await searchSessions(q, { limit: 50 }) : [];
    // Also match touched file paths (captured sessions carry metadata.filesTouched).
    const { sessions: all } = await listSessions({ limit: 5000 });
    const byFile = q
        ? all.filter((s) => Array.isArray(s.metadata?.filesTouched) &&
            s.metadata.filesTouched.some((f) => typeof f === 'string' && f.toLowerCase().includes(q)))
        : [];
    const seen = new Set();
    const merged = [...byText, ...byFile].filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
    const body = {
        query,
        total: merged.length,
        sessions: merged.slice(0, 50).map((s) => ({
            id: s.id,
            title: s.title,
            tags: s.tags,
            project: s.metadata?.project,
            updatedAt: s.updatedAt,
            summary: s.summary.slice(0, 200),
        })),
    };
    return { uri, mimeType: 'application/json', text: JSON.stringify(body, null, 2) };
}
/** Read a `sessions/{id}` resource. */
export async function readSessionDetail(uri, sessionId) {
    const session = await getSession(sessionId);
    if (!session) {
        // Return an empty-but-valid envelope so clients don't crash.
        return {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ error: 'NOT_FOUND', sessionId }, null, 2),
        };
    }
    return { uri, mimeType: 'application/json', text: JSON.stringify(session, null, 2) };
}
/** Read the `config` resource. */
export function readConfig(uri) {
    const result = validateConfiguration();
    return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(result, null, 2),
    };
}
/**
 * Dispatch a `resources/read` call by URI. Returns `null` if the URI does
 * not match any registered resource (caller should surface a proper error).
 */
export async function readResource(uri) {
    if (uri === 'vibe-coding://sessions/list') {
        return readSessionsList(uri);
    }
    if (uri === 'vibe-coding://sessions/today') {
        return readSessionsToday(uri);
    }
    if (uri === 'vibe-coding://config') {
        return readConfig(uri);
    }
    const searchMatch = uri.match(/^vibe-coding:\/\/search\/(.+)$/);
    if (searchMatch) {
        return readSearch(uri, searchMatch[1]);
    }
    // Template match: vibe-coding://sessions/{id}
    const sessionMatch = uri.match(/^vibe-coding:\/\/sessions\/([^/]+)$/);
    if (sessionMatch && sessionMatch[1] !== 'list' && sessionMatch[1] !== 'today') {
        return readSessionDetail(uri, sessionMatch[1]);
    }
    return null;
}
//# sourceMappingURL=resources.js.map