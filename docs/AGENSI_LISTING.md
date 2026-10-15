# Agensi listing — vibe-coding

Copy for the Agensi.io creator dashboard. Upload `dist-skill/vibe-coding-skill-<version>.zip` (built by `npm run skill:pack`).
Agensi's review checks: a clear SKILL.md, no hidden behaviour, honest intent, original work, "it actually works", payouts connected (KYC).

## Title
vibe-coding — your AI coding sessions, documented automatically

## Tagline (one line)
Captures every Claude Code session into local memory and turns it into standups, weekly reports, ADRs and PR descriptions.

## Short description (≈160 chars)
Auto-captures Claude Code sessions (prompts, files, commands, decisions) and writes standups, weekly reports, ADRs and PR descriptions. Local-first, no API key.

## Long description

You spent four hours pair-programming with an AI. You made three architectural decisions, wrote eight files and reverted twice. Tomorrow you will not remember why you picked option B. `git log` knows *what* changed, not *why*.

**vibe-coding** fixes that at the source. Claude Code already writes a full transcript of every session. A tiny hook parses it after every turn and stores a structured session on your disk: what you asked, which files were written or edited (with the code), which commands ran, how long you actively worked, which branch, and the design decisions it can detect. The skill then teaches your agent when and how to use the 17 MCP tools to turn those sessions into:

- `/standup` — Yesterday / Today / Blockers, every bullet traceable to a captured session
- `/weekly-report` — Shipped / Decisions / In progress / Next, per project, with hours and files
- "why did we choose JWT over sessions?" — keyword search across titles, prompts and touched file paths
- ADR / DESIGN / README / API docs generated from a session
- PR descriptions with Why / What changed / Trade-offs / How to review (+ Mermaid diagram)
- Publishing to Notion, Obsidian, GitHub Wiki, Confluence, Slack or Discord

**What's in the package**
- `SKILL.md` — when to use it, the tool chain for each request, output shapes, and the rule that nothing in a report may be invented
- `references/tools.md` — every tool, resource, prompt, parameter and env var
- `references/workflows.md` — step-by-step chains with example calls
- `scripts/setup.sh` — one-shot install: MCP registration + capture hooks + backfill + doctor
- `assets/hooks.settings.json` — the exact hooks block, for manual setup

**Requirements**: Node.js 18+, Claude Code (capture) — the MCP tools also work in Cursor, Codex CLI and any MCP-capable agent for reporting over an existing session store.

**Privacy & security (disclosed behaviour)**
- No telemetry. Sessions live in `~/.vibe-coding-mcp/sessions/` as JSON; nothing leaves the machine unless you call a publish tool.
- `setup.sh` / `init` write a hooks block into `~/.claude/settings.json` and create a backup first; `init --remove` uninstalls.
- `npx -y vibe-coding-mcp` downloads the MIT-licensed package from npm (source: github.com/MUSE-CODE-SPACE/vibe-coding-mcp). No other network calls unless a publish platform is configured.
- No credentials are read or stored; publish integrations use env vars you set yourself.

## Category / tags
Developer tools · Documentation · Productivity
`claude-code`, `mcp`, `documentation`, `standup`, `weekly-report`, `adr`, `pr-description`, `notion`, `obsidian`, `session-memory`

## Supported agents
Claude Code (full: capture + skill + MCP) · Cursor, Codex CLI, Windsurf, Gemini CLI, Copilot (skill + MCP tools over an existing session store)

## Pricing (suggestion)
- Launch: **Free** (the MCP server is MIT and on npm; the skill is the packaging + playbook). Free listings get installs and reviews first.
- Later option: a paid "Pro playbook" skill with team templates (shared store, Slack digests) once those features ship.

## Screenshots / demo to attach
1. `npx vibe-coding-mcp doctor` output (hooks installed, N sessions)
2. `/standup` result in Claude Code
3. `/weekly-report` rendered in Notion

## Checklist before submitting
- [ ] `npm run skill:pack` → upload the zip from `dist-skill/`
- [ ] npm has the version the skill references (`npm view vibe-coding-mcp version` ≥ 2.15.1)
- [ ] GitHub `main` is pushed and the `v<version>` tag exists
- [ ] Agensi account + KYC completed (required for payouts, even for free listings you may need it to publish)
