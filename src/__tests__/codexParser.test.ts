import { parseCodexTranscriptText, parseApplyPatch, parseExecScript, readJsStringLiteral } from '../core/codexParser.js';
import { looksLikeCodexTranscript, parseTranscriptText } from '../core/transcriptParser.js';

const SID = '01a208e1-a9b3-7991-91ad-1545de225683';
const CWD = '/work/app';

function line(type: string, payload: Record<string, unknown>, timestamp: string): string {
  return JSON.stringify({ timestamp, type, payload });
}

function userMsg(texts: string[], kinds: string[] | undefined, timestamp: string): string {
  return line(
    'response_item',
    {
      type: 'message',
      role: 'user',
      content: texts.map((text) => ({ type: 'input_text', text })),
      ...(kinds ? { internal_chat_message_metadata_passthrough: { content_item_kinds: kinds } } : {}),
    },
    timestamp,
  );
}

const PATCH = '*** Begin Patch\n*** Add File: src/new.ts\n+export const a = 1;\n+export const b = 2;\n*** Update File: /work/app/src/old.py\n@@\n-x = 1\n+x = 2\n*** Delete File: src/gone.ts\n*** End Patch';

const ROLLOUT = [
  line('session_meta', { id: SID, cwd: CWD, cli_version: '0.171.0' }, '2026-11-23T10:00:00.000Z'),
  userMsg(['<codex_internal_context source="user_goal">\nUser set the goal: "ship the search page"\nUser set goal status: "active".\n</codex_internal_context>'], ['user.goal'], '2026-11-23T10:00:00.000Z'),
  userMsg(['# AGENTS.md instructions for /work/app\n...', '<environment_context>\n<cwd>/work/app</cwd>\n</environment_context>'], ['agents_md.instructions', 'environments.environment_context'], '2026-11-23T10:00:01.000Z'),
  line('turn_context', { model: 'gpt-6-astra', cwd: CWD }, '2026-11-23T10:00:02.000Z'),
  line('response_item', { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Looking at the code first.' }] }, '2026-11-23T10:00:05.000Z'),
  line('response_item', { type: 'custom_tool_call', name: 'exec', input: `text(await tools.exec_command({cmd:"rg --files -g '*.ts'","max_output_tokens":6000}));` }, '2026-11-23T10:00:06.000Z'),
  line('token_usage_record', { usage: { input_tokens: 100 } }, '2026-11-23T10:00:07.000Z'),
  line('event_msg', { type: 'token_count', info: { total_token_usage: { input_tokens: 1000, cached_input_tokens: 600, cache_write_input_tokens: 0, output_tokens: 50, total_tokens: 1050 } } }, '2026-11-23T10:00:07.000Z'),
  line('response_item', { type: 'custom_tool_call', name: 'exec', input: `text(await tools.apply_patch(${JSON.stringify(PATCH)}));\ntext(await tools.exec_command({"cmd":'npm test'}));` }, '2026-11-23T10:05:00.000Z'),
  line('token_usage_record', { usage: {} }, '2026-11-23T10:05:01.000Z'),
  line('event_msg', { type: 'token_count', info: { total_token_usage: { input_tokens: 5000, cached_input_tokens: 4000, cache_write_input_tokens: 0, output_tokens: 300, total_tokens: 5300 } } }, '2026-11-23T10:05:01.000Z'),
  // next morning: idle gap must not count
  userMsg(['now add tests', 'and docs'], ['user.text', 'user.text'], '2026-11-24T09:00:00.000Z'),
  line('response_item', { type: 'function_call', name: 'shell', arguments: JSON.stringify({ command: ['bash', '-lc', 'git status'] }) }, '2026-11-24T09:01:00.000Z'),
  'not json',
].join('\n');

describe('codexParser helpers', () => {
  it('decodes JS string literals', () => {
    expect(readJsStringLiteral('"a\\nb\\"c\\u0041"', 0)).toEqual({ value: 'a\nb"cA', end: 15 });
    expect(readJsStringLiteral("'it\\'s'", 0)?.value).toBe("it's");
    expect(readJsStringLiteral('`pre ${x} post`', 0)?.value).toBe('pre ');
    expect(readJsStringLiteral('x', 0)).toBeNull();
  });

  it('splits an apply_patch envelope per file', () => {
    const files = parseApplyPatch(PATCH);
    expect(files.map((f) => [f.filePath, f.kind])).toEqual([
      ['src/new.ts', 'write'],
      ['/work/app/src/old.py', 'edit'],
      ['src/gone.ts', 'delete'],
    ]);
    expect(files[0].added).toBe('export const a = 1;\nexport const b = 2;');
    expect(files[1].added).toBe('x = 2');
  });

  it('finds commands and patches inside an exec script', () => {
    const s = parseExecScript(`const r = await tools.exec_command({ cmd: "ls -la" });\nawait tools.view_image({path:"a.png"});`);
    expect(s.tools).toEqual(['exec_command', 'view_image']);
    expect(s.commands).toEqual(['ls -la']);
  });
});

describe('parseCodexTranscriptText', () => {
  const parsed = parseCodexTranscriptText(ROLLOUT);

  it('reads session metadata', () => {
    expect(parsed.source).toBe('codex');
    expect(parsed.claudeSessionId).toBe(SID);
    expect(parsed.cwd).toBe(CWD);
    expect(parsed.claudeVersion).toBe('0.171.0');
    expect(parsed.skippedLines).toBe(1);
  });

  it('keeps human prompts (goal + typed text) and drops injected context', () => {
    expect(parsed.userPrompts.map((p) => p.text)).toEqual(['ship the search page', 'now add tests\nand docs']);
    expect(parsed.assistantTexts).toEqual(['Looking at the code first.']);
    expect(parsed.assistantTurns).toBe(1);
  });

  it('extracts commands from exec scripts and legacy shell calls', () => {
    expect(parsed.commands.map((c) => c.command)).toEqual(["rg --files -g '*.ts'", 'npm test', 'git status']);
    expect(parsed.toolCounts).toEqual({ exec_command: 2, apply_patch: 1, shell: 1 });
  });

  it('extracts file changes from apply_patch (deletes excluded, relative paths resolved)', () => {
    expect(parsed.fileChanges.map((f) => [f.filePath, f.kind, f.language])).toEqual([
      ['/work/app/src/new.ts', 'write', 'typescript'],
      ['/work/app/src/old.py', 'edit', 'python'],
    ]);
    expect(parsed.fileChanges[0].lastSnippet).toContain('export const a = 1;');
  });

  it('takes the last cumulative token count and counts responses per model', () => {
    expect(parsed.tokens).toEqual({ input: 1000, output: 300, cacheRead: 4000, cacheWrite: 0, total: 5300 });
    expect(parsed.models).toEqual({ 'gpt-6-astra': 2 });
  });

  it('excludes the overnight gap from active duration', () => {
    expect(parsed.durationSec).toBe(5 * 60 + 1 + 60);
    expect(parsed.wallClockSec).toBeGreaterThan(80000);
  });

  it('falls back to prefix filtering when kinds metadata is absent', () => {
    const old = parseCodexTranscriptText(
      [
        line('session_meta', { id: 'x', cwd: CWD }, '2026-01-01T00:00:00.000Z'),
        userMsg(['<environment_context>…</environment_context>'], undefined, '2026-01-01T00:00:01.000Z'),
        userMsg(['fix the bug'], undefined, '2026-01-01T00:00:02.000Z'),
      ].join('\n'),
    );
    expect(old.userPrompts.map((p) => p.text)).toEqual(['fix the bug']);
  });
});

describe('format detection', () => {
  it('tells Codex rollouts from Claude Code transcripts', () => {
    expect(looksLikeCodexTranscript(ROLLOUT)).toBe(true);
    expect(looksLikeCodexTranscript(JSON.stringify({ type: 'user', sessionId: 's', message: { content: 'hi' } }))).toBe(false);
  });
});

describe('Claude Code parser: tokens and harness records', () => {
  const usage = (o: number) => ({ input_tokens: 10, output_tokens: o, cache_read_input_tokens: 1000, cache_creation_input_tokens: 200 });
  const rec = (o: Record<string, unknown>) => JSON.stringify({ sessionId: 's', timestamp: '2026-02-01T09:00:00.000Z', ...o });
  const parsed = parseTranscriptText(
    [
      rec({ type: 'user', message: { content: 'real question' } }),
      rec({ type: 'user', isMeta: true, message: { content: 'Base directory for this skill: /x' } }),
      rec({ type: 'user', isCompactSummary: true, message: { content: 'This session is being continued from a previous conversation' } }),
      rec({ type: 'user', origin: { kind: 'task-notification' }, message: { content: 'background finished' } }),
      rec({ type: 'user', origin: { kind: 'human' }, message: { content: '<local-command-caveat>ignore</local-command-caveat>second question' } }),
      // one API response split over two records: usage must be counted once
      rec({ type: 'assistant', message: { id: 'msg_1', model: 'claude-sonnet-5-5', usage: usage(5), content: [{ type: 'text', text: 'a' }] } }),
      rec({ type: 'assistant', message: { id: 'msg_1', model: 'claude-sonnet-5-5', usage: usage(40), content: [{ type: 'text', text: 'b' }] } }),
      rec({ type: 'assistant', message: { id: 'msg_2', model: 'claude-opus-5-5', usage: usage(60), content: [{ type: 'text', text: 'c' }] } }),
      rec({ type: 'assistant', message: { id: 'msg_3', model: '<synthetic>', usage: { input_tokens: 0, output_tokens: 0 }, content: [{ type: 'text', text: 'd' }] } }),
    ].join('\n'),
  );

  it('keeps only human prompts', () => {
    expect(parsed.userPrompts.map((p) => p.text)).toEqual(['real question', 'second question']);
  });

  it('sums usage once per API response', () => {
    expect(parsed.tokens).toEqual({ input: 20, output: 100, cacheRead: 2000, cacheWrite: 400, total: 2520 });
    expect(parsed.models).toEqual({ 'claude-sonnet-5-5': 1, 'claude-opus-5-5': 1 });
    expect(parsed.source).toBe('claude-code');
  });
});
