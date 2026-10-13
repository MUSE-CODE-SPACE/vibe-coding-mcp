# vibe-coding — worked workflows

Each workflow lists the tool calls in order, with realistic arguments and what to do with the result.

## A. First-run setup (user: "set up session capture", or `stats` shows 0 sessions)

```bash
npx -y vibe-coding-mcp doctor          # shows: hooks not installed / transcripts found / store empty
npx -y vibe-coding-mcp init            # writes Stop + SessionEnd hooks, prints backup path
```

Then backfill what already exists on disk:

```json
muse_capture_transcript { "action": "capture", "all": true, "cwd": "/abs/path/to/project" }
```

Expected: `results[]` with one `created` per Claude Code session (`skipped` for empty ones). Tell the user how many sessions were imported and that future sessions are captured automatically after a Claude Code restart.

## B. Daily standup

```json
muse_digest { "period": "yesterday", "groupBy": "project", "includePrompts": true }
muse_digest { "period": "today",     "groupBy": "project", "includePrompts": true }
muse_git    { "action": "status" }
```

Write three groups, max three bullets each. Map: yesterday's session titles + files → **Yesterday**; today's sessions + uncommitted files from `muse_git` → **Today**; anything in prompts/summaries that mentions "revert", "failed", "blocked", "not sure", "TODO" → **Blockers** (else "none").

## C. Weekly report

```json
muse_digest { "period": "week", "groupBy": "project", "includePrompts": true, "language": "en" }
```

Rewrite `content` (Markdown) into:

```
## Shipped
### <project>
- <outcome> (`file`, `file`)
## Decisions
- <decision> — <rationale>
## In progress / blocked
## Next week
```

Use `totals` for a one-line header ("5 sessions · 6h 20m · 23 files · 4 decisions"). Optional publish:

```json
muse_normalize_for_platform { "document": "<md>", "platform": "notion" }
muse_publish_document       { "document": "<normalized>", "platform": "notion", "title": "Weekly report 2026-05-11 → 2026-05-17" }
```

## D. "Why did we choose X?"

```json
muse_session_history { "action": "search", "keyword": "redis", "searchIn": ["title", "summary", "tags"] }
```

or read `vibe-coding://search/redis` (also matches file paths like `src/cache/redis.ts`). Then:

```json
muse_session_history { "action": "get", "sessionId": "session_abc" }
```

Quote `designDecisions[]` (`title`, `description`, `rationale`) and the prompt lines in `summary` under "What was asked". If `designDecisions` is empty:

```json
muse_summarize_design_decisions { "conversationLog": "<session.summary + prompts>", "language": "auto" }
```

## E. Document a session (README / DESIGN / API / ARCHITECTURE)

```json
muse_session_history            { "action": "get", "sessionId": "session_abc" }
muse_summarize_design_decisions { "conversationLog": "<summary>", "maxDecisions": 10 }        // only if designDecisions empty
muse_generate_dev_document      { "documentType": "DESIGN", "title": "<session.title>", "designDecisions": [...], "codeContexts": [...] }
muse_publish_document           { "document": "<md>", "platform": "obsidian", "title": "<title>", "options": { "vaultPath": "~/Vault/decisions", "tags": ["adr"] } }
```

## F. PR description for a refactor

```json
muse_session_history { "action": "get", "sessionId": "session_abc" }
muse_analyze_code    { "code": "<largest codeBlock>", "language": "typescript", "diagramTypes": ["class", "dependency"] }
muse_git             { "action": "diff", "repoPath": "<metadata.cwd>", "diffType": "all", "stat": true }
```

Assemble: **Why** (decisions + first prompt) · **What changed** (`metadata.filesTouched` + diff stat) · **Trade-offs** (decision `tradeoffs` / `alternatives`) · **How to review** (Mermaid from `muse_analyze_code`, suggested read order).

## G. Capture one session right now (no hooks)

```json
muse_capture_transcript { "action": "preview" }     // show what would be saved
muse_capture_transcript { "action": "capture", "tags": ["sprint-12"] }
```

## H. Troubleshooting

| Symptom | Check |
|---|---|
| `muse_digest` returns 0 sessions | `npx -y vibe-coding-mcp doctor`: hooks installed? last hook run? Run backfill (A). |
| "No Claude Code transcript found for cwd" | The MCP server's cwd differs from the project. Pass `cwd` explicitly, or `transcriptPath`. |
| Hook never runs | Claude Code must be restarted after `init`. Confirm with `cat ~/.vibe-coding-mcp/hook.log`. |
| Publishing fails with `INTEGRATION_NOT_CONFIGURED` | Read `vibe-coding://config`; set the missing env var in the MCP server's `env` block. |
| Titles look like pasted emails | Titles prefer the user's own words; a session whose only prompt is a paste keeps a `[pasted: …]` marker. Rename with `muse_session_history` `update`. |
