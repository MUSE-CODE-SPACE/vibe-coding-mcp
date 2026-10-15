import * as path from 'path';
import * as os from 'os';
import { promises as fs } from 'fs';
import * as sessionStorage from '../core/sessionStorage.js';
import { captureTranscript, buildTitle, buildTags, findSessionByClaudeId } from '../core/captureEngine.js';
import { captureTranscriptTool } from '../tools/captureTranscript.js';
import { projectSlug } from '../core/transcriptParser.js';

const SID = '11111111-2222-3333-4444-555555555555';
const CWD = '/tmp/demo-project';

function rec(obj: Record<string, unknown>): string {
  return JSON.stringify({ sessionId: SID, cwd: CWD, gitBranch: 'feature/login', version: '2.1.0', ...obj });
}

const TRANSCRIPT = [
  rec({ type: 'user', timestamp: '2026-02-01T09:00:00.000Z', message: { content: 'Build the login page. We decided to use react-hook-form because it is lightweight instead of formik.' } }),
  rec({
    type: 'assistant',
    timestamp: '2026-02-01T09:10:00.000Z',
    message: {
      content: [
        { type: 'text', text: 'I will implement it with react-hook-form since the bundle is smaller.' },
        { type: 'tool_use', id: 'a', name: 'Write', input: { file_path: `${CWD}/src/pages/Login.tsx`, content: 'export default function Login() {}' } },
        { type: 'tool_use', id: 'b', name: 'Write', input: { file_path: `${CWD}/src/lib/auth.ts`, content: 'export const login = () => {};' } },
        { type: 'tool_use', id: 'c', name: 'Bash', input: { command: 'npm run build' } },
      ],
    },
  }),
  rec({ type: 'user', timestamp: '2026-02-01T09:20:00.000Z', message: { content: 'ship it' } }),
].join('\n');

let storageDir: string;
let transcriptPath: string;

beforeAll(async () => {
  storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vibe-capture-'));
  await sessionStorage.initializeStorage(storageDir);
  transcriptPath = path.join(storageDir, `${SID}.jsonl`);
  await fs.writeFile(transcriptPath, TRANSCRIPT);
});

afterAll(async () => {
  await fs.rm(storageDir, { recursive: true, force: true });
});

