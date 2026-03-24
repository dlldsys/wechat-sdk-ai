export interface OfficialAccountConfig {
  appId: string;
  appSecret: string;
  token?: string;
  encodingAESKey?: string;
}

export interface MiniProgramConfig {
  appId: string;
  appSecret: string;
}

export interface WeChatConfigOptions {
  officialAccounts?: Record<string, OfficialAccountConfig>;
  miniPrograms?: Record<string, MiniProgramConfig>;
  defaultOfficialAccount?: string;
  defaultMiniProgram?: string;
  debug?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  cache?: CacheConfig;
  http?: HttpConfig;
}

export interface CacheConfig {
  type: 'memory' | 'redis' | 'file';
  prefix?: string;
  ttl?: number;
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  file?: {
    path: string;
  };
}

export interface HttpConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  baseURL?: string;
  /** 强制要求 HTTPS，默认为 true */
  forceHttps?: boolean;
}

export interface TokenInfo {
  accessToken: string;
  expiresIn: number;
  expiresAt: number;
  appId: string;
}

export interface JsApiTicket {
  ticket: string;
  expiresIn: number;
  expiresAt: number;
}

export interface AppConfig {
  appId: string;
  appSecret: string;
  token?: string;
  encodingAESKey?: string;
  type: 'official' | 'mini';
}

export type ConfigSource = 'env' | 'json' | 'memory';

export interface ConfigLoadOptions {
  source: ConfigSource;
  envPrefix?: string;
  jsonPath?: string;
}
