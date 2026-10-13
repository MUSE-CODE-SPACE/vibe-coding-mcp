# Auto-capture Claude Code sessions

`vibe-coding-mcp` captures every Claude Code session into a local store
(`~/.vibe-coding-mcp/sessions/<id>.json`) without you typing anything.
It works by registering two [Claude Code hooks](https://code.claude.com/docs/en/hooks):

| Hook | When it fires | What we do |
|------|---------------|------------|
| `Stop` | after every assistant turn (runs in the background) | parse the session transcript, upsert the session |
| `SessionEnd` | when the session closes | final parse + upsert |

Both run `vibe-coding-mcp hook`. Claude Code pipes a JSON object to its stdin:

```json
{ "session_id": "…", "transcript_path": "~/.claude/projects/<slug>/<id>.jsonl", "cwd": "/your/project", "hook_event_name": "Stop" }
```

The hook parses `transcript_path` (Claude Code's own JSONL log of the conversation) and extracts:

- every **human prompt** (system reminders stripped, pasted blocks collapsed to a marker)
- every **file written or edited** (`Write`, `Edit`, `MultiEdit`, `NotebookEdit`) with the latest content snippet
- every **shell command** the assistant ran
- **timing** (first → last record), **git branch**, **cwd**, Claude Code version, tool-usage counts
- **design decisions**, extracted by the same pattern engine as `muse_summarize_design_decisions` (no API key)

It never writes to stdout (Claude Code parses hook stdout), logs to `~/.vibe-coding-mcp/hook.log`, and always exits 0 so a capture problem can never interrupt your session.

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
    "Stop": [
      { "hooks": [ { "type": "command", "command": "npx -y vibe-coding-mcp hook", "timeout": 60, "async": true } ] }
    ],
    "SessionEnd": [
      { "hooks": [ { "type": "command", "command": "npx -y vibe-coding-mcp hook", "timeout": 60 } ] }
    ]
  }
}
```

`init` merges this into whatever hooks you already have and is idempotent (re-running upgrades the command, never duplicates it).

## 3. Verify

```bash
npx -y vibe-coding-mcp doctor
```

```
Claude Code hooks
  ✔ global: ~/.claude/settings.json — Stop=yes, SessionEnd=yes
Claude Code transcripts
  ✔ 12 transcript(s) for /Users/you/project (newest 2026-10-13T00:04:53Z)
Session store
  ✔ 9 session(s) stored under ~/.vibe-coding-mcp
  · latest auto-capture: "Add login form with validation" at 2026-10-13T00:05:07Z
  ✔ last hook run: 2026-10-13T00:05:07Z (Stop → updated)
```

Or, inside Claude: read `@vibe-coding://sessions/today`, or run `/standup`.

## 4. Backfill history you already have

Claude Code has been writing transcripts all along. Import them once:

```bash
npx -y vibe-coding-mcp capture --all          # every transcript for the current directory
npx -y vibe-coding-mcp capture --dry-run      # preview the newest one without saving
```

or from inside Claude: `muse_capture_transcript { "action": "capture", "all": true }`.
Each Claude Code session becomes exactly one stored session (keyed on `metadata.claudeSessionId`), so re-running is safe.

## 5. What a captured session looks like

```jsonc
{
  "id": "session_mv5x655f_csyb1v",
  "title": "Add login form with validation",            // Claude's session title, else your first prompt
  "summary": "3 prompt(s), 14 assistant turn(s), 4 file(s) changed, 6 command(s) run, 23 min.\nFiles: src/Login.tsx, …\n\nWhat was asked:\n- Add a login form with validation\n- …",
  "tags": ["claude-code", "auto-capture", "my-app", "tsx", "typescript"],
  "codeContexts": [ { "codeBlocks": [ { "language": "tsx", "code": "…", "filename": "src/Login.tsx" } ], "conversationSummary": "Wrote `src/Login.tsx` (2 changes)" } ],
  "designDecisions": [ { "title": "react-hook-form", "description": "…", "rationale": "lightweight", "category": "library" } ],
  "metadata": {
    "source": "claude-code", "claudeSessionId": "df23f1fd-…", "project": "my-app", "gitBranch": "feature/login",
    "startedAt": "…", "endedAt": "…", "durationSec": 1380, "promptCount": 3, "filesTouched": ["src/Login.tsx", "…"],
    "commandCount": 6, "commands": ["npm test", "…"], "toolCounts": { "Edit": 5, "Bash": 6 }, "captureCount": 14
  }
}
```

## 6. Privacy & limits

- Everything stays on disk under `~/.vibe-coding-mcp/`. Nothing is uploaded unless you call `muse_publish_document`.
- Sub-agent side-chains, system reminders and tool results are not stored. File snippets are capped at 4 000 characters, prompts at 2 000.
- Only Claude Code transcripts are parsed today. Cursor / Codex support is on the roadmap.
- Set `VIBE_CODING_STORAGE_DIR` to move the store, `CLAUDE_CONFIG_DIR` if Claude Code's config lives elsewhere.

## 7. Disable

```bash
npx -y vibe-coding-mcp init --remove
```

Captured sessions stay on disk until you delete them (`muse_session_history { "action": "delete", "sessionId": "…" }`).
