# Changelog

All notable changes to `vibe-coding-mcp` are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Shared session store (opt-in S3 / Git / WebDAV sync; team mode).
- Auto-summary by topic across weeks instead of by day.
- Wider AST language support (Rust / Swift / Kotlin) + diagrams.
- Git `prepare-commit-msg` integration surfacing decision summaries.
- Capture for Cursor / Codex CLI transcripts (today: Claude Code only).

## [2.15.2] - 2026-10-22

### Changed
- Dependencies: `@anthropic-ai/sdk` 1.1 (API version 2026-10-21), `@modelcontextprotocol/sdk` 1.32, `zod` 4.6, `express` 5.3, `@notionhq/client` 5.27, `dotenv` 18, `jest` 30.5, TypeScript 6.0, `@types/node` 26.
- AI summarization / auto-tagging now call `claude-sonnet-5-5` (the previous `claude-sonnet-4-20250514` is deprecated).
- CI runs on Node 22 + 24; GitHub Actions bumped to `checkout@v7` / `setup-node@v7` / `codeql-action@v4`.

### Fixed
- Server version reported over MCP `initialize` now matches the package version.

## [2.15.1] - 2026-10-15

### Fixed
- **Session duration counted idle time.** `durationSec` was first-record → last-record, so a session resumed over several days reported hundreds of hours in `muse_digest`. It is now *active* time: gaps between records longer than 30 minutes (`idleGapSec`) are excluded. Wall-clock is still available as `wallClockSec`.
- **Harness messages captured as prompts.** Background `<task-notification>` records and `[Image: …]` dimension notes are user-role records in the transcript but not something the human typed; they no longer appear in "What was asked" or in prompt counts.
- **Junk language tags.** Files with unknown extensions (`.txt`, `.srt`, `.lock`) were tagged by extension; only real code languages are tagged now.

### Changed
- `skills/vibe-coding/SKILL.md` frontmatter now carries `license`, `compatibility` and `metadata` (Agent Skills spec); packaged for Agensi.

## [2.15.0] - 2026-10-13

### Highlights ⭐
- **Auto-capture actually works now.** The v2.14 hook recipe shelled out to `claude mcp call`, a command that does not exist in Claude Code, so nothing was ever captured. v2.15 replaces it with a real hook binary: `vibe-coding-mcp hook` reads Claude Code's hook JSON on stdin, parses the session transcript (`~/.claude/projects/**/*.jsonl`) and upserts a session — prompts, files written/edited with code, shell commands, duration, branch, and pattern-extracted design decisions. No API key, no stdout noise, exit 0 always.
- **`npx vibe-coding-mcp init`** installs `Stop` + `SessionEnd` hooks into `~/.claude/settings.json` (merging, with backup). **`doctor`** tells you whether capture is running. **`capture --all`** backfills every past session of a project.
- **`muse_digest`** turns captured sessions into a standup / weekly report / monthly retro (totals, highlights, grouped by day · project · tag, most-touched files), in English or Korean.
- **Agent Skill shipped** in `skills/vibe-coding/` (SKILL.md + references + setup script), packable with `npm run skill:pack` for Agensi / Claude Code / Cursor / Codex.

### Added
- `src/cli.ts` — new bin entry (`vibe-coding-mcp`) with subcommands `init`, `doctor`, `capture`, `hook`; no subcommand starts the stdio MCP server as before.
- `src/core/transcriptParser.ts` — Claude Code JSONL parser (user prompts, assistant text, `Write`/`Edit`/`MultiEdit`/`NotebookEdit` file changes with snippets, `Bash` commands, tool counts, timing, `ai-title`; skips sub-agent side-chains and system reminders; collapses pasted blocks).
- `src/core/captureEngine.ts` — transcript → session mapping, idempotent per `metadata.claudeSessionId`, preserves user-added tags on update.
- `src/core/hookInstaller.ts` — pure merge/remove of hook groups + settings IO with backups.
- Tool `muse_capture_transcript` (`capture` | `preview` | `list`, `all`, `transcriptPath`, `cwd`, `tags`).
- Tool `muse_digest` (`today` | `yesterday` | `week` | `last-week` | `month` | `custom`, `groupBy`, `language`, `includePrompts`, filters).
- Resources `vibe-coding://sessions/today` and `vibe-coding://search/{query}` (matches touched file paths too).
- Prompts `/standup` and `/weekly-report`.
- `skills/vibe-coding/` skill package and `scripts/pack-skill.mjs`.
- +49 tests (183 → 232): transcript parser, capture engine, digest, resources, hook installer.

### Changed
- `bin` now points at `dist/cli.js`; `dist/stdio.js` still runs standalone.
- Logger writes every level to **stderr**. On the stdio transport stdout is the JSON-RPC channel, so `info` lines on stdout could corrupt the protocol.
- Tool count 15 → 17, resources 3 → 5, prompts 3 → 5 on both transports.
- README quickstart and `docs/AUTO_CAPTURE.md` rewritten around `init` / `doctor`.

### Fixed
- Auto-capture hook recipe referenced a non-existent `claude mcp call` command (README + docs since v2.14.0).

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

[Unreleased]: https://github.com/MUSE-CODE-SPACE/vibe-coding-mcp/compare/v2.15.0...HEAD
[2.15.0]: https://github.com/MUSE-CODE-SPACE/vibe-coding-mcp/compare/v2.14.0...v2.15.0
[2.14.0]: https://github.com/MUSE-CODE-SPACE/vibe-coding-mcp/compare/v2.13.0...v2.14.0
[2.13.0]: https://github.com/MUSE-CODE-SPACE/vibe-coding-mcp/compare/v2.12.1...v2.13.0
