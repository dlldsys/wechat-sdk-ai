import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { WxError, ErrorCode, WxResponse, WxBaseResponse } from '../types';
import type { HttpConfig } from '../types';
import { Logger } from '../utils/logger';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export class WeChatHttpClient {
  private timeout: number;
  private retries: number;
  private retryDelay: number;
  private logger: Logger;

  constructor(config?: HttpConfig, logger?: Logger) {
    this.timeout = config?.timeout ?? 30000;
    this.retries = config?.retries ?? 3;
    this.retryDelay = config?.retryDelay ?? 1000;
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
    const maxRetries = options?.retries ?? this.retries;
    let lastError: WxError | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        await this.sleep(this.retryDelay * Math.pow(2, attempt - 1));
        this.logger.debug(`Retrying request (attempt ${attempt + 1}/${maxRetries + 1})`, { url });
      }
      
      try {
        const result = await this.doRequest<T>(url, options, body);
        
        if (result.err && this.shouldRetry(result.err)) {
          lastError = result.err;
          continue;
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof WxError ? error : new WxError(ErrorCode.SYSTEM_ERROR, String(error));
        
        if (!this.shouldRetry(lastError)) {
          break;
        }
      }
    }
    
    return {
      err: lastError ?? new WxError(ErrorCode.SYSTEM_ERROR, 'Max retries exceeded'),
      data: null as T,
    };
  }

  private async doRequest<T>(url: string, options: RequestOptions, body?: unknown): Promise<WxResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    this.logger.debug(`Request started`, { requestId, url, method: options.method });
    
    return new Promise((resolve) => {
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const lib = isHttps ? https : http;
      
      const requestOptions: http.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method ?? 'GET',
        headers: options.headers ?? {},
        timeout: options.timeout ?? this.timeout,
      };
      
      const req = lib.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const duration = Date.now() - startTime;
          this.logger.debug(`Request completed`, { requestId, duration, statusCode: res.statusCode });
          
          if (res.statusCode && res.statusCode >= 400) {
            resolve({
              err: new WxError(res.statusCode, `HTTP Error: ${res.statusCode}`, requestId),
              data: null as T,
            });
            return;
          }
          
          try {
            const json = JSON.parse(data) as T & WxBaseResponse;
            const error = WxError.fromResponse(json, requestId);
            
            resolve({
              err: error,
              data: json,
            });
          } catch {
            resolve({
              err: null,
              data: data as unknown as T,
            });
          }
        });
      });
      
      req.on('error', (error) => {
        this.logger.error(`Request failed`, { requestId, error: error.message });
        resolve({
          err: new WxError(ErrorCode.SYSTEM_ERROR, error.message, requestId),
          data: null as T,
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        this.logger.error(`Request timeout`, { requestId });
        resolve({
          err: new WxError(ErrorCode.SYSTEM_ERROR, 'Request timeout', requestId),
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

  private shouldRetry(error: WxError): boolean {
    const retryableCodes: number[] = [
      ErrorCode.SYSTEM_ERROR,
      ErrorCode.RATE_LIMIT,
      ErrorCode.TOO_MANY_REQUESTS,
    ];
    
    return retryableCodes.includes(error.errcode) || error.errcode >= 500;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
}
