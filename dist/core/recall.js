/**
 * Project recall — turn the captured session history of one project into a
 * short brief an agent can read at the start of a new session ("what did we
 * do here last time, and why?").
 *
 * Used by three surfaces:
 *   - the `SessionStart` hook (`vibe-coding-mcp hook`), which injects the
 *     brief into a fresh Claude Code session as additional context,
 *   - the `muse_recall` MCP tool (optionally with a search query),
 *   - the `vibe-coding-mcp recall` CLI.
 *
 * Reads only the local session store. No network, no LLM.
 */
import * as path from 'path';
import { listSessions, getSession } from './sessionStorage.js';
import { localDate } from '../tools/digest.js';
const STRINGS = {
    en: {
        heading: 'Project memory',
        searchHeading: 'Session search',
        intro: (n, total) => `${n} of ${total} earlier session(s), captured by vibe-coding-mcp. Background only — it may be out of date; check the code before relying on it.`,
        asked: 'Asked',
        files: 'Files',
        decisions: 'Decisions',
        commits: 'Commits',
        ended: 'Ended with',
        more: (n) => `… ${n} more session(s) not shown. Use muse_recall with a query to search them.`,
    },
    ko: {
        heading: '프로젝트 기억',
        searchHeading: '세션 검색',
        intro: (n, total) => `이전 세션 ${total}개 중 ${n}개 (vibe-coding-mcp 캡처). 참고용이며 최신 상태와 다를 수 있으니 코드를 확인하세요.`,
        asked: '요청',
        files: '파일',
        decisions: '결정',
        commits: '커밋',
        ended: '마지막 응답',
        more: (n) => `… 표시하지 않은 세션 ${n}개. muse_recall에 query를 넣어 검색하세요.`,
    },
};
function meta(s) {
    return (s.metadata ?? {});
}
function startedAt(s) {
    const m = meta(s);
    return typeof m.startedAt === 'string' ? m.startedAt : s.createdAt;
}
function isWithin(parent, child) {
    const rel = path.relative(parent, child);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}
