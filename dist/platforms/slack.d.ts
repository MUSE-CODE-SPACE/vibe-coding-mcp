/**
 * Slack 웹훅 알림
 */
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
export declare function sendSlackNotification(message: string, options?: SlackNotificationOptions): Promise<SlackNotificationResult>;
export declare function sendDocumentPublishedNotification(title: string, url: string, platform: string, options?: SlackNotificationOptions): Promise<SlackNotificationResult>;
export declare function sendSessionSummaryNotification(sessionId: string, summary: string, stats: {
    files: number;
    functions: number;
    classes: number;
}, options?: SlackNotificationOptions): Promise<SlackNotificationResult>;
//# sourceMappingURL=slack.d.ts.map