import { Platform } from '../types/index.js';
import { normalizeMarkdownForPlatform } from '../utils/markdown.js';

export interface NormalizeForPlatformInput {
  document: string;
  platform: Platform;
  options?: {
    preserveLocalLinks?: boolean;
    convertImages?: boolean;
    addFrontmatter?: boolean;
    frontmatterData?: Record<string, string | string[]>;
    stripHtml?: boolean;
    convertTables?: boolean;
    addTags?: string[];
    convertCodeBlocks?: boolean;
    maxLineLength?: number;
  };
}

export interface NormalizeForPlatformOutput {
  normalizedDocument: string;
  platform: Platform;
  changes: string[];
  stats: {
    originalLength: number;
    normalizedLength: number;
    headingsCount: number;
    codeBlocksCount: number;
    linksCount: number;
    imagesCount: number;
  };
  warnings?: string[];
}

export function normalizeForPlatform(input: NormalizeForPlatformInput): NormalizeForPlatformOutput {
  const changes: string[] = [];
  const warnings: string[] = [];
  let document = input.document;
  const originalLength = document.length;

  // 입력 검증
  if (!document || document.trim().length === 0) {
    warnings.push('Empty document provided');
  }

  // 기본 플랫폼별 변환
  const normalized = normalizeMarkdownForPlatform(document, input.platform);
  if (normalized !== document) {
    changes.push(`Applied ${input.platform} specific formatting`);
    document = normalized;
  }

  // HTML 제거 옵션
  if (input.options?.stripHtml) {
    const before = document;
    document = stripHtmlTags(document);
    if (before !== document) {
      changes.push('Stripped HTML tags');
    }
  }

  // 테이블 변환
  if (input.options?.convertTables) {
    const before = document;
    document = convertTables(document, input.platform);
    if (before !== document) {
      changes.push('Converted table format');
    }
  }

  // 코드 블록 변환
  if (input.options?.convertCodeBlocks) {
    const before = document;
    document = convertCodeBlocks(document, input.platform);
    if (before !== document) {
      changes.push('Converted code block syntax');
    }
  }

  // 프론트매터 추가 (Obsidian)
  if (input.options?.addFrontmatter) {
    const frontmatterData = {
      ...input.options.frontmatterData,
      tags: input.options.addTags
    };
    const frontmatter = generateFrontmatter(frontmatterData);
    document = frontmatter + document;
    changes.push('Added YAML frontmatter');
  }

  // 이미지 문법 변환
  if (input.options?.convertImages) {
    const before = document;
    document = convertImageSyntax(document, input.platform);
    if (before !== document) {
      changes.push('Converted image syntax');
    }
  }

  // 로컬 링크 변환
  if (input.options?.preserveLocalLinks === false) {
    const before = document;
    document = convertLocalLinks(document, input.platform);
    if (before !== document) {
      changes.push('Converted local links');
    }
  }

  // 줄 길이 제한
  if (input.options?.maxLineLength) {
    document = wrapLines(document, input.options.maxLineLength);
    changes.push(`Wrapped lines at ${input.options.maxLineLength} characters`);
  }

  // 플랫폼별 최종 조정
  switch (input.platform) {
    case 'notion':
      document = finalizeForNotion(document, warnings);
      break;
    case 'github-wiki':
      document = finalizeForGitHubWiki(document);
      break;
    case 'obsidian':
      document = finalizeForObsidian(document, input.options?.addTags);
      break;
  }

  // 통계 수집
  const stats = collectStats(document);

  const result: NormalizeForPlatformOutput = {
    normalizedDocument: document,
    platform: input.platform,
    changes,
    stats: {
      originalLength,
      normalizedLength: document.length,
      ...stats
    }
  };

  if (warnings.length > 0) {
    result.warnings = warnings;
  }

  return result;
}

