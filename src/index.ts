import { WeChatConfig } from './config';
import { MemoryCache, MemoryLock, BaseCache, CacheInterface, LockInterface } from './cache';
import { RedisCache, RedisLock, createRedisCache } from './cache/redis';
import { FileCache } from './cache/file';
import { TokenManager, generateSignature, generateNonceStr, generateTimestamp } from './token';
import { WeChatHttpClient } from './http';
import { WxCrypto, verifyWeChatSignature, verifyMessageSignature, IPWhitelist, isWeChatIP } from './security';
import { WeChatOfficial } from './official';
import { WeChatMP } from './mp';
import { Logger, createLogger } from './utils/logger';
import { XmlParser, parseXml, parseXmlFromBody } from './xml';
import type { OfficialAccountConfig, MiniProgramConfig, HttpConfig } from './types';
export { WxError, ErrorCode, createSuccessResponse, createErrorResponse } from './types';

export interface WeChatSDKOptions {
  officialAccounts?: Record<string, OfficialAccountConfig>;
  miniPrograms?: Record<string, MiniProgramConfig>;
  defaultOfficialAccount?: string;
  defaultMiniProgram?: string;
  debug?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  http?: HttpConfig;
  cache?: CacheInterface;
  lock?: LockInterface;
}

export class WeChatSDK {
  private config: WeChatConfig;
  private cache: CacheInterface;
  private lock: LockInterface;
  private http: WeChatHttpClient;
  private tokenManager: TokenManager;
  private logger: Logger;
  private officialAccounts: Map<string, WeChatOfficial> = new Map();
  private miniPrograms: Map<string, WeChatMP> = new Map();

  constructor(options?: WeChatSDKOptions) {
    this.config = new WeChatConfig(options ? {
      officialAccounts: options.officialAccounts,
      miniPrograms: options.miniPrograms,
      defaultOfficialAccount: options.defaultOfficialAccount,
      defaultMiniProgram: options.defaultMiniProgram,
      debug: options.debug,
      logLevel: options.logLevel,
      http: options.http,
    } : undefined);
    this.cache = options?.cache ?? new MemoryCache();
    this.lock = options?.lock ?? new MemoryLock();
    this.logger = new Logger({
      level: options?.logLevel ?? 'info',
      debug: options?.debug ?? false,
    });
    this.http = new WeChatHttpClient(options?.http, this.logger);
    this.tokenManager = new TokenManager(this.http, this.cache, this.lock);
    
    this.initializeApps();
  }

  private initializeApps(): void {
    const officialAccounts = this.config.listOfficialAccounts();
    for (const name of officialAccounts) {
      const appConfig = this.config.getOfficialAccount(name);
      if (appConfig) {
        this.officialAccounts.set(name, new WeChatOfficial(appConfig, this.tokenManager));
      }
    }

    const miniPrograms = this.config.listMiniPrograms();
    for (const name of miniPrograms) {
      const appConfig = this.config.getMiniProgram(name);
      if (appConfig) {
        this.miniPrograms.set(name, new WeChatMP(appConfig, this.tokenManager));
      }
    }
  }

  static fromEnv(prefix: string = 'WECHAT'): WeChatSDK {
    const config = new WeChatConfig();
    config.loadFromEnv(prefix);
    const json = config.toJSON();
    return new WeChatSDK({
      officialAccounts: json.officialAccounts,
      miniPrograms: json.miniPrograms,
      defaultOfficialAccount: json.defaultOfficialAccount,
      defaultMiniProgram: json.defaultMiniProgram,
      debug: json.debug,
      logLevel: json.logLevel,
    });
  }

  static fromJson(jsonPath: string): WeChatSDK {
    const config = new WeChatConfig();
    config.loadFromJson(jsonPath);
    const json = config.toJSON();
    return new WeChatSDK({
      officialAccounts: json.officialAccounts,
      miniPrograms: json.miniPrograms,
      defaultOfficialAccount: json.defaultOfficialAccount,
      defaultMiniProgram: json.defaultMiniProgram,
      debug: json.debug,
      logLevel: json.logLevel,
    });
  }

