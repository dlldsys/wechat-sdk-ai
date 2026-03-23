import type { TokenInfo, JsApiTicket } from '../types';

export interface CacheInterface {
  get<T>(_key: string): Promise<T | null>;
  set<T>(_key: string, _value: T, _ttl?: number): Promise<void>;
  delete(_key: string): Promise<boolean>;
  has(_key: string): Promise<boolean>;
  clear(): Promise<void>;
}

export interface LockInterface {
  acquire(_key: string, _ttl?: number): Promise<boolean>;
  release(_key: string): Promise<void>;
  isLocked(_key: string): Promise<boolean>;
}

export abstract class BaseCache implements CacheInterface {
  abstract get<T>(_key: string): Promise<T | null>;
  abstract set<T>(_key: string, _value: T, _ttl?: number): Promise<void>;
  abstract delete(_key: string): Promise<boolean>;
  abstract has(_key: string): Promise<boolean>;
  abstract clear(): Promise<void>;

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const result = new Map<string, T | null>();
    for (const key of keys) {
      result.set(key, await this.get<T>(key));
    }
    return result;
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    for (const { key, value, ttl } of entries) {
      await this.set(key, value, ttl);
    }
  }

  async mdelete(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.delete(key);
    }
  }
}

export class MemoryCache extends BaseCache {
  private cache: Map<string, { value: unknown; expiresAt: number | null }> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private defaultTtl: number;

  constructor(defaultTtl: number = 7200) {
    super();
    this.defaultTtl = defaultTtl;
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt !== null && entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const effectiveTtl = ttl ?? this.defaultTtl;
    const expiresAt = effectiveTtl > 0 ? Date.now() + effectiveTtl * 1000 : null;
    this.cache.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export class MemoryLock implements LockInterface {
  private locks: Map<string, { token: string; expiresAt: number }> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, lock] of this.locks) {
        if (lock.expiresAt < now) {
          this.locks.delete(key);
        }
      }
    }, 10000);
  }

  private generateToken(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  async acquire(key: string, ttl: number = 10): Promise<boolean> {
    const now = Date.now();
    const existing = this.locks.get(key);
    
    if (existing && existing.expiresAt > now) {
      return false;
    }
    
    this.locks.set(key, { token: this.generateToken(), expiresAt: now + ttl * 1000 });
    return true;
  }

  async release(key: string): Promise<void> {
    this.locks.delete(key);
  }

  async isLocked(key: string): Promise<boolean> {
    const lock = this.locks.get(key);
    if (!lock) {
      return false;
    }
    if (lock.expiresAt < Date.now()) {
      this.locks.delete(key);
      return false;
    }
    return true;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.locks.clear();
  }
}

export function createTokenKey(appId: string, type: 'access' | 'jsapi' = 'access'): string {
  return `wechat:token:${type}:${appId}`;
}

export function createTicketKey(appId: string, type: 'jsapi' | 'wx_card' = 'jsapi'): string {
  return `wechat:ticket:${type}:${appId}`;
}

export function createLockKey(appId: string, type: 'token' | 'ticket' = 'token'): string {
  return `wechat:lock:${type}:${appId}`;
}

export function isTokenValid(tokenInfo: TokenInfo | null): boolean {
  if (!tokenInfo) {
    return false;
  }
  const bufferTime = 300;
  return tokenInfo.expiresAt > Date.now() + bufferTime * 1000;
}

export function isTicketValid(ticket: JsApiTicket | null): boolean {
  if (!ticket) {
    return false;
  }
  const bufferTime = 300;
  return ticket.expiresAt > Date.now() + bufferTime * 1000;
}
