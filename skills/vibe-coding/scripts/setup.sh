#!/usr/bin/env bash
# One-shot setup for vibe-coding-mcp inside Claude Code:
#   1. register the MCP server (user scope)
#   2. install the Stop + SessionEnd capture hooks and the SessionStart project-memory hook
#   3. backfill existing transcripts (all projects, Claude Code + Codex, last 30 days)
#   4. run doctor
#
# Usage: bash scripts/setup.sh [--project]   (--project writes hooks to .claude/settings.json)
set -euo pipefail

SCOPE_FLAG=""
if [[ "${1:-}" == "--project" ]]; then SCOPE_FLAG="--project"; fi

if ! command -v claude >/dev/null 2>&1; then
  echo "claude CLI not found. Install Claude Code first: https://code.claude.com" >&2
  exit 1
fi

echo "▶ Registering MCP server (claude mcp add -s user vibe-coding-mcp)…"
if claude mcp get vibe-coding-mcp >/dev/null 2>&1; then
  echo "  already registered"
else
  claude mcp add -s user vibe-coding-mcp -- npx -y vibe-coding-mcp
fi

echo "▶ Installing hooks…"
npx -y vibe-coding-mcp init $SCOPE_FLAG

echo "▶ Backfilling transcripts…"
npx -y vibe-coding-mcp sync || true

echo "▶ Doctor"
npx -y vibe-coding-mcp doctor

echo
echo "Done. Restart Claude Code, then try: /catch-up  /standup  /weekly-report"
