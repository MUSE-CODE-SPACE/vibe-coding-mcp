/**
 * MCP Resources — read-only contextual data exposed via `resources/list` and
 * `resources/read`. Resources let Claude UI surface vibe-coding state with
 * @-mentions / slash commands without the LLM having to call a tool first.
 *
 * Registered URIs:
 *   - `vibe-coding://sessions/list`        — list of captured sessions
 *   - `vibe-coding://sessions/{id}`        — full detail for one session (template)
 *   - `vibe-coding://config`               — current platform configuration
 */

import { listSessions, getSession } from './sessionStorage.js';
import { validateConfiguration } from './config.js';

export interface ResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}

export interface ResourceDescriptor {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * Static resources (fixed URI, returned by `resources/list`).
 */
export const STATIC_RESOURCE_DESCRIPTORS: ResourceDescriptor[] = [
  {
    uri: 'vibe-coding://sessions/list',
    name: 'sessions-list',
    description: 'List of all captured vibe coding sessions (id, title, tags, timestamps).',
    mimeType: 'application/json',
  },
  {
    uri: 'vibe-coding://config',
    name: 'config',
    description:
      'Current publishing platform configuration — which platforms (Notion, GitHub Wiki, Obsidian, Confluence, Slack, Discord) are fully configured via environment variables and which are missing required secrets.',
    mimeType: 'application/json',
  },
];

/**
 * Resource templates — URIs with variables (RFC 6570). Listed separately
 * by `resources/templates/list`.
 */
export const RESOURCE_TEMPLATE_DESCRIPTORS = [
  {
    uriTemplate: 'vibe-coding://sessions/{id}',
    name: 'session-detail',
    description:
      'Full read-only detail of one captured session (code contexts, design decisions, metadata).',
    mimeType: 'application/json',
  },
] as const;

/** Read the `sessions/list` resource. */
export async function readSessionsList(uri: string): Promise<ResourceContent> {
  const { sessions, total } = await listSessions({ limit: 200 });
  const body = {
    total,
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title,
      tags: s.tags,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      codeContextCount: s.codeContextCount,
      designDecisionCount: s.designDecisionCount,
    })),
  };
  return { uri, mimeType: 'application/json', text: JSON.stringify(body, null, 2) };
}

/** Read a `sessions/{id}` resource. */
export async function readSessionDetail(uri: string, sessionId: string): Promise<ResourceContent> {
  const session = await getSession(sessionId);
  if (!session) {
    // Return an empty-but-valid envelope so clients don't crash.
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({ error: 'NOT_FOUND', sessionId }, null, 2),
    };
  }
  return { uri, mimeType: 'application/json', text: JSON.stringify(session, null, 2) };
}

/** Read the `config` resource. */
export function readConfig(uri: string): ResourceContent {
  const result = validateConfiguration();
  return {
    uri,
    mimeType: 'application/json',
    text: JSON.stringify(result, null, 2),
  };
}

/**
 * Dispatch a `resources/read` call by URI. Returns `null` if the URI does
 * not match any registered resource (caller should surface a proper error).
 */
export async function readResource(uri: string): Promise<ResourceContent | null> {
  if (uri === 'vibe-coding://sessions/list') {
    return readSessionsList(uri);
  }
  if (uri === 'vibe-coding://config') {
    return readConfig(uri);
  }
  // Template match: vibe-coding://sessions/{id}
  const sessionMatch = uri.match(/^vibe-coding:\/\/sessions\/([^/]+)$/);
  if (sessionMatch && sessionMatch[1] !== 'list') {
    return readSessionDetail(uri, sessionMatch[1]);
  }
  return null;
}