/** Does a stored session belong to the project identified by `cwd` / `project`? */
export function sessionMatchesProject(s, cwd, project) {
    const m = meta(s);
    const sessionCwd = typeof m.cwd === 'string' ? m.cwd : undefined;
    if (cwd && sessionCwd) {
        // Same directory, or the session ran in a sub-directory of it (monorepo
        // package). A session that ran in a *parent* directory (say ~/Projects) is
        // about something else and must not leak into every project below it.
        if (isWithin(path.resolve(cwd), path.resolve(sessionCwd)))
            return true;
    }
    if (project) {
        const p = project.toLowerCase();
        if (typeof m.project === 'string' && m.project.toLowerCase() === p)
            return true;
        if ((s.tags ?? []).some((t) => t.toLowerCase() === p))
            return true;
    }
    return false;
}
/** Pull the "What was asked" bullets back out of a capture summary. */
export function extractAsks(summary, max = 3) {
    const idx = summary.indexOf('What was asked:');
    if (idx < 0)
        return [];
    return summary
        .slice(idx)
        .split('\n')
        .slice(1)
        .filter((l) => l.startsWith('- ') && !l.startsWith('- …'))
        .slice(0, max)
        .map((l) => l.slice(2));
}
export function extractLastResponse(summary) {
    const m = /^Last response: (.+)$/m.exec(summary);
    return m ? m[1] : undefined;
}
const MARKER_TAGS = new Set(['claude-code', 'codex', 'auto-capture']);
/** Placeholder the pattern extractor writes when a decision has no stated reason. */
const NO_RATIONALE = 'Rationale not explicitly stated';
function tokenize(query) {
    return [...new Set(query.toLowerCase().split(/[^\p{L}\p{N}_.\-/]+/u).filter((t) => t.length >= 2))];
}
/** Relevance of one session to the query terms (0 = no match). */
export function scoreSession(s, terms) {
    if (!terms.length)
        return 0;
    const m = meta(s);
    const files = Array.isArray(m.filesTouched) ? m.filesTouched.filter((f) => typeof f === 'string') : [];
    const commits = Array.isArray(m.commits) ? m.commits.map((c) => c.subject ?? '') : [];
    const commands = Array.isArray(m.commands) ? m.commands.filter((c) => typeof c === 'string') : [];
    const fields = [
        [s.title, 5],
        [s.designDecisions.map((d) => `${d.title} ${d.description} ${d.rationale}`).join('\n'), 4],
        [files.join('\n'), 3],
        [commits.join('\n'), 3],
        // Marker tags are on every captured session; matching them is noise.
        [(s.tags ?? []).filter((t) => !MARKER_TAGS.has(t)).join(' '), 3],
        [s.summary, 2],
        [commands.join('\n'), 1],
    ];
    let score = 0;
    let matchedTerms = 0;
    for (const term of terms) {
        let hit = false;
        for (const [text, weight] of fields) {
            if (text && text.toLowerCase().includes(term)) {
                score += weight;
                hit = true;
            }
        }
        if (hit)
            matchedTerms += 1;
    }
    // Sessions matching every term outrank sessions matching one term many times.
    return matchedTerms === 0 ? 0 : score + matchedTerms * 10;
}
function toRecallSession(s, score) {
    const m = meta(s);
    const files = Array.isArray(m.filesTouched) ? m.filesTouched.filter((f) => typeof f === 'string') : [];
    const commits = Array.isArray(m.commits)
        ? m.commits
            .filter((c) => typeof c.hash === 'string' && typeof c.subject === 'string')
            .map((c) => ({ hash: c.hash, subject: c.subject }))
        : [];
    return {
        id: s.id,
        title: s.title,
        date: localDate(startedAt(s)),
        source: typeof m.source === 'string' ? m.source : undefined,
        project: typeof m.project === 'string' ? m.project : undefined,
        // Claude Code records "HEAD" when the directory is not on a branch / not a repo.
        gitBranch: typeof m.gitBranch === 'string' && m.gitBranch !== 'HEAD' ? m.gitBranch : undefined,
        durationSec: typeof m.durationSec === 'number' ? m.durationSec : undefined,
        asks: extractAsks(s.summary),
        files,
        decisions: s.designDecisions.map((d) => ({
            title: d.title,
            rationale: d.rationale && d.rationale !== NO_RATIONALE ? d.rationale : undefined,
        })),
        commits,
        lastResponse: extractLastResponse(s.summary),
        score,
    };
}
function fmtDuration(sec) {
    if (sec < 60)
        return `${sec}s`;
    const m = Math.round(sec / 60);
    if (m < 60)
        return `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
}
function clip(text, max) {
    const t = text.replace(/\s+/g, ' ').trim();
    return t.length > max ? t.slice(0, max - 1) + '…' : t;
}
function renderSession(s, L, showProject) {
    const bits = [];
    if (showProject && s.project)
        bits.push(s.project);
    if (s.source)
        bits.push(s.source);
    if (s.gitBranch)
        bits.push(`\`${s.gitBranch}\``);
    if (s.durationSec !== undefined)
        bits.push(fmtDuration(s.durationSec));
    const lines = [`## ${s.date} · ${clip(s.title, 90)}${bits.length ? ` (${bits.join(' · ')})` : ''}`];
    for (const ask of s.asks.slice(0, 3))
        lines.push(`- ${L.asked}: ${clip(ask, 160)}`);
    if (s.files.length) {
        lines.push(`- ${L.files}: ${s.files.slice(0, 6).map((f) => `\`${f}\``).join(', ')}${s.files.length > 6 ? ` +${s.files.length - 6}` : ''}`);
    }
    for (const d of s.decisions.slice(0, 3)) {
        lines.push(`- ${L.decisions}: ${clip(d.title, 100)}${d.rationale ? ` — ${clip(d.rationale, 140)}` : ''}`);
    }
    if (s.commits.length) {
        lines.push(`- ${L.commits}: ${s.commits.slice(-4).map((c) => `${c.hash} ${clip(c.subject, 60)}`).join('; ')}`);
    }
    if (s.lastResponse)
        lines.push(`- ${L.ended}: ${clip(s.lastResponse, 220)}`);
    return lines.join('\n');
}
/** Render the brief, dropping trailing sessions that do not fit `maxChars` (the first always fits). */
export function renderRecall(result, maxChars, language = 'en') {
    if (!result.sessions.length)
        return '';
    const L = STRINGS[language];
    const showProject = result.scope === 'all';
    const title = result.query
        ? `# ${L.searchHeading}: "${clip(result.query, 60)}"`
        : `# ${L.heading}: ${result.project ?? (result.cwd ? path.basename(result.cwd) : 'all')}`;
    const blocks = [];
    let used = title.length + 200;
    for (const s of result.sessions) {
        const block = renderSession(s, L, showProject);
        if (blocks.length && used + block.length > maxChars)
            break;
        blocks.push(block);
        used += block.length + 2;
    }
    const hidden = result.matched - blocks.length;
    const parts = [title, '', L.intro(blocks.length, result.matched), '', blocks.join('\n\n')];
    if (hidden > 0)
        parts.push('', L.more(hidden));
    return parts.join('\n');
}
/**
 * Collect the sessions relevant to a project (or a query) and render the brief.
 */