  static fromOptions(options: WeChatSDKOptions): WeChatSDK {
    return new WeChatSDK(options);
  }

  official(name?: string): WeChatOfficial {
    const key = name ?? this.config.getDefaultOfficialAccount();
    if (!key) {
      throw new Error('No official account configured');
    }
    
    const app = this.officialAccounts.get(key);
    if (!app) {
      throw new Error(`Official account "${key}" not found`);
    }
    
    return app;
  }

  mp(name?: string): WeChatMP {
    const key = name ?? this.config.getDefaultMiniProgram();
    if (!key) {
      throw new Error('No mini program configured');
    }
    
    const app = this.miniPrograms.get(key);
    if (!app) {
      throw new Error(`Mini program "${key}" not found`);
    }
    
    return app;
  }

  addOfficialAccount(name: string, config: OfficialAccountConfig): WeChatOfficial {
    this.config.addOfficialAccount(name, config);
    const app = new WeChatOfficial(config, this.tokenManager);
    this.officialAccounts.set(name, app);
    return app;
  }

  addMiniProgram(name: string, config: MiniProgramConfig): WeChatMP {
    this.config.addMiniProgram(name, config);
    const app = new WeChatMP(config, this.tokenManager);
    this.miniPrograms.set(name, app);
    return app;
  }

  removeOfficialAccount(name: string): boolean {
    this.config.removeOfficialAccount(name);
    return this.officialAccounts.delete(name);
  }

  removeMiniProgram(name: string): boolean {
    this.config.removeMiniProgram(name);
    return this.miniPrograms.delete(name);
  }

  setDebug(enabled: boolean): void {
    this.config.setDebug(enabled);
    this.logger.setDebug(enabled);
  }

  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.config.setLogLevel(level);
    this.logger.setLevel(level);
  }

  getConfig(): WeChatConfig {
    return this.config;
  }

  getCache(): CacheInterface {
    return this.cache;
  }

  getTokenManager(): TokenManager {
    return this.tokenManager;
  }

  listOfficialAccounts(): string[] {
    return this.config.listOfficialAccounts();
  }

  listMiniPrograms(): string[] {
    return this.config.listMiniPrograms();
  }
}

export {
  WeChatConfig,
  WeChatHttpClient,
  TokenManager,
  WxCrypto,
  IPWhitelist,
  Logger,
  MemoryCache,
  MemoryLock,
  RedisCache,
  RedisLock,
  FileCache,
  BaseCache,
  CacheInterface,
  LockInterface,
  generateSignature,
  generateNonceStr,
  generateTimestamp,
  verifyWeChatSignature,
  verifyMessageSignature,
  isWeChatIP,
  createRedisCache,
  createLogger,
  XmlParser,
  parseXml,
  parseXmlFromBody,
};

export type {
  OfficialAccountConfig,
  MiniProgramConfig,
  WxResponse,
  HttpConfig,
  CacheConfig,
  TokenInfo,
  JsApiTicket,
  UserInfo,
  MenuButton,
  MenuData,
  TemplateMessage,
  SubscribeMessage,
  MaterialItem,
  OAuthAccessToken,
  OAuthUserInfo,
  QrCodeResponse,
  PhoneNumberInfo,
  DecryptDataResult,
  ContentSecurityResult,
  CloudFunctionResult,
  NearbyPoi,
} from './types';

export type {
  XmlMessage,
  TextMessage,
  ImageMessage,
  VoiceMessage,
  VideoMessage,
  ShortVideoMessage,
  LocationMessage,
  LinkMessage,
  EventMessage,
  SubscribeEvent,
  QrCodeEvent,
  LocationEvent,
  ClickEvent,
  ViewEvent,
  TemplateSendJobFinishEvent,
  KfSessionEvent,
  MpOrderPayEvent,
  MpWeappAuditResultEvent,
  AnyMessage,
  XmlParseResult,
  XmlParseError,
  XmlParseOptions,
} from './xml/types';
