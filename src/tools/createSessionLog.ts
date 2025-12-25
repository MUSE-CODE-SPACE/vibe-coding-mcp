import { SessionLog, CodeContext, DesignDecision, SessionLogOptions } from '../types/index.js';
import { generateId, formatDate, getCurrentTimestamp } from '../utils/markdown.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface CreateSessionLogInput {
  title: string;
  summary: string;
  codeContexts?: CodeContext[];
  designDecisions?: DesignDecision[];
  duration?: number;
  tags?: string[];
  options?: SessionLogOptions;
}

export interface CreateSessionLogOutput {
  sessionLog: SessionLog;
  filePath?: string;
  content: string;
}

export async function createSessionLog(input: CreateSessionLogInput): Promise<CreateSessionLogOutput> {
  const sessionLog: SessionLog = {
    sessionId: generateId(),
    date: formatDate(),
    title: input.title,
    summary: input.summary,
    codeContexts: input.codeContexts || [],
    designDecisions: input.designDecisions || [],
    duration: input.duration,
    tags: input.tags
  };

  const options = input.options || { logType: 'session', format: 'markdown' };
  let content: string;
  let filePath: string | undefined;

  if (options.format === 'json') {
    content = JSON.stringify(sessionLog, null, 2);
  } else {
    content = generateMarkdownLog(sessionLog, options.logType);
  }

  // 파일로 저장
  if (options.outputPath) {
    const extension = options.format === 'json' ? '.json' : '.md';
    const filename = options.logType === 'daily'
      ? `${formatDate()}-daily-log${extension}`
      : `${sessionLog.sessionId}${extension}`;

    filePath = path.join(options.outputPath, filename);

    try {
      await fs.mkdir(options.outputPath, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      // 파일 저장 실패시 filePath를 undefined로
      filePath = undefined;
    }
  }

  return {
    sessionLog,
    filePath,
    content
  };
}

function generateMarkdownLog(log: SessionLog, logType: 'daily' | 'session'): string {
  let md = '';

  if (logType === 'daily') {
    md += `# Daily Vibe Coding Log - ${log.date}\n\n`;
  } else {
    md += `# Session: ${log.title}\n\n`;
    md += `**Session ID:** ${log.sessionId}\n`;
    md += `**Date:** ${log.date}\n`;
  }

  if (log.duration) {
    md += `**Duration:** ${Math.round(log.duration / 60)} minutes\n`;
  }

  if (log.tags && log.tags.length > 0) {
    md += `**Tags:** ${log.tags.map(t => `#${t}`).join(' ')}\n`;
  }

  md += '\n---\n\n';

  md += `## Summary\n\n${log.summary}\n\n`;

  if (log.codeContexts.length > 0) {
    md += `## Code Contexts\n\n`;

    for (const context of log.codeContexts) {
      md += `### ${context.timestamp}\n\n`;
      md += context.conversationSummary + '\n\n';

      if (context.codeBlocks.length > 0) {
        md += `<details>\n<summary>View Code (${context.codeBlocks.length} blocks)</summary>\n\n`;
        for (const block of context.codeBlocks) {
          md += `\`\`\`${block.language}\n${block.code}\n\`\`\`\n\n`;
        }
        md += `</details>\n\n`;
      }
    }
  }

  if (log.designDecisions.length > 0) {
    md += `## Design Decisions\n\n`;

    for (const decision of log.designDecisions) {
      md += `### ${decision.title}\n\n`;
      md += `**Category:** ${decision.category}\n\n`;
      md += decision.description + '\n\n';

      if (decision.rationale) {
        md += `> **Rationale:** ${decision.rationale}\n\n`;
      }

      if (decision.alternatives && decision.alternatives.length > 0) {
        md += `**Alternatives considered:**\n`;
        for (const alt of decision.alternatives) {
          md += `- ${alt}\n`;
        }
        md += '\n';
      }
    }
  }

  md += `---\n\n*Log generated at ${getCurrentTimestamp()}*\n`;

  return md;
}

export const createSessionLogSchema = {
  name: 'create_session_log',
  description: 'Creates daily or session-based vibe coding session logs.',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title of the session'
      },
      summary: {
        type: 'string',
        description: 'Summary of what was accomplished'
      },
      codeContexts: {
        type: 'array',
        description: 'Array of code contexts from the session',
        items: { type: 'object' }
      },
      designDecisions: {
        type: 'array',
        description: 'Array of design decisions made',
        items: { type: 'object' }
      },
      duration: {
        type: 'number',
        description: 'Session duration in seconds'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for the session'
      },
      options: {
        type: 'object',
        properties: {
          logType: {
            type: 'string',
            enum: ['daily', 'session'],
            description: 'Type of log to create'
          },
          outputPath: {
            type: 'string',
            description: 'Directory path to save the log file'
          },
          format: {
            type: 'string',
            enum: ['markdown', 'json'],
            description: 'Output format of the log'
          }
        }
      }
    },
    required: ['title', 'summary']
  }
};
