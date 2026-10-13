/**
 * Structured logging utility for MCP server
 */
class Logger {
    minLevel = 'info';
    static levelPriority = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    };
    setLevel(level) {
        this.minLevel = level;
    }
    shouldLog(level) {
        return Logger.levelPriority[level] >= Logger.levelPriority[this.minLevel];
    }
    formatEntry(entry) {
        return JSON.stringify(entry);
    }
    log(level, message, context, error) {
        if (!this.shouldLog(level))
            return;
        const entry = {
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
    debug(message, context) {
        this.log('debug', message, context);
    }
    info(message, context) {
        this.log('info', message, context);
    }
    warn(message, context) {
        this.log('warn', message, context);
    }
    error(message, error, context) {
        this.log('error', message, context, error);
    }
    /**
     * Creates a child logger with preset context
     */
    child(defaultContext) {
        return new ChildLogger(this, defaultContext);
    }
    /**
     * Measures and logs execution time
     */
    async time(label, fn, context) {
        const start = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - start;
            this.info(`${label} completed`, { ...context, duration });
            return result;
        }
        catch (error) {
            const duration = Date.now() - start;
            this.error(`${label} failed`, error, { ...context, duration });
            throw error;
        }
    }
}
class ChildLogger {
    parent;
    defaultContext;
    constructor(parent, defaultContext) {
        this.parent = parent;
        this.defaultContext = defaultContext;
    }
    mergeContext(context) {
        return { ...this.defaultContext, ...context };
    }
    debug(message, context) {
        this.parent.debug(message, this.mergeContext(context));
    }
    info(message, context) {
        this.parent.info(message, this.mergeContext(context));
    }
    warn(message, context) {
        this.parent.warn(message, this.mergeContext(context));
    }
    error(message, error, context) {
        this.parent.error(message, error, this.mergeContext(context));
    }
}
// Singleton instance
export const logger = new Logger();
// Convenience function to create tool-specific logger
export function createToolLogger(toolName) {
    return logger.child({ tool: toolName });
}
//# sourceMappingURL=logger.js.map