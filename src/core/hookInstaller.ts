/**
 * Claude Code hook installer — writes the `Stop` + `SessionEnd` hooks that
 * invoke `vibe-coding-mcp hook` into a Claude Code settings file, merging
 * with whatever is already there and backing the file up first.
 */

import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

export const HOOK_MARKER = 'vibe-coding-mcp hook';

export interface HookHandler {
  type: 'command';
  command: string;
  timeout?: number;
  async?: boolean;
}

export interface HookGroup {
  matcher?: string;
  hooks: HookHandler[];
}

export interface ClaudeSettings {
  hooks?: Record<string, HookGroup[]>;
  mcpServers?: Record<string, unknown>;
  [key: string]: unknown;
}

export type SettingsScope = 'global' | 'project' | 'local';

export function settingsPathFor(scope: SettingsScope, cwd: string = process.cwd()): string {
  switch (scope) {
    case 'global':
      return path.join(process.env.CLAUDE_CONFIG_DIR ?? path.join(os.homedir(), '.claude'), 'settings.json');
    case 'project':
      return path.join(cwd, '.claude', 'settings.json');
    case 'local':
      return path.join(cwd, '.claude', 'settings.local.json');
  }
}

/** The hook command. Prefers a globally-installed binary, falls back to npx. */
export function hookCommand(binaryOnPath: boolean): string {
  return binaryOnPath ? 'vibe-coding-mcp hook' : 'npx -y vibe-coding-mcp hook';
}

/** Build the hook groups we install. */
export function buildHookGroups(command: string): Record<string, HookGroup[]> {
  return {
    // Fires after every assistant turn — incremental capture, run in the background.
    Stop: [{ hooks: [{ type: 'command', command, timeout: 60, async: true }] }],
    // Fires once when the session closes — final capture.
    SessionEnd: [{ hooks: [{ type: 'command', command, timeout: 60 }] }],
  };
}

function hasMarker(group: HookGroup): boolean {
  return group.hooks?.some((h) => typeof h.command === 'string' && h.command.includes(HOOK_MARKER)) ?? false;
}

/**
 * Pure merge: returns a new settings object with our hooks present exactly
 * once per event. Existing unrelated hooks are preserved. A previously
 * installed vibe-coding hook (any command text containing the marker) is
 * replaced so re-running `init` upgrades the command.
 */
export function mergeHooks(settings: ClaudeSettings, command: string): { settings: ClaudeSettings; changed: boolean } {
  const next: ClaudeSettings = { ...settings, hooks: { ...(settings.hooks ?? {}) } };
  const desired = buildHookGroups(command);
  let changed = false;

  for (const [event, groups] of Object.entries(desired)) {
    const existing = next.hooks![event] ?? [];
    const kept = existing.filter((g) => !hasMarker(g));
    const removed = existing.length - kept.length;
    const already = existing.find((g) => hasMarker(g));
    const sameCommand = already?.hooks.every((h) => h.command === command) && removed === 1;
    if (sameCommand && already) {
      // Keep as-is (but normalise position).
      continue;
    }
    next.hooks![event] = [...kept, ...groups];
    changed = true;
  }
  return { settings: next, changed };
}

/** Remove our hooks (pure). */
export function removeHooks(settings: ClaudeSettings): { settings: ClaudeSettings; changed: boolean } {
  if (!settings.hooks) return { settings, changed: false };
  const hooks: Record<string, HookGroup[]> = {};
  let changed = false;
  for (const [event, groups] of Object.entries(settings.hooks)) {
    const kept = groups.filter((g) => !hasMarker(g));
    if (kept.length !== groups.length) changed = true;
    if (kept.length) hooks[event] = kept;
  }
  const next: ClaudeSettings = { ...settings };
  if (Object.keys(hooks).length) next.hooks = hooks;
  else delete next.hooks;
  return { settings: next, changed };
}

export async function readSettings(file: string): Promise<ClaudeSettings> {
  try {
    const text = await fs.readFile(file, 'utf-8');
    if (!text.trim()) return {};
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${file} does not contain a JSON object`);
    }
    return parsed as ClaudeSettings;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw err;
  }
}

export async function writeSettingsWithBackup(file: string, settings: ClaudeSettings): Promise<{ backup?: string }> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  let backup: string | undefined;
  try {
    await fs.access(file);
    backup = `${file}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    await fs.copyFile(file, backup);
  } catch {
    /* no existing file */
  }
  await fs.writeFile(file, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
  return { backup };
}

/** Does any event in the settings carry our hook? */
export function hooksInstalled(settings: ClaudeSettings): { stop: boolean; sessionEnd: boolean } {
  const has = (event: string) => (settings.hooks?.[event] ?? []).some(hasMarker);
  return { stop: has('Stop'), sessionEnd: has('SessionEnd') };
}
