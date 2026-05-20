# Changelog

All notable changes to `vibe-coding-mcp` are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Shared session store (opt-in S3 / Git / WebDAV sync; team mode).
- Auto-summary by topic across weeks instead of by day.
- Wider AST language support (Rust / Swift / Kotlin) + diagrams.
- `vibe-coding://search?q=...` resource for cross-session search.
- Git `prepare-commit-msg` integration surfacing decision summaries.

## [2.14.0] - 2026-05-20

### Highlights ⭐
- **HTTP and stdio expose the same surface now.** v2.13.0's "stdio has 15 tools, HTTP has 7" drift is gone — both entry points go through `src/core/mcpServerFactory.ts` and `src/core/toolRegistry.ts`. **15 tools, 3 resources, 3 prompts** everywhere.
- **One slash command publishes a full daily log.** `/daily-vibe-log` reads `vibe-coding://sessions/list`, composes a session log, offers to publish to Notion / Obsidian / GitHub Wiki — no manual tool chaining required.
- **`/refactor-context` writes your PR description.** Pulls the design-decision summary out of the captured session and produces a structured "why / what / trade-offs / how to review" PR body, not a paraphrased diff.
- **Streamable HTTP (MCP 2025-03-26).** `/sse` is retired (HTTP 410 with pointer); `POST /mcp` is the new endpoint.

### Added
- **MCP Resources (3):**
  - `vibe-coding://sessions/list` — list of captured sessions.
  - `vibe-coding://sessions/{id}` — full session detail (resource template).
  - `vibe-coding://config` — current platform configuration.
- **MCP Prompts (3):**
  - `daily-vibe-log` — assemble today's captured sessions into a daily log.
  - `document-session` — fetch a session, extract decisions, generate a dev document, optionally publish.
  - `refactor-context` — produce a refactor-ready PR description from a session (decisions + AST + git diff).
- **Auto-capture hook guide** — [`docs/AUTO_CAPTURE.md`](./docs/AUTO_CAPTURE.md) documents how to wire `PostToolUse` / `Stop` hooks in `~/.claude/settings.json` so Claude Code sessions auto-capture into `muse_session_history`.
- **+34 tests** covering the tool registry, resources, prompts, and the McpServer factory (149 → 183 passing).

### Changed
- **Entry-point unification.** `src/index.ts` (HTTP) and `src/stdio.ts` (bin) now both consume a single shared registry (`src/core/toolRegistry.ts`) and the new `src/core/mcpServerFactory.ts`. Same 15 tools / 3 resources / 3 prompts on both transports.
- **High-level `McpServer` API.** Both entry points moved from low-level `Server + setRequestHandler(CallToolRequestSchema, ...)` to `McpServer.registerTool() / .resource() / .prompt()` (SDK 1.25+).
- **Transport: SSE → Streamable HTTP.** `src/index.ts` uses `StreamableHTTPServerTransport` at `POST /mcp`. The legacy `/sse` route returns HTTP 410 with a pointer to `/mcp`.

## [2.13.0] - 2026-05-20

### Highlights ⭐
- **SDK pin tightened to ^1.25.0** (resolves to 1.29.0). Source-compatible — no breaking change.
- **CI on every push, weekly CodeQL** with `security-and-quality` pack.
- **`SECURITY.md` published** — this package is the canonical source of `src/core/security.ts` used by the other MCPs in the workspace, so the threat model lives here.

### Added
- GitHub Actions `ci.yml` running `npm ci`, `npm run typecheck`, `npm run build`, and `npm test` on Node 20 for every push and PR to `main`.
- GitHub Actions `release.yml` that publishes to npm with provenance when a `v*.*.*` tag is pushed (gated on `NPM_TOKEN`).
- GitHub Actions `codeql.yml` running the `security-and-quality` query pack weekly and on every push / PR.
- `SECURITY.md` with threat model, supported versions, reporting process.
- `npm run typecheck` script (`tsc --noEmit`) for CI use.

### Changed
- Bump `@modelcontextprotocol/sdk` constraint from `^1.0.0` to `^1.25.0` (resolves to 1.29.0). No source changes required.
- Tighten the npm `files` whitelist so published tarballs only contain `dist/**/*.{js,d.ts,js.map}` plus `README.md`, `SECURITY.md`, `CHANGELOG.md`, `LICENSE`.

### Known issues (resolved in 2.14.0)
- The repo still ships **two entry points** with feature drift: `src/index.ts` (SSE transport, 7 tools) vs. `src/stdio.ts` (stdio transport, 15 tools). Full unification is deferred to Phase 3 (2.14.0) to keep this release purely additive.

## [2.12.1] - prior

- MCP Registry support.

## [2.12.0] and earlier

- Session stats, auto-tag, template, batch tools (v2.9-v2.12).
- Session export and project profile tools (v2.7).
- Session history management (v2.6).
- AI-powered code analysis (v2.5).
- AI-powered summarization with Claude API.
- See git history for earlier releases.

[Unreleased]: https://github.com/MUSE-CODE-SPACE/vibe-coding-mcp/compare/v2.14.0...HEAD
[2.14.0]: https://github.com/MUSE-CODE-SPACE/vibe-coding-mcp/compare/v2.13.0...v2.14.0
[2.13.0]: https://github.com/MUSE-CODE-SPACE/vibe-coding-mcp/compare/v2.12.1...v2.13.0
