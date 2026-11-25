#!/usr/bin/env node
/**
 * HTTP entry point — Streamable HTTP transport.
 *
 * A transport-bind around the shared `createMcpServer()` factory, so it
 * exposes exactly the same tools, resources and prompts as the stdio entry
 * point in `src/stdio.ts`.
 *
 * Environment:
 *   PORT                  listen port (default 3000)
 *   HOST                  bind address (default 127.0.0.1 — local only; set 0.0.0.0 to expose)
 *   MCP_AUTH_TOKEN        when set, `/mcp` requires `Authorization: Bearer <token>`
 *   MCP_ALLOWED_ORIGINS   comma-separated browser origins allowed by CORS (default: none)
 *   MCP_SESSION_TTL_MIN   idle minutes before an MCP session is closed (default 60)
 */
import express from 'express';
import cors from 'cors';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { config as loadEnv } from 'dotenv';
loadEnv({ quiet: true });
import { initializeAI } from './core/ai.js';
import { createMcpServer, getCapabilityCounts, SERVER_NAME, SERVER_VERSION } from './core/mcpServerFactory.js';
import { getToolNames } from './core/toolRegistry.js';
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN?.trim() || undefined;
const ALLOWED_ORIGINS = (process.env.MCP_ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
const SESSION_TTL_MS = (Number(process.env.MCP_SESSION_TTL_MIN) || 60) * 60_000;
const IS_LOOPBACK = ['127.0.0.1', 'localhost', '::1'].includes(HOST);
const app = express();
app.disable('x-powered-by');
// CORS is opt-in: a browser page on another origin must not be able to drive
// a local MCP server just because it is listening on localhost.
app.use(cors({
    origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : false,
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Mcp-Session-Id', 'Mcp-Protocol-Version', 'Last-Event-ID'],
}));
app.use(express.json({ limit: '4mb' }));
/** Bearer-token check for `/mcp`. A no-op when `MCP_AUTH_TOKEN` is unset. */
function requireAuth(req, res, next) {
    if (!AUTH_TOKEN) {
        next();
        return;
    }
    const header = req.headers.authorization ?? '';
    const presented = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const a = Buffer.from(presented);
    const b = Buffer.from(AUTH_TOKEN);
    if (a.length === b.length && timingSafeEqual(a, b)) {
        next();
        return;
    }
    res
        .status(401)
        .set('WWW-Authenticate', 'Bearer realm="vibe-coding-mcp"')
        .json({ jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized: missing or invalid bearer token' }, id: null });
}
/** Reject browser requests from origins that were not explicitly allowed (DNS-rebinding guard). */
function checkOrigin(req, res, next) {
    const origin = req.headers.origin;
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        res.status(403).json({ jsonrpc: '2.0', error: { code: -32002, message: `Origin not allowed: ${origin}` }, id: null });
        return;
    }
    next();
}
/** Active transports keyed by MCP session id, with last-use time for idle reaping. */
const transports = new Map();
// Health / discovery endpoints (no auth: they expose only counts and names).
app.get('/', (_req, res) => {
    res.json({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: 'Local memory for AI coding sessions — capture, recall, digest, document, publish',
        status: 'running',
        transport: 'streamable-http',
        auth: AUTH_TOKEN ? 'bearer' : 'none',
        endpoints: { mcp: '/mcp', health: '/health' },
        capabilities: getCapabilityCounts(),
        toolNames: getToolNames(),
    });
});
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: SERVER_VERSION, sessions: transports.size, ...getCapabilityCounts() });
});
/**
 * Main MCP endpoint. Accepts POST (JSON-RPC requests), GET (SSE notification
 * stream), and DELETE (session termination) per the Streamable HTTP spec.
 */
async function handleMcpRequest(req, res) {
    const sessionId = req.headers['mcp-session-id'];
    const known = sessionId ? transports.get(sessionId) : undefined;
    if (known) {
        known.lastSeen = Date.now();
        await known.transport.handleRequest(req, res, req.body);
        return;
    }
    if (sessionId) {
        // Unknown or expired session: the spec says 404 so the client re-initializes.
        res.status(404).json({ jsonrpc: '2.0', error: { code: -32001, message: 'Session not found' }, id: null });
        return;
    }
    if (req.method !== 'POST' || !isInitializeRequest(req.body)) {
        res.status(400).json({
            jsonrpc: '2.0',
            error: { code: -32000, message: 'Bad Request: send an initialize request first (no Mcp-Session-Id header)' },
            id: null,
        });
        return;
    }
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
            transports.set(sid, { transport, lastSeen: Date.now() });
        },
    });
    transport.onclose = () => {
        if (transport.sessionId)
            transports.delete(transport.sessionId);
    };
    const server = createMcpServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
}
function mcpRoute(req, res) {
    handleMcpRequest(req, res).catch((err) => {
        console.error('[vibe-coding-mcp] request failed:', err instanceof Error ? err.message : err);
        if (!res.headersSent) {
            res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
        }
    });
}
app.post('/mcp', checkOrigin, requireAuth, mcpRoute);
app.get('/mcp', checkOrigin, requireAuth, mcpRoute);
app.delete('/mcp', checkOrigin, requireAuth, mcpRoute);
// Back-compat shim: old clients used /sse. Tell them where /mcp lives.
app.get('/sse', (_req, res) => {
    res.status(410).json({
        error: 'sse_transport_removed',
        message: 'The legacy SSE transport was removed in v2.14.0. Use the Streamable HTTP transport at POST /mcp.',
        mcpEndpoint: '/mcp',
    });
});
// Close MCP sessions nobody has used for a while (clients that vanished without DELETE).
const reaper = setInterval(() => {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [sid, entry] of transports) {
        if (entry.lastSeen < cutoff) {
            transports.delete(sid);
            void entry.transport.close().catch(() => undefined);
        }
    }
}, 60_000);
reaper.unref();
const httpServer = app.listen(PORT, HOST, () => {
    const counts = getCapabilityCounts();
    const aiEnabled = initializeAI();
    console.log(`${SERVER_NAME} v${SERVER_VERSION} listening on http://${HOST}:${PORT}`);
    console.log(`Streamable HTTP endpoint: http://${HOST}:${PORT}/mcp (auth: ${AUTH_TOKEN ? 'bearer token' : 'none'})`);
    console.log(`Capabilities: ${counts.tools} tools, ${counts.resources} resources, ${counts.prompts} prompts${aiEnabled ? ', AI enabled' : ''}`);
    if (!IS_LOOPBACK && !AUTH_TOKEN) {
        console.warn(`WARNING: listening on ${HOST} without MCP_AUTH_TOKEN. Anyone who can reach this port can read captured sessions ` +
            'and run every tool. Set MCP_AUTH_TOKEN, or bind HOST=127.0.0.1.');
    }
});
function shutdown(signal) {
    console.log(`${signal} received, shutting down`);
    clearInterval(reaper);
    for (const entry of transports.values())
        void entry.transport.close().catch(() => undefined);
    transports.clear();
    httpServer.close(() => process.exit(0));
    // Open SSE streams can hold the server; do not wait forever.
    setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
//# sourceMappingURL=index.js.map