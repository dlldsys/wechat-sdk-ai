import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryCache, MemoryLock, createTokenKey, isTokenValid } from '../src/cache';
import type { TokenInfo } from '../src/types';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  it('should set and get value', async () => {
    await cache.set('key1', { data: 'value1' });
    const result = await cache.get<{ data: string }>('key1');
    
    expect(result).toEqual({ data: 'value1' });
  });

  it('should return null for non-existent key', async () => {
    const result = await cache.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should delete value', async () => {
    await cache.set('key1', 'value1');
    const deleted = await cache.delete('key1');
    
    expect(deleted).toBe(true);
    expect(await cache.get('key1')).toBeNull();
  });

  it('should check if key exists', async () => {
    await cache.set('key1', 'value1');
    
    expect(await cache.has('key1')).toBe(true);
    expect(await cache.has('nonexistent')).toBe(false);
  });

  it('should expire value after TTL', async () => {
    await cache.set('key1', 'value1', 1);
    
    expect(await cache.get('key1')).toBe('value1');
    
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(await cache.get('key1')).toBeNull();
  });

  it('should use getOrSet', async () => {
    const factory = vi.fn().mockResolvedValue('computed');
    
    const result1 = await cache.getOrSet('key1', factory);
    expect(result1).toBe('computed');
    expect(factory).toHaveBeenCalledTimes(1);
    
    const result2 = await cache.getOrSet('key1', factory);
    expect(result2).toBe('computed');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('should clear all values', async () => {
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    
    await cache.clear();
    
    expect(await cache.has('key1')).toBe(false);
    expect(await cache.has('key2')).toBe(false);
  });
});

describe('MemoryLock', () => {
  let lock: MemoryLock;

  beforeEach(() => {
    lock = new MemoryLock();
  });

  it('should acquire lock', async () => {
    const acquired = await lock.acquire('lock1');
    expect(acquired).toBe(true);
  });

  it('should not acquire already locked key', async () => {
    await lock.acquire('lock1');
    const acquired = await lock.acquire('lock1');
    expect(acquired).toBe(false);
  });

  it('should release lock', async () => {
    await lock.acquire('lock1');
    await lock.release('lock1');
    
    const acquired = await lock.acquire('lock1');
    expect(acquired).toBe(true);
  });

  it('should check if locked', async () => {
    expect(await lock.isLocked('lock1')).toBe(false);
    
    await lock.acquire('lock1');
    expect(await lock.isLocked('lock1')).toBe(true);
  });

  it('should expire lock after TTL', async () => {
    await lock.acquire('lock1', 1);
    
    expect(await lock.isLocked('lock1')).toBe(true);
    
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(await lock.isLocked('lock1')).toBe(false);
  });
});

describe('Token utilities', () => {
  it('should create token key', () => {
    const key = createTokenKey('wx123', 'access');
    expect(key).toBe('wechat:token:access:wx123');
  });

  it('should validate token', () => {
    const validToken: TokenInfo = {
      accessToken: 'token123',
      expiresIn: 7200,
      expiresAt: Date.now() + 7200 * 1000,
      appId: 'wx123',
    };
    
    expect(isTokenValid(validToken)).toBe(true);
    
    const expiredToken: TokenInfo = {
      accessToken: 'token123',
      expiresIn: 7200,
      expiresAt: Date.now() - 1000,
      appId: 'wx123',
    };
    
    expect(isTokenValid(expiredToken)).toBe(false);
    
    expect(isTokenValid(null)).toBe(false);
  });
});
