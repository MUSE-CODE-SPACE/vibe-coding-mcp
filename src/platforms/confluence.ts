/**
 * Confluence 발행 플랫폼
 */

import { PublishOptions, PublishResult } from '../types/index.js';
import { fetchWithRetry } from '../core/security.js';

export interface ConfluenceConfig {
  baseUrl: string;
  username: string;
  apiToken: string;
  spaceKey: string;
}

function getConfluenceConfig(): ConfluenceConfig {
  const baseUrl = process.env.CONFLUENCE_BASE_URL;
  const username = process.env.CONFLUENCE_USERNAME;
  const apiToken = process.env.CONFLUENCE_API_TOKEN;
  const spaceKey = process.env.CONFLUENCE_SPACE_KEY;

  if (!baseUrl || !username || !apiToken || !spaceKey) {
    throw new Error('Confluence configuration incomplete. Required: CONFLUENCE_BASE_URL, CONFLUENCE_USERNAME, CONFLUENCE_API_TOKEN, CONFLUENCE_SPACE_KEY');
  }

  return { baseUrl, username, apiToken, spaceKey };
}

// 마크다운을 Confluence Storage Format으로 변환
function markdownToConfluenceStorage(markdown: string): string {
  let storage = markdown;

  // 헤딩
  storage = storage.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  storage = storage.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  storage = storage.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  storage = storage.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  storage = storage.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  storage = storage.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // 코드 블록
  storage = storage.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const language = lang || 'none';
    return `<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">${language}</ac:parameter><ac:plain-text-body><![CDATA[${code.trim()}]]></ac:plain-text-body></ac:structured-macro>`;
  });

  // 인라인 코드
  storage = storage.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 볼드
  storage = storage.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 이탤릭
  storage = storage.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 링크
  storage = storage.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 불릿 리스트
  const bulletListRegex = /^[-*]\s+(.+)$/gm;
  let hasOpenUl = false;
  storage = storage.replace(bulletListRegex, (match, content) => {
    if (!hasOpenUl) {
      hasOpenUl = true;
      return `<ul><li>${content}</li>`;
    }
    return `<li>${content}</li>`;
  });
  if (hasOpenUl) {
    storage += '</ul>';
  }

  // 번호 리스트
  const numberedListRegex = /^\d+\.\s+(.+)$/gm;
  let hasOpenOl = false;
  storage = storage.replace(numberedListRegex, (match, content) => {
    if (!hasOpenOl) {
      hasOpenOl = true;
      return `<ol><li>${content}</li>`;
    }
    return `<li>${content}</li>`;
  });
  if (hasOpenOl) {
    storage += '</ol>';
  }

  // 인용
  storage = storage.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // 구분선
  storage = storage.replace(/^---+$/gm, '<hr />');

  // 줄바꿈
  storage = storage.replace(/\n\n/g, '</p><p>');
  storage = `<p>${storage}</p>`;

  return storage;
}

export async function publishToConfluence(
  document: string,
  title: string,
  options?: Partial<PublishOptions>
): Promise<PublishResult> {
  try {
    const config = getConfluenceConfig();
    const storage = markdownToConfluenceStorage(document);

    const auth = Buffer.from(`${config.username}:${config.apiToken}`).toString('base64');

    const parentId = options?.parentPageId;

    const body: any = {
      type: 'page',
      title,
      space: { key: config.spaceKey },
      body: {
        storage: {
          value: storage,
          representation: 'storage'
        }
      }
    };

    if (parentId) {
      body.ancestors = [{ id: parentId }];
    }

    const response = await fetchWithRetry(`${config.baseUrl}/wiki/rest/api/content`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    }, { timeout: 30000, maxRetries: 3 });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Confluence API error: ${response.status} - ${error}`);
    }

    const result = await response.json() as { _links: { webui: string } };

    return {
      success: true,
      platform: 'confluence' as any,
      url: `${config.baseUrl}/wiki${result._links.webui}`
    };
  } catch (error) {
    return {
      success: false,
      platform: 'confluence' as any,
      error: error instanceof Error ? error.message : 'Failed to publish to Confluence'
    };
  }
}

// 기존 페이지 업데이트
export async function updateConfluencePage(
  pageId: string,
  document: string,
  title: string
): Promise<PublishResult> {
  try {
    const config = getConfluenceConfig();
    const storage = markdownToConfluenceStorage(document);
    const auth = Buffer.from(`${config.username}:${config.apiToken}`).toString('base64');

    // 현재 버전 가져오기
    const currentResponse = await fetchWithRetry(`${config.baseUrl}/wiki/rest/api/content/${pageId}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    }, { timeout: 30000, maxRetries: 3 });

    if (!currentResponse.ok) {
      throw new Error('Failed to get current page');
    }

    const currentPage = await currentResponse.json() as { version: { number: number } };
    const newVersion = currentPage.version.number + 1;

    // 업데이트
    const response = await fetchWithRetry(`${config.baseUrl}/wiki/rest/api/content/${pageId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        type: 'page',
        title,
        body: {
          storage: {
            value: storage,
            representation: 'storage'
          }
        },
        version: { number: newVersion }
      })
    }, { timeout: 30000, maxRetries: 3 });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Confluence API error: ${response.status} - ${error}`);
    }

    const result = await response.json() as { _links: { webui: string } };

    return {
      success: true,
      platform: 'confluence' as any,
      url: `${config.baseUrl}/wiki${result._links.webui}`
    };
  } catch (error) {
    return {
      success: false,
      platform: 'confluence' as any,
      error: error instanceof Error ? error.message : 'Failed to update Confluence page'
    };
  }
}
