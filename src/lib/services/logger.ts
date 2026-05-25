/**
 * src/lib/services/logger.ts
 * Structured Logger Service for enterprise observability.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

class Logger {
  private format(level: LogLevel, message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const ctxString = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${ctxString}`;
  }

  public info(message: string, context?: Record<string, any>): void {
    console.log(this.format('INFO', message, context));
  }

  public warn(message: string, context?: Record<string, any>): void {
    console.warn(this.format('WARN', message, context));
  }

  public error(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    const errorDetails = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack } 
      : { rawError: String(error) };
    
    console.error(this.format('ERROR', message, { ...context, error: errorDetails }));
  }

  public debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.format('DEBUG', message, context));
    }
  }
}

export const logger = new Logger();
export default logger;
