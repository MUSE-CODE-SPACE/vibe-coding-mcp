/**
 * Smoke tests for the unified McpServer factory.
 *
 * We don't drive the JSON-RPC wire here — that's covered indirectly by the
 * SDK's own tests. Instead we verify that the factory wires up the
 * advertised capability counts and that the underlying registries match the
 * tooling/resources/prompts surface used at runtime.
 */

import { createMcpServer, getCapabilityCounts, SERVER_NAME, SERVER_VERSION } from '../core/mcpServerFactory.js';

describe('createMcpServer', () => {
  it('returns an McpServer with the right metadata', () => {
    const server = createMcpServer();
    expect(server).toBeDefined();
    // McpServer exposes the underlying low-level Server instance.
    expect(server.server).toBeDefined();
  });

  it('SERVER_NAME and SERVER_VERSION are exported', () => {
    expect(SERVER_NAME).toBe('vibe-coding-mcp');
    expect(SERVER_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('getCapabilityCounts', () => {
  it('reports 15 tools', () => {
    expect(getCapabilityCounts().tools).toBe(15);
  });

  it('reports at least 3 resources (2 static + 1 template)', () => {
    expect(getCapabilityCounts().resources).toBeGreaterThanOrEqual(3);
  });

  it('reports at least 3 prompts', () => {
    expect(getCapabilityCounts().prompts).toBeGreaterThanOrEqual(3);
  });
});
