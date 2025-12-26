/**
 * Slack 웹훅 알림
 */

import {
  fetchWithRetry,
  validateWebhookUrl,
  SLACK_ALLOWED_HOSTS
} from '../core/security.js';

export interface SlackNotificationOptions {
  webhookUrl?: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface SlackNotificationResult {
  success: boolean;
  error?: string;
}

// 마크다운을 Slack mrkdwn으로 변환
function markdownToSlackMrkdwn(markdown: string): string {
  let mrkdwn = markdown;

  // 헤딩 -> 볼드
  mrkdwn = mrkdwn.replace(/^#{1,6}\s+(.+)$/gm, '*$1*');

  // 볼드
  mrkdwn = mrkdwn.replace(/\*\*([^*]+)\*\*/g, '*$1*');

  // 이탤릭
  mrkdwn = mrkdwn.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '_$1_');

  // 인라인 코드
  mrkdwn = mrkdwn.replace(/`([^`]+)`/g, '`$1`');

  // 코드 블록
  mrkdwn = mrkdwn.replace(/```\w*\n([\s\S]*?)```/g, '```$1```');

  // 링크
  mrkdwn = mrkdwn.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>');

  // 불릿 리스트
  mrkdwn = mrkdwn.replace(/^[-*]\s+/gm, '• ');

  // 구분선
  mrkdwn = mrkdwn.replace(/^---+$/gm, '───────────');

  return mrkdwn;
}

export async function sendSlackNotification(
  message: string,
  options: SlackNotificationOptions = {}
): Promise<SlackNotificationResult> {
  try {
    const webhookUrl = options.webhookUrl || process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error('SLACK_WEBHOOK_URL is not set');
    }

    // Validate webhook URL (SSRF prevention)
    validateWebhookUrl(webhookUrl, SLACK_ALLOWED_HOSTS);

    const mrkdwn = markdownToSlackMrkdwn(message);

    const payload: any = {
      text: mrkdwn,
      mrkdwn: true
    };

    if (options.channel) {
      payload.channel = options.channel;
    }

    if (options.username) {
      payload.username = options.username;
    }

    if (options.iconEmoji) {
      payload.icon_emoji = options.iconEmoji;
    }

    // Use fetchWithRetry for timeout and retry support
    const response = await fetchWithRetry(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }, { timeout: 30000, maxRetries: 3 });

    if (!response.ok) {
      throw new Error(`Slack webhook error: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send Slack notification'
    };
  }
}

// 문서 발행 알림 (구조화된 메시지)
export async function sendDocumentPublishedNotification(
  title: string,
  url: string,
  platform: string,
  options: SlackNotificationOptions = {}
): Promise<SlackNotificationResult> {
  try {
    const webhookUrl = options.webhookUrl || process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error('SLACK_WEBHOOK_URL is not set');
    }

    // Validate webhook URL (SSRF prevention)
    validateWebhookUrl(webhookUrl, SLACK_ALLOWED_HOSTS);

    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📄 새 문서가 발행되었습니다',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*제목:*\n${title}`
            },
            {
              type: 'mrkdwn',
              text: `*플랫폼:*\n${platform}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<${url}|📎 문서 보기>`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `🤖 Vibe Coding MCP로 자동 생성됨 | ${new Date().toLocaleString('ko-KR')}`
            }
          ]
        }
      ]
    };

    const response = await fetchWithRetry(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }, { timeout: 30000, maxRetries: 3 });

    if (!response.ok) {
      throw new Error(`Slack webhook error: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send Slack notification'
    };
  }
}

// 세션 요약 알림
export async function sendSessionSummaryNotification(
  sessionId: string,
  summary: string,
  stats: { files: number; functions: number; classes: number },
  options: SlackNotificationOptions = {}
): Promise<SlackNotificationResult> {
  try {
    const webhookUrl = options.webhookUrl || process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error('SLACK_WEBHOOK_URL is not set');
    }

    // Validate webhook URL (SSRF prevention)
    validateWebhookUrl(webhookUrl, SLACK_ALLOWED_HOSTS);

    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎯 코딩 세션 요약',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: summary
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*📁 파일:* ${stats.files}`
            },
            {
              type: 'mrkdwn',
              text: `*⚡ 함수:* ${stats.functions}`
            },
            {
              type: 'mrkdwn',
              text: `*🏗️ 클래스:* ${stats.classes}`
            },
            {
              type: 'mrkdwn',
              text: `*🆔 세션:* ${sessionId.slice(0, 8)}...`
            }
          ]
        },
        {
          type: 'divider'
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `🤖 Vibe Coding MCP | ${new Date().toLocaleString('ko-KR')}`
            }
          ]
        }
      ]
    };

    const response = await fetchWithRetry(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }, { timeout: 30000, maxRetries: 3 });

    if (!response.ok) {
      throw new Error(`Slack webhook error: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send Slack notification'
    };
  }
}
