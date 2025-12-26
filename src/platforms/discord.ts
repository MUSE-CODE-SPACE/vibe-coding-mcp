/**
 * Discord 웹훅 알림
 */

import {
  fetchWithRetry,
  validateWebhookUrl,
  DISCORD_ALLOWED_HOSTS
} from '../core/security.js';

export interface DiscordNotificationOptions {
  webhookUrl?: string;
  username?: string;
  avatarUrl?: string;
}

export interface DiscordNotificationResult {
  success: boolean;
  error?: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
  thumbnail?: { url: string };
  author?: { name: string; url?: string; icon_url?: string };
}

// 색상 상수
const COLORS = {
  success: 0x00ff00,  // 녹색
  info: 0x0099ff,     // 파랑
  warning: 0xffcc00,  // 노랑
  error: 0xff0000,    // 빨강
  primary: 0x5865f2   // Discord 블루
};

export async function sendDiscordNotification(
  message: string,
  options: DiscordNotificationOptions = {}
): Promise<DiscordNotificationResult> {
  try {
    const webhookUrl = options.webhookUrl || process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error('DISCORD_WEBHOOK_URL is not set');
    }

    // Validate webhook URL (SSRF prevention)
    validateWebhookUrl(webhookUrl, DISCORD_ALLOWED_HOSTS);

    const payload: any = {
      content: message
    };

    if (options.username) {
      payload.username = options.username;
    }

    if (options.avatarUrl) {
      payload.avatar_url = options.avatarUrl;
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
      throw new Error(`Discord webhook error: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send Discord notification'
    };
  }
}

// 임베드 메시지 전송
export async function sendDiscordEmbed(
  embeds: DiscordEmbed[],
  options: DiscordNotificationOptions = {}
): Promise<DiscordNotificationResult> {
  try {
    const webhookUrl = options.webhookUrl || process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error('DISCORD_WEBHOOK_URL is not set');
    }

    // Validate webhook URL (SSRF prevention)
    validateWebhookUrl(webhookUrl, DISCORD_ALLOWED_HOSTS);

    const payload: any = {
      embeds
    };

    if (options.username) {
      payload.username = options.username;
    }

    if (options.avatarUrl) {
      payload.avatar_url = options.avatarUrl;
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
      throw new Error(`Discord webhook error: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send Discord embed'
    };
  }
}

// 문서 발행 알림
export async function sendDocumentPublishedNotificationDiscord(
  title: string,
  url: string,
  platform: string,
  description?: string,
  options: DiscordNotificationOptions = {}
): Promise<DiscordNotificationResult> {
  const embed: DiscordEmbed = {
    title: '📄 새 문서가 발행되었습니다',
    description: description || `**${title}**가 ${platform}에 발행되었습니다.`,
    url,
    color: COLORS.success,
    fields: [
      { name: '제목', value: title, inline: true },
      { name: '플랫폼', value: platform, inline: true }
    ],
    footer: {
      text: '🤖 Vibe Coding MCP'
    },
    timestamp: new Date().toISOString()
  };

  return sendDiscordEmbed([embed], {
    ...options,
    username: options.username || 'Vibe Coding MCP'
  });
}

// 세션 요약 알림
export async function sendSessionSummaryNotificationDiscord(
  sessionId: string,
  summary: string,
  stats: { files: number; functions: number; classes: number; complexity?: number },
  options: DiscordNotificationOptions = {}
): Promise<DiscordNotificationResult> {
  const embed: DiscordEmbed = {
    title: '🎯 코딩 세션 요약',
    description: summary,
    color: COLORS.info,
    fields: [
      { name: '📁 파일', value: `${stats.files}`, inline: true },
      { name: '⚡ 함수', value: `${stats.functions}`, inline: true },
      { name: '🏗️ 클래스', value: `${stats.classes}`, inline: true }
    ],
    footer: {
      text: `세션 ID: ${sessionId.slice(0, 8)}... | 🤖 Vibe Coding MCP`
    },
    timestamp: new Date().toISOString()
  };

  if (stats.complexity !== undefined) {
    embed.fields?.push({ name: '🔄 복잡도', value: `${stats.complexity}`, inline: true });
  }

  return sendDiscordEmbed([embed], {
    ...options,
    username: options.username || 'Vibe Coding MCP'
  });
}

// 에러 알림
export async function sendErrorNotificationDiscord(
  errorTitle: string,
  errorMessage: string,
  context?: string,
  options: DiscordNotificationOptions = {}
): Promise<DiscordNotificationResult> {
  const embed: DiscordEmbed = {
    title: `❌ ${errorTitle}`,
    description: errorMessage,
    color: COLORS.error,
    fields: context ? [{ name: '컨텍스트', value: context }] : undefined,
    footer: {
      text: '🤖 Vibe Coding MCP'
    },
    timestamp: new Date().toISOString()
  };

  return sendDiscordEmbed([embed], {
    ...options,
    username: options.username || 'Vibe Coding MCP'
  });
}

// 코드 분석 결과 알림
export async function sendCodeAnalysisNotificationDiscord(
  filename: string,
  analysis: {
    functions: number;
    classes: number;
    imports: number;
    complexity: number;
    insights: string[];
  },
  options: DiscordNotificationOptions = {}
): Promise<DiscordNotificationResult> {
  const complexityColor = analysis.complexity > 20 ? COLORS.error :
                          analysis.complexity > 10 ? COLORS.warning : COLORS.success;

  const embed: DiscordEmbed = {
    title: `🔍 코드 분석: ${filename}`,
    color: complexityColor,
    fields: [
      { name: '⚡ 함수', value: `${analysis.functions}`, inline: true },
      { name: '🏗️ 클래스', value: `${analysis.classes}`, inline: true },
      { name: '📦 임포트', value: `${analysis.imports}`, inline: true },
      { name: '🔄 복잡도', value: `${analysis.complexity}`, inline: true }
    ],
    footer: {
      text: '🤖 Vibe Coding MCP'
    },
    timestamp: new Date().toISOString()
  };

  if (analysis.insights.length > 0) {
    embed.description = analysis.insights.map(i => `• ${i}`).join('\n');
  }

  return sendDiscordEmbed([embed], {
    ...options,
    username: options.username || 'Vibe Coding MCP'
  });
}
