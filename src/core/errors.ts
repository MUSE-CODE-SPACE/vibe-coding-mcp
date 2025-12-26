/**
 * Custom error classes for structured error handling
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'PLATFORM_ERROR'
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMIT'
  | 'INTERNAL_ERROR'
  | 'PARSE_ERROR'
  | 'TIMEOUT';

export interface ErrorContext {
  tool?: string;
  platform?: string;
  input?: Record<string, unknown>;
  [key: string]: unknown;
}

export class ToolError extends Error {
  public readonly code: ErrorCode;
  public readonly context?: ErrorContext;
  public readonly cause?: Error;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: ErrorCode,
    context?: ErrorContext,
    cause?: Error
  ) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
    this.context = context;
    this.cause = cause;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, ToolError);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      cause: this.cause?.message
    };
  }

  static fromError(error: unknown, code: ErrorCode = 'INTERNAL_ERROR', context?: ErrorContext): ToolError {
    if (error instanceof ToolError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const cause = error instanceof Error ? error : undefined;

    return new ToolError(message, code, context, cause);
  }
}

export class ValidationError extends ToolError {
  public readonly field?: string;
  public readonly expected?: string;
  public readonly received?: string;

  constructor(
    message: string,
    field?: string,
    expected?: string,
    received?: string,
    context?: ErrorContext
  ) {
    super(message, 'VALIDATION_ERROR', { ...context, field, expected, received });
    this.name = 'ValidationError';
    this.field = field;
    this.expected = expected;
    this.received = received;
  }
}

export class PlatformError extends ToolError {
  public readonly platform: string;
  public readonly statusCode?: number;

  constructor(
    message: string,
    platform: string,
    statusCode?: number,
    context?: ErrorContext,
    cause?: Error
  ) {
    super(message, 'PLATFORM_ERROR', { ...context, platform, statusCode }, cause);
    this.name = 'PlatformError';
    this.platform = platform;
    this.statusCode = statusCode;
  }
}

export class AuthError extends ToolError {
  constructor(message: string, context?: ErrorContext, cause?: Error) {
    super(message, 'AUTH_ERROR', context, cause);
    this.name = 'AuthError';
  }
}

export class RateLimitError extends ToolError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number, context?: ErrorContext) {
    super(message, 'RATE_LIMIT', { ...context, retryAfter });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Wraps async function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  toolName: string
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw ToolError.fromError(error, 'INTERNAL_ERROR', { tool: toolName });
    }
  }) as T;
}

/**
 * Creates a standardized error response for MCP
 */
export function createErrorResponse(error: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
} {
  const toolError = error instanceof ToolError
    ? error
    : ToolError.fromError(error);

  return {
    content: [{ type: 'text', text: JSON.stringify(toolError.toJSON(), null, 2) }],
    isError: true
  };
}
