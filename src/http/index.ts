import * as https from 'node:https';
import * as http from 'node:http';
import { URL } from 'node:url';
import { WxError, ErrorCode } from '../types/error';
import type { HttpConfig } from '../types/config';
import { Logger } from '../utils/logger';
import type { WxResponse, WxBaseResponse } from '../types/response';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  forceHttps?: boolean;
}

export class WeChatHttpClient {
  // 修复：使用 const 替代 let
  private readonly timeout: number;
  private readonly retries: number;
  private readonly retryDelay: number;
  private readonly logger: Logger;
  private readonly forceHttps: boolean;

  constructor(config?: HttpConfig, logger?: Logger) {
    // 修复：默认超时 10s，最多重试 2 次
    this.timeout = config?.timeout ?? 10000;
    this.retries = config?.retries ?? 2;
    this.retryDelay = config?.retryDelay ?? 1000;
    this.forceHttps = config?.forceHttps ?? true;
    this.logger = logger ?? new Logger({ level: 'info' });
  }

  async get<T>(url: string, options?: RequestOptions): Promise<WxResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<WxResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST' }, data);
  }

  async postForm<T>(url: string, formData: Record<string, string | Buffer>, options?: RequestOptions): Promise<WxResponse<T>> {
    const boundary = `----WeChatSDK${Date.now()}${Math.random().toString(16).slice(2)}`;
    const body = this.buildMultipartBody(formData, boundary);
    
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        ...options?.headers,
      },
    }, body);
  }

  async postJson<T>(url: string, data: unknown, options?: RequestOptions): Promise<WxResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    }, JSON.stringify(data));
  }

  private buildMultipartBody(formData: Record<string, string | Buffer>, boundary: string): Buffer {
    const chunks: Buffer[] = [];
    
    for (const [name, value] of Object.entries(formData)) {
      chunks.push(Buffer.from(`--${boundary}\r\n`));
      
      if (Buffer.isBuffer(value)) {
        chunks.push(Buffer.from(`Content-Disposition: form-data; name="${name}"; filename="file"\r\n`));
        chunks.push(Buffer.from('Content-Type: application/octet-stream\r\n\r\n'));
        chunks.push(value);
        chunks.push(Buffer.from('\r\n'));
      } else {
        chunks.push(Buffer.from(`Content-Disposition: form-data; name="${name}"\r\n\r\n`));
        chunks.push(Buffer.from(value));
        chunks.push(Buffer.from('\r\n'));
      }
    }
    
    chunks.push(Buffer.from(`--${boundary}--\r\n`));
    return Buffer.concat(chunks);
  }

  private async request<T>(url: string, options: RequestOptions, body?: unknown): Promise<WxResponse<T>> {
    const requestId = this.generateRequestId();
    
    // HTTPS 校验：强制要求 HTTPS
    const shouldForceHttps = options.forceHttps ?? this.forceHttps;
    if (shouldForceHttps && !this.isSafeUrl(url)) {
      this.logger.warn('Unsafe URL blocked', { requestId, url: this.maskUrl(url) });
      return {
        err: WxError.unsafeUrl(url, requestId),
        data: null as T,
      };
    }
    
    const maxRetries = options?.retries ?? this.retries;
    let lastError: WxError | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        // 指数退避：1s, 2s, 4s...
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
        this.logger.debug(`Retrying request (attempt ${attempt + 1}/${maxRetries + 1})`, { requestId, url: this.maskUrl(url), delay });
      }
      
      try {
        const result = await this.doRequest<T>(url, options, body, requestId);
        
        if (result.err && this.shouldRetry(result.err)) {
          lastError = result.err;
          continue;
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof WxError ? error : new WxError(ErrorCode.SYSTEM_ERROR, String(error), requestId);
        
        if (!this.shouldRetry(lastError)) {
          break;
        }
      }
    }
    
    // 达到最大重试次数
    if (lastError) {
      return {
        err: WxError.httpMaxRetries(requestId),
        data: null as T,
      };
    }
    
    return {
      err: lastError ?? new WxError(ErrorCode.SYSTEM_ERROR, 'Request failed', requestId),
      data: null as T,
    };
  }

  private isSafeUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private maskUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.hostname}/***`;
    } catch {
      return '***';
    }
  }

  private async doRequest<T>(url: string, options: RequestOptions, body?: unknown, requestId?: string): Promise<WxResponse<T>> {
    const id = requestId ?? this.generateRequestId();
    const startTime = Date.now();
    
    // 日志脱敏：隐藏敏感参数
    this.logger.debug(`Request started`, { 
      requestId: id, 
      url: this.maskUrl(url), 
      method: options.method,
      timeout: options.timeout ?? this.timeout 
    });
    
    return new Promise((resolve) => {
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const lib = isHttps ? https : http;
      
      // 超时设置：默认 10s
      const requestTimeout = options.timeout ?? this.timeout;
      
      const requestOptions: http.RequestOptions & { rejectUnauthorized?: boolean } = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method ?? 'GET',
        headers: options.headers ?? {},
        timeout: requestTimeout,
      };

      if (isHttps) {
        (requestOptions as https.RequestOptions).rejectUnauthorized = true;
      }
      
      const req = lib.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const duration = Date.now() - startTime;
          this.logger.debug(`Request completed`, { 
            requestId: id, 
            duration, 
            statusCode: res.statusCode,
            url: this.maskUrl(url)
          });
          
          if (res.statusCode && res.statusCode >= 400) {
            resolve({
              err: new WxError(res.statusCode, `HTTP Error: ${res.statusCode}`, id),
              data: null as T,
            });
            return;
          }
          
          const contentType = res.headers['content-type'] || '';
          const isJsonExpected = contentType.includes('application/json');
          
          try {
            const json = JSON.parse(data) as T & WxBaseResponse;
            const error = WxError.fromResponse(json, id);
            
            resolve({
              err: error,
              data: json,
            });
          } catch (parseError) {
            if (isJsonExpected) {
              this.logger.warn('Failed to parse expected JSON response', { 
                requestId: id, 
                contentType,
                data: data.substring(0, 200),
                url: this.maskUrl(url)
              });
              resolve({
                err: new WxError(ErrorCode.SYSTEM_ERROR, 'Invalid JSON response', id),
                data: null as T,
              });
            } else {
              resolve({
                err: null,
                data: data as unknown as T,
              });
            }
          }
        });
      });
      
      req.on('error', (error) => {
        // SSL 证书错误处理
        if (error.message.includes('certificate') || error.message.includes('SSL')) {
          this.logger.error(`SSL Error`, { 
            requestId: id, 
            url: this.maskUrl(url),
            error: 'SSL certificate verification failed'
          });
          resolve({
            err: WxError.httpSslError(id),
            data: null as T,
          });
          return;
        }
        
        this.logger.error(`Request failed`, { 
          requestId: id, 
          url: this.maskUrl(url),
          error: 'Connection failed'
        });
        resolve({
          err: WxError.httpConnectionError(id),
          data: null as T,
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        this.logger.error(`Request timeout`, { 
          requestId: id,
          url: this.maskUrl(url),
          timeout: requestTimeout
        });
        resolve({
          err: WxError.httpTimeout(id),
          data: null as T,
        });
      });
      
      if (body) {
        if (Buffer.isBuffer(body)) {
          req.write(body);
        } else if (typeof body === 'string') {
          req.write(body);
        }
      }
      
      req.end();
    });
  }

  // 可重试的错误码判断
  private shouldRetry(error: WxError): boolean {
    const retryableCodes: number[] = [
      ErrorCode.SYSTEM_ERROR,
      ErrorCode.RATE_LIMIT,
      ErrorCode.TOO_MANY_REQUESTS,
      ErrorCode.HTTP_TIMEOUT,
      ErrorCode.HTTP_CONNECTION_ERROR,
    ];
    
    // 5xx 错误可重试
    return retryableCodes.includes(error.errcode) || error.errcode >= 500;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
}
