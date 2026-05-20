#!/usr/bin/env node
/**
 * HTTP entry point — Streamable HTTP transport (MCP 2025-03-26).
 *
 * As of v2.14.0 this file is a transport-bind around the shared
 * `createMcpServer()` factory. It exposes the *same* 15 tools, 3 resources,
 * and 3 prompts as the stdio entry point in `src/stdio.ts` — the old SSE /
 * 7-tool drift is gone.
 *
 * The previous `SSEServerTransport` (deprecated in the MCP spec) has been
 * replaced with `StreamableHTTPServerTransport`. The SSE GET endpoint is
 * preserved as a compatibility shim that points clients at `/mcp`.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import 'dotenv/config';

import { createMcpServer, getCapabilityCounts, SERVER_NAME, SERVER_VERSION } from './core/mcpServerFactory.js';
import { getToolNames } from './core/toolRegistry.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '4mb' }));

/**
 * Active transports keyed by session ID. We run in stateful mode so a
 * single client conversation re-uses the same transport across requests.
 */
const transports = new Map<string, StreamableHTTPServerTransport>();

// Health / discovery endpoint.
app.get('/', (_req: Request, res: Response) => {
  const counts = getCapabilityCounts();
  res.json({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    description:
      'MCP server for vibe coding documentation — unified tool registry, Streamable HTTP transport',
    status: 'running',
    transport: 'streamable-http',
    endpoints: {
      mcp: '/mcp',
      health: '/health',
    },
    capabilities: {
      tools: counts.tools,
      resources: counts.resources,
      prompts: counts.prompts,
    },
    toolNames: getToolNames(),
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', version: SERVER_VERSION, ...getCapabilityCounts() });
});

/**
 * Main MCP endpoint. Accepts POST (JSON-RPC requests), GET (SSE notification
 * stream), and DELETE (session termination) per the Streamable HTTP spec.
 */
async function handleMcpRequest(req: Request, res: Response): Promise<void> {
  const sessionId = (req.headers['mcp-session-id'] as string | undefined) ?? undefined;

  let transport: StreamableHTTPServerTransport | undefined;
  if (sessionId) {
    transport = transports.get(sessionId);
  }

  if (!transport) {
    // Initialize a new transport + server for the first request of a session.
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        transports.set(sid, transport!);
      },
    });

    transport.onclose = () => {
      const sid = transport!.sessionId;
      if (sid) {
        transports.delete(sid);
      }
    };

    const server = createMcpServer();
    await server.connect(transport);
  }

  await transport.handleRequest(req as unknown as Parameters<typeof transport.handleRequest>[0], res, req.body);
}

app.post('/mcp', (req: Request, res: Response) => {
  void handleMcpRequest(req, res);
});
app.get('/mcp', (req: Request, res: Response) => {
  void handleMcpRequest(req, res);
});
app.delete('/mcp', (req: Request, res: Response) => {
  void handleMcpRequest(req, res);
});

// Back-compat shim: old clients used /sse. Tell them where /mcp lives.
app.get('/sse', (_req: Request, res: Response) => {
  res
    .status(410)
    .json({
      error: 'sse_transport_removed',
      message:
        'The legacy SSE transport was removed in v2.14.0. Use the Streamable HTTP transport at POST /mcp.',
      mcpEndpoint: '/mcp',
    });
});

app.listen(PORT, () => {
  const counts = getCapabilityCounts();
  console.log(
    `${SERVER_NAME} v${SERVER_VERSION} running on http://localhost:${PORT}`,
  );
  console.log(`Streamable HTTP endpoint: http://localhost:${PORT}/mcp`);
  console.log(
    `Capabilities: ${counts.tools} tools, ${counts.resources} resources, ${counts.prompts} prompts`,
  );
});
