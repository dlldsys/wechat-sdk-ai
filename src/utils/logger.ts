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

// 敏感字段列表 - 日志中必须脱敏
const SENSITIVE_FIELDS = [
  'appSecret',
  'app_secret',
  'AppSecret',
  'secret',
  'password',
  'token',
  'access_token',
  'refresh_token',
  'encodingAESKey',
  'encoding_aes_key',
  'aesKey',
  'aes_key',
  'session_key',
  'sessionKey',
  'phoneNumber',
  'encryptedData',
  'encrypted_data',
];

/**
 * Logger 类
 * 1. 日志脱敏：自动过滤敏感字段
 * 2. 禁止输出堆栈/路径
 */
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
    // 脱敏处理：过滤敏感信息
    const sanitizedData = data ? this.sanitizeData(data) : undefined;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      prefix: this.prefix,
      message,
      data: sanitizedData,
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

  /**
   * 敏感数据脱敏
   * 递归遍历对象，将敏感字段替换为 ****
   */
  private sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitiveField(key)) {
        result[key] = this.maskValue(value);
      } else if (value !== null && typeof value === 'object') {
        if (Array.isArray(value)) {
          result[key] = value.map(item => 
            typeof item === 'object' && item !== null 
              ? this.sanitizeData(item as Record<string, unknown>) 
              : item
          );
        } else {
          result[key] = this.sanitizeData(value as Record<string, unknown>);
        }
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * 判断是否为敏感字段
   */
  private isSensitiveField(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return SENSITIVE_FIELDS.some(field => lowerKey === field.toLowerCase());
  }

  /**
   * 掩码处理值
   * 字符串显示前后各2位，其余为 ****
   * Buffer 显示 [Buffer]
   */
  private maskValue(value: unknown): string {
    if (typeof value === 'string') {
      if (value.length <= 4) {
        return '****';
      }
      return value.substring(0, 2) + '****' + value.substring(value.length - 2);
    }
    if (Buffer.isBuffer(value)) {
      return '[Buffer]';
    }
    return '****';
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
    
    // 只在 debug 模式下输出详细数据
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

/**
 * 创建日志实例
 */
export function createLogger(appId: string, options?: LoggerOptions): Logger {
  return Logger.getInstance(appId, options);
}

/**
 * 脱敏辅助函数 - 供外部使用
 */
export function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  return sanitizeDataStatic(obj);
}

// 静态版本的脱敏函数（供外部工具函数使用）
function sanitizeDataStatic(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveFieldStatic(key)) {
      result[key] = maskValueStatic(value);
    } else if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        result[key] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? sanitizeDataStatic(item as Record<string, unknown>) 
            : item
        );
      } else {
        result[key] = sanitizeDataStatic(value as Record<string, unknown>);
      }
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// 静态版本敏感字段判断
function isSensitiveFieldStatic(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_FIELDS.some(field => lowerKey === field.toLowerCase());
}

// 静态版本掩码处理
function maskValueStatic(value: unknown): string {
  if (typeof value === 'string') {
    if (value.length <= 4) {
      return '****';
    }
    return value.substring(0, 2) + '****' + value.substring(value.length - 2);
  }
  if (Buffer.isBuffer(value)) {
    return '[Buffer]';
  }
  return '****';
}

/**
 * 掩码 AppSecret
 */
export function maskAppSecret(secret: string): string {
  if (!secret || secret.length <= 4) {
    return '****';
  }
  return secret.substring(0, 2) + '****' + secret.substring(secret.length - 2);
}

/**
 * 掩码 AES Key
 */
export function maskAesKey(key: string): string {
  if (!key || key.length <= 4) {
    return '****';
  }
  return key.substring(0, 4) + '****';
}
