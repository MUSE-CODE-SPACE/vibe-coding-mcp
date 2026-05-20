# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

(no unreleased changes)

## [2.14.0] - 2026-05-20

### Changed

- **Entry-point unification.** `src/index.ts` (HTTP) and `src/stdio.ts`
  (stdio) now both consume a single shared tool registry
  (`src/core/toolRegistry.ts`) and the new
  `src/core/mcpServerFactory.ts`. Both entry points expose the **same 15
  tools, 3 resources, and 3 prompts** — the SSE-vs-stdio drift documented
  in v2.13.0 is resolved.
- **High-level `McpServer` migration.** Both entry points moved from the
  low-level `Server + setRequestHandler(CallToolRequestSchema, ...)`
  pattern to `McpServer.registerTool() / .resource() / .prompt()`.
- **Transport: SSE → Streamable HTTP.** `src/index.ts` now uses
  `StreamableHTTPServerTransport` (MCP 2025-03-26 spec) at `POST /mcp`.
  The legacy `/sse` route returns HTTP 410 with a pointer to `/mcp`.

### Added

- **MCP Resources** — 3 logical resources:
  - `vibe-coding://sessions/list` — list of captured sessions.
  - `vibe-coding://sessions/{id}` — full session detail (template).
  - `vibe-coding://config` — current platform configuration.
- **MCP Prompts** — 3 reusable workflows:
  - `daily-vibe-log` — assemble today's captured sessions into a daily log.
  - `document-session` — fetch a session, extract decisions, generate a dev
    document, optionally publish.
  - `refactor-context` — produce a refactor-ready PR description from a
    session (decisions + AST analysis + git diff).
- **Auto-capture hook guide** — `docs/AUTO_CAPTURE.md` documents how to
  wire `PostToolUse` / `Stop` hooks in `~/.claude/settings.json` so Claude
  Code sessions auto-capture into `muse_session_history`.
- **34 new tests** covering the tool registry, resources, prompts, and the
  McpServer factory (149 → 183 passing tests).

## [2.13.0] - 2026-05-20

### Changed

- Bump `@modelcontextprotocol/sdk` constraint from `^1.0.0` to `^1.25.0`
  (resolves to 1.29.0). No source changes required — the low-level
  `Server` / `setRequestHandler` API used by both entry points remains
  source-compatible.
- Tighten the npm `files` whitelist so published tarballs only contain
  `dist/**/*.{js,d.ts,js.map}` plus `README.md`, `SECURITY.md`,
  `CHANGELOG.md`, and `LICENSE`.

### Added

- GitHub Actions `ci.yml` running `npm ci`, `npm run typecheck`,
  `npm run build`, and `npm test` on Node 20 for every push and PR to `main`.
- GitHub Actions `release.yml` that publishes to npm with provenance when a
  `v*.*.*` tag is pushed (gated on `NPM_TOKEN`).
- GitHub Actions `codeql.yml` running the `security-and-quality` query pack
  weekly and on every push / PR.
- `SECURITY.md` documenting the threat model, supported versions, and
  reporting process. This package is the source of `src/core/security.ts`
  used by the other MCPs in the workspace, so the threat model is the
  canonical reference.
- `npm run typecheck` script (`tsc --noEmit`) for CI use.

### Known issues / drift

- The repo still ships **two entry points** with feature drift:
  `src/index.ts` (SSE transport, 7 tools) vs. `src/stdio.ts` (stdio
  transport, 15 tools). Full unification is intentionally deferred to
  Phase 3 to keep this release purely additive.

## [2.12.1] - prior

- MCP Registry support.

## [2.12.0] and earlier

- Session stats, auto-tag, template, batch tools (v2.9-v2.12).
- Session export and project profile tools (v2.7).
- Session history management (v2.6).
- See git history for earlier releases.
