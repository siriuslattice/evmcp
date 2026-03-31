type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

class Logger {
  private level: number;

  constructor(level: LogLevel = "info") {
    this.level = LOG_LEVELS[level];
  }

  setLevel(level: LogLevel): void {
    this.level = LOG_LEVELS[level];
  }

  debug(message: string, data?: unknown): void {
    this.log("debug", message, data);
  }
  info(message: string, data?: unknown): void {
    this.log("info", message, data);
  }
  warn(message: string, data?: unknown): void {
    this.log("warn", message, data);
  }
  error(message: string, data?: unknown): void {
    this.log("error", message, data);
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (LOG_LEVELS[level] < this.level) return;
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data !== undefined && {
        data: data instanceof Error ? { message: data.message, stack: data.stack } : data,
      }),
    };
    process.stderr.write(JSON.stringify(entry) + "\n");
  }
}

export const logger = new Logger((process.env.LOG_LEVEL as LogLevel) || "info");
