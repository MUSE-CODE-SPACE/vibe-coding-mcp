/**
 * Tests for MCP prompts — the high-level slash-command surface added
 * in v2.14.0.
 */

import { PROMPT_DESCRIPTORS, findPrompt, buildPrompt } from '../core/prompts.js';

describe('prompts descriptors', () => {
  it('exposes at least 3 prompts', () => {
    expect(PROMPT_DESCRIPTORS.length).toBeGreaterThanOrEqual(3);
  });

  it('includes daily-vibe-log, document-session, refactor-context', () => {
    const names = PROMPT_DESCRIPTORS.map((p) => p.name);
    expect(names).toContain('daily-vibe-log');
    expect(names).toContain('document-session');
    expect(names).toContain('refactor-context');
  });

  it('every prompt has description + arguments array', () => {
    for (const p of PROMPT_DESCRIPTORS) {
      expect(typeof p.description).toBe('string');
      expect(p.description.length).toBeGreaterThan(0);
      expect(Array.isArray(p.arguments)).toBe(true);
    }
  });
});

describe('findPrompt', () => {
  it('returns the prompt by name', () => {
    const p = findPrompt('document-session');
    expect(p).toBeDefined();
    expect(p?.descriptor.name).toBe('document-session');
  });

  it('returns undefined for unknown prompt', () => {
    expect(findPrompt('nope')).toBeUndefined();
  });
});

describe('buildPrompt', () => {
  it('daily-vibe-log builds with no arguments (uses today)', () => {
    const result = buildPrompt('daily-vibe-log', {});
    expect(result).not.toBeNull();
    expect(result!.messages).toHaveLength(1);
    expect(result!.messages[0].role).toBe('user');
    expect(result!.messages[0].content.text).toContain('muse_session_history');
  });

  it('daily-vibe-log honors explicit date argument', () => {
    const result = buildPrompt('daily-vibe-log', { date: '2026-01-15' });
    expect(result!.description).toContain('2026-01-15');
    expect(result!.messages[0].content.text).toContain('2026-01-15');
  });

  it('document-session embeds sessionId and documentType', () => {
    const result = buildPrompt('document-session', {
      sessionId: 'session_abc',
      documentType: 'README',
      platform: 'notion',
    });
    expect(result!.messages[0].content.text).toContain('session_abc');
    expect(result!.messages[0].content.text).toContain('README');
    expect(result!.messages[0].content.text).toContain('muse_publish_document');
  });

  it('document-session without platform skips publish step', () => {
    const result = buildPrompt('document-session', { sessionId: 'sx' });
    expect(result!.messages[0].content.text).toContain('(no publish)');
  });

  it('refactor-context calls muse_analyze_code and muse_git', () => {
    const result = buildPrompt('refactor-context', { sessionId: 'sx' });
    expect(result!.messages[0].content.text).toContain('muse_analyze_code');
    expect(result!.messages[0].content.text).toContain('muse_git');
  });

  it('returns null for unknown prompt name', () => {
    expect(buildPrompt('not-a-real-prompt', {})).toBeNull();
  });
});
