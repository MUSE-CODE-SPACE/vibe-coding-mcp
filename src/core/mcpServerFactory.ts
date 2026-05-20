/**
 * MCP server factory — builds a fully-wired `McpServer` instance using the
 * high-level `@modelcontextprotocol/sdk` API. Used by both entry points
 * (`src/index.ts` and `src/stdio.ts`) so they expose an identical surface:
 * 15 tools, 3 resources (one of which is a template), 3 prompts.
 *
 * High-level vs low-level: previously both entry points constructed a
 * low-level `Server` and registered request handlers for
 * `ListToolsRequestSchema` / `CallToolRequestSchema`. We now use
 * `McpServer.registerTool()`, `.resource()`, and `.prompt()` — the SDK turns
 * those registrations into the same JSON-RPC surface, but adds first-class
 * resources and prompts support along the way.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { TOOL_REGISTRY } from './toolRegistry.js';
import { createErrorResponse, ToolError } from './errors.js';
import {
  STATIC_RESOURCE_DESCRIPTORS,
  readSessionsList,
  readSessionDetail,
  readConfig,
} from './resources.js';
import { PROMPT_DESCRIPTORS, findPrompt } from './prompts.js';
import { listSessions } from './sessionStorage.js';

const SERVER_NAME = 'vibe-coding-mcp';
const SERVER_VERSION = '2.14.0';

/**
 * Build a new `McpServer` instance populated with all 15 tools, the resource
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
    },
  );

  registerTools(server);
  registerResources(server);
  registerPrompts(server);

  return server;
}

/** Wire all 15 tools from the shared registry. */
function registerTools(server: McpServer): void {
  for (const tool of TOOL_REGISTRY) {
    const { name, description } = tool.descriptor;

    // Use `registerTool` with the Zod schema for the input. The SDK uses
    // `normalizeObjectSchema` internally, which accepts our pre-built
    // `z.object(...)` instances. SDK pre-validates `args` before calling the
    // handler; our handler then re-runs `validateInput()` defensively.
    server.registerTool(
      name,
      {
        description,
        inputSchema: tool.inputZodSchema as unknown as z.ZodTypeAny,
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

  // Static: config
  server.resource(
    'config',
    'vibe-coding://config',
    { description: STATIC_RESOURCE_DESCRIPTORS[1].description, mimeType: 'application/json' },
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
    // 2 static + 1 template = 3 logical resources
    resources: STATIC_RESOURCE_DESCRIPTORS.length + 1,
    prompts: PROMPT_DESCRIPTORS.length,
  };
}

export { SERVER_NAME, SERVER_VERSION };
