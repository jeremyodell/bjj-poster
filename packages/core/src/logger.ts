/**
 * Structured logger for Lambda functions
 * Outputs JSON in production for CloudWatch Logs Insights
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: LogLevel;
  private defaultContext: LogContext;

  constructor(minLevel: LogLevel = 'info', defaultContext: LogContext = {}) {
    this.minLevel = minLevel;
    this.defaultContext = defaultContext;
  }

  /**
   * Create a child logger with additional default context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.minLevel, {
      ...this.defaultContext,
      ...context,
    });
    return childLogger;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    const mergedContext = { ...this.defaultContext, ...context };
    if (Object.keys(mergedContext).length > 0) {
      entry.context = mergedContext;
    }

    // In development, use pretty format
    if (process.env.NODE_ENV === 'development') {
      const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
      return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}`;
    }

    // In production, use JSON for CloudWatch Logs Insights
    return JSON.stringify(entry);
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      // If context contains an Error, extract useful info
      if (context?.error instanceof Error) {
        context = {
          ...context,
          error: {
            name: context.error.name,
            message: context.error.message,
            stack: context.error.stack,
          },
        };
      }
      console.error(this.formatMessage('error', message, context));
    }
  }
}

// Default logger instance
const defaultLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
export const logger = new Logger(defaultLevel);

// Factory function for creating request-scoped loggers
export function createRequestLogger(requestId: string, additionalContext?: LogContext): Logger {
  return logger.child({
    requestId,
    ...additionalContext,
  });
}
