export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  debug?: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  prefix?: string;
  message: string;
  data?: Record<string, unknown>;
}

export class Logger {
  private level: LogLevel;
  private prefix: string;
  private debugMode: boolean;
  private static instances: Map<string, Logger> = new Map();

  constructor(options?: LoggerOptions) {
    this.level = options?.level ?? 'info';
    this.prefix = options?.prefix ?? '';
    this.debugMode = options?.debug ?? false;
  }

  static getInstance(name: string, options?: LoggerOptions): Logger {
    if (!Logger.instances.has(name)) {
      Logger.instances.set(name, new Logger({ ...options, prefix: name }));
    }
    return Logger.instances.get(name)!;
  }

  static clearInstance(name: string): boolean {
    return Logger.instances.delete(name);
  }

  static clearAllInstances(): void {
    Logger.instances.clear();
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setDebug(enabled: boolean): void {
    this.debugMode = enabled;
    if (enabled && this.level !== 'debug') {
      this.level = 'debug';
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, data);
    }
  }

  info(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      this.log('info', message, data);
    }
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message, data);
    }
  }

  error(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      this.log('error', message, data);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    
    if (this.debugMode) {
      return true;
    }
    
    return messageLevelIndex >= currentLevelIndex;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      prefix: this.prefix,
      message,
      data,
    };

    const output = this.formatEntry(entry);
    
    switch (level) {
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(output);
        break;
      case 'info':
        // eslint-disable-next-line no-console
        console.info(output);
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(output);
        break;
      case 'error':
        // eslint-disable-next-line no-console
        console.error(output);
        break;
    }
  }

  private formatEntry(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
    ];
    
    if (entry.prefix) {
      parts.push(`[${entry.prefix}]`);
    }
    
    parts.push(entry.message);
    
    if (entry.data && (this.debugMode || this.level === 'debug')) {
      parts.push(JSON.stringify(entry.data, null, 2));
    }
    
    return parts.join(' ');
  }

  child(prefix: string): Logger {
    return new Logger({
      level: this.level,
      prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix,
      debug: this.debugMode,
    });
  }
}

export function createLogger(appId: string, options?: LoggerOptions): Logger {
  return Logger.getInstance(appId, options);
}
