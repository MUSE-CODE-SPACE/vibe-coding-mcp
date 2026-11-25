import * as path from 'path';
import * as os from 'os';
import { promises as fs } from 'fs';
import { execFileSync } from 'child_process';
import * as sessionStorage from '../core/sessionStorage.js';
import { recall, scoreSession, sessionMatchesProject, extractAsks, extractLastResponse } from '../core/recall.js';
import { recallTool } from '../tools/recall.js';
import { captureTranscript, collectCommits, findSessionByClaudeId, syncTranscripts } from '../core/captureEngine.js';
import { digestTool, localDate } from '../tools/digest.js';

let root: string;
const APP = '/work/app';

function summary(asks: string[], last: string): string {
  return `2 prompt(s).\n\nWhat was asked:\n${asks.map((a) => `- ${a}`).join('\n')}\n\nLast response: ${last}`;
}

async function seed(
  title: string,
  cwd: string | undefined,
  startedAt: string,
  extra: Partial<sessionStorage.SessionData> & { meta?: Record<string, unknown> } = {},
): Promise<string> {
  const { meta, ...rest } = extra;
  const s = await sessionStorage.saveSession({
    title,
    summary: summary([`ask about ${title}`], `done with ${title}`),
    tags: ['claude-code', 'auto-capture'],
    codeContexts: [],
    designDecisions: [],
    metadata: { source: 'claude-code', cwd, project: cwd ? path.basename(cwd) : undefined, startedAt, agentSessionId: `agent-${title}`, ...meta },
    ...rest,
  });
  return s.id;
}

beforeAll(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'vibe-recall-'));
  await sessionStorage.initializeStorage(path.join(root, 'sessions'));
  await seed('login page', APP, '2026-03-01T10:00:00.000Z', {
    designDecisions: [
      { id: 'd1', title: 'Use react-hook-form', description: 'forms', rationale: 'smaller bundle than formik', category: 'library', timestamp: '' },
      { id: 'd2', title: 'Noise', description: 'x', rationale: 'Rationale not explicitly stated', category: 'other', timestamp: '' },
    ],
    meta: { filesTouched: ['src/pages/Login.tsx'], gitBranch: 'feature/login', durationSec: 1500, commits: [{ hash: 'abc1234', date: '', subject: 'feat: login form' }] },
  });
  await seed('cache layer', APP, '2026-03-05T10:00:00.000Z', { meta: { filesTouched: ['src/core/cache.ts'], gitBranch: 'HEAD' } });
  await seed('package work', `${APP}/packages/ui`, '2026-03-03T10:00:00.000Z');
  await seed('parent dir chat', '/work', '2026-03-06T10:00:00.000Z');
  await seed('other app', '/work/other', '2026-03-07T10:00:00.000Z', { meta: { filesTouched: ['src/core/cache.ts'] } });
  await seed('manual note', undefined, '2026-03-02T10:00:00.000Z', { tags: ['app'], metadata: { startedAt: '2026-03-02T10:00:00.000Z' } });
});

