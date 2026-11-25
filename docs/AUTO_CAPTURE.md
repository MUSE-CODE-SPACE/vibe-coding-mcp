# Auto-capture Claude Code (and Codex CLI) sessions

`vibe-coding-mcp` captures every Claude Code session into a local store
(`~/.vibe-coding-mcp/sessions/<id>.json`) without you typing anything.
It works by registering three [Claude Code hooks](https://code.claude.com/docs/en/hooks):

| Hook | When it fires | What we do |
|------|---------------|------------|
| `Stop` | after every assistant turn (runs in the background) | parse the session transcript, upsert the session |
| `SessionEnd` | when the session closes | final parse + upsert |
| `SessionStart` (`startup`, `clear`) | when a new session opens | print a short brief of earlier sessions in the same project as additional context (see §5) |

All three run `vibe-coding-mcp hook`. Claude Code pipes a JSON object to its stdin:

```json
{ "session_id": "…", "transcript_path": "~/.claude/projects/<slug>/<id>.jsonl", "cwd": "/your/project", "hook_event_name": "Stop" }
```

The hook parses `transcript_path` (Claude Code's own JSONL log of the conversation) and extracts:

- every **human prompt** (system reminders stripped, pasted blocks collapsed to a marker; skill preambles, hook notices, compaction summaries and background-task results are not prompts)
- every **file written or edited** (`Write`, `Edit`, `MultiEdit`, `NotebookEdit`) with the latest content snippet
- every **shell command** the assistant ran
- **timing** (active time, idle gaps over 30 minutes excluded), **git branch**, **cwd**, Claude Code version, tool-usage counts
- **token usage** as reported by the API (counted once per response) and **responses per model**
- **commits** made in the project directory between the first and last record
- **design decisions**, extracted by the same pattern engine as `muse_summarize_design_decisions` (no API key); only decisions with a stated reason are kept

The capture hooks never write to stdout (Claude Code parses hook stdout), log to `~/.vibe-coding-mcp/hook.log`, and always exit 0 so a capture problem can never interrupt your session.

> **Upgrading from v2.14?** The old recipe used `claude mcp call …`, which is not a real Claude Code command — those hooks silently did nothing. Run `npx vibe-coding-mcp init` and delete the old entries from `~/.claude/settings.json`.

## 1. Install (30 seconds)

```bash
# register the MCP server (tools, resources, prompts)
claude mcp add -s user vibe-coding-mcp -- npx -y vibe-coding-mcp

# install the capture hooks into ~/.claude/settings.json (a backup is written first)
npx -y vibe-coding-mcp init

# restart Claude Code, then verify
npx -y vibe-coding-mcp doctor
```

`init` options:

| Flag | Effect |
|------|--------|
| `--project` | write to `./.claude/settings.json` (shareable with your team) |
| `--local` | write to `./.claude/settings.local.json` (gitignored) |
| `--dry-run` | print the merged settings without writing |
| `--print` | print only the `hooks` block (for manual copy-paste) |
| `--remove` | uninstall the hooks |
| `--command "<cmd>"` | use a custom hook command (e.g. an absolute path to a global install) |

If `vibe-coding-mcp` is on your `PATH` (`npm i -g vibe-coding-mcp`), `init` uses `vibe-coding-mcp hook`; otherwise it uses `npx -y vibe-coding-mcp hook`.

## 2. What the hooks block looks like

```json
{
  "hooks": {
    "SessionStart": [
      { "matcher": "startup|clear", "hooks": [ { "type": "command", "command": "npx -y vibe-coding-mcp hook", "timeout": 15 } ] }
    ],
    "Stop": [
      { "hooks": [ { "type": "command", "command": "npx -y vibe-coding-mcp hook", "timeout": 60, "async": true } ] }
    ],
    "SessionEnd": [
      { "hooks": [ { "type": "command", "command": "npx -y vibe-coding-mcp hook", "timeout": 60 } ] }
    ]
  }
}
```

`init` merges this into whatever hooks you already have and is idempotent (re-running upgrades the command, never duplicates it). `init --no-recall` installs the two capture hooks only, and removes a `SessionStart` entry an earlier `init` added.

## 3. Verify

```bash
npx -y vibe-coding-mcp doctor
```

```
Claude Code hooks
  ✔ global: ~/.claude/settings.json — Stop=yes, SessionEnd=yes, SessionStart(recall)=yes
Claude Code transcripts
  ✔ 12 transcript(s) for /Users/you/project (newest 2026-10-13T00:04:53Z)
Codex CLI transcripts
  ✔ 8 rollout(s) under ~/.codex/sessions (newest 2026-11-25T04:22:02Z) — capture with: vibe-coding-mcp sync
Session store
  ✔ 9 session(s) stored under ~/.vibe-coding-mcp
  · latest capture: "Add login form with validation" at 2026-10-13T00:05:07Z
  ✔ last hook run: 2026-10-13T00:05:07Z (Stop → updated)
```

Or, inside Claude: read `@vibe-coding://sessions/today`, or run `/standup`.

## 4. Backfill history you already have

Claude Code and Codex have been writing transcripts all along. Import them once:

```bash
npx -y vibe-coding-mcp sync                   # every project, Claude Code + Codex, last 30 days
npx -y vibe-coding-mcp sync --days 365        # go further back
npx -y vibe-coding-mcp sync --agent codex     # one agent only
npx -y vibe-coding-mcp capture --all          # every Claude Code transcript for the current directory
npx -y vibe-coding-mcp capture --dry-run      # preview the newest one without saving
```

or from inside Claude: `muse_capture_transcript { "action": "sync" }`.
Each agent session becomes exactly one stored session (keyed on `metadata.agentSessionId`), and `sync` skips transcripts that have not changed since they were captured, so re-running is safe and fast.

**Codex CLI** has no hook that fits, so its sessions (`~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`) are captured only by `sync`. Run it when you want them, or put it on a schedule (cron / launchd). The Codex parser reads prompts, `exec_command` commands, `apply_patch` file changes, token counts and the model; the rollout format changes between Codex releases, so it skips records it does not recognise.

## 5. Project memory at session start

With the `SessionStart` hook installed, a new Claude Code session in a project that has earlier captured sessions begins with a brief like this in its context:

```markdown
# Project memory: my-app

3 of 12 earlier session(s), captured by vibe-coding-mcp. Background only — it may be out of date; check the code before relying on it.

## 2026-11-24 · Add login form with validation (claude-code · `feature/login` · 23m)
- Asked: Add a login form with validation
- Files: `src/Login.tsx`, `src/lib/auth.ts`
- Decisions: react-hook-form — smaller bundle than formik
- Commits: a1b2c3d feat: login form
- Ended with: Login form is in place and the three validation tests pass.
```

- A session matches when it ran in the project directory or below it. Sessions from a parent directory or a sibling project are not included.
- It is skipped when a session is resumed or compacted, when there is nothing to recall, and for the session that is asking.
- Size: 3 sessions and 2 000 characters by default. Change with `VIBE_CODING_RECALL_SESSIONS`, `VIBE_CODING_RECALL_CHARS`, `VIBE_CODING_RECALL_LANG=ko`.
- Turn it off with `VIBE_CODING_RECALL=off` (in the `env` block of `~/.claude/settings.json`) or `init --no-recall`.
- With the `npx -y` hook command each session start pays npx's startup time. `npm i -g vibe-coding-mcp` and re-running `init` switches the hooks to the installed binary.
- The same brief on demand: `vibe-coding-mcp recall`, `vibe-coding-mcp recall "token refresh"`, the `muse_recall` tool, or `/catch-up`.

## 6. What a captured session looks like

```jsonc
{
  "id": "session_mv5x655f_csyb1v",
  "title": "Add login form with validation",            // Claude's session title, else your first prompt
  "summary": "3 prompt(s), 14 assistant turn(s), 4 file(s) changed, 6 command(s) run, 23 min.\nFiles: src/Login.tsx, …\n\nWhat was asked:\n- Add a login form with validation\n- …",
  "tags": ["claude-code", "auto-capture", "my-app", "tsx", "typescript"],
  "codeContexts": [ { "codeBlocks": [ { "language": "tsx", "code": "…", "filename": "src/Login.tsx" } ], "conversationSummary": "Wrote `src/Login.tsx` (2 changes)" } ],
  "designDecisions": [ { "title": "react-hook-form", "description": "…", "rationale": "lightweight", "category": "library" } ],
  "metadata": {
    "source": "claude-code", "agentSessionId": "df23f1fd-…", "claudeSessionId": "df23f1fd-…", "project": "my-app", "gitBranch": "feature/login",
    "startedAt": "…", "endedAt": "…", "durationSec": 1380, "promptCount": 3, "filesTouched": ["src/Login.tsx", "…"],
    "commandCount": 6, "commands": ["npm test", "…"], "toolCounts": { "Edit": 5, "Bash": 6 },
    "tokens": { "input": 4210, "output": 18650, "cacheRead": 2140000, "cacheWrite": 96000, "total": 2258860 },
    "models": { "claude-sonnet-5-5": 14 },
    "commits": [ { "hash": "a1b2c3d", "date": "…", "subject": "feat: login form" } ],
    "captureCount": 14
  }
}
```

## 7. Privacy & limits

- Everything stays on disk under `~/.vibe-coding-mcp/`. Nothing is uploaded unless you call `muse_publish_document`.
- Sub-agent side-chains, system reminders and tool results are not stored. File snippets are capped at 4 000 characters, prompts at 2 000.
- Claude Code and Codex CLI transcripts are parsed. Cursor support is on the roadmap.
- The `SessionStart` brief is built from the local store and goes only into your own Claude Code session's context.
- Commits are linked by time window (first → last record, in the session's directory), whoever made them. Token counts cover the main conversation, not sub-agents; no cost is computed.
- Set `VIBE_CODING_STORAGE_DIR` to move the store, `CLAUDE_CONFIG_DIR` / `CODEX_HOME` if Claude Code's / Codex's config lives elsewhere.

## 8. Disable

```bash
npx -y vibe-coding-mcp init --remove
```

Captured sessions stay on disk until you delete them (`muse_session_history { "action": "delete", "sessionId": "…" }`).
