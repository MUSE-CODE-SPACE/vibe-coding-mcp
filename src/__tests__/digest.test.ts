import * as path from 'path';
import * as os from 'os';
import { promises as fs } from 'fs';
import * as sessionStorage from '../core/sessionStorage.js';
import { digestTool, resolveRange } from '../tools/digest.js';
import { readSessionsToday, readSearch, readResource } from '../core/resources.js';

let storageDir: string;

function iso(daysAgo: number, hour = 10): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

async function seed(title: string, daysAgo: number, project: string, files: string[], decisions = 0, tags: string[] = []) {
  return sessionStorage.saveSession({
    title,
    summary: `1 prompt(s).\n\nWhat was asked:\n- ${title} please`,
    tags: ['claude-code', 'auto-capture', project, ...tags],
    codeContexts: [],
    designDecisions: Array.from({ length: decisions }, (_, i) => ({
      id: `d${i}`, title: `Decision ${i} for ${title}`, description: 'desc', rationale: 'because', category: 'other', timestamp: iso(daysAgo),
    })),
    metadata: { source: 'claude-code', claudeSessionId: `c-${title}`, project, startedAt: iso(daysAgo), durationSec: 600, promptCount: 1, filesTouched: files },
  });
}

beforeAll(async () => {
  storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vibe-digest-'));
  await sessionStorage.initializeStorage(storageDir);
  await seed('auth refactor', 0, 'api', ['src/auth.ts', 'src/db.ts'], 2, ['auth']);
  await seed('fix checkout bug', 1, 'web', ['src/checkout.tsx', 'src/auth.ts'], 1);
  await seed('old work', 40, 'web', ['legacy.js'], 0);
});

afterAll(async () => {
  await fs.rm(storageDir, { recursive: true, force: true });
});

describe('resolveRange', () => {
  const now = new Date('2026-05-13T15:00:00'); // a Wednesday
  it('today / yesterday', () => {
    const t = resolveRange({ period: 'today' }, now);
    expect(t.since.getDate()).toBe(13);
    expect(t.until.getDate()).toBe(14);
    const y = resolveRange({ period: 'yesterday' }, now);
    expect(y.since.getDate()).toBe(12);
    expect(y.until.getDate()).toBe(13);
  });
  it('week starts Monday', () => {
    const w = resolveRange({ period: 'week' }, now);
    expect(w.since.getDay()).toBe(1);
    expect(w.since.getDate()).toBe(11);
    expect(w.until.getDate()).toBe(18);
    const lw = resolveRange({ period: 'last-week' }, now);
    expect(lw.since.getDate()).toBe(4);
    expect(lw.until.getDate()).toBe(11);
  });
  it('month and custom', () => {
    const m = resolveRange({ period: 'month' }, now);
    expect(m.since.getDate()).toBe(1);
    expect(m.until.getMonth()).toBe(5);
    const c = resolveRange({ since: '2026-01-01', until: '2026-02-01' }, now);
    expect(c.period).toBe('custom');
    expect(() => resolveRange({ period: 'custom', since: 'nope' }, now)).toThrow(/ISO dates/);
  });
});

describe('muse_digest', () => {
  it('builds a custom-range digest with totals, groups, top files and markdown', async () => {
    const out = await digestTool({ since: iso(3).slice(0, 10), until: iso(-1).slice(0, 10), groupBy: 'project' });
    expect(out.success).toBe(true);
    expect(out.totals.sessions).toBe(2);
    expect(out.totals.durationSec).toBe(1200);
    expect(out.totals.designDecisions).toBe(3);
    expect(out.totals.uniqueFiles).toBe(3);
    expect(out.totals.projects).toEqual(['api', 'web']);
    expect(out.groups.map((g) => g.key).sort()).toEqual(['api', 'web']);
    expect(out.topFiles[0]).toEqual({ file: 'src/auth.ts', sessions: 2 });
    expect(out.content).toContain('# Vibe Coding Digest');
    expect(out.content).toContain('## Highlights');
    expect(out.content).toContain('**auth refactor**');
    expect(out.content).toContain('`src/auth.ts` — 2×');
  });

  it('filters by tag and project, groups by tag, localises to Korean, includes prompts', async () => {
    const byTag = await digestTool({ since: iso(3).slice(0, 10), until: iso(-1).slice(0, 10), tags: ['auth'], groupBy: 'tag', language: 'ko', includePrompts: true });
    expect(byTag.totals.sessions).toBe(1);
    expect(byTag.groups[0].key).toBe('api'); // user tags only (marker tags hidden)
    expect(byTag.content).toContain('바이브 코딩 다이제스트');
    expect(byTag.content).toContain('요청 내용: auth refactor please');

    const byProject = await digestTool({ since: iso(3).slice(0, 10), until: iso(-1).slice(0, 10), project: 'web' });
    expect(byProject.totals.sessions).toBe(1);
    expect(byProject.groups[0].sessions[0].title).toBe('fix checkout bug');
  });

  it('returns a helpful empty digest when nothing is in range', async () => {
    const out = await digestTool({ since: '2000-01-01', until: '2000-01-02' });
    expect(out.success).toBe(true);
    expect(out.totals.sessions).toBe(0);
    expect(out.content).toContain('No captured sessions');
  });

  it('json format omits markdown', async () => {
    const out = await digestTool({ period: 'month', format: 'json' });
    expect(out.success).toBe(true);
    expect(out.content).toBeUndefined();
  });

  it('rejects invalid custom dates', async () => {
    const out = await digestTool({ period: 'custom', since: 'garbage' });
    expect(out.success).toBe(false);
    expect(out.error).toMatch(/ISO dates/);
  });
});

describe('v2.15 resources', () => {
  it('sessions/today lists only today', async () => {
    const r = await readSessionsToday('vibe-coding://sessions/today');
    const body = JSON.parse(r.text);
    expect(body.total).toBe(1);
    expect(body.sessions[0].title).toBe('auth refactor');
    expect(body.sessions[0].filesTouched).toEqual(['src/auth.ts', 'src/db.ts']);
  });

  it('search/{query} matches titles and touched file paths, URL-decoded', async () => {
    const byTitle = JSON.parse((await readSearch('vibe-coding://search/checkout%20bug', 'checkout%20bug')).text);
    expect(byTitle.query).toBe('checkout bug');
    expect(byTitle.sessions.map((s: { title: string }) => s.title)).toEqual(['fix checkout bug']);

    const byFile = JSON.parse((await readSearch('vibe-coding://search/auth.ts', 'auth.ts')).text);
    expect(byFile.total).toBe(2);
  });

  it('readResource dispatches the new URIs', async () => {
    expect(await readResource('vibe-coding://sessions/today')).not.toBeNull();
    expect(await readResource('vibe-coding://search/legacy')).not.toBeNull();
    expect(await readResource('vibe-coding://nope')).toBeNull();
  });
});
