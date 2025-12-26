# Vibe Coding Documentation MCP (MUSE)

MCP server that automatically collects, summarizes, documents, and publishes code and design decisions created during vibe coding sessions.

## Features

This MCP server provides 15 tools for managing vibe coding documentation:

| Tool | Description |
|------|-------------|
| `muse_collect_code_context` | Collects code blocks and conversation summaries into structured context |
| `muse_summarize_design_decisions` | Extracts key architectural and design decisions from conversation logs |
| `muse_generate_dev_document` | Generates README, DESIGN, TUTORIAL, CHANGELOG, API, or ARCHITECTURE documents |
| `muse_normalize_for_platform` | Converts Markdown documents for Notion, GitHub Wiki, or Obsidian |
| `muse_publish_document` | Publishes generated documents to external platforms |
| `muse_create_session_log` | Creates daily or session-based vibe coding session logs |
| `muse_analyze_code` | AST-based code analysis with Mermaid diagram generation |
| `muse_session_history` | Manages session history - save, retrieve, search past sessions |
| `muse_export_session` | Exports sessions to Markdown, JSON, or HTML formats |
| `muse_project_profile` | Manages project-specific settings and configurations |
| `muse_git` | Git integration - status, log, diff, branch, snapshot, design decision extraction |
| `muse_session_stats` | Session analytics dashboard with productivity insights and trends |
| `muse_auto_tag` | AI-powered auto-tagging for sessions based on content analysis |
| `muse_template` | Custom template management for documents and reports |
| `muse_batch` | Batch operations to execute multiple tools in sequence or parallel |

### Additional Features (v2.0)
- **AST Parsing**: TypeScript, Python, Go code analysis
- **Mermaid Diagrams**: Class, Flowchart, Sequence, ER, Architecture diagrams
- **Multi-language**: Korean/English support
- **6 Document Types**: README, DESIGN, TUTORIAL, CHANGELOG, API, ARCHITECTURE
- **6 Platforms**: Notion, GitHub Wiki, Obsidian, Confluence, Slack, Discord

### Code Quality (v2.1)
- **Input Validation**: Zod schema-based type-safe validation for all tools
- **Error Handling**: Structured error classes (ToolError, ValidationError, PlatformError)
- **Security**: Command injection prevention (exec → spawn), path sanitization
- **Performance**: LRU cache, regex cache, memoization utilities

### Security (v2.2)
- **Path Traversal Prevention**: Validates file paths stay within allowed directories
- **SSRF Protection**: Webhook URL validation for Slack/Discord
- **Network Timeout**: AbortController-based request timeout (30s default)
- **Retry Logic**: Exponential backoff with configurable retry attempts

### Enhanced Quality (v2.3)
- **Structured Logging**: JSON-based logging with child loggers per tool
- **Configuration Validation**: Startup validation for all platform configurations
- **Platform Expansion**: Full support for 6 platforms (Notion, GitHub Wiki, Obsidian, Confluence, Slack, Discord)
- **AST Memoization**: Cached code analysis for improved performance
- **Test Coverage**: 149 tests with 85%+ coverage on core modules

### AI-Powered Analysis (v2.4)
- **Claude AI Integration**: Use Claude AI for enhanced design decision analysis
- **Smart Summarization**: AI-generated insights and recommendations
- **Fallback Support**: Automatic fallback to pattern-based analysis when AI unavailable
- **Optional Feature**: Enable with `useAI: true` parameter

### AI Code Analysis (v2.5)
- **AI-Powered Code Review**: Deep code analysis with quality, security, and performance insights
- **Issue Detection**: Identify potential bugs, security vulnerabilities, and code smells
- **Improvement Suggestions**: AI-generated recommendations for better code
- **Works with AST**: Combines AI insights with AST-based analysis for comprehensive results

### Session History (v2.6)
- **Persistent Storage**: Save coding sessions to local JSON files
- **CRUD Operations**: Create, read, update, delete sessions
- **Search & Filter**: Find past sessions by keyword, tags, or date
- **Statistics**: Track total sessions, code contexts, and design decisions

### Session Export & Project Profiles (v2.7)
- **Session Export**: Export sessions to Markdown, JSON, or HTML formats
- **Multiple Templates**: Default, minimal, detailed, and report templates
- **Project Profiles**: Manage project-specific settings and configurations
- **Publishing Config**: Default platforms and settings per project
- **Code Analysis Config**: Language preferences and diagram types
- **Documentation Config**: Default document types, language, author info
- **Team Management**: Store team member information per project

### Git Integration (v2.8)
- **Repository Status**: View staged, unstaged, and untracked files
- **Commit History**: Browse commit log with filtering by author, date, grep
- **Diff Analysis**: View changes with statistics (staged, unstaged, between refs)
- **Branch Info**: List local and remote branches with tracking info
- **Git Snapshot**: Capture complete repository state for session context
- **Design Decision Extraction**: Auto-extract design decisions from commit messages
- **Session Linking**: Attach Git context to coding sessions

### Session Statistics Dashboard (v2.9)
- **Overview Analytics**: Total sessions, code contexts, design decisions at a glance
- **Language Distribution**: Breakdown of programming languages used across sessions
- **Timeline View**: Session activity over time (daily, weekly, monthly)
- **Tag Analytics**: Most used tags and tag co-occurrence analysis
- **Productivity Insights**: Session duration, code output, and efficiency metrics
- **Trend Analysis**: Compare current period with previous or average

