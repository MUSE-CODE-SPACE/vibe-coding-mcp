/**
 * Tests for the unified tool registry. The whole point of Phase 3 was to
 * stop the SSE-entry-point-7-tools vs stdio-entry-point-15-tools drift, so
 * these tests pin the contract.
 */

import {
  TOOL_REGISTRY,
  getToolNames,
  getToolDescriptors,
  findTool,
  callToolByName,
} from '../core/toolRegistry.js';

describe('toolRegistry', () => {
  it('exposes exactly 15 tools', () => {
    expect(TOOL_REGISTRY).toHaveLength(15);
    expect(getToolNames()).toHaveLength(15);
  });

  it('includes every muse_* tool the stdio entry point used to expose', () => {
    const names = getToolNames();
    const expected = [
      'muse_collect_code_context',
      'muse_summarize_design_decisions',
      'muse_generate_dev_document',
      'muse_normalize_for_platform',
      'muse_publish_document',
      'muse_create_session_log',
      'muse_analyze_code',
      'muse_session_history',
      'muse_export_session',
      'muse_project_profile',
      'muse_git',
      'muse_session_stats',
      'muse_auto_tag',
      'muse_template',
      'muse_batch',
    ];
    for (const name of expected) {
      expect(names).toContain(name);
    }
  });

  it('every tool descriptor has name, description, and inputSchema', () => {
    for (const tool of TOOL_REGISTRY) {
      expect(typeof tool.descriptor.name).toBe('string');
      expect(typeof tool.descriptor.description).toBe('string');
      expect(tool.descriptor.inputSchema).toBeDefined();
      expect(typeof tool.handler).toBe('function');
    }
  });

  it('findTool() returns the matching tool by name', () => {
    const tool = findTool('muse_collect_code_context');
    expect(tool).toBeDefined();
    expect(tool?.descriptor.name).toBe('muse_collect_code_context');
  });

  it('findTool() returns undefined for unknown tool', () => {
    expect(findTool('muse_does_not_exist')).toBeUndefined();
  });

  it('callToolByName() wraps a successful call into MCP content envelope', async () => {
    const result = await callToolByName('muse_collect_code_context', {
      codeBlocks: [{ language: 'typescript', code: 'const x = 1;' }],
      conversationSummary: 'registry happy path',
    });
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.context.codeBlocks).toHaveLength(1);
  });

  it('callToolByName() returns NOT_FOUND error envelope for unknown tool', async () => {
    const result = await callToolByName('muse_bogus', {});
    expect(result.isError).toBe(true);
  });

  it('callToolByName() returns VALIDATION_ERROR envelope for bad input', async () => {
    // conversationSummary is required by the CollectCodeContextSchema
    const result = await callToolByName('muse_collect_code_context', { codeBlocks: [] });
    expect(result.isError).toBe(true);
  });
});
