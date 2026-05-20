/**
 * Tests for MCP resources — the read-only context surface added in v2.14.0.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  STATIC_RESOURCE_DESCRIPTORS,
  RESOURCE_TEMPLATE_DESCRIPTORS,
  readResource,
  readSessionsList,
  readSessionDetail,
  readConfig,
} from '../core/resources.js';
import * as sessionStorage from '../core/sessionStorage.js';

let testDir: string;
let savedId: string;

beforeAll(async () => {
  testDir = path.join(os.tmpdir(), `vibe-resources-test-${Date.now()}`);
  await sessionStorage.initializeStorage(testDir);
  const saved = await sessionStorage.saveSession({
    title: 'Resources fixture',
    summary: 'A fixture session for resources.test',
    tags: ['fixture'],
    codeContexts: [],
    designDecisions: [],
  });
  savedId = saved.id;
});

afterAll(async () => {
  try {
    const files = await fs.readdir(testDir);
    for (const file of files) {
      await fs.unlink(path.join(testDir, file));
    }
    await fs.rmdir(testDir);
  } catch {
    // ignore
  }
});

describe('resources descriptors', () => {
  it('exposes 2 static resources + 1 template (3 logical resources)', () => {
    expect(STATIC_RESOURCE_DESCRIPTORS).toHaveLength(2);
    expect(RESOURCE_TEMPLATE_DESCRIPTORS).toHaveLength(1);
  });

  it('every static descriptor has uri, name, mimeType', () => {
    for (const d of STATIC_RESOURCE_DESCRIPTORS) {
      expect(d.uri).toMatch(/^vibe-coding:\/\//);
      expect(d.name.length).toBeGreaterThan(0);
      expect(d.mimeType).toBe('application/json');
    }
  });
});

describe('readSessionsList', () => {
  it('returns JSON with sessions array', async () => {
    const out = await readSessionsList('vibe-coding://sessions/list');
    expect(out.mimeType).toBe('application/json');
    const parsed = JSON.parse(out.text);
    expect(Array.isArray(parsed.sessions)).toBe(true);
    expect(parsed.total).toBeGreaterThanOrEqual(1);
  });
});

describe('readSessionDetail', () => {
  it('returns the full session JSON for a known id', async () => {
    const out = await readSessionDetail(`vibe-coding://sessions/${savedId}`, savedId);
    const parsed = JSON.parse(out.text);
    expect(parsed.id).toBe(savedId);
    expect(parsed.title).toBe('Resources fixture');
  });

  it('returns a NOT_FOUND envelope for unknown id', async () => {
    const out = await readSessionDetail('vibe-coding://sessions/missing', 'missing');
    const parsed = JSON.parse(out.text);
    expect(parsed.error).toBe('NOT_FOUND');
  });
});

describe('readConfig', () => {
  it('returns JSON describing platform configuration', () => {
    const out = readConfig('vibe-coding://config');
    const parsed = JSON.parse(out.text);
    expect(Array.isArray(parsed.platforms)).toBe(true);
    expect(parsed.platforms.length).toBeGreaterThan(0);
    expect(typeof parsed.valid).toBe('boolean');
  });
});

describe('readResource dispatcher', () => {
  it('routes sessions/list URI', async () => {
    const out = await readResource('vibe-coding://sessions/list');
    expect(out).not.toBeNull();
    expect(out!.mimeType).toBe('application/json');
  });

  it('routes config URI', async () => {
    const out = await readResource('vibe-coding://config');
    expect(out).not.toBeNull();
  });

  it('routes sessions/{id} template URI', async () => {
    const out = await readResource(`vibe-coding://sessions/${savedId}`);
    expect(out).not.toBeNull();
    const parsed = JSON.parse(out!.text);
    expect(parsed.id).toBe(savedId);
  });

  it('returns null for an unrecognised URI', async () => {
    const out = await readResource('vibe-coding://nope');
    expect(out).toBeNull();
  });
});