export async function recall(options = {}) {
    const scope = options.scope ?? 'project';
    const cwd = options.cwd ? path.resolve(options.cwd) : scope === 'project' && !options.project ? process.cwd() : undefined;
    const project = options.project ?? (cwd ? path.basename(cwd) : undefined);
    const limit = Math.max(1, options.limit ?? 5);
    const maxChars = options.maxChars ?? 6000;
    const terms = options.query ? tokenize(options.query) : [];
    const cutoff = options.sinceDays ? Date.now() - options.sinceDays * 86_400_000 : 0;
    const { sessions: stored } = await listSessions({ limit: 100000 });
    const candidates = stored
        .filter((s) => {
        const m = meta(s);
        if (options.excludeAgentSessionId && (m.agentSessionId === options.excludeAgentSessionId || m.claudeSessionId === options.excludeAgentSessionId))
            return false;
        if (cutoff && new Date(startedAt(s)).getTime() < cutoff)
            return false;
        if (scope === 'all')
            return true;
        // With an explicit cwd, a name-only match is not enough: two unrelated
        // checkouts can share a basename. Fall back to the name when the
        // session has no recorded cwd (manually saved sessions).
        if (options.cwd || !options.project) {
            return typeof m.cwd === 'string' ? sessionMatchesProject(s, cwd, undefined) : sessionMatchesProject(s, undefined, project);
        }
        return sessionMatchesProject(s, cwd, project);
    })
        .sort((a, b) => (startedAt(a) < startedAt(b) ? 1 : -1));
    // Full bodies are needed for decisions; without a query only the newest are read.
    const toLoad = terms.length ? candidates.slice(0, 500) : candidates.slice(0, limit);
    const loaded = [];
    for (const s of toLoad) {
        const data = await getSession(s.id).catch(() => null);
        if (!data)
            continue;
        const score = terms.length ? scoreSession(data, terms) : 0;
        if (terms.length && score === 0)
            continue;
        loaded.push({ data, score });
    }
    if (terms.length)
        loaded.sort((a, b) => b.score - a.score || (startedAt(a.data) < startedAt(b.data) ? 1 : -1));
    const base = {
        project,
        cwd,
        scope,
        query: options.query,
        matched: terms.length ? loaded.length : candidates.length,
        sessions: loaded.slice(0, limit).map((l) => toRecallSession(l.data, terms.length ? l.score : undefined)),
    };
    return { ...base, content: renderRecall(base, maxChars, options.language ?? 'en') };
}
//# sourceMappingURL=recall.js.map