### AI Auto-tagging (v2.10)
- **Smart Tag Suggestions**: Pattern-based and AI-powered tag recommendations
- **Confidence Scoring**: Each tag suggestion includes confidence level
- **Custom Tag Training**: Train the system with custom tag patterns
- **Configurable Rules**: Define tag rules for file extensions, keywords, patterns
- **Batch Tagging**: Apply tags to multiple sessions at once

### Custom Templates (v2.11)
- **Template Management**: Create, edit, delete custom document templates
- **Variable Substitution**: Support for `{{variable}}`, `${variable}`, `{variable}` formats
- **Built-in Templates**: README, Session Summary, Weekly Report templates included
- **Template Preview**: Preview rendered output before applying
- **Import/Export**: Share templates between projects

### Batch Operations (v2.12)
- **Sequential Execution**: Run multiple tools in order with dependency management
- **Parallel Execution**: Execute independent operations concurrently
- **Dependency Graph**: Topological sort for operation ordering
- **Job Tracking**: Monitor batch job status, cancel running jobs
- **Error Handling**: Stop on error or continue with remaining operations
- **Result Chaining**: Pass output from one operation to next using `$ref` syntax

## Installation

### Claude Code (Recommended)

```bash
claude mcp add vibe-coding-mcp npx vibe-coding-mcp
```

### npm

```bash
npm install -g vibe-coding-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vibe-coding-mcp": {
      "command": "npx",
      "args": ["vibe-coding-mcp"]
    }
  }
}
```

## Environment Variables

```env
# Anthropic API (optional, for AI-powered analysis)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Notion API (optional)
NOTION_API_KEY=your_notion_api_key_here
NOTION_DATABASE_ID=your_database_id_here

# GitHub (optional, for Wiki publishing)
GITHUB_TOKEN=your_github_token_here
GITHUB_REPO=owner/repo

# Confluence (optional)
CONFLUENCE_BASE_URL=https://your-domain.atlassian.net
CONFLUENCE_USERNAME=your_email@example.com
CONFLUENCE_API_TOKEN=your_api_token_here
CONFLUENCE_SPACE_KEY=YOURSPACE

# Slack (optional, webhook URL passed via tool parameter)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Discord (optional, webhook URL passed via tool parameter)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
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

### 4. Git-Aware Session Documentation

```
User: Capture my current Git state and create a session with design decisions from commits.

Claude: [Uses muse_git(action='snapshot') → muse_git(action='extractDecisions') → muse_session_history(action='save')]
```

### 5. Complete Session Export with Git Context

```
User: Export all my sessions from this week with Git information.

Claude: [Uses muse_git(action='linkToSession') → muse_export_session(format='markdown')]
```

### 6. Session Analytics Dashboard

```
User: Show me my coding productivity statistics for this month.

Claude: [Uses muse_session_stats(action='overview') → muse_session_stats(action='productivity') → muse_session_stats(action='trends')]
```

### 7. Auto-tag and Organize Sessions

```
User: Analyze my sessions and suggest relevant tags.

Claude: [Uses muse_auto_tag(action='suggest') → muse_auto_tag(action='apply')]
```

### 8. Generate Custom Report with Template

```
User: Create a weekly report using the team report template.

Claude: [Uses muse_template(action='apply', templateId='weekly-report') → muse_publish_document]
```

### 9. Batch Documentation Workflow

```
User: Analyze this code, generate docs, and publish to Notion in one go.

Claude: [Uses muse_batch(action='execute', operations=[
  {tool: 'muse_analyze_code', params: {...}},
  {tool: 'muse_generate_dev_document', params: {...}, dependsOn: ['op_0']},
  {tool: 'muse_publish_document', params: {...}, dependsOn: ['op_1']}
])]
```

## Supported Platforms

- **Notion**: Full API integration with page creation
- **GitHub Wiki**: Git-based wiki updates
- **Obsidian**: Local vault file storage with frontmatter support
- **Confluence**: Atlassian Confluence page publishing
- **Slack**: Webhook-based message publishing
- **Discord**: Webhook-based message publishing

## Project Structure

```
src/
├── stdio.ts              # MCP server entry point (stdio transport)
├── index.ts              # HTTP/SSE server entry point
├── core/
│   ├── schemas.ts        # Zod validation schemas
│   ├── errors.ts         # Structured error classes
│   ├── cache.ts          # LRU cache & memoization
│   ├── security.ts       # Path traversal, SSRF, timeout utilities
│   ├── logger.ts         # Structured JSON logging
│   └── config.ts         # Platform configuration validation
├── tools/                # 15 MCP tools
├── platforms/            # Notion, GitHub Wiki, Obsidian, Confluence, Slack, Discord
├── types/                # TypeScript interfaces
└── utils/
    ├── markdown.ts       # Markdown processing
    ├── astParser.ts      # AST parsing for TypeScript, Python, Go
    ├── diagramGenerator.ts # Mermaid diagram generation
    ├── gitExecutor.ts    # Safe Git command execution
    └── gitParsers.ts     # Git output parsing utilities
```

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Start (HTTP/SSE mode)
npm start

# Start (stdio mode for Claude Desktop)
npm run stdio

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` | MCP server SDK |
| `@notionhq/client` | Notion API integration |
| `zod` | Input validation |
| `typescript` | TypeScript compiler |

## License

MIT
