import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WeChatHttpClient } from '../src/http';
import { WxError, ErrorCode } from '../src/types';
import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'http';

describe('WeChatHttpClient Integration Tests', () => {
  let server: Server;
  let serverPort: number;
  let client: WeChatHttpClient;
  let requestCount: number;
  let receivedRequests: Array<{ method: string; url: string; headers: Record<string, string>; body?: string }> = [];

  const startMockServer = (mockHandler: (req: IncomingMessage, res: ServerResponse) => void): Promise<number> => {
    return new Promise((resolve) => {
      server = createServer((req, res) => {
        requestCount++;
        const headers = Object.fromEntries(Object.entries(req.headers).filter(([_, v]) => v !== undefined)) as Record<string, string>;
        let body = '';
        
        req.on('data', chunk => {
          body += chunk;
        });
        
        req.on('end', () => {
          receivedRequests.push({
            method: req.method || 'GET',
            url: req.url || '/',
            headers,
            body: body || undefined,
          });
          mockHandler(req, res);
        });
      });
      
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address !== 'string') {
          serverPort = address.port;
          resolve(serverPort);
        }
      });
    });
  };

  beforeEach(async () => {
    requestCount = 0;
    receivedRequests = [];
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  describe('Basic HTTP Methods', () => {
    it('should send GET request and parse response', async () => {
      const port = await startMockServer((req, res) => {
        expect(req.method).toBe('GET');
        expect(req.url).toBe('/api/test?param1=value1&param2=value2');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ errcode: 0, errmsg: 'ok', data: { id: 1, name: 'test' } }));
      });

      client = new WeChatHttpClient({ timeout: 5000 });
      const result = await client.get<{ errcode: number; errmsg: string; data: { id: number; name: string } }>(
        `http://localhost:${port}/api/test?param1=value1&param2=value2`
      );

      expect(result.err).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.errcode).toBe(0);
      expect(result.data?.data.id).toBe(1);
      expect(result.data?.data.name).toBe('test');
      expect(requestCount).toBe(1);
    });

    it('should send POST request with JSON body', async () => {
      const port = await startMockServer((req, res) => {
        expect(req.method).toBe('POST');
        expect(req.headers['content-type']).toContain('application/json');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ errcode: 0, errmsg: 'success', result: 'created' }));
      });

      client = new WeChatHttpClient({ timeout: 5000 });
      const result = await client.postJson<{ errcode: number; errmsg: string; result: string }>(
        `http://localhost:${port}/api/create`,
        { name: 'test', value: 123 }
      );

      expect(result.err).toBeNull();
      expect(result.data?.errcode).toBe(0);
      expect(result.data?.result).toBe('created');
      
      expect(receivedRequests[0].body).toContain('test');
    });

    it('should handle POST form data', async () => {
      const port = await startMockServer((req, res) => {
        expect(req.method).toBe('POST');
        expect(req.headers['content-type']).toContain('multipart/form-data');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ errcode: 0, errmsg: 'uploaded' }));
      });

      client = new WeChatHttpClient({ timeout: 5000 });
      const result = await client.postForm<{ errcode: number; errmsg: string }>(
        `http://localhost:${port}/api/upload`,
        {
          name: 'test.txt',
          file: Buffer.from('file content'),
        }
      );

      expect(result.err).toBeNull();
      expect(result.data?.errcode).toBe(0);
      expect(requestCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP 404 error', async () => {
      const port = await startMockServer((req, res) => {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      });

      client = new WeChatHttpClient({ timeout: 5000 });
      const result = await client.get(`http://localhost:${port}/api/notfound`);

      expect(result.err).toBeInstanceOf(WxError);
      expect(result.err?.errcode).toBe(404);
      expect(result.data).toBeNull();
    });

    it('should handle WeChat API error response', async () => {
      const port = await startMockServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ errcode: 40001, errmsg: 'invalid credential' }));
      });

      client = new WeChatHttpClient({ timeout: 5000 });
      const result = await client.get<{ errcode: number; errmsg: string }>(
        `http://localhost:${port}/api/error`
      );

      expect(result.err).toBeInstanceOf(WxError);
      expect(result.err?.errcode).toBe(40001);
      expect(result.err?.errmsg).toBe('invalid credential');
    });

    it('should handle network timeout', async () => {
      const port = await startMockServer((req, res) => {
        setTimeout(() => {
          res.writeHead(200);
          res.end('delayed response');
        }, 2000);
      });

      client = new WeChatHttpClient({ timeout: 500, retries: 0 });
      const result = await client.get(`http://localhost:${port}/api/slow`);

      expect(result.err).toBeInstanceOf(WxError);
      expect(result.err?.errcode).toBe(ErrorCode.SYSTEM_ERROR);
      expect(result.err?.message).toContain('timeout');
    });

    it('should handle connection error', async () => {
      client = new WeChatHttpClient({ timeout: 1000, retries: 0 });
      const result = await client.get('http://localhost:9999/api/test');

      expect(result.err).toBeInstanceOf(WxError);
      expect(result.err?.errcode).toBe(ErrorCode.SYSTEM_ERROR);
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry on retryable errors', async () => {
      let attemptCount = 0;
      
      const port = await startMockServer((req, res) => {
        attemptCount++;
        if (attemptCount < 3) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ errcode: 500, errmsg: 'server error' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ errcode: 0, errmsg: 'success' }));
        }
      });

      client = new WeChatHttpClient({ timeout: 5000, retries: 3, retryDelay: 100 });
      const result = await client.get<{ errcode: number; errmsg: string }>(
        `http://localhost:${port}/api/flaky`
      );

      expect(result.err).toBeNull();
      expect(result.data?.errcode).toBe(0);
      expect(attemptCount).toBe(3);
    });

    it('should not retry on non-retryable errors', async () => {
      let attemptCount = 0;
      
      const port = await startMockServer((req, res) => {
        attemptCount++;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ errcode: 40001, errmsg: 'invalid param' }));
      });

      client = new WeChatHttpClient({ timeout: 5000, retries: 3, retryDelay: 100 });
      const result = await client.get<{ errcode: number; errmsg: string }>(
        `http://localhost:${port}/api/invalid`,
        { retries: 0 }
      );

      expect(result.err).toBeInstanceOf(WxError);
      expect(result.err?.errcode).toBe(40001);
      expect(attemptCount).toBe(1);
    });

    it('should respect max retries limit', async () => {
      const port = await startMockServer((req, res) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ errcode: 500, errmsg: 'server error' }));
      });

      client = new WeChatHttpClient({ timeout: 5000, retries: 2, retryDelay: 50 });
      const result = await client.get(`http://localhost:${port}/api/fail`);

      expect(result.err).toBeInstanceOf(WxError);
      expect(requestCount).toBe(3);
    });
  });

  describe('Headers and Configuration', () => {
    it('should send custom headers', async () => {
      const port = await startMockServer((req, res) => {
        expect(req.headers['x-custom-header']).toBe('custom-value');
        expect(req.headers['authorization']).toBe('Bearer token123');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      });

      client = new WeChatHttpClient({ timeout: 5000 });
      const result = await client.get(`http://localhost:${port}/api/headers`, {
        headers: {
          'X-Custom-Header': 'custom-value',
          'Authorization': 'Bearer token123',
        },
      });

      expect(result.err).toBeNull();
    });

    it('should handle response with different content types', async () => {
      const port = await startMockServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('plain text response');
      });

      client = new WeChatHttpClient({ timeout: 5000 });
      const result = await client.get<string>(`http://localhost:${port}/api/plain`);

      expect(result.err).toBeNull();
      expect(result.data).toBe('plain text response');
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const port = await startMockServer((req, res) => {
        setTimeout(() => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id: Math.random() }));
        }, 50);
      });

      client = new WeChatHttpClient({ timeout: 5000 });
      
      const requests = Array.from({ length: 10 }, (_, i) =>
        client.get<{ id: number }>(`http://localhost:${port}/api/concurrent/${i}`)
      );

      const results = await Promise.all(requests);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.err).toBeNull();
        expect(result.data?.id).toBeDefined();
      });
      
      expect(requestCount).toBe(10);
    });
  });

  describe('Request Logging', () => {
    it('should include requestId in error response', async () => {
      const port = await startMockServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ errcode: 40001, errmsg: 'invalid' }));
      });

      client = new WeChatHttpClient({ timeout: 5000 });
      const result = await client.get(`http://localhost:${port}/api/error`);

      expect(result.err).toBeDefined();
      expect(result.err?.requestId).toBeDefined();
      expect(typeof result.err?.requestId).toBe('string');
    });
  });
});
