/**
 * Discord 웹훅 알림
 */
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
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
    footer?: {
        text: string;
        icon_url?: string;
    };
    timestamp?: string;
    thumbnail?: {
        url: string;
    };
    author?: {
        name: string;
        url?: string;
        icon_url?: string;
    };
}
export declare function sendDiscordNotification(message: string, options?: DiscordNotificationOptions): Promise<DiscordNotificationResult>;
export declare function sendDiscordEmbed(embeds: DiscordEmbed[], options?: DiscordNotificationOptions): Promise<DiscordNotificationResult>;
export declare function sendDocumentPublishedNotificationDiscord(title: string, url: string, platform: string, description?: string, options?: DiscordNotificationOptions): Promise<DiscordNotificationResult>;
export declare function sendSessionSummaryNotificationDiscord(sessionId: string, summary: string, stats: {
    files: number;
    functions: number;
    classes: number;
    complexity?: number;
}, options?: DiscordNotificationOptions): Promise<DiscordNotificationResult>;
export declare function sendErrorNotificationDiscord(errorTitle: string, errorMessage: string, context?: string, options?: DiscordNotificationOptions): Promise<DiscordNotificationResult>;
export declare function sendCodeAnalysisNotificationDiscord(filename: string, analysis: {
    functions: number;
    classes: number;
    imports: number;
    complexity: number;
    insights: string[];
}, options?: DiscordNotificationOptions): Promise<DiscordNotificationResult>;
//# sourceMappingURL=discord.d.ts.map