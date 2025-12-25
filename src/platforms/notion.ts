import { Client } from '@notionhq/client';
import { PublishOptions, PublishResult } from '../types/index.js';

let notionClient: Client | null = null;

function getNotionClient(): Client {
  if (!notionClient) {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) {
      throw new Error('NOTION_API_KEY environment variable is not set');
    }
    notionClient = new Client({ auth: apiKey });
  }
  return notionClient;
}

// 마크다운을 Notion 블록으로 변환
function markdownToNotionBlocks(markdown: string): any[] {
  const blocks: any[] = [];
  const lines = markdown.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 빈 줄 스킵
    if (!line.trim()) {
      i++;
      continue;
    }

    // 헤딩
    if (line.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
        }
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: line.slice(3) } }]
        }
      });
    } else if (line.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: line.slice(4) } }]
        }
      });
    }
    // 코드 블록
    else if (line.startsWith('```')) {
      const language = line.slice(3).trim() || 'plain text';
      const codeLines: string[] = [];
      i++;

      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }

      blocks.push({
        object: 'block',
        type: 'code',
        code: {
          rich_text: [{ type: 'text', text: { content: codeLines.join('\n') } }],
          language: language.toLowerCase()
        }
      });
    }
    // 불릿 리스트
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
        }
      });
    }
    // 번호 리스트
    else if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s/, '');
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: [{ type: 'text', text: { content } }]
        }
      });
    }
    // 인용
    else if (line.startsWith('> ')) {
      blocks.push({
        object: 'block',
        type: 'quote',
        quote: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
        }
      });
    }
    // 구분선
    else if (line.match(/^---+$/)) {
      blocks.push({
        object: 'block',
        type: 'divider',
        divider: {}
      });
    }
    // 일반 텍스트
    else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: line } }]
        }
      });
    }

    i++;
  }

  return blocks;
}

export async function publishToNotion(
  document: string,
  title: string,
  options?: Partial<PublishOptions>
): Promise<PublishResult> {
  try {
    const client = getNotionClient();
    const parentPageId = options?.parentPageId || process.env.NOTION_DATABASE_ID;

    if (!parentPageId) {
      throw new Error('Parent page ID or NOTION_DATABASE_ID is required');
    }

    const blocks = markdownToNotionBlocks(document);

    // 페이지 생성
    const response = await client.pages.create({
      parent: {
        page_id: parentPageId
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title
              }
            }
          ]
        }
      },
      children: blocks.slice(0, 100) // Notion API 제한: 한 번에 100개 블록
    });

    // 100개 이상의 블록이 있으면 추가
    if (blocks.length > 100) {
      for (let i = 100; i < blocks.length; i += 100) {
        const chunk = blocks.slice(i, i + 100);
        await client.blocks.children.append({
          block_id: response.id,
          children: chunk
        });
      }
    }

    return {
      success: true,
      platform: 'notion',
      url: `https://notion.so/${response.id.replace(/-/g, '')}`
    };
  } catch (error) {
    return {
      success: false,
      platform: 'notion',
      error: error instanceof Error ? error.message : 'Failed to publish to Notion'
    };
  }
}
