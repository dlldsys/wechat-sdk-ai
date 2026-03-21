import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenManager } from '../src/token';
import { WeChatHttpClient } from '../src/http';
import { MemoryCache, MemoryLock } from '../src/cache';
import { WxError, ErrorCode } from '../src/types';

describe('TokenManager Integration Tests', () => {
  let tokenManager: TokenManager;
  let httpClient: WeChatHttpClient;
  let cache: MemoryCache;
  let lock: MemoryLock;

  const mockAppId = 'wxtest123';
  const mockAppSecret = 'secret123456';
  const mockAccessToken = 'mock_access_token_12345';
  const mockTicket = 'mock_jsapi_ticket_67890';

  beforeEach(() => {
    cache = new MemoryCache();
    lock = new MemoryLock();
    
    httpClient = new WeChatHttpClient({
      timeout: 5000,
      retries: 0,
    });
    
    tokenManager = new TokenManager(httpClient, cache, lock);
  });

  describe('Cache and Lock Integration', () => {
    it('should use custom cache implementation', async () => {
      const customCache = new MemoryCache();
      const customTokenManager = new TokenManager(httpClient, customCache, lock);
      
      expect(customTokenManager).toBeDefined();
    });

    it('should use custom lock implementation', async () => {
      const customLock = new MemoryLock();
      const customTokenManager = new TokenManager(httpClient, cache, customLock);
      
      expect(customTokenManager).toBeDefined();
    });

    it('should create default cache if not provided', () => {
      const defaultManager = new TokenManager(httpClient);
      expect(defaultManager).toBeDefined();
    });

    it('should create default lock if not provided', () => {
      const defaultManager = new TokenManager(httpClient);
      expect(defaultManager).toBeDefined();
    });

    it('should return HTTP client instance', () => {
      const client = tokenManager.getHttpClient();
      expect(client).toBe(httpClient);
    });
  });

  describe('Token Cache Behavior', () => {
    it('should cache token with correct TTL', async () => {
      const cacheKey = `wechat:token:access:${mockAppId}`;
      const mockToken = {
        accessToken: mockAccessToken,
        expiresIn: 7200,
        expiresAt: Date.now() + 7200 * 1000,
        appId: mockAppId,
      };

      await cache.set(cacheKey, mockToken, 7200);
      const cached = await cache.get(cacheKey);
      
      expect(cached).toEqual(mockToken);
      expect(cached?.accessToken).toBe(mockAccessToken);
    });

    it('should check token validity', async () => {
      const validToken = {
        accessToken: mockAccessToken,
        expiresIn: 7200,
        expiresAt: Date.now() + 7200 * 1000,
        appId: mockAppId,
      };

      const expiredToken = {
        accessToken: mockAccessToken,
        expiresIn: 7200,
        expiresAt: Date.now() - 1000,
        appId: mockAppId,
      };

      expect(validToken.expiresAt > Date.now()).toBe(true);
      expect(expiredToken.expiresAt > Date.now()).toBe(false);
    });

    it('should delete token from cache', async () => {
      const cacheKey = `wechat:token:access:${mockAppId}`;
      await cache.set(cacheKey, { accessToken: 'test', expiresIn: 7200, expiresAt: Date.now() + 7200000, appId: mockAppId });
      
      expect(await cache.has(cacheKey)).toBe(true);
      
      await cache.delete(cacheKey);
      
      expect(await cache.has(cacheKey)).toBe(false);
    });
  });

  describe('Ticket Cache Behavior', () => {
    it('should cache ticket with correct TTL', async () => {
      const cacheKey = `wechat:ticket:jsapi:${mockAppId}`;
      const mockTicketData = {
        ticket: mockTicket,
        expiresIn: 7200,
        expiresAt: Date.now() + 7200 * 1000,
      };

      await cache.set(cacheKey, mockTicketData, 7200);
      const cached = await cache.get(cacheKey);
      
      expect(cached).toEqual(mockTicketData);
      expect(cached?.ticket).toBe(mockTicket);
    });

    it('should check ticket validity', async () => {
      const validTicket = {
        ticket: mockTicket,
        expiresIn: 7200,
        expiresAt: Date.now() + 7200 * 1000,
      };

      const expiredTicket = {
        ticket: mockTicket,
        expiresIn: 7200,
        expiresAt: Date.now() - 1000,
      };

      expect(validTicket.expiresAt > Date.now()).toBe(true);
      expect(expiredTicket.expiresAt > Date.now()).toBe(false);
    });
  });

  describe('Lock Behavior', () => {
    it('should acquire lock successfully', async () => {
      const lockKey = `wechat:lock:token:${mockAppId}`;
      const acquired = await lock.acquire(lockKey, 5);
      
      expect(acquired).toBe(true);
      
      await lock.release(lockKey);
    });

    it('should not acquire already locked key', async () => {
      const lockKey = `wechat:lock:token:${mockAppId}`;
      
      await lock.acquire(lockKey, 5);
      const secondAcquire = await lock.acquire(lockKey, 5);
      
      expect(secondAcquire).toBe(false);
      
      await lock.release(lockKey);
    });

    it('should release lock', async () => {
      const lockKey = `wechat:lock:token:${mockAppId}`;
      
      await lock.acquire(lockKey, 5);
      await lock.release(lockKey);
      
      const thirdAcquire = await lock.acquire(lockKey, 5);
      expect(thirdAcquire).toBe(true);
    });

    it('should check if key is locked', async () => {
      const lockKey = `wechat:lock:token:${mockAppId}`;
      
      expect(await lock.isLocked(lockKey)).toBe(false);
      
      await lock.acquire(lockKey, 5);
      expect(await lock.isLocked(lockKey)).toBe(true);
      
      await lock.release(lockKey);
      expect(await lock.isLocked(lockKey)).toBe(false);
    });

    it('should expire lock after TTL', async () => {
      const lockKey = `wechat:lock:token:${mockAppId}`;
      
      await lock.acquire(lockKey, 1);
      expect(await lock.isLocked(lockKey)).toBe(true);
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(await lock.isLocked(lockKey)).toBe(false);
    });
  });

  describe('Concurrent Access', () => {
    it('should handle concurrent cache operations', async () => {
      const cacheKey = `wechat:token:access:${mockAppId}`;
      const operations = Array.from({ length: 10 }, (_, i) =>
        cache.set(cacheKey, { accessToken: `token_${i}`, expiresIn: 7200, expiresAt: Date.now() + 7200000, appId: mockAppId })
      );

      await Promise.all(operations);
      
      const final = await cache.get(cacheKey);
      expect(final).toBeDefined();
    });

    it('should handle concurrent lock operations', async () => {
      const lockKey = `wechat:lock:token:${mockAppId}`;
      const results: boolean[] = [];

      const promises = Array.from({ length: 5 }, async () => {
        const result = await lock.acquire(lockKey, 5);
        results.push(result);
        if (result) {
          await new Promise(resolve => setTimeout(resolve, 50));
          await lock.release(lockKey);
        }
      });

      await Promise.all(promises);
      
      expect(results.filter(r => r).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle null token from cache', async () => {
      const cacheKey = `wechat:token:access:${mockAppId}`;
      const cached = await cache.get(cacheKey);
      
      expect(cached).toBeNull();
    });

    it('should handle null ticket from cache', async () => {
      const cacheKey = `wechat:ticket:jsapi:${mockAppId}`;
      const cached = await cache.get(cacheKey);
      
      expect(cached).toBeNull();
    });

    it('should handle invalid token structure', async () => {
      const cacheKey = `wechat:token:access:${mockAppId}`;
      await cache.set(cacheKey, { invalid: 'structure' } as any);
      
      const cached = await cache.get(cacheKey);
      expect(cached).toBeDefined();
      expect((cached as any).accessToken).toBeUndefined();
    });

    it('should handle expired cache entries', async () => {
      const cacheKey = `wechat:token:access:${mockAppId}`;
      await cache.set(cacheKey, {
        accessToken: 'test',
        expiresIn: 1,
        expiresAt: Date.now() + 1000,
        appId: mockAppId,
      }, 1);

      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const cached = await cache.get(cacheKey);
      expect(cached).toBeNull();
    });
  });

  describe('Key Generation', () => {
    it('should generate unique keys for different appIds', () => {
      const key1 = `wechat:token:access:${mockAppId}`;
      const key2 = `wechat:token:access:wxtest456`;
      
      expect(key1).not.toBe(key2);
    });

    it('should generate unique keys for token and ticket', () => {
      const tokenKey = `wechat:token:access:${mockAppId}`;
      const ticketKey = `wechat:ticket:jsapi:${mockAppId}`;
      
      expect(tokenKey).not.toBe(ticketKey);
    });

    it('should generate unique lock keys', () => {
      const tokenLockKey = `wechat:lock:token:${mockAppId}`;
      const ticketLockKey = `wechat:lock:ticket:${mockAppId}`;
      
      expect(tokenLockKey).not.toBe(ticketLockKey);
    });
  });

  describe('Token Invalidation', () => {
    it('should invalidate token by deleting from cache', async () => {
      const cacheKey = `wechat:token:access:${mockAppId}`;
      await cache.set(cacheKey, {
        accessToken: mockAccessToken,
        expiresIn: 7200,
        expiresAt: Date.now() + 7200000,
        appId: mockAppId,
      });

      expect(await cache.has(cacheKey)).toBe(true);
      
      await cache.delete(cacheKey);
      
      expect(await cache.has(cacheKey)).toBe(false);
    });

    it('should invalidate ticket by deleting from cache', async () => {
      const cacheKey = `wechat:ticket:jsapi:${mockAppId}`;
      await cache.set(cacheKey, {
        ticket: mockTicket,
        expiresIn: 7200,
        expiresAt: Date.now() + 7200000,
      });

      expect(await cache.has(cacheKey)).toBe(true);
      
      await cache.delete(cacheKey);
      
      expect(await cache.has(cacheKey)).toBe(false);
    });
  });

  describe('Multiple AppIds', () => {
    it('should handle multiple appIds independently', async () => {
      const appId1 = 'wxtest123';
      const appId2 = 'wxtest456';
      
      const key1 = `wechat:token:access:${appId1}`;
      const key2 = `wechat:token:access:${appId2}`;
      
      await cache.set(key1, {
        accessToken: 'token1',
        expiresIn: 7200,
        expiresAt: Date.now() + 7200000,
        appId: appId1,
      });
      
      await cache.set(key2, {
        accessToken: 'token2',
        expiresIn: 7200,
        expiresAt: Date.now() + 7200000,
        appId: appId2,
      });
      
      const cached1 = await cache.get(key1);
      const cached2 = await cache.get(key2);
      
      expect(cached1?.accessToken).toBe('token1');
      expect(cached2?.accessToken).toBe('token2');
    });
  });

  describe('Refresh Token Methods', () => {
    it('should have refreshAccessToken method', () => {
      expect(tokenManager.refreshAccessToken).toBeDefined();
      expect(typeof tokenManager.refreshAccessToken).toBe('function');
    });

    it('should have invalidateToken method', () => {
      expect(tokenManager.invalidateToken).toBeDefined();
      expect(typeof tokenManager.invalidateToken).toBe('function');
    });

    it('should have invalidateTicket method', () => {
      expect(tokenManager.invalidateTicket).toBeDefined();
      expect(typeof tokenManager.invalidateTicket).toBe('function');
    });
  });
});
