# vibe-coding-mcp

> Your AI coding sessions, documented automatically. Captures every Claude Code session from its transcript — prompts, files changed, commands, design decisions — then turns them into standups, weekly reports, ADRs and PR descriptions, and publishes them to Notion / Obsidian / GitHub Wiki / Confluence / Slack / Discord.

[![CI](https://github.com/MUSE-CODE-SPACE/vibe-coding-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/MUSE-CODE-SPACE/vibe-coding-mcp/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/vibe-coding-mcp.svg)](https://www.npmjs.com/package/vibe-coding-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Maintained](https://img.shields.io/badge/maintained-yes-brightgreen.svg)

[English](#english) · [한국어](#한국어)

---

<a name="english"></a>
## Why vibe-coding?

You spent four hours pair-programming with Claude. You made three architectural decisions, wrote eight files, and reverted twice. Tomorrow you will not remember why you picked the second option over the first. Most people solve this with manual journaling that lasts two weeks, or by trawling `git log` after the fact — and `git log` knows *what* changed, not *why*.

vibe-coding-mcp fixes that at the source. Claude Code already writes a full transcript of every session to `~/.claude/projects/`. A tiny hook (`vibe-coding-mcp hook`) parses that transcript after every turn and stores a structured session locally: what you asked, which files were written or edited (with the code), which commands ran, how long it took, which branch, and the design decisions it can detect in the conversation. From there, 17 MCP tools turn those sessions into a **standup**, a **weekly report**, a **daily log**, a **DESIGN / ADR / README / API doc**, or a **PR description**, and publish them anywhere.

No API key needed for capture. Everything stays on your disk until you publish.

## 30-second install

```bash
# 1. Register the MCP server with Claude Code (tools, resources, slash-command prompts)
claude mcp add -s user vibe-coding-mcp -- npx -y vibe-coding-mcp

# 2. Install the capture hooks into ~/.claude/settings.json (backup written first)
npx -y vibe-coding-mcp init

# 3. Restart Claude Code. Then import the sessions you already have and check health
npx -y vibe-coding-mcp capture --all
npx -y vibe-coding-mcp doctor
```

Then, inside Claude Code:

```
/standup                     → Yesterday / Today / Blockers from captured sessions
/weekly-report               → Shipped / Decisions / In progress / Next, per project
/daily-vibe-log              → today's sessions as one log, offer to publish
@vibe-coding://search/redis  → every session that touched redis (titles, prompts, or file paths)
```

Or just ask: *"why did we choose JWT over sessions last week?"*, *"document yesterday's session as a DESIGN doc and put it in my Obsidian vault"*, *"write the PR description for this refactor"*.

> **Upgrading from v2.14?** The old README's hook recipe used `claude mcp call`, which is not a real Claude Code command, so nothing was ever captured. Run `npx vibe-coding-mcp init` and remove the old entries. See [`docs/AUTO_CAPTURE.md`](./docs/AUTO_CAPTURE.md).

## What's new in v2.15.0

- **Auto-capture that works.** `vibe-coding-mcp hook` reads Claude Code's hook JSON on stdin, parses the session transcript, and upserts one session per Claude session (idempotent, exit 0 always, nothing on stdout).
- **`init` / `doctor` / `capture` CLI.** Install the hooks with a merge + backup, diagnose, backfill history.
- **`muse_digest`.** Standup / weekly / monthly report over captured sessions, grouped by day · project · tag, English or Korean.
- **`muse_capture_transcript`.** Capture on demand from inside the chat ("save this session").
- **Resources** `vibe-coding://sessions/today`, `vibe-coding://search/{query}` and **prompts** `/standup`, `/weekly-report`.
- **Agent Skill.** `skills/vibe-coding/` tells any skill-aware agent (Claude Code, Cursor, Codex, …) when and how to use the server. `npm run skill:pack` builds the zip.

## Real use cases

### 1. "Write my standup"
`/standup` calls `muse_digest` for yesterday and today plus `muse_git status`, and returns three bullet groups. Every bullet traces to a captured session title, file path, or decision — nothing invented.

### 2. "What did I ship this week?" (for your 1:1, Slack, or Notion)
`/weekly-report` calls `muse_digest { period: "week", groupBy: "project" }`: totals (sessions, hours, files, decisions), highlights (decisions with rationale), per-project sessions with the files they touched, and most-touched files. Optionally `muse_publish_document` to Notion / Slack.

### 3. "Why did we pick option B?"
`@vibe-coding://search/<keyword>` matches titles, summaries, tags **and touched file paths**. Open the session; `designDecisions` holds problem → choice → rationale, and `summary` holds the actual prompts you typed. This is the context a diff cannot give you.

### 4. "PR description for a refactor that touched 11 files"
`/refactor-context` chains session → `muse_summarize_design_decisions` → `muse_analyze_code` (AST + Mermaid) → `muse_git diff` into Why / What changed / Trade-offs / How to review.

### 5. "Fill my Obsidian vault with ADRs"
`muse_summarize_design_decisions` over a session, `muse_generate_dev_document { documentType: "DESIGN" }`, `muse_publish_document { platform: "obsidian" }` — frontmatter, tags and a session back-reference included.

## Tools / Resources / Prompts

| Name | Type | What it does |
|------|------|--------------|
| `muse_capture_transcript` | tool | **(new)** Claude Code transcript → stored session (`capture` / `preview` / `list`, `all` for backfill) |
| `muse_digest` | tool | **(new)** Standup / weekly / monthly report over captured sessions, grouped by day / project / tag |
| `muse_session_history` | tool | `save / get / update / delete / list / search / stats` over `~/.vibe-coding-mcp/sessions/` |
| `muse_session_stats` | tool | Productivity dashboard: sessions/day, decisions/session, language breakdown |
| `muse_summarize_design_decisions` | tool | Extract decisions (problem → options → choice → trade-off), EN/KO, optional Claude API |
| `muse_analyze_code` | tool | AST analysis (TypeScript / Python / Go) + Mermaid diagrams |
| `muse_generate_dev_document` | tool | README / DESIGN / TUTORIAL / CHANGELOG / API / ARCHITECTURE generator |
| `muse_create_session_log` | tool | Daily or per-session log composition |
| `muse_export_session` | tool | Export sessions to Markdown / JSON / HTML |
| `muse_normalize_for_platform` | tool | Markdown quirks for Notion / GitHub Wiki / Obsidian |
| `muse_publish_document` | tool | Publish to Notion / GitHub Wiki / Obsidian / Confluence / Slack / Discord |
| `muse_collect_code_context` | tool | Pull code blocks + summary out of raw text |
| `muse_git` | tool | `status / log / diff / branch / snapshot` + decision extraction from commits |
| `muse_auto_tag` | tool | Tag suggestions (Claude API, optional) |
| `muse_template` | tool | Custom doc templates |
| `muse_project_profile` | tool | Per-project defaults (platform, tags, language) |
| `muse_batch` | tool | Several tool calls in one round-trip |
| `vibe-coding://sessions/list` | resource | All captured sessions |
| `vibe-coding://sessions/today` | resource | **(new)** Sessions started today, with files touched |
| `vibe-coding://sessions/{id}` | resource | One session in full |
| `vibe-coding://search/{query}` | resource | **(new)** Keyword search incl. file paths |
| `vibe-coding://config` | resource | Which publish platforms are configured |
| `/daily-vibe-log` | prompt | Today's sessions → one daily log |
| `/standup` | prompt | **(new)** Yesterday / Today / Blockers |
| `/weekly-report` | prompt | **(new)** Shipped / Decisions / In progress / Next |
| `/document-session` | prompt | Session → dev document → publish |
| `/refactor-context` | prompt | Session → PR description |

## The skill

`skills/vibe-coding/` is an [Agent Skill](https://agentskills.io) (`SKILL.md` + `references/` + `scripts/setup.sh` + `assets/`). It teaches the agent: check that capture is running before reporting, which tool chain matches which request, output shapes for standup / weekly / PR, and the rule that every reported line must trace to a captured session. Install it alongside the MCP server:

```bash
# Claude Code: drop it into your skills directory
cp -r skills/vibe-coding ~/.claude/skills/

# or build a zip for a marketplace (Agensi, etc.)
npm run skill:pack      # → dist-skill/vibe-coding-skill-<version>.zip
```

## How it works

```
 Claude Code ──Stop / SessionEnd hook──▶ vibe-coding-mcp hook ──▶ ~/.vibe-coding-mcp/sessions/*.json
      │   (stdin: session_id,             │ parse ~/.claude/projects/<slug>/<id>.jsonl
      │    transcript_path, cwd)          │ prompts · files+code · commands · timing · decisions
      │                                   │ upsert by claudeSessionId
      ▼
 Claude (or any MCP client) ──▶ src/cli.ts ──▶ src/stdio.ts ─┐
                              src/index.ts (HTTP, POST /mcp) ─┴─▶ src/core/mcpServerFactory.ts
                                                                    ├─ toolRegistry.ts   (17 muse_* tools)
                                                                    ├─ resources.ts      (5 resources)
                                                                    └─ prompts.ts        (5 prompts)
                                                                          │
                                                                          ▼
                                            src/tools/*.ts · src/core/{captureEngine,transcriptParser}.ts
                                            src/core/sessionStorage.ts · src/platforms/*.ts
```

Design choices that matter:

1. **Capture reads the transcript, not the editor.** Claude Code already logs everything; we parse it after the fact. The hook does no network calls, writes nothing to stdout, and exits 0 even on failure, so it can never slow down or break a session.
2. **One session per Claude session.** The `Stop` hook fires after every turn; captures are keyed on `claudeSessionId` and update in place. User-added tags survive updates.
3. **Local-first.** `~/.vibe-coding-mcp/sessions/<id>.json`. No DB, no telemetry. `grep`, back up, or sync it however you like.
4. **One registry, two transports.** HTTP and stdio expose the same 17 tools / 5 resources / 5 prompts via `createMcpServer()`.

## CLI reference

```
vibe-coding-mcp                 start the MCP server (stdio)
vibe-coding-mcp init            install Stop + SessionEnd hooks into ~/.claude/settings.json
    --project | --local         target .claude/settings.json | .claude/settings.local.json
    --dry-run | --print         show merged file | print only the hooks block
    --remove                    uninstall
    --command "<cmd>"           custom hook command
vibe-coding-mcp capture         capture the newest transcript for the cwd
    --all                       every transcript for the cwd (backfill)
    --transcript <path> --cwd <dir> --dry-run --json
vibe-coding-mcp doctor          hooks · transcripts · store · last hook run · platforms
vibe-coding-mcp hook            (used by the hooks) stdin JSON → capture
```

## Configuration

| Env var | Required for | Purpose |
|---------|--------------|---------|
| *(none)* | capture, digest, search, docs | Works with zero configuration |
| `ANTHROPIC_API_KEY` | `useAI` options, `muse_auto_tag` | Claude-API-powered analysis |
| `NOTION_API_KEY` + `NOTION_DATABASE_ID` | Notion publishing | |
| `GITHUB_TOKEN` + `GITHUB_REPO` | GitHub Wiki publishing | |
| `OBSIDIAN_VAULT_PATH` | Obsidian default vault | or pass `options.vaultPath` |
| `CONFLUENCE_BASE_URL` + `CONFLUENCE_USERNAME` + `CONFLUENCE_API_TOKEN` + `CONFLUENCE_SPACE_KEY` | Confluence | |
| `SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL` | Slack / Discord | |
| `VIBE_CODING_STORAGE_DIR` | — | Move the session store |
| `CLAUDE_CONFIG_DIR` | — | If Claude Code's config is not in `~/.claude` |
| `PORT` | HTTP mode only | default `3000` |

Tools that need an unconfigured integration return a structured `INTEGRATION_NOT_CONFIGURED` error instead of crashing.

## Known limitations

- **Claude Code only (for now).** Capture parses Claude Code's transcript format. Cursor / Codex transcripts are on the roadmap. The MCP tools themselves work from any MCP client.
- **Decision extraction is heuristic** unless `useAI: true` with an API key: it looks for "decided / chose / instead of / because" patterns in EN and KO.
- **AST analysis covers TS / Python / Go.**
- **Publishing is one-way.** Edits made in Notion / Wiki are not pulled back.
- **Single-user store.** Team search across everyone's sessions needs a shared store (roadmap).

## When NOT to use this

- Automatic **commit messages** → use aicommits or similar; this generates documents.
- **Team-wide search** across everyone's sessions → build a Notion DB on top, or wait for the shared store.
- **Hand-written rich notes** → use Obsidian / Notion directly; this is capture-then-publish.

## Roadmap

- Cursor / Codex CLI transcript capture.
- Shared session store (S3 / Git / WebDAV) and team mode.
- `prepare-commit-msg` suggestions from the current session's decisions.
- Rust / Swift / Kotlin AST + diagrams.

## Contributing

```bash
git clone https://github.com/MUSE-CODE-SPACE/vibe-coding-mcp
cd vibe-coding-mcp
npm install
npm run typecheck && npm test && npm run build
node dist/cli.js capture --dry-run     # try the capture engine on your own transcript
```

Adding a tool is one file in `src/tools/<name>.ts`, a Zod schema in `src/core/schemas.ts`, and one entry in `src/core/toolRegistry.ts`. CI runs typecheck + build + tests on Node 20 and 22.

## Security

Paths are validated, filenames sanitized, webhook URLs must be HTTPS and allowlisted, outbound HTTP has timeouts and backoff — see [`src/core/security.ts`](./src/core/security.ts) and [`SECURITY.md`](./SECURITY.md). The capture hook stores only your prompts, the assistant's prose, the code it wrote, and the commands it ran; tool outputs, sub-agent side-chains and system reminders are dropped.

**Report vulnerabilities privately** via a GitHub Security Advisory: <https://github.com/MUSE-CODE-SPACE/vibe-coding-mcp/security/advisories/new>.

## License

MIT — see [`LICENSE`](./LICENSE).

## Maintainer

[@yoon-k](https://github.com/MUSE-CODE-SPACE) (MUSE-CODE-SPACE). Issues + support: <https://github.com/MUSE-CODE-SPACE/vibe-coding-mcp/issues>.

---

<a name="한국어"></a>
## 한국어 요약

vibe-coding-mcp는 **Claude Code 세션을 자동으로 문서화**하는 MCP 서버 + 에이전트 스킬입니다. Claude Code가 남기는 트랜스크립트(`~/.claude/projects/`)를 훅이 매 턴마다 파싱해서 프롬프트 · 수정한 파일과 코드 · 실행한 명령 · 소요 시간 · 브랜치 · 설계 결정을 `~/.vibe-coding-mcp/sessions/`에 저장합니다. API 키 없이 동작하고, 발행하기 전까지는 아무것도 외부로 나가지 않습니다.

```bash
claude mcp add -s user vibe-coding-mcp -- npx -y vibe-coding-mcp   # MCP 등록
npx -y vibe-coding-mcp init                                        # 훅 설치 (settings.json 백업 후 병합)
npx -y vibe-coding-mcp capture --all                               # 기존 세션 가져오기
npx -y vibe-coding-mcp doctor                                      # 상태 확인
```

Claude Code 안에서 `/standup`(어제·오늘·블로커), `/weekly-report`(주간 보고, `language: ko` 지원), `/daily-vibe-log`, `@vibe-coding://search/키워드`를 바로 쓸 수 있고, "지난주에 왜 JWT를 골랐지?", "어제 세션을 DESIGN 문서로 만들어서 Obsidian에 넣어줘", "이 리팩터링 PR 설명 써줘" 같은 요청에 `muse_*` 도구 17개가 대응합니다.

> v2.14의 훅 레시피(`claude mcp call`)는 존재하지 않는 명령이라 실제로 캡처가 되지 않았습니다. v2.15에서 `init`으로 교체하세요.

설치·검증·백필은 [`docs/AUTO_CAPTURE.md`](./docs/AUTO_CAPTURE.md), 변경 이력은 [`CHANGELOG.md`](./CHANGELOG.md), 스킬 패키지는 [`skills/vibe-coding/`](./skills/vibe-coding/) 참고.
