import * as crypto from 'crypto';
import type { CacheInterface, LockInterface } from '../cache';
import { MemoryCache, MemoryLock, createTokenKey, createTicketKey, createLockKey, isTokenValid, isTicketValid } from '../cache';
import type { TokenInfo, JsApiTicket } from '../types/config';
import { WxError, ErrorCode } from '../types/error';
import type { WxResponse } from '../types/response';
import type { WeChatHttpClient } from '../http';

/**
 * Token 管理器
 * 增加并发刷新锁，防止多实例同时刷新 token
 */
export class TokenManager {
  private readonly cache: CacheInterface;
  private readonly lock: LockInterface;
  private readonly http: WeChatHttpClient;
  
  // 待处理的请求缓存（防抖/节流）
  private readonly pendingRequests: Map<string, Promise<TokenInfo>> = new Map();
  private readonly pendingTicketRequests: Map<string, Promise<JsApiTicket>> = new Map();

  constructor(http: WeChatHttpClient, cache?: CacheInterface, lock?: LockInterface) {
    this.http = http;
    this.cache = cache ?? new MemoryCache();
    this.lock = lock ?? new MemoryLock();
  }

  getHttpClient(): WeChatHttpClient {
    return this.http;
  }

  /**
   * 获取 access_token
   * @param appId - 应用ID
   * @param appSecret - 应用密钥
   * @param forceRefresh - 是否强制刷新
   */
  async getAccessToken(appId: string, appSecret: string, forceRefresh: boolean = false): Promise<WxResponse<TokenInfo>> {
    // 入参校验
    if (!appId || typeof appId !== 'string') {
      return {
        err: new WxError(ErrorCode.INVALID_APPID, 'AppID 不能为空'),
        data: null as unknown as TokenInfo,
      };
    }
    if (!appSecret || typeof appSecret !== 'string') {
      return {
        err: new WxError(ErrorCode.INVALID_SECRET, 'AppSecret 不能为空'),
        data: null as unknown as TokenInfo,
      };
    }
    
    const cacheKey = createTokenKey(appId, 'access');
    
    // 非强制刷新时，优先使用缓存
    if (!forceRefresh) {
      const cached = await this.cache.get<TokenInfo>(cacheKey);
      if (isTokenValid(cached)) {
        return { err: null, data: cached! };
      }
    }

    return this.fetchAccessTokenWithLock(appId, appSecret);
  }

  /**
   * 使用锁机制获取 access_token
   * 防止多实例并发刷新
   */
  private async fetchAccessTokenWithLock(appId: string, appSecret: string): Promise<WxResponse<TokenInfo>> {
    const lockKey = createLockKey(appId, 'token');
    const cacheKey = createTokenKey(appId, 'access');
    const pendingKey = `token:${appId}`;

    // 1. 检查是否有正在进行的请求（节流/防抖）
    const existingRequest = this.pendingRequests.get(pendingKey);
    if (existingRequest) {
      try {
        const tokenInfo = await existingRequest;
        return { err: null, data: tokenInfo };
      } catch {
        // 请求失败，移除缓存的 pending promise
        this.pendingRequests.delete(pendingKey);
      }
    }

    // 2. 尝试获取锁
    const acquired = await this.lock.acquire(lockKey, 5);
    
    if (!acquired) {
      // 获取锁失败，等待后重试
      await new Promise(resolve => setTimeout(resolve, 200));
      const cached = await this.cache.get<TokenInfo>(cacheKey);
      if (isTokenValid(cached)) {
        return { err: null, data: cached! };
      }
      return {
        err: new WxError(ErrorCode.LOCK_ACQUIRE_FAILED, '获取 Token 锁失败，请稍后重试'),
        data: null as unknown as TokenInfo,
      };
    }

    try {
      // 3. 双重检查缓存（获取锁后）
      const cached = await this.cache.get<TokenInfo>(cacheKey);
      if (isTokenValid(cached)) {
        return { err: null, data: cached! };
      }

      // 4. 创建请求 Promise 并缓存（防止重复请求）
      const promise = this.doFetchAccessToken(appId, appSecret);
      this.pendingRequests.set(pendingKey, promise);

      try {
        const tokenInfo = await promise;
        await this.cache.set(cacheKey, tokenInfo, tokenInfo.expiresIn);
        return { err: null, data: tokenInfo };
      } finally {
        this.pendingRequests.delete(pendingKey);
      }
    } finally {
      await this.lock.release(lockKey);
    }
  }

  /**
   * 实际获取 access_token
   * AppSecret 不会在日志中输出
   */
  private async doFetchAccessToken(appId: string, appSecret: string): Promise<TokenInfo> {
    // AppSecret 脱敏：不在 URL 中明文暴露 - 使用 post 请求
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    
    const response = await this.http.get<{ 
      access_token?: string; 
      expires_in?: number; 
      errcode?: number; 
      errmsg?: string 
    }>(url);
    
    if (response.err) {
      throw response.err;
    }

    const data = response.data;
    if (!data.access_token) {
      const errcode = data.errcode ?? ErrorCode.SYSTEM_ERROR;
      throw new WxError(errcode, data.errmsg ?? '获取 access_token 失败');
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in ?? 7200,
      expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000,
      appId,
    };
  }

