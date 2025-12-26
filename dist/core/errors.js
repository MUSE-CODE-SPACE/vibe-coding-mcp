/**
 * Custom error classes for structured error handling
 */
export class ToolError extends Error {
    code;
    context;
    cause;
    timestamp;
    constructor(message, code, context, cause) {
        super(message);
        this.name = 'ToolError';
        this.code = code;
        this.context = context;
        this.cause = cause;
        this.timestamp = new Date().toISOString();
        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace?.(this, ToolError);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            context: this.context,
            timestamp: this.timestamp,
            cause: this.cause?.message
        };
    }
    static fromError(error, code = 'INTERNAL_ERROR', context) {
        if (error instanceof ToolError) {
            return error;
        }
        const message = error instanceof Error ? error.message : String(error);
        const cause = error instanceof Error ? error : undefined;
        return new ToolError(message, code, context, cause);
    }
}
export class ValidationError extends ToolError {
    field;
    expected;
    received;
    constructor(message, field, expected, received, context) {
        super(message, 'VALIDATION_ERROR', { ...context, field, expected, received });
        this.name = 'ValidationError';
        this.field = field;
        this.expected = expected;
        this.received = received;
    }
}
export class PlatformError extends ToolError {
    platform;
    statusCode;
    constructor(message, platform, statusCode, context, cause) {
        super(message, 'PLATFORM_ERROR', { ...context, platform, statusCode }, cause);
        this.name = 'PlatformError';
        this.platform = platform;
        this.statusCode = statusCode;
    }
}
export class AuthError extends ToolError {
    constructor(message, context, cause) {
        super(message, 'AUTH_ERROR', context, cause);
        this.name = 'AuthError';
    }
}
export class RateLimitError extends ToolError {
    retryAfter;
    constructor(message, retryAfter, context) {
        super(message, 'RATE_LIMIT', { ...context, retryAfter });
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}
/**
 * Wraps async function with error handling
 */
export function withErrorHandling(fn, toolName) {
    return (async (...args) => {
        try {
            return await fn(...args);
        }
        catch (error) {
            throw ToolError.fromError(error, 'INTERNAL_ERROR', { tool: toolName });
        }
    });
}
/**
 * Creates a standardized error response for MCP
 */
export function createErrorResponse(error) {
    const toolError = error instanceof ToolError
        ? error
        : ToolError.fromError(error);
    return {
        content: [{ type: 'text', text: JSON.stringify(toolError.toJSON(), null, 2) }],
        isError: true
    };
}
//# sourceMappingURL=errors.js.map