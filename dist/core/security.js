/**
 * Security utilities for path validation, network requests, and URL validation
 */
import * as path from 'path';
import { ToolError } from './errors.js';
/**
 * Validates that a file path stays within the allowed directory (prevents path traversal)
 */
export function validatePathWithinDirectory(filePath, allowedDir) {
    const resolvedPath = path.resolve(filePath);
    const resolvedAllowedDir = path.resolve(allowedDir);
    if (!resolvedPath.startsWith(resolvedAllowedDir + path.sep) && resolvedPath !== resolvedAllowedDir) {
        throw new ToolError('Path traversal detected: file path escapes allowed directory', 'VALIDATION_ERROR', { filePath, allowedDir });
    }
    return resolvedPath;
}
/**
 * Sanitizes a filename to prevent path traversal and invalid characters
 */
export function sanitizeFilename(filename, maxLength = 200) {
    return filename
        .replace(/\.\./g, '') // Remove parent directory references
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-') // Remove invalid characters
        .replace(/\s+/g, '-') // Replace whitespace with dashes
        .replace(/-+/g, '-') // Collapse multiple dashes
        .replace(/^-|-$/g, '') // Remove leading/trailing dashes
        .slice(0, maxLength);
}
/**
 * Validates webhook URL for Slack or Discord (SSRF prevention)
 */
export function validateWebhookUrl(url, allowedHosts) {
    try {
        const parsed = new URL(url);
        // Must be HTTPS
        if (parsed.protocol !== 'https:') {
            throw new ToolError('Webhook URL must use HTTPS protocol', 'VALIDATION_ERROR', { url: url.slice(0, 50) });
        }
        // Must match allowed hosts
        const isAllowed = allowedHosts.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host));
        if (!isAllowed) {
            throw new ToolError(`Webhook URL must be from allowed hosts: ${allowedHosts.join(', ')}`, 'VALIDATION_ERROR', { hostname: parsed.hostname });
        }
    }
    catch (error) {
        if (error instanceof ToolError)
            throw error;
        throw new ToolError('Invalid webhook URL format', 'VALIDATION_ERROR', { url: url.slice(0, 50) });
    }
}
// Allowed webhook hosts
export const SLACK_ALLOWED_HOSTS = ['hooks.slack.com'];
export const DISCORD_ALLOWED_HOSTS = ['discord.com', 'discordapp.com'];
export async function fetchWithRetry(url, options = {}, retryOptions = {}) {
    const { timeout = 30000, maxRetries = 3, retryDelay = 1000, retryStatusCodes = [429, 500, 502, 503, 504] } = retryOptions;
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            // Check if we should retry
            if (retryStatusCodes.includes(response.status) && attempt < maxRetries) {
                // Get retry-after header if available
                const retryAfter = response.headers.get('retry-after');
                const delay = retryAfter
                    ? parseInt(retryAfter) * 1000
                    : retryDelay * Math.pow(2, attempt); // Exponential backoff
                await sleep(delay);
                continue;
            }
            return response;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    lastError = new ToolError(`Request timed out after ${timeout}ms`, 'TIMEOUT', { url: url.slice(0, 100), attempt });
                }
                else {
                    lastError = error;
                }
            }
            // Retry on network errors
            if (attempt < maxRetries) {
                await sleep(retryDelay * Math.pow(2, attempt));
                continue;
            }
        }
    }
    throw lastError || new ToolError('Request failed after retries', 'NETWORK_ERROR');
}
/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=security.js.map