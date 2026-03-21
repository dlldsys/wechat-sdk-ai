import * as crypto from 'crypto';
import type { CacheInterface, LockInterface } from '../cache';
import { MemoryCache, MemoryLock, createTokenKey, createTicketKey, createLockKey, isTokenValid, isTicketValid } from '../cache';
import type { TokenInfo, JsApiTicket, WxResponse } from '../types';
import { WxError, ErrorCode } from '../types';
import type { WeChatHttpClient } from '../http';

export class TokenManager {
  private cache: CacheInterface;
  private lock: LockInterface;
  private http: WeChatHttpClient;
  private pendingRequests: Map<string, Promise<TokenInfo>> = new Map();
  private pendingTicketRequests: Map<string, Promise<JsApiTicket>> = new Map();

  constructor(http: WeChatHttpClient, cache?: CacheInterface, lock?: LockInterface) {
    this.http = http;
    this.cache = cache ?? new MemoryCache();
    this.lock = lock ?? new MemoryLock();
  }

  getHttpClient(): WeChatHttpClient {
    return this.http;
  }

  async getAccessToken(appId: string, appSecret: string, forceRefresh: boolean = false): Promise<WxResponse<TokenInfo>> {
    const cacheKey = createTokenKey(appId, 'access');
    
    if (!forceRefresh) {
      const cached = await this.cache.get<TokenInfo>(cacheKey);
      if (isTokenValid(cached)) {
        return { err: null, data: cached! };
      }
    }

    return this.fetchAccessTokenWithLock(appId, appSecret);
  }

  private async fetchAccessTokenWithLock(appId: string, appSecret: string): Promise<WxResponse<TokenInfo>> {
    const lockKey = createLockKey(appId, 'token');
    const cacheKey = createTokenKey(appId, 'access');

    const pendingKey = `token:${appId}`;
    if (this.pendingRequests.has(pendingKey)) {
      const tokenInfo = await this.pendingRequests.get(pendingKey)!;
      return { err: null, data: tokenInfo };
    }

    const acquired = await this.lock.acquire(lockKey, 5);
    
    if (!acquired) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const cached = await this.cache.get<TokenInfo>(cacheKey);
      if (isTokenValid(cached)) {
        return { err: null, data: cached! };
      }
      return {
        err: new WxError(ErrorCode.SYSTEM_ERROR, 'Failed to acquire lock for token refresh'),
        data: null as unknown as TokenInfo,
      };
    }

    try {
      const cached = await this.cache.get<TokenInfo>(cacheKey);
      if (isTokenValid(cached)) {
        return { err: null, data: cached! };
      }

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

  private async doFetchAccessToken(appId: string, appSecret: string): Promise<TokenInfo> {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const response = await this.http.get<{ access_token?: string; expires_in?: number; errcode?: number; errmsg?: string }>(url);
    
    if (response.err) {
      throw response.err;
    }

    const data = response.data;
    if (!data.access_token) {
      throw new WxError(data.errcode ?? ErrorCode.SYSTEM_ERROR, data.errmsg ?? 'Failed to get access token');
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in ?? 7200,
      expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000,
      appId,
    };
  }

  async getJsApiTicket(appId: string, accessToken: string, forceRefresh: boolean = false): Promise<WxResponse<JsApiTicket>> {
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
    if (this.pendingTicketRequests.has(pendingKey)) {
      const ticket = await this.pendingTicketRequests.get(pendingKey)!;
      return { err: null, data: ticket };
    }

    const acquired = await this.lock.acquire(lockKey, 5);
    
    if (!acquired) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const cached = await this.cache.get<JsApiTicket>(cacheKey);
      if (isTicketValid(cached)) {
        return { err: null, data: cached! };
      }
      return {
        err: new WxError(ErrorCode.SYSTEM_ERROR, 'Failed to acquire lock for ticket refresh'),
        data: null as unknown as JsApiTicket,
      };
    }

    try {
      const cached = await this.cache.get<JsApiTicket>(cacheKey);
      if (isTicketValid(cached)) {
        return { err: null, data: cached! };
      }

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
    const response = await this.http.get<{ ticket?: string; expires_in?: number; errcode?: number; errmsg?: string }>(url);
    
    if (response.err) {
      throw response.err;
    }

    const data = response.data;
    if (!data.ticket) {
      throw new WxError(data.errcode ?? ErrorCode.SYSTEM_ERROR, data.errmsg ?? 'Failed to get jsapi ticket');
    }

    return {
      ticket: data.ticket,
      expiresIn: data.expires_in ?? 7200,
      expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000,
    };
  }

  async refreshAccessToken(appId: string, appSecret: string): Promise<WxResponse<TokenInfo>> {
    const cacheKey = createTokenKey(appId, 'access');
    await this.cache.delete(cacheKey);
    return this.getAccessToken(appId, appSecret, true);
  }

  async invalidateToken(appId: string): Promise<void> {
    const cacheKey = createTokenKey(appId, 'access');
    await this.cache.delete(cacheKey);
  }

  async invalidateTicket(appId: string): Promise<void> {
    const cacheKey = createTicketKey(appId, 'jsapi');
    await this.cache.delete(cacheKey);
  }
}

export function generateSignature(params: Record<string, string | number>, sort: boolean = true): string {
  const keys = Object.keys(params).filter(key => params[key] !== undefined && params[key] !== '');
  
  if (sort) {
    keys.sort();
  }
  
  const str = keys.map(key => `${key}=${params[key]}`).join('&');
  return crypto.createHash('sha1').update(str).digest('hex');
}

export function generateNonceStr(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