function collectStats(document: string): { headingsCount: number; codeBlocksCount: number; linksCount: number; imagesCount: number } {
  return {
    headingsCount: (document.match(/^#{1,6}\s/gm) || []).length,
    codeBlocksCount: (document.match(/```/g) || []).length / 2,
    linksCount: (document.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length,
    imagesCount: (document.match(/!\[([^\]]*)\]\([^)]+\)/g) || []).length
  };
}

function generateFrontmatter(data: Record<string, string | string[] | undefined>): string {
  const defaultData = {
    created: new Date().toISOString(),
    ...data
  };

  let frontmatter = '---\n';
  for (const [key, value] of Object.entries(defaultData)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length > 0) {
        frontmatter += `${key}:\n`;
        for (const item of value) {
          frontmatter += `  - ${item}\n`;
        }
      }
    } else {
      frontmatter += `${key}: ${value}\n`;
    }
  }
  frontmatter += '---\n\n';

  return frontmatter;
}

function stripHtmlTags(document: string): string {
  // 기본 HTML 태그 제거
  return document
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
    .replace(/<[^>]+>/g, '');
}

function convertTables(document: string, platform: Platform): string {
  if (platform === 'notion') {
    // Notion은 간단한 테이블만 지원
    // 복잡한 테이블은 유지하되 정렬 마커 제거
    return document.replace(/\|:?-+:?\|/g, '|---|');
  }
  return document;
}

function convertCodeBlocks(document: string, platform: Platform): string {
  if (platform === 'notion') {
    // Notion에서 지원하는 언어 이름으로 변환
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'js': 'javascript',
      'py': 'python',
      'rb': 'ruby',
      'sh': 'bash',
      'yml': 'yaml'
    };

    return document.replace(/```(\w+)/g, (match, lang) => {
      return '```' + (languageMap[lang] || lang);
    });
  }
  return document;
}

function convertImageSyntax(document: string, platform: Platform): string {
  switch (platform) {
    case 'notion':
      // Obsidian 스타일 → 표준 마크다운
      document = document.replace(/!\[\[(.*?)\]\]/g, '![$1]($1)');
      // 상대 경로를 절대 URL 플레이스홀더로
      document = document.replace(/!\[([^\]]*)\]\((?!http)(.*?)\)/g, '![$1](IMAGE_URL_PLACEHOLDER:$2)');
      return document;
    case 'github-wiki':
      // Obsidian 스타일 → GitHub Wiki 스타일
      document = document.replace(/!\[\[(.*?)\]\]/g, '![$1](images/$1)');
      return document;
    case 'obsidian':
      // 표준 마크다운 → Obsidian 스타일 (로컬 이미지만)
      document = document.replace(/!\[([^\]]*)\]\((?!http)(.*?)\)/g, '![[$2]]');
      return document;
    default:
      return document;
  }
}

function convertLocalLinks(document: string, platform: Platform): string {
  switch (platform) {
    case 'notion':
      // [[]] 링크를 표준 마크다운으로 (페이지 ID는 나중에 대체 필요)
      return document.replace(/\[\[(.*?)\]\]/g, '[$1](PAGE_ID_PLACEHOLDER:$1)');
    case 'github-wiki':
      // [[]] 링크를 GitHub Wiki 스타일로
      return document.replace(/\[\[(.*?)\]\]/g, (_, pageName) => {
        const slug = pageName.replace(/\s+/g, '-');
        return `[${pageName}](${slug})`;
      });
    case 'obsidian':
      // 표준 마크다운 링크를 Obsidian 스타일로 (로컬 링크만)
      return document.replace(/\[([^\]]+)\]\((?!http)([^)]+)\.md\)/g, '[[$2|$1]]');
    default:
      return document;
  }
}

function wrapLines(document: string, maxLength: number): string {
  const lines = document.split('\n');
  const wrapped: string[] = [];

  for (const line of lines) {
    // 코드 블록이나 테이블 행은 래핑하지 않음
    if (line.startsWith('```') || line.startsWith('|') || line.startsWith('    ') || line.startsWith('\t')) {
      wrapped.push(line);
      continue;
    }

    if (line.length <= maxLength) {
      wrapped.push(line);
      continue;
    }

    // 긴 줄 래핑
    let remaining = line;
    while (remaining.length > maxLength) {
      let breakPoint = remaining.lastIndexOf(' ', maxLength);
      if (breakPoint === -1) breakPoint = maxLength;

      wrapped.push(remaining.substring(0, breakPoint));
      remaining = remaining.substring(breakPoint + 1);
    }
    if (remaining) wrapped.push(remaining);
  }

  return wrapped.join('\n');
}

