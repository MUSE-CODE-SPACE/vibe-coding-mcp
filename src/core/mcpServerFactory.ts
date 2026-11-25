/**
 * MCP server factory — builds a fully-wired `McpServer` instance using the
 * high-level `@modelcontextprotocol/sdk` API. Used by both entry points
 * (`src/index.ts` and `src/stdio.ts`) so they expose an identical surface:
 * 18 tools, 5 resources (two of which are templates), 6 prompts.
 *
 * High-level vs low-level: previously both entry points constructed a
 * low-level `Server` and registered request handlers for
 * `ListToolsRequestSchema` / `CallToolRequestSchema`. We now use
 * `McpServer.registerTool()`, `.resource()`, and `.prompt()` — the SDK turns
 * those registrations into the same JSON-RPC surface, but adds first-class
 * resources and prompts support along the way.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createRequire } from 'module';
import { z } from 'zod';

import { TOOL_REGISTRY, TOOL_ANNOTATIONS } from './toolRegistry.js';
import { createErrorResponse, ToolError } from './errors.js';
import {
  STATIC_RESOURCE_DESCRIPTORS,
  readSessionsList,
  readSessionDetail,
  readConfig,
  readSessionsToday,
  readSearch,
} from './resources.js';
import { PROMPT_DESCRIPTORS, findPrompt } from './prompts.js';
import { listSessions } from './sessionStorage.js';

const SERVER_NAME = 'vibe-coding-mcp';
// Single source of truth: package.json (dist/core → ../../package.json).
const SERVER_VERSION = (createRequire(import.meta.url)('../../package.json') as { version: string }).version;

/** Sent to clients in the `initialize` result; tells the model when to reach for which tool. */
const SERVER_INSTRUCTIONS = [
  'vibe-coding-mcp keeps a local memory of AI coding sessions (Claude Code and Codex CLI) and turns it into documents.',
  '- Starting work in a project touched before, or asked "why did we…" / "when did we change…": call muse_recall (cwd = project directory; add query to search).',
  '- Standup / weekly report / retro: muse_digest.',
  '- Nothing captured yet, or sessions are missing: muse_capture_transcript with action=sync backfills every Claude Code and Codex transcript on this machine.',
  '- One session in full: muse_session_history (action=get). Turn it into a README / design doc / PR description with muse_generate_dev_document, then muse_publish_document.',
  'All session data stays on this machine unless muse_publish_document or an AI option (useAI) is used.',
].join('\n');

/**
 * Build a new `McpServer` instance populated with all 18 tools, the resource
 * set, and the prompt set. The returned server is not yet connected to a
 * transport — caller is responsible for `server.connect(transport)`.
 */
export function createMcpServer(): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
      instructions: SERVER_INSTRUCTIONS,
    },
  );

  registerTools(server);
  registerResources(server);
  registerPrompts(server);

  return server;
}

/** Wire all 18 tools from the shared registry. */
function registerTools(server: McpServer): void {
  for (const tool of TOOL_REGISTRY) {
    const { name, description } = tool.descriptor;
    const { title, ...annotations } = TOOL_ANNOTATIONS[name] ?? { title: name };

    // Use `registerTool` with the Zod schema for the input. The SDK uses
    // `normalizeObjectSchema` internally, which accepts our pre-built
    // `z.object(...)` instances. SDK pre-validates `args` before calling the
    // handler; our handler then re-runs `validateInput()` defensively.
    server.registerTool(
      name,
      {
        title,
        description,
        inputSchema: tool.inputZodSchema as unknown as z.ZodTypeAny,
        annotations: { title, ...annotations },
      },
      async (args: unknown) => {
        try {
          const result = await tool.handler(args);
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return createErrorResponse(error);
        }
      },
    );
  }
}

/** Register the static + templated resources. */
function registerResources(server: McpServer): void {
  // Static: sessions/list
  server.resource(
    'sessions-list',
    'vibe-coding://sessions/list',
    { description: STATIC_RESOURCE_DESCRIPTORS[0].description, mimeType: 'application/json' },
    async (uri) => {
      const content = await readSessionsList(uri.toString());
      return { contents: [content] };
    },
  );

  // Static: sessions/today
  server.resource(
    'sessions-today',
    'vibe-coding://sessions/today',
    { description: STATIC_RESOURCE_DESCRIPTORS[1].description, mimeType: 'application/json' },
    async (uri) => {
      const content = await readSessionsToday(uri.toString());
      return { contents: [content] };
    },
  );

  // Static: config
  server.resource(
    'config',
    'vibe-coding://config',
    { description: STATIC_RESOURCE_DESCRIPTORS[2].description, mimeType: 'application/json' },
    async (uri) => {
      const content = readConfig(uri.toString());
      return { contents: [content] };
    },
  );

  // Template: sessions/{id}
  server.resource(
    'session-detail',
    new ResourceTemplate('vibe-coding://sessions/{id}', {
      // List variants of the template — enumerate stored session IDs so
      // clients can autocomplete the {id} placeholder.
      list: async () => {
        const { sessions } = await listSessions({ limit: 50 });
        return {
          resources: sessions
            .filter((s) => s.id !== 'list')
            .map((s) => ({
              uri: `vibe-coding://sessions/${s.id}`,
              name: s.title || s.id,
              description: s.summary?.slice(0, 120) ?? '',
              mimeType: 'application/json',
            })),
        };
      },
    }),
    {
      description:
        'Full read-only detail of one captured session (code contexts, design decisions, metadata).',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const id = Array.isArray(variables.id) ? variables.id[0] : variables.id;
      const content = await readSessionDetail(uri.toString(), id ?? '');
      return { contents: [content] };
    },
  );

  // Template: search/{query}
  server.resource(
    'session-search',
    new ResourceTemplate('vibe-coding://search/{query}', { list: undefined }),
    {
      description: 'Keyword search across session titles, summaries, tags and touched file paths.',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const q = Array.isArray(variables.query) ? variables.query[0] : variables.query;
      const content = await readSearch(uri.toString(), q ?? '');
      return { contents: [content] };
    },
  );
}

/** Register all prompts from the shared prompts module. */
function registerPrompts(server: McpServer): void {
  for (const descriptor of PROMPT_DESCRIPTORS) {
    // Build a Zod raw-shape from the prompt's argument list so the SDK can
    // surface argument metadata in `prompts/list`.
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const arg of descriptor.arguments) {
      const base = z.string().describe(arg.description);
      shape[arg.name] = arg.required ? base : base.optional();
    }

    server.prompt(descriptor.name, descriptor.description, shape, (args) => {
      const prompt = findPrompt(descriptor.name);
      if (!prompt) {
        throw new ToolError(`Prompt not found: ${descriptor.name}`, 'NOT_FOUND');
      }
      const result = prompt.build(args as Record<string, string | undefined>);
      return {
        description: result.description,
        messages: result.messages,
      };
    });
  }
}

/** Counts surfaced for smoke-testing + observability. */
export function getCapabilityCounts() {
  return {
    tools: TOOL_REGISTRY.length,
    // 3 static + 2 templates = 5 logical resources
    resources: STATIC_RESOURCE_DESCRIPTORS.length + 2,
    prompts: PROMPT_DESCRIPTORS.length,
  };
}

export { SERVER_NAME, SERVER_VERSION };
