/**
 * Custom error classes for structured error handling
 */
export type ErrorCode = 'VALIDATION_ERROR' | 'PLATFORM_ERROR' | 'NETWORK_ERROR' | 'AUTH_ERROR' | 'NOT_FOUND' | 'RATE_LIMIT' | 'INTERNAL_ERROR' | 'PARSE_ERROR' | 'TIMEOUT';
export interface ErrorContext {
    tool?: string;
    platform?: string;
    input?: Record<string, unknown>;
    [key: string]: unknown;
}
export declare class ToolError extends Error {
    readonly code: ErrorCode;
    readonly context?: ErrorContext;
    readonly cause?: Error;
    readonly timestamp: string;
    constructor(message: string, code: ErrorCode, context?: ErrorContext, cause?: Error);
    toJSON(): Record<string, unknown>;
    static fromError(error: unknown, code?: ErrorCode, context?: ErrorContext): ToolError;
}
export declare class ValidationError extends ToolError {
    readonly field?: string;
    readonly expected?: string;
    readonly received?: string;
    constructor(message: string, field?: string, expected?: string, received?: string, context?: ErrorContext);
}
export declare class PlatformError extends ToolError {
    readonly platform: string;
    readonly statusCode?: number;
    constructor(message: string, platform: string, statusCode?: number, context?: ErrorContext, cause?: Error);
}
export declare class AuthError extends ToolError {
    constructor(message: string, context?: ErrorContext, cause?: Error);
}
export declare class RateLimitError extends ToolError {
    readonly retryAfter?: number;
    constructor(message: string, retryAfter?: number, context?: ErrorContext);
}
/**
 * Wraps async function with error handling
 */
export declare function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(fn: T, toolName: string): T;
/**
 * Creates a standardized error response for MCP
 */
export declare function createErrorResponse(error: unknown): {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError: true;
};
//# sourceMappingURL=errors.d.ts.map