describe('captureEngine', () => {
  it('creates a session from a transcript with title, tags, files, metadata', async () => {
    const r = await captureTranscript(transcriptPath, { hookEvent: 'Stop' });
    expect(r.status).toBe('created');
    expect(r.sessionId).toBeDefined();
    expect(r.title).toBe('Build the login page. We decided to use react-hook-form because it is lightweight instead of formik.');
    expect(r.stats).toMatchObject({ prompts: 2, assistantTurns: 1, filesChanged: 2, commands: 1, durationSec: 1200 });

    const stored = await sessionStorage.getSession(r.sessionId!);
    expect(stored).not.toBeNull();
    expect(stored!.tags).toEqual(expect.arrayContaining(['claude-code', 'auto-capture', 'demo-project', 'tsx', 'typescript']));
    expect(stored!.codeContexts).toHaveLength(2);
    expect(stored!.codeContexts[0].codeBlocks[0].filename).toBe('src/pages/Login.tsx');
    expect(stored!.summary).toContain('What was asked:');
    expect(stored!.summary).toContain('- ship it');

    const meta = stored!.metadata as Record<string, unknown>;
    expect(meta).toMatchObject({
      source: 'claude-code',
      claudeSessionId: SID,
      project: 'demo-project',
      gitBranch: 'feature/login',
      hookEvent: 'Stop',
      captureCount: 1,
      promptCount: 2,
      commandCount: 1,
    });
    expect(meta.filesTouched).toEqual(['src/pages/Login.tsx', 'src/lib/auth.ts']);
    expect(meta.toolCounts).toEqual({ Write: 2, Bash: 1 });
  });

  it('is idempotent per Claude session: a second capture updates, keeps user tags, bumps captureCount', async () => {
    const existing = await findSessionByClaudeId(SID);
    expect(existing).not.toBeNull();
    await sessionStorage.updateSession(existing!.id, { tags: [...existing!.tags, 'reviewed'] });

    const r = await captureTranscript(transcriptPath, { hookEvent: 'SessionEnd' });
    expect(r.status).toBe('updated');
    expect(r.sessionId).toBe(existing!.id);

    const { total } = await sessionStorage.listSessions();
    expect(total).toBe(1);

    const stored = await sessionStorage.getSession(existing!.id);
    expect(stored!.tags).toContain('reviewed');
    expect((stored!.metadata as Record<string, unknown>).captureCount).toBe(2);
    expect((stored!.metadata as Record<string, unknown>).hookEvent).toBe('SessionEnd');
  });

  it('extracts design decisions from the conversation without an API key', async () => {
    const r = await captureTranscript(transcriptPath, { dryRun: true });
    expect(r.status).toBe('dry-run');
    expect(r.stats.designDecisions).toBeGreaterThan(0);
    expect(r.session!.designDecisions[0]).toEqual(
      expect.objectContaining({ id: expect.any(String), title: expect.any(String), category: expect.any(String) }),
    );
  });

  it('skips transcripts with no prompts and no file changes', async () => {
    const empty = path.join(storageDir, 'empty.jsonl');
    await fs.writeFile(empty, rec({ type: 'assistant', timestamp: '2026-02-01T00:00:00.000Z', message: { content: [{ type: 'text', text: 'hello' }] } }));
    const r = await captureTranscript(empty);
    expect(r.status).toBe('skipped');
    expect(r.reason).toMatch(/fewer than 1 prompt/);
  });

  it('buildTitle prefers ai-title, then first prompt line, then a dated fallback', () => {
    expect(buildTitle({ aiTitle: 'Nice title', userPrompts: [{ text: 'x' }], assistantTexts: [], fileChanges: [], commands: [], toolCounts: {}, assistantTurns: 0, skippedLines: 0 })).toBe('Nice title');
    expect(buildTitle({ userPrompts: [{ text: '[pasted: email…]\nfix the bug' }], assistantTexts: [], fileChanges: [], commands: [], toolCounts: {}, assistantTurns: 0, skippedLines: 0 })).toBe('fix the bug');
    expect(buildTitle({ startedAt: '2026-03-04T00:00:00Z', userPrompts: [], assistantTexts: [], fileChanges: [], commands: [], toolCounts: {}, assistantTurns: 0, skippedLines: 0 })).toBe('Claude Code session 2026-03-04');
  });

  it('buildTags skips data-only languages and adds extras', () => {
    const tags = buildTags(
      {
        userPrompts: [], assistantTexts: [], commands: [], toolCounts: {}, assistantTurns: 0, skippedLines: 0,
        fileChanges: [
          { filePath: '/p/a.json', kind: 'write', touches: 9, language: 'json' },
          { filePath: '/p/b.go', kind: 'edit', touches: 1, language: 'go' },
          // bare unknown extension must not become a tag
          { filePath: '/p/notes.txt', kind: 'write', touches: 5, language: 'txt' },
        ],
      },
      '/p/My Project',
      ['sprint-3'],
    );
    expect(tags).toEqual(['claude-code', 'auto-capture', 'my-project', 'go', 'sprint-3']);
  });
});

describe('muse_capture_transcript tool', () => {
  it('previews a specific transcript without writing', async () => {
    const before = (await sessionStorage.listSessions()).total;
    const out = await captureTranscriptTool({ action: 'preview', transcriptPath });
    expect(out.success).toBe(true);
    expect(out.results![0].status).toBe('dry-run');
    expect((await sessionStorage.listSessions()).total).toBe(before);
  });

  it('reports a clear error when no transcript exists for cwd', async () => {
    const out = await captureTranscriptTool({ action: 'capture', cwd: '/definitely/not/a/project' });
    expect(out.success).toBe(false);
    expect(out.error).toMatch(/No Claude Code transcript found/);
  });

  it('lists transcripts for a cwd via CLAUDE_CONFIG_DIR', async () => {
    const prev = process.env.CLAUDE_CONFIG_DIR;
    const cfg = await fs.mkdtemp(path.join(os.tmpdir(), 'vibe-cfg-'));
    process.env.CLAUDE_CONFIG_DIR = cfg;
    try {
      const dir = path.join(cfg, 'projects', projectSlug(CWD));
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, 'one.jsonl'), TRANSCRIPT);
      const out = await captureTranscriptTool({ action: 'list', cwd: CWD });
      expect(out.success).toBe(true);
      expect(out.transcripts).toHaveLength(1);

      const cap = await captureTranscriptTool({ action: 'capture', cwd: CWD, all: true, tags: ['backfill'] });
      expect(cap.success).toBe(true);
      expect(cap.results![0].status).toBe('updated'); // same Claude session id as the first test
      const stored = await sessionStorage.getSession(cap.results![0].sessionId!);
      expect(stored!.tags).toContain('backfill');
    } finally {
      if (prev === undefined) delete process.env.CLAUDE_CONFIG_DIR;
      else process.env.CLAUDE_CONFIG_DIR = prev;
      await fs.rm(cfg, { recursive: true, force: true });
    }
  });
});
