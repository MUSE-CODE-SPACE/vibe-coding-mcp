# Vibe Coding Documentation MCP (MUSE)

MCP server that automatically collects, summarizes, documents, and publishes code and design decisions created during vibe coding sessions.

## Features

This MCP server provides 7 tools for managing vibe coding documentation:

| Tool | Description |
|------|-------------|
| `muse_collect_code_context` | Collects code blocks and conversation summaries into structured context |
| `muse_summarize_design_decisions` | Extracts key architectural and design decisions from conversation logs |
| `muse_generate_dev_document` | Generates README, DESIGN, TUTORIAL, CHANGELOG, API, or ARCHITECTURE documents |
| `muse_normalize_for_platform` | Converts Markdown documents for Notion, GitHub Wiki, or Obsidian |
| `muse_publish_document` | Publishes generated documents to external platforms |
| `muse_create_session_log` | Creates daily or session-based vibe coding session logs |
| `muse_analyze_code` | AST-based code analysis with Mermaid diagram generation |

### Additional Features (v2.0)
- **AST Parsing**: TypeScript, Python, Go code analysis
- **Mermaid Diagrams**: Class, Flowchart, Sequence, ER, Architecture diagrams
- **Multi-language**: Korean/English support
- **6 Document Types**: README, DESIGN, TUTORIAL, CHANGELOG, API, ARCHITECTURE
- **6 Platforms**: Notion, GitHub Wiki, Obsidian, Confluence, Slack, Discord

## Quick Start (HTTP Server)

```bash
# Install dependencies
npm install

# Build
npm run build

# Start server
npm start
```

Server will run on `http://localhost:3000`

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check & server info |
| `/sse` | GET | SSE connection for MCP |
| `/message` | POST | Message endpoint for MCP |

## Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

Or manually:

```bash
railway login
railway init
railway up
```

## Usage with PlayMCP

1. Deploy to Railway (or any hosting service)
2. Get your server URL (e.g., `https://your-app.railway.app`)
3. Register on [PlayMCP](https://playmcp.kakao.com/)
4. Enter your SSE endpoint: `https://your-app.railway.app/sse`

## Environment Variables

```env
# Server Port (optional, default: 3000)
PORT=3000

# Notion API (optional, for publish_document)
NOTION_API_KEY=your_notion_api_key_here
NOTION_DATABASE_ID=your_database_id_here

# GitHub (optional, for Wiki publishing)
GITHUB_TOKEN=your_github_token_here
GITHUB_REPO=owner/repo
```

## Demo Scenarios

### 1. Generate README and Publish to Notion

```
User: Collect the code we wrote today and create a README, then publish to Notion.

Claude: [Uses collect_code_context → generate_dev_document → normalize_for_platform → publish_document]
```

### 2. Create Design Decision Docs for GitHub Wiki

```
User: Summarize our design decisions and publish to GitHub Wiki.

Claude: [Uses summarize_design_decisions → generate_dev_document → normalize_for_platform → publish_document]
```

### 3. Daily Vibe Coding Log

```
User: Create a session log for today's work.

Claude: [Uses collect_code_context → create_session_log]
```

## Supported Platforms

- **Notion**: Full API integration with page creation
- **GitHub Wiki**: Git-based wiki updates
- **Obsidian**: Local vault file storage with frontmatter support

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Start
npm start
```

## License

MIT
