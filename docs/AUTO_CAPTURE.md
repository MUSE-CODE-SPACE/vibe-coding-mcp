# Auto-capture vibe coding sessions with Claude Code hooks

This guide shows how to wire `vibe-coding-mcp` into [Claude Code hooks](https://docs.claude.com/en/docs/claude-code/hooks)
so that every coding session in Claude Code is automatically captured into a
local session log — no manual `muse_session_history` calls required.

The hook fires on `PostToolUse` (after a file edit/write) and `Stop` (when
Claude finishes a turn). Each fire shells out to `claude mcp call` against
the local stdio MCP, which invokes `muse_session_history` with
`action: "save"`.

> Requires `vibe-coding-mcp` installed globally (`npm i -g vibe-coding-mcp`)
> or registered with Claude Code via `claude mcp add vibe-coding-mcp npx vibe-coding-mcp`.

## 1. Sample `~/.claude/settings.json`

```jsonc
{
  "mcpServers": {
    "vibe-coding-mcp": {
      "command": "npx",
      "args": ["-y", "vibe-coding-mcp"]
    }
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "claude mcp call vibe-coding-mcp muse_session_history '{\"action\":\"save\",\"title\":\"auto-capture\",\"summary\":\"PostToolUse event\",\"tags\":[\"auto-capture\",\"claude-code\"]}' >/dev/null 2>&1 || true"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "claude mcp call vibe-coding-mcp muse_create_session_log '{\"title\":\"Claude Code session\",\"summary\":\"Stop hook capture\",\"options\":{\"logType\":\"session\"}}' >/dev/null 2>&1 || true"
          }
        ]
      }
    ]
  }
}
```

### What the hooks do

| Hook | Trigger | Action |
|------|---------|--------|
| `PostToolUse` | After every `Edit`, `Write`, or `NotebookEdit` tool use | Append a lightweight `muse_session_history` save with an `auto-capture` tag |
| `Stop` | When Claude finishes a turn | Roll up a `muse_create_session_log` with `logType: "session"` |

The `>/dev/null 2>&1 || true` suffix makes the hook fire-and-forget — if
the MCP isn't running, Claude Code keeps working without surfacing an error.

## 2. Verifying capture

After the hooks are active, run any Claude Code session that edits files. To
inspect what was captured:

```bash
# From your shell:
ls ~/.vibe-coding-mcp/sessions/

# Or from any MCP-aware client (Claude Desktop, Claude Code):
# Call the tool directly:
#   muse_session_history { "action": "list", "filterTags": ["auto-capture"] }
# Or read the resource:
#   resource://vibe-coding/sessions/list
```

You can also use the bundled prompt `/daily-vibe-log` (registered as
`prompt://vibe-coding/daily-vibe-log`) to aggregate everything captured
today into a single daily log document.

## 3. Customising the capture payload

The hook command is just a shell command, so you can pipe richer context
into the MCP. A common extension is to capture the latest git diff:

```jsonc
{
  "type": "command",
  "command": "DIFF=$(git diff --stat 2>/dev/null | head -20); claude mcp call vibe-coding-mcp muse_session_history \"{\\\"action\\\":\\\"save\\\",\\\"title\\\":\\\"auto-capture\\\",\\\"summary\\\":\\\"$DIFF\\\",\\\"tags\\\":[\\\"auto-capture\\\"]}\" >/dev/null 2>&1 || true"
}
```

## 4. Disabling auto-capture

Remove the `hooks` block from `~/.claude/settings.json`. Captured sessions
remain on disk under `~/.vibe-coding-mcp/sessions/` until you delete them
explicitly (`muse_session_history { "action": "delete", "sessionId": "..." }`).

## See also

- Tool catalog: [README — 15 MCP Tools](../README.md#15-mcp-tools)
- Resources & prompts: [README — Capabilities matrix](../README.md#capabilities-matrix)
- Claude Code hooks reference: <https://docs.claude.com/en/docs/claude-code/hooks>
