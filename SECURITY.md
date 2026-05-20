# Security Policy

`vibe-coding-mcp` is an MCP (Model Context Protocol) server that reads source code,
runs `git` commands, and publishes generated documentation to third-party platforms
(Notion, Obsidian, GitHub Wiki, Confluence, Slack, Discord). Because it executes
local commands and makes outbound HTTPS requests on behalf of the calling LLM,
the threat surface is non-trivial. This document describes the guarantees the
package makes, what is explicitly out of scope, and how to report vulnerabilities.

## Supported versions

| Version  | Supported |
|----------|-----------|
| 2.13.x   | yes       |
| < 2.13   | no        |

## Threat model

The MCP server runs on the **same trust boundary as the operator's developer
machine** (or container). It is *not* designed to be exposed to untrusted users
over a network. The threats actively mitigated are:

| # | Threat                                              | Mitigation (in `src/core/security.ts`)            |
|---|-----------------------------------------------------|---------------------------------------------------|
| 1 | Path traversal via tool arguments                   | `validatePathWithinDirectory`, `sanitizeFilename` |
| 2 | SSRF via webhook URLs (Slack / Discord)             | `validateWebhookUrl` + allowlist of known hosts   |
| 3 | Plaintext webhook URLs                              | HTTPS-only check inside `validateWebhookUrl`      |
| 4 | Hung outbound requests / DoS                        | `fetchWithRetry` with timeout + exponential backoff |
| 5 | Unbounded retries on transient errors               | `maxRetries` cap (default 3) with retry-after honored |
| 6 | Arbitrary shell injection through `git` invocations | All `git` calls go through `gitExecutor.ts` argv form (no shell) |
| 7 | Unvalidated tool inputs                             | All tool args parsed through Zod schemas in `src/core/schemas.ts` |

### Out of scope

- **Sandboxing of the host machine.** The MCP server has the privileges of the
  user running it. Treat tokens (Notion, GitHub, Discord, Slack) as ambient
  authority and store them in `.env`, not in source control.
- **Supply-chain attestation for third-party platforms.** We trust the official
  SDKs (`@anthropic-ai/sdk`, `@notionhq/client`) to handle their own transport
  security.
- **Multi-tenant isolation.** Running a single MCP server for multiple users is
  not a supported deployment.

## Reporting a vulnerability

If you believe you have found a security issue:

1. **Do not open a public GitHub issue.**
2. Email the maintainers via the GitHub Security Advisories tab on this
   repository, or open a private advisory at
   https://github.com/MUSE-CODE-SPACE/vibe-coding-mcp/security/advisories/new
3. Include a reproduction (minimal MCP tool call, environment, expected vs
   actual behavior).

We aim to acknowledge reports within 72 hours and to ship a fix or mitigation
within 14 days for high-severity issues.

## Hardening checklist for operators

- Run `vibe-coding-mcp` inside the smallest reasonable container or user account.
- Keep `.env` out of version control. Rotate Notion / Slack / Discord tokens
  if they are ever logged.
- Pin the package to a known-good version (e.g. `vibe-coding-mcp@2.13.0`) in
  production rather than using `latest`.
- Watch the GitHub Actions `CodeQL` workflow for new findings on `main`.
