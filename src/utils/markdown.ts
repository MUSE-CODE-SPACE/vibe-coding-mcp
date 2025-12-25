import { CodeBlock, DesignDecision, Platform } from '../types/index.js';

// 코드 블록을 마크다운으로 변환
export function codeBlockToMarkdown(block: CodeBlock): string {
  const header = block.filename ? `// ${block.filename}` : '';
  const description = block.description ? `// ${block.description}\n` : '';

  return `\`\`\`${block.language}
${header ? header + '\n' : ''}${description}${block.code}
\`\`\``;
}

// 디자인 결정을 마크다운으로 변환
export function designDecisionToMarkdown(decision: DesignDecision): string {
  let md = `### ${decision.title}\n\n`;
  md += `**Category:** ${decision.category}\n\n`;
  md += `${decision.description}\n\n`;
  md += `**Rationale:** ${decision.rationale}\n`;

  if (decision.alternatives && decision.alternatives.length > 0) {
    md += `\n**Alternatives Considered:**\n`;
    decision.alternatives.forEach(alt => {
      md += `- ${alt}\n`;
    });
  }

  return md;
}

// 텍스트에서 코드 블록 추출
export function extractCodeBlocks(text: string): CodeBlock[] {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: CodeBlock[] = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim()
    });
  }

  return blocks;
}

// 플랫폼별 마크다운 변환
export function normalizeMarkdownForPlatform(markdown: string, platform: Platform): string {
  switch (platform) {
    case 'notion':
      return normalizeForNotion(markdown);
    case 'github-wiki':
      return normalizeForGitHubWiki(markdown);
    case 'obsidian':
      return normalizeForObsidian(markdown);
    default:
      return markdown;
  }
}

// Notion용 변환
function normalizeForNotion(markdown: string): string {
  // Notion은 대부분의 마크다운을 지원하지만 일부 조정 필요
  let normalized = markdown;

  // 체크박스 변환
  normalized = normalized.replace(/- \[ \]/g, '☐');
  normalized = normalized.replace(/- \[x\]/g, '☑');

  // 하이라이트 문법 변환 (==text== -> **text**)
  normalized = normalized.replace(/==(.*?)==/g, '**$1**');

  return normalized;
}

// GitHub Wiki용 변환
function normalizeForGitHubWiki(markdown: string): string {
  let normalized = markdown;

  // 내부 링크를 Wiki 스타일로 변환
  // [[Page Name]] -> [Page Name](Page-Name)
  normalized = normalized.replace(/\[\[(.*?)\]\]/g, (_, pageName) => {
    const slug = pageName.replace(/\s+/g, '-');
    return `[${pageName}](${slug})`;
  });

  return normalized;
}

// Obsidian용 변환
function normalizeForObsidian(markdown: string): string {
  let normalized = markdown;

  // 일반 링크를 Obsidian 내부 링크로 변환 (필요시)
  // 이미 Obsidian 형식이면 그대로 유지

  // 태그 형식 유지 (#tag)
  // Callout 문법 지원
  normalized = normalized.replace(/^> \[!(note|warning|tip|important)\]/gm, (_, type) => {
    return `> [!${type}]`;
  });

  return normalized;
}

// UUID 생성
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 현재 타임스탬프 생성
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// 날짜 포맷팅 (YYYY-MM-DD)
export function formatDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}