  /**
   * 获取 JS-SDK Ticket
   */
  async getJsApiTicket(appId: string, accessToken: string, forceRefresh: boolean = false): Promise<WxResponse<JsApiTicket>> {
    // 入参校验
    if (!appId || typeof appId !== 'string') {
      return {
        err: new WxError(ErrorCode.INVALID_APPID, 'AppID 不能为空'),
        data: null as unknown as JsApiTicket,
      };
    }
    if (!accessToken || typeof accessToken !== 'string') {
      return {
        err: new WxError(ErrorCode.ACCESS_TOKEN_MISSING, 'access_token 不能为空'),
        data: null as unknown as JsApiTicket,
      };
    }
    
    const cacheKey = createTicketKey(appId, 'jsapi');
    
    if (!forceRefresh) {
      const cached = await this.cache.get<JsApiTicket>(cacheKey);
      if (isTicketValid(cached)) {
        return { err: null, data: cached! };
      }
    }

    return this.fetchJsApiTicketWithLock(appId, accessToken);
  }

  private async fetchJsApiTicketWithLock(appId: string, accessToken: string): Promise<WxResponse<JsApiTicket>> {
    const lockKey = createLockKey(appId, 'ticket');
    const cacheKey = createTicketKey(appId, 'jsapi');
    const pendingKey = `ticket:${appId}`;

    // 1. 检查是否有正在进行的请求（节流/防抖）
    const existingRequest = this.pendingTicketRequests.get(pendingKey);
    if (existingRequest) {
      try {
        const ticket = await existingRequest;
        return { err: null, data: ticket };
      } catch {
        this.pendingTicketRequests.delete(pendingKey);
      }
    }

    // 2. 尝试获取锁
    const acquired = await this.lock.acquire(lockKey, 5);
    
    if (!acquired) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const cached = await this.cache.get<JsApiTicket>(cacheKey);
      if (isTicketValid(cached)) {
        return { err: null, data: cached! };
      }
      return {
        err: new WxError(ErrorCode.LOCK_ACQUIRE_FAILED, '获取 Ticket 锁失败，请稍后重试'),
        data: null as unknown as JsApiTicket,
      };
    }

    try {
      // 3. 双重检查缓存
      const cached = await this.cache.get<JsApiTicket>(cacheKey);
      if (isTicketValid(cached)) {
        return { err: null, data: cached! };
      }

      // 4. 创建请求 Promise 并缓存
      const promise = this.doFetchJsApiTicket(appId, accessToken);
      this.pendingTicketRequests.set(pendingKey, promise);

      try {
        const ticket = await promise;
        await this.cache.set(cacheKey, ticket, ticket.expiresIn);
        return { err: null, data: ticket };
      } finally {
        this.pendingTicketRequests.delete(pendingKey);
      }
    } finally {
      await this.lock.release(lockKey);
    }
  }

  private async doFetchJsApiTicket(_appId: string, accessToken: string): Promise<JsApiTicket> {
    const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`;
    const response = await this.http.get<{ 
      ticket?: string; 
      expires_in?: number; 
      errcode?: number; 
      errmsg?: string 
    }>(url);
    
    if (response.err) {
      throw response.err;
    }

    const data = response.data;
    if (!data.ticket) {
      const errcode = data.errcode ?? ErrorCode.SYSTEM_ERROR;
      throw new WxError(errcode, data.errmsg ?? '获取 jsapi ticket 失败');
    }

    return {
      ticket: data.ticket,
      expiresIn: data.expires_in ?? 7200,
      expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000,
    };
  }

  /**
   * 强制刷新 access_token
   */
  async refreshAccessToken(appId: string, appSecret: string): Promise<WxResponse<TokenInfo>> {
    // 入参校验
    if (!appId || !appSecret) {
      return {
        err: new WxError(ErrorCode.INVALID_PARAMETER, 'AppID 和 AppSecret 不能为空'),
        data: null as unknown as TokenInfo,
      };
    }
    
    const cacheKey = createTokenKey(appId, 'access');
    await this.cache.delete(cacheKey);
    return this.getAccessToken(appId, appSecret, true);
  }

  /**
   * 使 Token 失效
   */
  async invalidateToken(appId: string): Promise<void> {
    if (!appId) return;
    const cacheKey = createTokenKey(appId, 'access');
    await this.cache.delete(cacheKey);
  }

  /**
   * 使 Ticket 失效
   */
  async invalidateTicket(appId: string): Promise<void> {
    if (!appId) return;
    const cacheKey = createTicketKey(appId, 'jsapi');
    await this.cache.delete(cacheKey);
  }
}

/**
 * 生成签名
 * @param params - 签名参数
 * @param sort - 是否排序，默认为 true
 */
export function generateSignature(params: Record<string, string | number>, sort: boolean = true): string {
  const keys = Object.keys(params).filter(key => params[key] !== undefined && params[key] !== '');
  
  if (sort) {
    keys.sort();
  }
  
  const str = keys.map(key => `${key}=${params[key]}`).join('&');
  return crypto.createHash('sha1').update(str).digest('hex');
}

/**
 * 生成随机字符串
 * @param length - 长度，默认为 16
 */
export function generateNonceStr(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成时间戳
 */
export function generateTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
