import { Platform } from '../types/index.js';
import { normalizeMarkdownForPlatform } from '../utils/markdown.js';

export interface NormalizeForPlatformInput {
  document: string;
  platform: Platform;
  options?: {
    preserveLocalLinks?: boolean;
    convertImages?: boolean;
    addFrontmatter?: boolean;
    frontmatterData?: Record<string, string>;
  };
}

export interface NormalizeForPlatformOutput {
  normalizedDocument: string;
  platform: Platform;
  changes: string[];
}

export function normalizeForPlatform(input: NormalizeForPlatformInput): NormalizeForPlatformOutput {
  const changes: string[] = [];
  let document = input.document;

  // 기본 플랫폼별 변환
  const normalized = normalizeMarkdownForPlatform(document, input.platform);

  if (normalized !== document) {
    changes.push(`Applied ${input.platform} specific formatting`);
    document = normalized;
  }

  // 추가 옵션 처리
  if (input.options) {
    if (input.options.addFrontmatter && input.platform === 'obsidian') {
      const frontmatter = generateFrontmatter(input.options.frontmatterData || {});
      document = frontmatter + document;
      changes.push('Added YAML frontmatter');
    }

    if (input.options.convertImages) {
      document = convertImageSyntax(document, input.platform);
      changes.push('Converted image syntax');
    }

    if (input.options.preserveLocalLinks === false) {
      document = convertLocalLinks(document, input.platform);
      changes.push('Converted local links');
    }
  }

  // 플랫폼별 최종 조정
  switch (input.platform) {
    case 'notion':
      document = finalizeForNotion(document);
      break;
    case 'github-wiki':
      document = finalizeForGitHubWiki(document);
      break;
    case 'obsidian':
      document = finalizeForObsidian(document);
      break;
  }

  return {
    normalizedDocument: document,
    platform: input.platform,
    changes
  };
}

function generateFrontmatter(data: Record<string, string>): string {
  const defaultData = {
    created: new Date().toISOString(),
    ...data
  };

  let frontmatter = '---\n';
  for (const [key, value] of Object.entries(defaultData)) {
    frontmatter += `${key}: ${value}\n`;
  }
  frontmatter += '---\n\n';

  return frontmatter;
}

function convertImageSyntax(document: string, platform: Platform): string {
  switch (platform) {
    case 'notion':
      // Notion은 외부 이미지 URL 필요
      return document.replace(/!\[\[(.*?)\]\]/g, '![$1]($1)');
    case 'github-wiki':
      // GitHub Wiki는 상대 경로 사용
      return document.replace(/!\[\[(.*?)\]\]/g, '![$1](images/$1)');
    case 'obsidian':
      // Obsidian은 ![[]] 문법 그대로 사용
      return document;
    default:
      return document;
  }
}

function convertLocalLinks(document: string, platform: Platform): string {
  switch (platform) {
    case 'notion':
      // Notion 링크는 페이지 ID 필요 - 플레이스홀더 유지
      return document.replace(/\[\[(.*?)\]\]/g, '[[$1]]');
    case 'github-wiki':
      // GitHub Wiki는 하이픈 구분 slug 사용
      return document.replace(/\[\[(.*?)\]\]/g, (_, pageName) => {
        const slug = pageName.replace(/\s+/g, '-');
        return `[${pageName}](${slug})`;
      });
    case 'obsidian':
      // Obsidian은 [[]] 문법 그대로 사용
      return document;
    default:
      return document;
  }
}

function finalizeForNotion(document: string): string {
  // Notion에서 지원하지 않는 문법 제거 또는 변환

  // 각주 제거 (Notion 미지원)
  document = document.replace(/\[\^(\d+)\]/g, '');
  document = document.replace(/^\[\^(\d+)\]:.*$/gm, '');

  // 테이블 정렬 구문 단순화
  document = document.replace(/\|:?-+:?\|/g, '|---|');

  return document;
}

function finalizeForGitHubWiki(document: string): string {
  // GitHub Wiki 특화 처리

  // 상대 링크를 Wiki 링크로
  document = document.replace(/\[([^\]]+)\]\(\.\/([^)]+)\.md\)/g, '[[$2|$1]]');

  return document;
}

function finalizeForObsidian(document: string): string {
  // Obsidian 특화 처리

  // 태그 형식 확인 (#tag)
  // Callout 확인 및 변환
  document = document.replace(/^>\s*\*\*(Note|Warning|Tip|Important)\*\*:/gm, (_, type) => {
    return `> [!${type.toLowerCase()}]`;
  });

  return document;
}

export const normalizeForPlatformSchema = {
  name: 'normalize_for_platform',
  description: 'Converts Markdown documents for Notion, GitHub Wiki, or Obsidian platforms.',
  inputSchema: {
    type: 'object',
    properties: {
      document: {
        type: 'string',
        description: 'The Markdown document to normalize'
      },
      platform: {
        type: 'string',
        enum: ['notion', 'github-wiki', 'obsidian'],
        description: 'Target platform for the document'
      },
      options: {
        type: 'object',
        properties: {
          preserveLocalLinks: {
            type: 'boolean',
            description: 'Whether to preserve local wiki-style links'
          },
          convertImages: {
            type: 'boolean',
            description: 'Whether to convert image syntax for the platform'
          },
          addFrontmatter: {
            type: 'boolean',
            description: 'Whether to add YAML frontmatter (Obsidian)'
          },
          frontmatterData: {
            type: 'object',
            description: 'Custom frontmatter data to include'
          }
        }
      }
    },
    required: ['document', 'platform']
  }
};
