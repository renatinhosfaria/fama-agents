export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface LogEntry {
  level: LogLevel;
  levelName: string;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

type LogListener = (entry: LogEntry) => void;

const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "debug",
  [LogLevel.INFO]: "info",
  [LogLevel.WARN]: "warn",
  [LogLevel.ERROR]: "error",
  [LogLevel.SILENT]: "silent",
};

function parseLevelFromEnv(): LogLevel | undefined {
  const envVal = process.env["FAMA_LOG_LEVEL"]?.toLowerCase();
  if (!envVal) return undefined;
  const map: Record<string, LogLevel> = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
    silent: LogLevel.SILENT,
  };
  return map[envVal];
}

export class StructuredLogger {
  private level: LogLevel;
  private listeners: LogListener[] = [];

  constructor(level?: LogLevel) {
    this.level = level ?? parseLevelFromEnv() ?? LogLevel.INFO;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  onLog(listener: LogListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: LogListener): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.ERROR, message, context);
  }

  private emit(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): void {
    if (level < this.level) return;

    const entry: LogEntry = {
      level,
      levelName: LEVEL_NAMES[level],
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    for (const listener of this.listeners) {
      listener(entry);
    }
  }
}

/** Global singleton instance */
export const structuredLog = new StructuredLogger();
