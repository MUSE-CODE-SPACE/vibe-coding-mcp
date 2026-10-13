# vibe-coding-mcp — tool, resource and prompt reference

Server name: `vibe-coding-mcp` · npm: `vibe-coding-mcp` (v2.15+) · transport: stdio (`npx -y vibe-coding-mcp`) or Streamable HTTP (`POST /mcp`).

## CLI (outside the MCP)

| Command | Purpose |
|---|---|
| `npx -y vibe-coding-mcp init` | Install `Stop` + `SessionEnd` hooks into `~/.claude/settings.json` (backup created). `--project` / `--local` target the repo's `.claude/settings*.json`. `--remove` uninstalls. `--print` shows the hooks block. |
| `npx -y vibe-coding-mcp doctor` | Check hooks, transcripts for cwd, session store, last hook run, platform env vars. |
| `npx -y vibe-coding-mcp capture [--all] [--transcript <file>] [--dry-run] [--json]` | Capture the newest (or every) transcript for the cwd by hand. |
| `npx -y vibe-coding-mcp hook` | What the hooks run. Reads Claude Code's hook JSON on stdin; never prints to stdout; always exits 0. |

Storage: `~/.vibe-coding-mcp/sessions/<id>.json` (override with `VIBE_CODING_STORAGE_DIR`). Hook activity log: `~/.vibe-coding-mcp/hook.log`.

## Tools (17)

### Capture & memory

**`muse_capture_transcript`** — Claude Code transcript → stored session. No API key.
- `action`: `capture` (default) | `preview` (no write) | `list`
- `transcriptPath?` explicit `.jsonl`; `cwd?` project dir (default server cwd); `all?: boolean` every transcript for cwd; `limit?`; `minPrompts?` (default 1); `maxFiles?` (40); `maxDecisions?` (10); `tags?: string[]`
- Returns `results[]` with `status` (`created` | `updated` | `skipped` | `dry-run`), `sessionId`, `title`, `stats { prompts, assistantTurns, filesChanged, commands, designDecisions, durationSec }`.
- Stored session `metadata`: `source: "claude-code"`, `claudeSessionId`, `cwd`, `project`, `gitBranch`, `startedAt`, `endedAt`, `durationSec`, `promptCount`, `filesTouched[]`, `commandCount`, `commands[]`, `toolCounts`, `captureCount`.

**`muse_session_history`** — `action`: `save` | `get` | `update` | `delete` | `list` | `search` | `stats`.
- `list`: `limit`, `offset`, `filterTags[]`, `sortBy` (`createdAt` | `updatedAt` | `title`), `sortOrder`.
- `search`: `keyword`, `searchIn[]` (`title` | `summary` | `tags`).
- `get`/`update`/`delete`: `sessionId`.

**`muse_digest`** — report over a time window.
- `period`: `today` | `yesterday` | `week` (Mon→Sun, default) | `last-week` | `month` | `custom` (+ `since`, `until` ISO dates, `until` exclusive)
- `groupBy`: `day` (default) | `project` | `tag` | `none`; `language`: `en` | `ko`; `format`: `markdown` | `json`
- filters: `tags[]`, `project` (directory basename), `maxSessions`
- content toggles: `includeFiles` (true), `includeDecisions` (true), `includePrompts` (false), `title`
- Returns `totals { sessions, durationSec, filesTouched, uniqueFiles, designDecisions, prompts, projects[] }`, `groups[]`, `topFiles[]`, `content` (Markdown).

**`muse_session_stats`** — `action`: `overview` | `languages` | `timeline` | `tags` | `productivity` | `trends`; `period`, `since`, `until`, `tags[]`, `format`, `compareWith`.

**`muse_export_session`** — `sessionIds[]?`, `format` (`markdown` | `json` | `html`), `outputPath?`, `template` (`default` | `minimal` | `detailed` | `report`), `bundleMultiple`.

### Analysis

**`muse_collect_code_context`** — pull fenced code blocks + summary out of raw text: `rawText?`, `codeBlocks[]?`, `conversationSummary` (required), `tags[]`, `autoDetectLanguage`, `removeDuplicates`.

**`muse_summarize_design_decisions`** — `conversationLog` (required), `projectContext?`, `language` (`en` | `ko` | `auto`), `maxDecisions` (20), `includeImportanceScore`, `extractRelatedCode`, `useAI` (needs `ANTHROPIC_API_KEY`). Returns `decisions[]` with `title`, `description`, `rationale`, `alternatives`, `tradeoffs`, `category`, `importance`.

