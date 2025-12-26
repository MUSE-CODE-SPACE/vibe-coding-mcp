/**
 * Security utilities for path validation, network requests, and URL validation
 */
/**
 * Validates that a file path stays within the allowed directory (prevents path traversal)
 */
export declare function validatePathWithinDirectory(filePath: string, allowedDir: string): string;
/**
 * Sanitizes a filename to prevent path traversal and invalid characters
 */
export declare function sanitizeFilename(filename: string, maxLength?: number): string;
/**
 * Validates webhook URL for Slack or Discord (SSRF prevention)
 */
export declare function validateWebhookUrl(url: string, allowedHosts: string[]): void;
export declare const SLACK_ALLOWED_HOSTS: string[];
export declare const DISCORD_ALLOWED_HOSTS: string[];
/**
 * Fetch with timeout and retry support
 */
export interface FetchWithRetryOptions {
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
    retryStatusCodes?: number[];
}
export declare function fetchWithRetry(url: string, options?: RequestInit, retryOptions?: FetchWithRetryOptions): Promise<Response>;
//# sourceMappingURL=security.d.ts.map