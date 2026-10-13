import * as path from 'path';
import * as os from 'os';
import { promises as fs } from 'fs';
import {
  parseTranscriptText,
  parseTranscriptFile,
  cleanUserText,
  languageFromPath,
  projectSlug,
  findLatestTranscript,
  listTranscripts,
} from '../core/transcriptParser.js';

const SID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function rec(obj: Record<string, unknown>): string {
  return JSON.stringify({ sessionId: SID, cwd: '/tmp/proj', gitBranch: 'main', version: '2.1.0', ...obj });
}

function user(text: string | unknown[], ts: string): string {
  return rec({ type: 'user', timestamp: ts, message: { role: 'user', content: text } });
}

function assistant(blocks: unknown[], ts: string): string {
  return rec({ type: 'assistant', timestamp: ts, message: { role: 'assistant', content: blocks } });
}

const SAMPLE = [
  '{"type":"mode","mode":"normal"}',
  'not json at all',
  user('Add a login form\nwith validation', '2026-01-01T10:00:00.000Z'),
  assistant(
    [
      { type: 'thinking', thinking: 'secret' },
      { type: 'text', text: 'I decided to use react-hook-form because it is lightweight.' },
      { type: 'tool_use', id: 't1', name: 'Write', input: { file_path: '/tmp/proj/src/Login.tsx', content: 'export const Login = () => null;' } },
    ],
    '2026-01-01T10:01:00.000Z',
  ),
  user([{ type: 'tool_result', tool_use_id: 't1', content: 'ok' }], '2026-01-01T10:01:01.000Z'),
  assistant(
    [
      { type: 'tool_use', id: 't2', name: 'Edit', input: { file_path: '/tmp/proj/src/Login.tsx', old_string: 'null', new_string: '<form />' } },
      { type: 'tool_use', id: 't3', name: 'Bash', input: { command: 'npm test', description: 'Run tests' } },
      { type: 'tool_use', id: 't4', name: 'Read', input: { file_path: '/tmp/proj/package.json' } },
    ],
    '2026-01-01T10:02:00.000Z',
  ),
  rec({ type: 'assistant', isSidechain: true, timestamp: '2026-01-01T10:02:30.000Z', message: { content: [{ type: 'tool_use', id: 't9', name: 'Write', input: { file_path: '/tmp/proj/side.ts', content: 'x' } }] } }),
  user('<system-reminder>ignore me</system-reminder>Looks good, ship it', '2026-01-01T10:03:00.000Z'),
  assistant([{ type: 'text', text: 'Done.' }], '2026-01-01T10:05:00.000Z'),
  '{"type":"ai-title","title":"Login form with validation"}',
].join('\n');

