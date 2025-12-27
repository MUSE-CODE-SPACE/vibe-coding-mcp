# Vibe Coding MCP

**Vibe Coding Session Documentation MCP Server**

> Automatically collect, summarize, document, and publish your vibe coding sessions

[![npm version](https://badge.fury.io/js/vibe-coding-mcp.svg)](https://www.npmjs.com/package/vibe-coding-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](#english) | [한국어](#korean)

---

<a name="english"></a>
## English

### Overview

Vibe Coding MCP is an MCP server that automatically collects, summarizes, documents, and publishes code and design decisions created during vibe coding sessions. It provides **15 powerful tools** for managing your coding documentation workflow.

### Features

- **15 MCP Tools** - Complete documentation workflow
- **AST Parsing** - TypeScript, Python, Go code analysis
- **Mermaid Diagrams** - Class, Flowchart, Sequence, ER, Architecture diagrams
- **Multi-language** - Korean/English support
- **6 Document Types** - README, DESIGN, TUTORIAL, CHANGELOG, API, ARCHITECTURE
- **6 Platforms** - Notion, GitHub Wiki, Obsidian, Confluence, Slack, Discord
- **Git Integration** - Status, log, diff, branch, snapshot, design decision extraction
- **Session Analytics** - Productivity insights and trend analysis
- **AI-Powered** - Claude AI integration for enhanced analysis

### 15 MCP Tools

| Tool | Description |
|------|-------------|
| `muse_collect_code_context` | Collect code blocks and conversation summaries |
| `muse_summarize_design_decisions` | Extract architectural and design decisions |
| `muse_generate_dev_document` | Generate README, DESIGN, API, ARCHITECTURE docs |
| `muse_normalize_for_platform` | Convert Markdown for Notion, GitHub Wiki, Obsidian |
| `muse_publish_document` | Publish to external platforms |
| `muse_create_session_log` | Create daily/session-based logs |
| `muse_analyze_code` | AST-based code analysis with Mermaid diagrams |
| `muse_session_history` | Manage session history (save, retrieve, search) |
| `muse_export_session` | Export sessions to Markdown, JSON, HTML |
| `muse_project_profile` | Manage project-specific settings |
| `muse_git` | Git integration (status, log, diff, branch, snapshot) |
| `muse_session_stats` | Session analytics dashboard |
| `muse_auto_tag` | AI-powered auto-tagging |
| `muse_template` | Custom template management |
| `muse_batch` | Batch operations (sequential/parallel) |

### Installation

#### Claude Code (Recommended)

```bash
claude mcp add vibe-coding-mcp npx vibe-coding-mcp
```

#### npm

```bash
npm install -g vibe-coding-mcp
```

#### Claude Desktop

Add to `claude_desktop_config.json`:

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

### Example Usage

#### Generate README and Publish to Notion
```
User: "Collect the code we wrote today and create a README, then publish to Notion."

Claude: [Uses collect_code_context → generate_dev_document → publish_document]
```

#### Daily Vibe Coding Log
```
User: "Create a session log for today's work."

Claude: [Uses collect_code_context → create_session_log]
```

#### Session Analytics Dashboard
```
User: "Show me my coding productivity statistics for this month."

Claude: [Uses muse_session_stats(action='overview') → muse_session_stats(action='productivity')]
```

#### Batch Documentation Workflow
```
User: "Analyze this code, generate docs, and publish to Notion in one go."

Claude: [Uses muse_batch with sequential operations]
```

### Supported Platforms

- **Notion** - Full API integration with page creation
- **GitHub Wiki** - Git-based wiki updates
- **Obsidian** - Local vault file storage with frontmatter
- **Confluence** - Atlassian Confluence page publishing
- **Slack** - Webhook-based message publishing
- **Discord** - Webhook-based message publishing

---

<a name="korean"></a>
## 한국어

### 개요

Vibe Coding MCP는 바이브 코딩 세션 중 생성된 코드와 설계 결정을 자동으로 수집, 요약, 문서화, 발행하는 MCP 서버입니다. 문서화 워크플로우를 관리하기 위한 **15가지 강력한 도구**를 제공합니다.

### 주요 기능

- **15개 MCP 도구** - 완벽한 문서화 워크플로우
- **AST 파싱** - TypeScript, Python, Go 코드 분석
- **Mermaid 다이어그램** - Class, Flowchart, Sequence, ER, Architecture 다이어그램
- **다국어 지원** - 한국어/영어 지원
- **6가지 문서 타입** - README, DESIGN, TUTORIAL, CHANGELOG, API, ARCHITECTURE
- **6개 플랫폼** - Notion, GitHub Wiki, Obsidian, Confluence, Slack, Discord
- **Git 연동** - 상태, 로그, diff, 브랜치, 스냅샷, 설계 결정 추출
- **세션 분석** - 생산성 인사이트 및 트렌드 분석
- **AI 기반** - Claude AI 연동으로 향상된 분석

### 15개 MCP 도구

| 도구 | 설명 |
|------|------|
| `muse_collect_code_context` | 코드 블록과 대화 요약 수집 |
| `muse_summarize_design_decisions` | 아키텍처 및 설계 결정 추출 |
| `muse_generate_dev_document` | README, DESIGN, API, ARCHITECTURE 문서 생성 |
| `muse_normalize_for_platform` | Notion, GitHub Wiki, Obsidian용 Markdown 변환 |
| `muse_publish_document` | 외부 플랫폼에 발행 |
| `muse_create_session_log` | 일일/세션 기반 로그 생성 |
| `muse_analyze_code` | AST 기반 코드 분석 + Mermaid 다이어그램 |
| `muse_session_history` | 세션 히스토리 관리 (저장, 조회, 검색) |
| `muse_export_session` | 세션을 Markdown, JSON, HTML로 내보내기 |
| `muse_project_profile` | 프로젝트별 설정 관리 |
| `muse_git` | Git 연동 (상태, 로그, diff, 브랜치, 스냅샷) |
| `muse_session_stats` | 세션 분석 대시보드 |
| `muse_auto_tag` | AI 기반 자동 태깅 |
| `muse_template` | 커스텀 템플릿 관리 |
| `muse_batch` | 배치 작업 (순차/병렬 실행) |

### 설치

#### Claude Code (권장)

```bash
claude mcp add vibe-coding-mcp npx vibe-coding-mcp
```

#### npm

```bash
npm install -g vibe-coding-mcp
```

#### Claude Desktop

`claude_desktop_config.json`에 추가:

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

### 사용 예시

#### README 생성 및 Notion 발행
```
User: "오늘 작성한 코드를 수집해서 README 만들고 Notion에 발행해줘."

Claude: [collect_code_context → generate_dev_document → publish_document 사용]
```

#### 일일 바이브 코딩 로그
```
User: "오늘 작업 세션 로그 만들어줘."

Claude: [collect_code_context → create_session_log 사용]
```

#### 세션 분석 대시보드
```
User: "이번 달 코딩 생산성 통계 보여줘."

Claude: [muse_session_stats(action='overview') → muse_session_stats(action='productivity') 사용]
```

#### 배치 문서화 워크플로우
```
User: "이 코드 분석하고 문서 생성해서 Notion에 발행해줘."

Claude: [muse_batch로 순차 작업 실행]
```

### 지원 플랫폼

- **Notion** - 페이지 생성 API 완전 통합
- **GitHub Wiki** - Git 기반 위키 업데이트
- **Obsidian** - 프론트매터 지원 로컬 볼트 파일 저장
- **Confluence** - Atlassian Confluence 페이지 발행
- **Slack** - 웹훅 기반 메시지 발행
- **Discord** - 웹훅 기반 메시지 발행

---

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

# Slack/Discord (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

## Links

- [npm Package](https://www.npmjs.com/package/vibe-coding-mcp)
- [GitHub Repository](https://github.com/MUSE-CODE-SPACE/vibe-coding-mcp)
- [MCP Registry](https://registry.modelcontextprotocol.io)

## License

MIT

## Author

**MUSE-CODE-SPACE** - [GitHub](https://github.com/MUSE-CODE-SPACE)
