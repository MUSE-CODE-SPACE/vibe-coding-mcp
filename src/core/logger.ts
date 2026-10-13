/**
 * Structured logging utility for MCP server
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  tool?: string;
  platform?: string;
  sessionId?: string;
  requestId?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private minLevel: LogLevel = 'info';
  private static levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return Logger.levelPriority[level] >= Logger.levelPriority[this.minLevel];
  }

  private formatEntry(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    const formatted = this.formatEntry(entry);

    // Always stderr: on the stdio transport stdout *is* the JSON-RPC channel,
    // and Claude Code parses hook stdout. Logs must never land there.
    console.error(formatted);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  /**
   * Creates a child logger with preset context
   */
  child(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }

  /**
   * Measures and logs execution time
   */
  async time<T>(
    label: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`${label} completed`, { ...context, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${label} failed`, error as Error, { ...context, duration });
      throw error;
    }
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private defaultContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context };
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.parent.error(message, error, this.mergeContext(context));
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience function to create tool-specific logger
export function createToolLogger(toolName: string): ChildLogger {
  return logger.child({ tool: toolName });
}
