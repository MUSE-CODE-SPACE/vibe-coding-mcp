---
name: vibe-coding
description: Auto-documents AI coding sessions. Captures Claude Code transcripts into a local session store (prompts, files changed, code, commands, design decisions), then turns them into daily logs, standups, weekly reports, ADRs and PR descriptions, and publishes to Notion, Obsidian, GitHub Wiki, Confluence, Slack or Discord. Use when the user asks to "document this session", "what did I do today/this week", "write my standup / weekly report", "why did we choose X", "write a PR description for this refactor", "save this session", or to set up automatic session capture for Claude Code.
when_to_use: Any request about remembering, summarizing, reporting on, or publishing past AI coding sessions; any request to install or debug vibe-coding-mcp auto-capture hooks.
argument-hint: "[standup | weekly | document <sessionId> | pr <sessionId> | setup]"
allowed-tools: mcp__vibe-coding-mcp__* Bash(npx vibe-coding-mcp *) Bash(vibe-coding-mcp *) Read
license: MIT
compatibility: Designed for Claude Code (also works in any MCP-capable agent). Requires Node.js 18+ and npx; downloads the vibe-coding-mcp package from npm on first run. Publishing to Notion/Confluence/Slack/Discord needs the matching API key or webhook.
metadata:
  author: MUSE-CODE-SPACE
  version: "2.15.1"
  homepage: https://github.com/MUSE-CODE-SPACE/vibe-coding-mcp
  npm: vibe-coding-mcp
---

# vibe-coding — session memory for AI pair programming

You have the `vibe-coding-mcp` MCP server available (tools are prefixed `muse_`). It stores
coding sessions as JSON files under `~/.vibe-coding-mcp/sessions/` and can read Claude Code's
own transcripts from `~/.claude/projects/`. Nothing leaves the machine unless the user publishes.

## 0. First: make sure capture is actually running

Before producing any report, check that there is data. Call `muse_session_history` with
`action: "stats"`. If `totalSessions` is 0, or the user asks for "setup":

1. Run `npx -y vibe-coding-mcp doctor` and show the user the result.
2. If hooks are not installed, run `npx -y vibe-coding-mcp init` (adds `Stop` + `SessionEnd`
   hooks to `~/.claude/settings.json`, backs the file up first). Tell the user to restart
   Claude Code once.
3. To backfill history that already exists on disk, call
   `muse_capture_transcript` with `{ "action": "capture", "all": true }`. This parses every
   transcript for the current project and stores one session per Claude Code session
   (re-running is safe: it updates instead of duplicating).

If the MCP server itself is missing, the user needs: `claude mcp add vibe-coding-mcp -- npx -y vibe-coding-mcp`.

## 1. Pick the workflow from the user's words

| User says | Do this |
|---|---|
| "save / capture this session", "remember what we did" | `muse_capture_transcript` `{ action: "capture" }` (newest transcript for cwd). Report title, files, decisions count. |
| "what did I do today", "daily log" | `muse_digest` `{ period: "today", groupBy: "project", includePrompts: true }` → tidy the Markdown. Or use the `/daily-vibe-log` prompt. |
| "standup" | `/standup` prompt, or `muse_digest` for `yesterday` and `today`, then `muse_git` `status`. Output **Yesterday / Today / Blockers**, max 3 bullets each. |
| "weekly report", "what did I ship this week", "monthly retro" | `/weekly-report` prompt, or `muse_digest` `{ period: "week" | "last-week" | "month", groupBy: "project", includePrompts: true }`. Rewrite into **Shipped / Decisions / In progress / Next**. |
| "why did we choose X", "what was the decision about Y" | `vibe-coding://search/<keyword>` resource or `muse_session_history` `{ action: "search", keyword }` → `muse_session_history` `{ action: "get", sessionId }` → quote `designDecisions` and the matching prompts. |
| "document this session as README/DESIGN/API/ARCHITECTURE" | `/document-session` prompt, or `muse_session_history` get → `muse_generate_dev_document` → (optional) `muse_normalize_for_platform` → `muse_publish_document`. |
| "write the PR description for this refactor" | `/refactor-context` prompt: session → `muse_summarize_design_decisions` → `muse_analyze_code` (Mermaid) → `muse_git` `diff`. Sections: Why / What changed / Trade-offs / How to review. |
| "write an ADR for …" | `muse_summarize_design_decisions` on the session's conversation, then `muse_generate_dev_document` `DESIGN`, then publish to Obsidian/Notion if asked. |
| "publish to Notion/Obsidian/Slack…" | Read `vibe-coding://config` first. If the platform is not configured, say which env var is missing (see references/tools.md) instead of trying. |

## 2. Rules that keep the output trustworthy

- **Never invent work.** Every line in a report must trace to a captured session (title, file, decision, or prompt). If the digest is empty, say so and offer setup/backfill.
- **Keep file paths and identifiers in backticks**, exactly as captured.
- **Decisions need a rationale.** When `designDecisions` is empty for a session, run
  `muse_summarize_design_decisions` over the session's `summary` + prompts before writing
  "Decisions". If still nothing, write "no explicit decisions recorded".
- **Respect the session's language.** Captured prompts in Korean → report in Korean unless asked otherwise (`language: "ko"` on `muse_digest`).
- **One capture per Claude session.** `muse_capture_transcript` is idempotent; do not loop it.
- **Do not read transcripts yourself** with Read/Bash when a tool exists; the parser handles truncation and privacy (sub-agent side-chains, system reminders).

## 3. Output shapes

Standup (plain text, no headings):

```
Yesterday
- Refactored auth middleware (`src/auth.ts`, `src/db.ts`); chose JWT over sessions for statelessness
Today
- Finish checkout bug (`src/checkout.tsx`), uncommitted changes pending
Blockers
- none
```

Weekly report: `## Shipped` (per project, bullets with files) · `## Decisions` (bullet: decision — rationale) · `## In progress / blocked` · `## Next week`.

PR description: `## Why` · `## What changed` (file-by-file) · `## Trade-offs` · `## How to review` (Mermaid diagram when `muse_analyze_code` produced one).

## 4. References

- `references/tools.md` — every tool, resource, prompt with parameters and env vars.
- `references/workflows.md` — step-by-step tool chains with example calls and expected output.
- `scripts/setup.sh` — one-shot install: MCP registration + hooks + doctor.
- `assets/hooks.settings.json` — the exact hooks block `init` installs, for manual setup.