afterAll(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe('recall helpers', () => {
  it('matches the project directory and its sub-directories, not parents or siblings', () => {
    const s = (cwd: string) => ({ metadata: { cwd }, tags: [] }) as unknown as sessionStorage.StoredSession;
    expect(sessionMatchesProject(s(APP), APP)).toBe(true);
    expect(sessionMatchesProject(s(`${APP}/packages/ui`), APP)).toBe(true);
    expect(sessionMatchesProject(s('/work'), APP)).toBe(false);
    expect(sessionMatchesProject(s('/work/app-two'), APP)).toBe(false);
    expect(sessionMatchesProject(s('/elsewhere'), undefined, 'APP')).toBe(false);
  });

  it('pulls asks and the last response back out of a capture summary', () => {
    const text = summary(['first', 'second'], 'all green');
    expect(extractAsks(text)).toEqual(['first', 'second']);
    expect(extractLastResponse(text)).toBe('all green');
    expect(extractAsks('no section')).toEqual([]);
  });

  it('does not score marker tags', async () => {
    const { sessions } = await sessionStorage.listSessions({ limit: 1 });
    const full = (await sessionStorage.getSession(sessions[0].id))!;
    expect(scoreSession(full, ['capture'])).toBe(0);
    expect(scoreSession(full, ['auto-capture'])).toBe(0);
  });
});

describe('recall', () => {
  it('returns the project sessions newest first, excluding parents and other projects', async () => {
    const r = await recall({ cwd: APP });
    expect(r.sessions.map((s) => s.title)).toEqual(['cache layer', 'package work', 'manual note', 'login page']);
    expect(r.matched).toBe(4);
    expect(r.content).toContain('# Project memory: app');
    expect(r.content).toContain('Asked: ask about cache layer');
    expect(r.content).toContain('Ended with: done with cache layer');
    expect(r.content).not.toContain('`HEAD`');
  });

  it('renders decisions with rationale, commits and branch; hides the placeholder rationale', async () => {
    const r = await recall({ cwd: APP, query: 'login' });
    expect(r.sessions).toHaveLength(1);
    expect(r.content).toContain('# Session search: "login"');
    expect(r.content).toContain('Use react-hook-form — smaller bundle than formik');
    expect(r.content).toContain('abc1234 feat: login form');
    expect(r.content).toContain('`feature/login`');
    expect(r.content).not.toContain('Rationale not explicitly stated');
  });

  it('searches file paths, and scope=all crosses projects', async () => {
    const inProject = await recall({ cwd: APP, query: 'src/core/cache.ts' });
    expect(inProject.sessions.map((s) => s.title)).toEqual(['cache layer']);
    const everywhere = await recall({ scope: 'all', query: 'cache.ts' });
    expect(everywhere.sessions.map((s) => s.title).sort()).toEqual(['cache layer', 'other app']);
    expect(everywhere.content).toContain('(other ·');
  });

  it('honours limit, the character budget and excludeAgentSessionId', async () => {
    const limited = await recall({ cwd: APP, limit: 2 });
    expect(limited.sessions).toHaveLength(2);
    expect(limited.content).toContain('2 more session(s) not shown');

    const tight = await recall({ cwd: APP, maxChars: 300 });
    expect((tight.content.match(/^## /gm) ?? []).length).toBe(1);

    const without = await recall({ cwd: APP, excludeAgentSessionId: 'agent-cache layer' });
    expect(without.sessions.map((s) => s.title)).not.toContain('cache layer');
  });

  it('returns an empty brief for an unknown project, in Korean when asked', async () => {
    const none = await recall({ cwd: '/nowhere' });
    expect(none.sessions).toEqual([]);
    expect(none.content).toBe('');
    const ko = await recall({ cwd: APP, language: 'ko', limit: 1 });
    expect(ko.content).toContain('# 프로젝트 기억: app');
  });

  it('muse_recall wraps the result and explains an empty one', async () => {
    const hit = await recallTool({ cwd: APP, query: 'login' });
    expect(hit.success).toBe(true);
    expect(hit.message).toContain('1 of 1');
    const miss = await recallTool({ cwd: '/nowhere' });
    expect(miss.success).toBe(true);
    expect(miss.message).toContain('action=sync');
  });
});

describe('commit linkage, tokens and sync', () => {
  const git = (cwd: string, args: string[], date?: string) =>
    execFileSync('git', args, {
      cwd,
      stdio: 'pipe',
      env: { ...process.env, GIT_AUTHOR_DATE: date ?? '', GIT_COMMITTER_DATE: date ?? '', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' },
    });

  it('collects only commits inside the session window', async () => {
    const repo = path.join(root, 'repo');
    await fs.mkdir(repo);
    git(repo, ['init', '-q']);
    const commit = (msg: string, date: string) =>
      git(repo, ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false', 'commit', '-q', '--allow-empty', '-m', msg], date);
    commit('before', '2026-02-01T08:00:00Z');
    commit('feat: during one', '2026-02-01T09:05:00Z');
    commit('fix: during two', '2026-02-01T09:15:00Z');
    commit('after', '2026-02-01T12:00:00Z');

    const commits = await collectCommits(repo, '2026-02-01T09:00:00.000Z', '2026-02-01T09:20:00.000Z');
    expect(commits.map((c) => c.subject)).toEqual(['feat: during one', 'fix: during two']);
    expect(commits[0].hash).toMatch(/^[0-9a-f]{7,}$/);
    expect(await collectCommits(path.join(root, 'missing'), '2026-02-01T09:00:00.000Z', '2026-02-01T09:20:00.000Z')).toEqual([]);
    expect(await collectCommits(undefined, 'a', 'b')).toEqual([]);
  });

  it('syncs Claude Code + Codex transcripts once, then reports them up to date', async () => {
    const claudeDir = path.join(root, 'claude');
    const codexHome = path.join(root, 'codex');
    const oldClaude = process.env.CLAUDE_CONFIG_DIR;
    const oldCodex = process.env.CODEX_HOME;
    process.env.CLAUDE_CONFIG_DIR = claudeDir;
    process.env.CODEX_HOME = codexHome;
    try {
      const repo = path.join(root, 'repo');
      await fs.mkdir(path.join(claudeDir, 'projects', '-work-sync'), { recursive: true });
      const claudeId = 'aaaaaaaa-1111-2222-3333-444444444444';
      await fs.writeFile(
        path.join(claudeDir, 'projects', '-work-sync', `${claudeId}.jsonl`),
        [
          JSON.stringify({ type: 'user', sessionId: claudeId, cwd: repo, timestamp: '2026-02-01T09:00:00.000Z', message: { content: 'add the sync command' } }),
          JSON.stringify({
            type: 'assistant', sessionId: claudeId, cwd: repo, timestamp: '2026-02-01T09:20:00.000Z',
            message: { id: 'm1', model: 'claude-sonnet-5-5', usage: { input_tokens: 5, output_tokens: 7, cache_read_input_tokens: 100 }, content: [{ type: 'text', text: 'done' }] },
          }),
        ].join('\n'),
      );
      const codexId = 'bbbbbbbb-1111-2222-3333-444444444444';
      const day = path.join(codexHome, 'sessions', '2026', '02', '01');
      await fs.mkdir(day, { recursive: true });
      await fs.writeFile(
        path.join(day, `rollout-2026-02-01T10-00-00-${codexId}.jsonl`),
        [
          JSON.stringify({ timestamp: '2026-02-01T10:00:00.000Z', type: 'session_meta', payload: { id: codexId, cwd: '/work/codex-app' } }),
          JSON.stringify({ timestamp: '2026-02-01T10:00:01.000Z', type: 'response_item', payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'port the parser' }] } }),
        ].join('\n'),
      );

      const first = await syncTranscripts({ days: 3650 });
      expect(first.scanned).toBe(2);
      expect(first.created).toBe(2);
      expect(first.failed).toEqual([]);

      const claude = await findSessionByClaudeId(claudeId);
      expect(claude?.metadata?.source).toBe('claude-code');
      expect(claude?.metadata?.tokens).toEqual({ input: 5, output: 7, cacheRead: 100, cacheWrite: 0, total: 112 });
      expect(claude?.metadata?.models).toEqual({ 'claude-sonnet-5-5': 1 });
      expect((claude?.metadata?.commits as Array<{ subject: string }>).map((c) => c.subject)).toEqual(['feat: during one', 'fix: during two']);
      expect(claude?.summary).toContain('Commits:');

      const codex = await findSessionByClaudeId(codexId);
      expect(codex?.metadata?.source).toBe('codex');
      expect(codex?.metadata?.claudeSessionId).toBeUndefined();
      expect(codex?.tags).toEqual(expect.arrayContaining(['codex', 'auto-capture', 'codex-app']));

      const second = await syncTranscripts({ days: 3650 });
      expect(second.upToDate).toBe(2);
      expect(second.created + second.updated).toBe(0);

      const onlyCodex = await syncTranscripts({ days: 3650, agent: 'codex' });
      expect(onlyCodex.scanned).toBe(1);
    } finally {
      if (oldClaude === undefined) delete process.env.CLAUDE_CONFIG_DIR; else process.env.CLAUDE_CONFIG_DIR = oldClaude;
      if (oldCodex === undefined) delete process.env.CODEX_HOME; else process.env.CODEX_HOME = oldCodex;
    }
  });

  it('re-capture goes through the index and never duplicates', async () => {
    const file = path.join(root, 'cccccccc-1111-2222-3333-444444444444.jsonl');
    await fs.writeFile(file, JSON.stringify({ type: 'user', sessionId: 'cccccccc-1111-2222-3333-444444444444', cwd: '/work/idx', timestamp: '2026-02-02T09:00:00.000Z', message: { content: 'hello index' } }));
    const a = await captureTranscript(file);
    const b = await captureTranscript(file);
    expect(a.status).toBe('created');
    expect(b.status).toBe('updated');
    expect(b.sessionId).toBe(a.sessionId);
    const index = JSON.parse(await fs.readFile(path.join(sessionStorage.getStorageDir(), 'capture-index.idx'), 'utf-8')) as Record<string, string>;
    expect(index['cccccccc-1111-2222-3333-444444444444']).toBe(a.sessionId);
    // A stale index entry falls back to a scan instead of creating a duplicate.
    await fs.writeFile(path.join(sessionStorage.getStorageDir(), 'capture-index.idx'), JSON.stringify({ 'cccccccc-1111-2222-3333-444444444444': 'session_gone' }));
    expect((await captureTranscript(file)).sessionId).toBe(a.sessionId);
  });

  it('digest totals include tokens, models, commits and sources', async () => {
    const d = await digestTool({ since: '2026-02-01', until: '2026-02-02', language: 'en' });
    expect(d.success).toBe(true);
    expect(d.totals.sources).toEqual({ 'claude-code': 1, codex: 1 });
    expect(d.totals.tokens.total).toBe(112);
    expect(d.totals.models).toEqual({ 'claude-sonnet-5-5': 1 });
    expect(d.totals.commits).toBe(2);
    expect(d.content).toContain('**112 tokens**');
    expect(d.content).toContain('**2 commits**');
    expect(d.content).toContain('Commits: `');
  });

  it('localDate uses the local calendar day', () => {
    const d = new Date(2026, 10, 25, 0, 30);
    expect(localDate(d)).toBe('2026-11-25');
    expect(localDate('not a date')).toBe('not a date');
  });
});
