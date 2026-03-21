import type { CacheInterface, LockInterface } from '../cache';
import { BaseCache } from '../cache';

interface RedisClient {
  get(_key: string): Promise<string | null>;
  set(_key: string, _value: string, ..._args: unknown[]): Promise<unknown>;
  del(_key: string): Promise<number>;
  exists(_key: string): Promise<number>;
  eval(_script: string, _numKeys: number, ..._args: (string | number)[]): Promise<unknown>;
}

export class RedisCache extends BaseCache implements CacheInterface {
  private client: RedisClient;
  private prefix: string;
  private defaultTtl: number;

  constructor(client: RedisClient, prefix: string = 'wechat:', defaultTtl: number = 7200) {
    super();
    this.client = client;
    this.prefix = prefix;
    this.defaultTtl = defaultTtl;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(this.getKey(key));
    if (!data) {
      return null;
    }
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const effectiveTtl = ttl ?? this.defaultTtl;
    const data = JSON.stringify(value);
    const fullKey = this.getKey(key);
    
    if (effectiveTtl > 0) {
      await this.client.set(fullKey, data, 'EX', effectiveTtl);
    } else {
      await this.client.set(fullKey, data);
    }
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.client.del(this.getKey(key));
    return result > 0;
  }

  async has(key: string): Promise<boolean> {
    const result = await this.client.exists(this.getKey(key));
    return result === 1;
  }

  async clear(): Promise<void> {
    throw new Error('RedisCache does not support clear operation. Use delete for specific keys.');
  }
}

export class RedisLock implements LockInterface {
  private client: RedisClient;
  private prefix: string;
  private unlockScript: string;

  constructor(client: RedisClient, prefix: string = 'wechat:lock:') {
    this.client = client;
    this.prefix = prefix;
    this.unlockScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private generateToken(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  async acquire(key: string, ttl: number = 10): Promise<boolean> {
    const fullKey = this.getKey(key);
    const token = this.generateToken();
    
    const result = await this.client.set(fullKey, token, 'NX', 'EX', ttl);
    return result === 'OK';
  }

  async release(key: string): Promise<void> {
    const fullKey = this.getKey(key);
    await this.client.eval(this.unlockScript, 1, fullKey, '');
  }

  async isLocked(key: string): Promise<boolean> {
    const result = await this.client.exists(this.getKey(key));
    return result === 1;
  }
}

export function createRedisCache(options: {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  prefix?: string;
  ttl?: number;
}): RedisCache {
  let Redis: typeof import('ioredis').default;
  
  try {
    Redis = require('ioredis');
  } catch {
    throw new Error('ioredis is required for RedisCache. Install it with: npm install ioredis');
  }

  const client = new Redis({
    host: options.host ?? 'localhost',
    port: options.port ?? 6379,
    password: options.password,
    db: options.db ?? 0,
  });

  return new RedisCache(client, options.prefix, options.ttl);
}