function finalizeForNotion(document: string, warnings: string[]): string {
  // 각주 제거 (Notion 미지원)
  if (/\[\^(\d+)\]/.test(document)) {
    warnings.push('Footnotes were removed (not supported by Notion)');
    document = document.replace(/\[\^(\d+)\]/g, '');
    document = document.replace(/^\[\^(\d+)\]:.*$/gm, '');
  }

  // 접기/펼치기 구문 변환 (Notion toggle)
  document = document.replace(/<details>\s*<summary>(.*?)<\/summary>/gi, '▶ $1\n');
  document = document.replace(/<\/details>/gi, '');

  // 수식 경고
  if (/\$\$[\s\S]+?\$\$|\$[^$]+\$/.test(document)) {
    warnings.push('Math equations may not render correctly in Notion');
  }

  // 체크박스 변환
  document = document.replace(/- \[ \]/g, '☐');
  document = document.replace(/- \[x\]/gi, '☑');

  return document;
}

function finalizeForGitHubWiki(document: string): string {
  // 상대 링크를 Wiki 링크로
  document = document.replace(/\[([^\]]+)\]\(\.\/([^)]+)\.md\)/g, '[[$2|$1]]');

  // Mermaid 다이어그램 지원 확인
  document = document.replace(/```mermaid/g, '```mermaid');

  // 경고/노트 블록 변환
  document = document.replace(/^>\s*\[!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]/gim, (match, type) => {
    return `> **${type.charAt(0) + type.slice(1).toLowerCase()}**`;
  });

  return document;
}

function finalizeForObsidian(document: string, tags?: string[]): string {
  // Callout 변환
  document = document.replace(/^>\s*\*\*(Note|Warning|Tip|Important|Caution)\*\*:?\s*/gim, (_, type) => {
    return `> [!${type.toLowerCase()}]\n> `;
  });

  // 인라인 태그 추가 (문서 끝에)
  if (tags && tags.length > 0) {
    const tagLine = '\n\n---\n' + tags.map(t => `#${t.replace(/\s+/g, '-')}`).join(' ') + '\n';
    document += tagLine;
  }

  // 내부 링크 확인 및 변환
  // 표준 마크다운 로컬 링크를 Obsidian 스타일로
  document = document.replace(/\[([^\]]+)\]\((?!http)([^)]+)\.md\)/g, '[[$2|$1]]');

  return document;
}

export const normalizeForPlatformSchema = {
  name: 'muse_normalize_for_platform',
  description: 'Converts Markdown documents for Notion, GitHub Wiki, or Obsidian platforms. Handles links, images, code blocks, tables, frontmatter, and platform-specific syntax.',
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
            description: 'Whether to preserve local wiki-style links (default: true)'
          },
          convertImages: {
            type: 'boolean',
            description: 'Whether to convert image syntax for the platform'
          },
          addFrontmatter: {
            type: 'boolean',
            description: 'Whether to add YAML frontmatter (useful for Obsidian)'
          },
          frontmatterData: {
            type: 'object',
            description: 'Custom frontmatter data to include'
          },
          stripHtml: {
            type: 'boolean',
            description: 'Whether to strip HTML tags'
          },
          convertTables: {
            type: 'boolean',
            description: 'Whether to convert table format for the platform'
          },
          addTags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tags to add (for Obsidian frontmatter or inline tags)'
          },
          convertCodeBlocks: {
            type: 'boolean',
            description: 'Whether to convert code block language identifiers'
          },
          maxLineLength: {
            type: 'number',
            description: 'Maximum line length (wraps long lines)'
          }
        }
      }
    },
    required: ['document', 'platform']
  }
};