**`muse_analyze_code`** — `code` (required), `language` (`typescript` | `javascript` | `python` | `go`), `filename?`, `generateDiagrams` (true), `diagramTypes[]` (`class` | `flowchart` | `dependency` | `all`), `useAI`.

**`muse_auto_tag`** — `action`: `suggest` | `apply` | `train` | `config`; `sessionId` or `content`; `maxTags`, `minConfidence`, `useAI`.

**`muse_git`** — `action`: `status` | `log` | `diff` | `branch` | `snapshot` | `extractDecisions` | `linkToSession`; `repoPath?`; log: `limit`, `since`, `until`, `grep`, `author`; diff: `diffType` (`staged` | `unstaged` | `all`), `fromRef`, `toRef`, `path`, `stat`; `linkToSession`: `sessionId`, `snapshotType`.

### Documents & publishing

**`muse_generate_dev_document`** — `documentType` (`README` | `DESIGN` | `TUTORIAL` | `CHANGELOG` | `API` | `ARCHITECTURE`), `title`, `projectName`, `description`, `language` (`en` | `ko`), `features[]`, `installation { requirements[], steps[] }`, `apiReference[]`, `designDecisions[]`, `codeContexts[]`, `changelog[]`, `faq[]`, `contributors[]`, `includeTableOfContents`.

**`muse_create_session_log`** — `title`, `summary` (required), `codeContexts[]`, `designDecisions[]`, `duration` (sec), `tags[]`, `options { logType: daily | session, outputPath?, format: markdown | json }`.

**`muse_normalize_for_platform`** — `document`, `platform` (`notion` | `github-wiki` | `obsidian`), `options { addFrontmatter, addTimestamp, customMetadata }`.

**`muse_publish_document`** — `document`, `platform` (`notion` | `github-wiki` | `obsidian` | `confluence` | `slack` | `discord`), `title`, `options { filename, wikiPath, vaultPath, tags[] }`. Returns `{ success, url?, filePath?, error? }`. Unconfigured platform → `INTEGRATION_NOT_CONFIGURED`.

**`muse_template`** — custom doc templates: `action` `create` | `get` | `update` | `delete` | `list` | `apply` | `preview` | `import` | `export`.

**`muse_project_profile`** — per-project defaults: `action` `create` | `get` | `update` | `delete` | `list` | `setActive` | `getActive` | `clone`; `publishing.defaultPlatform`, `defaultTags[]`, `documentation.language`.

**`muse_batch`** — run several `muse_*` calls in one round-trip: `operations[] { tool, params, id?, dependsOn[]? }`, `mode` (`sequential` | `parallel`), `stopOnError`.

## Resources (@-mention)

| URI | Content |
|---|---|
| `vibe-coding://sessions/list` | All sessions (id, title, tags, timestamps, counts) |
| `vibe-coding://sessions/today` | Sessions started today (local date) with `filesTouched` |
| `vibe-coding://sessions/{id}` | One session in full |
| `vibe-coding://search/{query}` | Keyword match on title, summary, tags **and touched file paths** (URL-encode spaces) |
| `vibe-coding://config` | Which publish platforms are configured |

## Prompts (slash commands)

| Prompt | Args | Produces |
|---|---|---|
| `daily-vibe-log` | `date?`, `language?` | One daily log from today's sessions |
| `standup` | `language?` | Yesterday / Today / Blockers |
| `weekly-report` | `period?`, `since?`, `until?`, `groupBy?`, `language?`, `platform?` | Shipped / Decisions / In progress / Next |
| `document-session` | `sessionId`, `documentType?`, `platform?` | Session → dev document → optional publish |
| `refactor-context` | `sessionId`, `language?` | PR description with decisions + AST diagram + diff |

## Environment variables (all optional)

| Var | Enables |
|---|---|
| `ANTHROPIC_API_KEY` | `useAI` on decision summaries, code analysis, auto-tag |
| `NOTION_API_KEY`, `NOTION_DATABASE_ID` | Notion |
| `GITHUB_TOKEN`, `GITHUB_REPO` (`owner/repo`) | GitHub Wiki |
| `OBSIDIAN_VAULT_PATH` | Obsidian default vault (else pass `options.vaultPath`) |
| `CONFLUENCE_BASE_URL`, `CONFLUENCE_USERNAME`, `CONFLUENCE_API_TOKEN`, `CONFLUENCE_SPACE_KEY` | Confluence |
| `SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL` | Slack / Discord (or pass `webhookUrl`) |
| `VIBE_CODING_STORAGE_DIR` | Session store location |
| `CLAUDE_CONFIG_DIR` | Where Claude Code keeps `settings.json` and `projects/` |