describe('transcriptParser', () => {
  it('parses prompts, assistant text, file changes, commands, tool counts and timing', () => {
    const p = parseTranscriptText(SAMPLE);

    expect(p.claudeSessionId).toBe(SID);
    expect(p.cwd).toBe('/tmp/proj');
    expect(p.gitBranch).toBe('main');
    expect(p.skippedLines).toBe(1);

    expect(p.userPrompts.map((u) => u.text)).toEqual(['Add a login form\nwith validation', 'Looks good, ship it']);
    expect(p.assistantTexts).toEqual(['I decided to use react-hook-form because it is lightweight.', 'Done.']);
    expect(p.assistantTurns).toBe(3);

    expect(p.fileChanges).toHaveLength(1);
    const f = p.fileChanges[0];
    expect(f.filePath).toBe('/tmp/proj/src/Login.tsx');
    expect(f.touches).toBe(2);
    expect(f.language).toBe('tsx');
    // A whole-file Write wins over a later partial Edit for the snapshot.
    expect(f.kind).toBe('write');
    expect(f.lastSnippet).toBe('export const Login = () => null;');

    expect(p.commands).toEqual([{ command: 'npm test', description: 'Run tests', timestamp: '2026-01-01T10:02:00.000Z' }]);
    expect(p.toolCounts).toEqual({ Write: 1, Edit: 1, Bash: 1, Read: 1 });

    expect(p.startedAt).toBe('2026-01-01T10:00:00.000Z');
    expect(p.endedAt).toBe('2026-01-01T10:05:00.000Z');
    expect(p.durationSec).toBe(300);
    expect(p.aiTitle).toBe('Login form with validation');
  });

  it('ignores side-chain (sub-agent) records', () => {
    const p = parseTranscriptText(SAMPLE);
    expect(p.fileChanges.some((f) => f.filePath.endsWith('side.ts'))).toBe(false);
  });

  it('keeps an Edit snippet when no Write exists', () => {
    const text = assistant(
      [{ type: 'tool_use', id: 'e', name: 'Edit', input: { file_path: '/a/b.py', old_string: 'x', new_string: 'y = 2' } }],
      '2026-01-01T00:00:00.000Z',
    );
    const p = parseTranscriptText(text);
    expect(p.fileChanges[0]).toMatchObject({ kind: 'edit', language: 'python', lastSnippet: 'y = 2' });
  });

  it('handles MultiEdit and NotebookEdit inputs', () => {
    const text = assistant(
      [
        { type: 'tool_use', id: 'm', name: 'MultiEdit', input: { file_path: '/a/c.go', edits: [{ new_string: 'a' }, { new_string: 'b' }] } },
        { type: 'tool_use', id: 'n', name: 'NotebookEdit', input: { notebook_path: '/a/n.ipynb', new_source: 'print(1)' } },
      ],
      '2026-01-01T00:00:00.000Z',
    );
    const p = parseTranscriptText(text);
    expect(p.fileChanges.map((f) => [f.filePath, f.kind, f.lastSnippet])).toEqual([
      ['/a/c.go', 'edit', 'a\n\nb'],
      ['/a/n.ipynb', 'notebook', 'print(1)'],
    ]);
  });

  it('truncates long snippets and texts', () => {
    const big = 'x'.repeat(5000);
    const text = [
      user(big, '2026-01-01T00:00:00.000Z'),
      assistant([{ type: 'tool_use', id: 'w', name: 'Write', input: { file_path: '/a.ts', content: big } }], '2026-01-01T00:00:01.000Z'),
    ].join('\n');
    const p = parseTranscriptText(text, { maxSnippetChars: 100, maxTextChars: 50 });
    expect(p.fileChanges[0].lastSnippet!.length).toBeLessThan(200);
    expect(p.fileChanges[0].lastSnippet).toContain('[truncated 4900 chars]');
    expect(p.userPrompts[0].text).toContain('[truncated 4950 chars]');
  });

  it('returns an empty structure for an empty transcript', () => {
    const p = parseTranscriptText('');
    expect(p.userPrompts).toEqual([]);
    expect(p.fileChanges).toEqual([]);
    expect(p.durationSec).toBeUndefined();
  });

  describe('cleanUserText', () => {
    it('strips system reminders and command wrappers', () => {
      expect(cleanUserText('<system-reminder>x</system-reminder>hello <command-name>/foo</command-name>')).toBe('hello');
    });
    it('collapses pasted content to a short marker', () => {
      const out = cleanUserText('<pasted_content id="1">Dear team,\nlong email body here</pasted_content id="1">\n\nplease summarize this');
      expect(out).toMatch(/^\[pasted: Dear team, long email body here…\]\s+please summarize this$/);
    });
  });

  describe('languageFromPath', () => {
    it.each([
      ['a.ts', 'typescript'],
      ['a.tsx', 'tsx'],
      ['a.py', 'python'],
      ['a.rs', 'rust'],
      ['a.md', 'markdown'],
      ['Makefile', 'text'],
      ['a.unknownext', 'unknownext'],
    ])('%s → %s', (file, lang) => {
      expect(languageFromPath(file)).toBe(lang);
    });
  });

  it('projectSlug mirrors Claude Code folder naming', () => {
    expect(projectSlug('/Users/me/Projects/my app')).toBe('-Users-me-Projects-my-app');
  });

  describe('file discovery', () => {
    let configDir: string;
    let cwd: string;
    const prevEnv = process.env.CLAUDE_CONFIG_DIR;

    beforeAll(async () => {
      configDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vibe-claude-'));
      cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'vibe-proj-'));
      process.env.CLAUDE_CONFIG_DIR = configDir;
      const dir = path.join(configDir, 'projects', projectSlug(cwd));
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, 'old.jsonl'), SAMPLE);
      await new Promise((r) => setTimeout(r, 20));
      await fs.writeFile(path.join(dir, 'new.jsonl'), SAMPLE);
      const now = new Date();
      await fs.utimes(path.join(dir, 'new.jsonl'), now, now);
      await fs.utimes(path.join(dir, 'old.jsonl'), new Date(now.getTime() - 60000), new Date(now.getTime() - 60000));
    });

    afterAll(async () => {
      if (prevEnv === undefined) delete process.env.CLAUDE_CONFIG_DIR;
      else process.env.CLAUDE_CONFIG_DIR = prevEnv;
      await fs.rm(configDir, { recursive: true, force: true });
      await fs.rm(cwd, { recursive: true, force: true });
    });

    it('findLatestTranscript picks the newest .jsonl', async () => {
      const latest = await findLatestTranscript(cwd);
      expect(latest && path.basename(latest)).toBe('new.jsonl');
    });

    it('listTranscripts returns newest first', async () => {
      const list = await listTranscripts(cwd);
      expect(list.map((t) => path.basename(t.path))).toEqual(['new.jsonl', 'old.jsonl']);
    });

    it('returns null / [] for a directory without history', async () => {
      expect(await findLatestTranscript('/nonexistent/project/dir')).toBeNull();
      expect(await listTranscripts('/nonexistent/project/dir')).toEqual([]);
    });

    it('parseTranscriptFile falls back to the file name for the session id', async () => {
      const dir = path.join(configDir, 'projects', projectSlug(cwd));
      await fs.writeFile(path.join(dir, 'noid.jsonl'), '{"type":"user","message":{"content":"hi"}}');
      const p = await parseTranscriptFile(path.join(dir, 'noid.jsonl'));
      expect(p.claudeSessionId).toBe('noid');
    });
  });
});
