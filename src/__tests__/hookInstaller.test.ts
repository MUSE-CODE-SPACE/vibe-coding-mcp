import * as path from 'path';
import * as os from 'os';
import { promises as fs } from 'fs';
import {
  mergeHooks,
  removeHooks,
  hooksInstalled,
  hookCommand,
  buildHookGroups,
  readSettings,
  writeSettingsWithBackup,
  settingsPathFor,
  ClaudeSettings,
} from '../core/hookInstaller.js';

const CMD = 'npx -y vibe-coding-mcp hook';

describe('hookInstaller', () => {
  it('builds Stop (async) + SessionEnd hook groups', () => {
    const g = buildHookGroups(CMD);
    expect(Object.keys(g)).toEqual(['Stop', 'SessionEnd']);
    expect(g.Stop[0].hooks[0]).toEqual({ type: 'command', command: CMD, timeout: 60, async: true });
    expect(g.SessionEnd[0].hooks[0].async).toBeUndefined();
  });

  it('hookCommand prefers the binary on PATH', () => {
    expect(hookCommand(true)).toBe('vibe-coding-mcp hook');
    expect(hookCommand(false)).toBe(CMD);
  });

  it('merges into empty settings', () => {
    const { settings, changed } = mergeHooks({}, CMD);
    expect(changed).toBe(true);
    expect(hooksInstalled(settings)).toEqual({ stop: true, sessionEnd: true });
  });

  it('preserves unrelated hooks and other keys, and is idempotent', () => {
    const base: ClaudeSettings = {
      permissions: { allow: ['Bash(ls)'] },
      hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo bye' }] }], PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'lint' }] }] },
    };
    const first = mergeHooks(base, CMD);
    expect(first.changed).toBe(true);
    expect(first.settings.permissions).toEqual({ allow: ['Bash(ls)'] });
    expect(first.settings.hooks!.PreToolUse).toEqual(base.hooks!.PreToolUse);
    expect(first.settings.hooks!.Stop).toHaveLength(2);
    expect(first.settings.hooks!.Stop[0].hooks[0].command).toBe('echo bye');

    const second = mergeHooks(first.settings, CMD);
    expect(second.changed).toBe(false);
    expect(second.settings.hooks!.Stop).toHaveLength(2);
    // original object untouched
    expect(base.hooks!.Stop).toHaveLength(1);
  });

  it('upgrades an older vibe-coding hook command in place', () => {
    const old: ClaudeSettings = { hooks: { Stop: [{ hooks: [{ type: 'command', command: 'vibe-coding-mcp hook --legacy' }] }] } };
    const { settings, changed } = mergeHooks(old, CMD);
    expect(changed).toBe(true);
    expect(settings.hooks!.Stop).toHaveLength(1);
    expect(settings.hooks!.Stop[0].hooks[0].command).toBe(CMD);
  });

  it('removeHooks strips only ours and drops empty events', () => {
    const merged = mergeHooks({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo bye' }] }] } }, CMD).settings;
    const { settings, changed } = removeHooks(merged);
    expect(changed).toBe(true);
    expect(settings.hooks).toEqual({ Stop: [{ hooks: [{ type: 'command', command: 'echo bye' }] }] });

    const clean = removeHooks({ hooks: { SessionEnd: [{ hooks: [{ type: 'command', command: CMD }] }] } }).settings;
    expect(clean.hooks).toBeUndefined();
    expect(removeHooks({}).changed).toBe(false);
  });

  describe('file IO', () => {
    let dir: string;
    beforeAll(async () => {
      dir = await fs.mkdtemp(path.join(os.tmpdir(), 'vibe-hooks-'));
    });
    afterAll(async () => {
      await fs.rm(dir, { recursive: true, force: true });
    });

    it('readSettings returns {} for a missing or empty file and rejects non-objects', async () => {
      expect(await readSettings(path.join(dir, 'missing.json'))).toEqual({});
      const empty = path.join(dir, 'empty.json');
      await fs.writeFile(empty, '   ');
      expect(await readSettings(empty)).toEqual({});
      const arr = path.join(dir, 'arr.json');
      await fs.writeFile(arr, '[1]');
      await expect(readSettings(arr)).rejects.toThrow(/JSON object/);
    });

    it('writeSettingsWithBackup creates dirs, backs up, writes pretty JSON', async () => {
      const file = path.join(dir, 'nested', 'settings.json');
      const first = await writeSettingsWithBackup(file, { a: 1 });
      expect(first.backup).toBeUndefined();
      const second = await writeSettingsWithBackup(file, { a: 2 });
      expect(second.backup).toMatch(/settings\.json\.bak-/);
      expect(JSON.parse(await fs.readFile(second.backup!, 'utf-8'))).toEqual({ a: 1 });
      expect(await fs.readFile(file, 'utf-8')).toBe('{\n  "a": 2\n}\n');
    });

    it('settingsPathFor honours CLAUDE_CONFIG_DIR and cwd', () => {
      const prev = process.env.CLAUDE_CONFIG_DIR;
      process.env.CLAUDE_CONFIG_DIR = '/cfg';
      try {
        expect(settingsPathFor('global')).toBe(path.join('/cfg', 'settings.json'));
        expect(settingsPathFor('project', '/proj')).toBe(path.join('/proj', '.claude', 'settings.json'));
        expect(settingsPathFor('local', '/proj')).toBe(path.join('/proj', '.claude', 'settings.local.json'));
      } finally {
        if (prev === undefined) delete process.env.CLAUDE_CONFIG_DIR;
        else process.env.CLAUDE_CONFIG_DIR = prev;
      }
    });
  });
});
