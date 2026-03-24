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
import { WxError, ErrorCode } from './types/error';
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

/**
 * 微信 SDK 主类
 * 补充配置校验和错误处理
 */
export class WeChatSDK {
  private readonly config: WeChatConfig;
  private readonly cache: CacheInterface;
  private readonly lock: LockInterface;
  private readonly http: WeChatHttpClient;
  private readonly tokenManager: TokenManager;
  private readonly logger: Logger;
  private readonly officialAccounts: Map<string, WeChatOfficial> = new Map();
  private readonly miniPrograms: Map<string, WeChatMP> = new Map();

  constructor(options?: WeChatSDKOptions) {
    // HTTP 配置校验：默认超时 10s，最多重试 2 次
    const httpConfig: HttpConfig = {
      timeout: 10000,
      retries: 2,
      forceHttps: true,
      ...options?.http,
    };
    
    this.config = new WeChatConfig(options ? {
      officialAccounts: options.officialAccounts,
      miniPrograms: options.miniPrograms,
      defaultOfficialAccount: options.defaultOfficialAccount,
      defaultMiniProgram: options.defaultMiniProgram,
      debug: options.debug,
      logLevel: options.logLevel,
      http: httpConfig,
    } : undefined);
    
    this.cache = options?.cache ?? new MemoryCache();
    this.lock = options?.lock ?? new MemoryLock();
    this.logger = new Logger({
      level: options?.logLevel ?? 'info',
      debug: options?.debug ?? false,
    });
    this.http = new WeChatHttpClient(httpConfig, this.logger);
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

  /**
   * 从环境变量创建 SDK
   * @param prefix - 环境变量前缀，默认为 WECHAT
   */
  static fromEnv(prefix: string = 'WECHAT'): WeChatSDK {
    // 环境变量前缀校验
    if (prefix && !/^[A-Z_][A-Z0-9_]*$/.test(prefix)) {
      throw new WxError(ErrorCode.INVALID_PARAMETER, '环境变量前缀格式错误');
    }
    
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

  /**
   * 从 JSON 文件创建 SDK
   * @param jsonPath - JSON 配置路径
   */
  static fromJson(jsonPath: string): WeChatSDK {
    if (!jsonPath || jsonPath.trim() === '') {
      throw new WxError(ErrorCode.PARAM_EMPTY_STRING, 'JSON 配置文件路径不能为空');
    }
    
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

  /**
   * 从选项创建 SDK
   * @param options - SDK 选项
   */
  static fromOptions(options: WeChatSDKOptions): WeChatSDK {
    // 校验配置
    if (options.officialAccounts) {
      for (const [name, config] of Object.entries(options.officialAccounts)) {
        validateOfficialAccountConfig(name, config);
      }
    }
    if (options.miniPrograms) {
      for (const [name, config] of Object.entries(options.miniPrograms)) {
        validateMiniProgramConfig(name, config);
      }
    }
    return new WeChatSDK(options);
  }

  /**
   * 获取公众号实例
   * @param name - 公众号名称，默认为默认公众号
   */
  official(name?: string): WeChatOfficial {
    const key = name ?? this.config.getDefaultOfficialAccount();
    if (!key) {
      throw new WxError(ErrorCode.CONFIG_NOT_FOUND, '未配置公众号，请先调用 addOfficialAccount 或设置默认公众号');
    }
    
    const app = this.officialAccounts.get(key);
    if (!app) {
      throw new WxError(ErrorCode.CONFIG_NOT_FOUND, `公众号 "${key}" 未找到`);
    }
    
    return app;
  }

  /**
   * 获取小程序实例
   * @param name - 小程序名称，默认为默认小程序
   */
  mp(name?: string): WeChatMP {
    const key = name ?? this.config.getDefaultMiniProgram();
    if (!key) {
      throw new WxError(ErrorCode.CONFIG_NOT_FOUND, '未配置小程序，请先调用 addMiniProgram 或设置默认小程序');
    }
    
    const app = this.miniPrograms.get(key);
    if (!app) {
      throw new WxError(ErrorCode.CONFIG_NOT_FOUND, `小程序 "${key}" 未找到`);
    }
    
    return app;
  }

  /**
   * 添加公众号配置
   * @param name - 名称
   * @param config - 公众号配置
   */
  addOfficialAccount(name: string, config: OfficialAccountConfig): WeChatOfficial {
    if (!name || name.trim() === '') {
      throw new WxError(ErrorCode.PARAM_EMPTY_STRING, '公众号名称不能为空');
    }
    
    const validatedConfig = validateOfficialAccountConfig(name, config);
    this.config.addOfficialAccount(name, validatedConfig);
    const app = new WeChatOfficial(validatedConfig, this.tokenManager);
    this.officialAccounts.set(name, app);
    return app;
  }

  /**
   * 添加小程序配置
   * @param name - 名称
   * @param config - 小程序配置
   */
  addMiniProgram(name: string, config: MiniProgramConfig): WeChatMP {
    if (!name || name.trim() === '') {
      throw new WxError(ErrorCode.PARAM_EMPTY_STRING, '小程序名称不能为空');
    }
    
    const validatedConfig = validateMiniProgramConfig(name, config);
    this.config.addMiniProgram(name, validatedConfig);
    const app = new WeChatMP(validatedConfig, this.tokenManager);
    this.miniPrograms.set(name, app);
    return app;
  }

  /**
   * 移除公众号配置
   */
  removeOfficialAccount(name: string): boolean {
    this.config.removeOfficialAccount(name);
    return this.officialAccounts.delete(name);
  }

  /**
   * 移除小程序配置
   */
  removeMiniProgram(name: string): boolean {
    this.config.removeMiniProgram(name);
    return this.miniPrograms.delete(name);
  }

  /**
   * 设置调试模式
   */
  setDebug(enabled: boolean): void {
    this.config.setDebug(enabled);
    this.logger.setDebug(enabled);
  }

  /**
   * 设置日志级别
   */
  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.config.setLogLevel(level);
    this.logger.setLevel(level);
  }

  /**
   * 获取配置实例
   */
  getConfig(): WeChatConfig {
    return this.config;
  }

  /**
   * 获取缓存实例
   */
  getCache(): CacheInterface {
    return this.cache;
  }

  /**
   * 获取 Token 管理器
   */
  getTokenManager(): TokenManager {
    return this.tokenManager;
  }

  /**
   * 获取已配置的公众号列表
   */
  listOfficialAccounts(): string[] {
    return this.config.listOfficialAccounts();
  }

  /**
   * 获取已配置的小程序列表
   */
  listMiniPrograms(): string[] {
    return this.config.listMiniPrograms();
  }
}

/**
 * 校验公众号配置
 */
function validateOfficialAccountConfig(name: string, config: OfficialAccountConfig): OfficialAccountConfig {
  // AppId 格式校验
  if (!config.appId || !/^wx[0-9a-zA-Z]{16}$/.test(config.appId)) {
    throw new WxError(ErrorCode.INVALID_APPID, `公众号 "${name}" 的 AppID 格式无效`);
  }
  
  // AppSecret 校验
  if (!config.appSecret || config.appSecret.length < 10) {
    throw new WxError(ErrorCode.INVALID_SECRET, `公众号 "${name}" 的 AppSecret 无效`);
  }
  
  // Token 校验（如果有的话）
  if (config.token !== undefined && config.token.trim() === '') {
    throw new WxError(ErrorCode.PARAM_EMPTY_STRING, `公众号 "${name}" 的 Token 不能为空`);
  }
  
  // EncodingAESKey 校验（如果有的话）
  if (config.encodingAESKey !== undefined && config.encodingAESKey.length !== 43) {
    throw new WxError(ErrorCode.ENCODING_AES_KEY_ERROR, `公众号 "${name}" 的 EncodingAESKey 长度必须为 43 位`);
  }
  
  return {
    appId: config.appId,
    appSecret: config.appSecret,
    token: config.token,
    encodingAESKey: config.encodingAESKey,
  };
}

/**
 * 校验小程序配置
 */
function validateMiniProgramConfig(name: string, config: MiniProgramConfig): MiniProgramConfig {
  // AppId 格式校验
  if (!config.appId || !/^wx[0-9a-zA-Z]{16}$/.test(config.appId)) {
    throw new WxError(ErrorCode.INVALID_APPID, `小程序 "${name}" 的 AppID 格式无效`);
  }
  
  // AppSecret 校验
  if (!config.appSecret || config.appSecret.length < 10) {
    throw new WxError(ErrorCode.INVALID_SECRET, `小程序 "${name}" 的 AppSecret 无效`);
  }
  
  return {
    appId: config.appId,
    appSecret: config.appSecret,
  };
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
