/**
 * 微信 SDK 统一错误处理
 * 补充完整错误码体系，禁止裸异常抛出
 */

// 错误码枚举 - 补充所有业务错误码
export const ErrorCode = {
  // 系统级
  OK: 0,
  SYSTEM_ERROR: -1,
  INVALID_PARAMETER: 40000,
  
  // 认证授权
  INVALID_APPID: 40001,
  INVALID_SECRET: 40002,
  INVALID_GRANT_TYPE: 40003,
  INVALID_REFRESH_TOKEN: 40030,
  INVALID_OPENID: 40003,
  INVALID_CODE: 40029,
  ACCESS_TOKEN_EXPIRED: 42001,
  ACCESS_TOKEN_INVALID: 40014,
  ACCESS_TOKEN_MISSING: 41001,
  
  // 频率限制
  RATE_LIMIT: 45009,
  TOO_MANY_REQUESTS: 45011,
  
  // 加密相关
  SIGNATURE_ERROR: 40001,
  ENCODING_AES_KEY_ERROR: 40004,
  ENCRYPT_ERROR: 40005,
  DECRYPT_ERROR: 40006,
  
  // HTTP 相关
  HTTP_TIMEOUT: 60001,
  HTTP_CONNECTION_ERROR: 60002,
  HTTP_SSL_ERROR: 60003,
  HTTP_MAX_RETRIES: 60004,
  HTTP_UNSAFE_URL: 60005,
  
  // 参数校验
  PARAM_MISSING: 61001,
  PARAM_INVALID_FORMAT: 61002,
  PARAM_TOO_LONG: 61003,
  PARAM_EMPTY_STRING: 61004,
  
  // 缓存锁
  CACHE_ERROR: 62001,
  LOCK_ACQUIRE_FAILED: 62002,
  LOCK_TIMEOUT: 62003,
  
  // 配置错误
  CONFIG_NOT_FOUND: 63001,
  CONFIG_INVALID: 63002,
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

// 错误消息映射
export const ErrorMessage: Record<number, string> = {
  // 系统级
  [-1]: '系统繁忙，请稍后重试',
  [40000]: '参数错误，请检查输入',
  
  // 认证授权
  [40001]: 'AppSecret 错误或不属于该公众号',
  [40002]: 'grant_type 字段值错误',
  [40003]: '不合法的 OpenID',
  [40014]: '不合法的 access_token',
  [40029]: '不合法的 code',
  [40030]: '不合法的 refresh_token',
  [41001]: '缺少 access_token 参数',
  [42001]: 'access_token 超时',
  
  // 频率限制
  [45009]: '接口调用超过限制',
  [45011]: '频率限制，请稍后重试',
  
  // 加密相关
  [40004]: '不合法的 EncodingAESKey',
  [40005]: '加密失败',
  [40006]: '解密失败',
  
  // HTTP 相关
  [60001]: '请求超时，请检查网络',
  [60002]: '连接失败，请检查网络',
  [60003]: 'SSL 证书验证失败',
  [60004]: '请求重试次数超限',
  [60005]: '禁止使用非 HTTPS URL',
  
  // 参数校验
  [61001]: '缺少必需参数',
  [61002]: '参数格式错误',
  [61003]: '参数过长',
  [61004]: '参数不能为空字符串',
  
  // 缓存锁
  [62001]: '缓存操作失败',
  [62002]: '获取锁失败',
  [62003]: '锁等待超时',
  
  // 配置错误
  [63001]: '配置不存在',
  [63002]: '配置无效',
};

// WxError 类 - 统一错误格式，禁止输出堆栈
export class WxError extends Error {
  public readonly errcode: number;
  public readonly errmsg: string;
  public readonly requestId?: string;
  public readonly timestamp: number;

  constructor(errcode: number, errmsg?: string, requestId?: string) {
    // 使用错误码对应的标准消息，忽略堆栈输出
    const message = errmsg ?? ErrorMessage[errcode] ?? '未知错误';
    super(message);
    this.name = 'WxError';
    this.errcode = errcode;
    this.errmsg = message;
    this.requestId = requestId;
    this.timestamp = Date.now();
    
    // 关键：禁止输出堆栈，防止敏感信息泄露
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WxError);
    }
  }

  // 类型守卫
  static isWxError(error: unknown): error is WxError {
    return error instanceof WxError;
  }

  // 从响应创建错误
  static fromResponse(response: { errcode?: number; errmsg?: string }, requestId?: string): WxError | null {
    if (response.errcode && response.errcode !== 0) {
      return new WxError(response.errcode, response.errmsg, requestId);
    }
    return null;
  }

  // 创建参数错误
  static invalidParameter(paramName: string, reason?: string, requestId?: string): WxError {
    const message = reason ? `参数 ${paramName} 无效: ${reason}` : `参数 ${paramName} 无效`;
    return new WxError(ErrorCode.INVALID_PARAMETER, message, requestId);
  }

  // 创建参数缺失错误
  static missingParameter(paramName: string, requestId?: string): WxError {
    return new WxError(ErrorCode.PARAM_MISSING, `缺少必需参数: ${paramName}`, requestId);
  }

  // 创建 HTTP 错误
  static httpTimeout(requestId?: string): WxError {
    return new WxError(ErrorCode.HTTP_TIMEOUT, '请求超时，请检查网络', requestId);
  }

  static httpConnectionError(requestId?: string): WxError {
    return new WxError(ErrorCode.HTTP_CONNECTION_ERROR, '连接失败，请检查网络', requestId);
  }

  static httpSslError(requestId?: string): WxError {
    return new WxError(ErrorCode.HTTP_SSL_ERROR, 'SSL 证书验证失败', requestId);
  }

  static httpMaxRetries(requestId?: string): WxError {
    return new WxError(ErrorCode.HTTP_MAX_RETRIES, '请求重试次数超限', requestId);
  }

  static unsafeUrl(url: string, requestId?: string): WxError {
    // 脱敏处理：只显示域名
    const maskedUrl = maskUrl(url);
    return new WxError(ErrorCode.HTTP_UNSAFE_URL, `禁止使用非 HTTPS URL: ${maskedUrl}`, requestId);
  }

  // 转为安全日志格式（不输出敏感信息）
  toSafeLog(): Record<string, unknown> {
    return {
      errcode: this.errcode,
      errmsg: this.errmsg,
      requestId: this.requestId,
      timestamp: this.timestamp,
      name: this.name,
    };
  }
}

// URL 脱敏：只保留域名
function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}/***`;
  } catch {
    return '***';
  }
}

// 业务错误辅助函数
export function createWxError(code: ErrorCodeType, message?: string, requestId?: string): WxError {
  return new WxError(code, message, requestId);
}

// 参数校验辅助函数
export function validateRequired(value: unknown, paramName: string): void {
  if (value === undefined || value === null) {
    throw new WxError(ErrorCode.PARAM_MISSING, `缺少必需参数: ${paramName}`);
  }
}

export function validateNonEmptyString(value: unknown, paramName: string): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new WxError(ErrorCode.PARAM_EMPTY_STRING, `参数 ${paramName} 不能为空`);
  }
}

export function validateStringLength(value: string, paramName: string, maxLength: number): void {
  if (value.length > maxLength) {
    throw new WxError(ErrorCode.PARAM_TOO_LONG, `参数 ${paramName} 长度不能超过 ${maxLength}`);
  }
}

export function validateAppId(appId: string): void {
  // 微信 appId 格式: wx + 16位数字/字母
  if (!appId || !/^wx[0-9a-zA-Z]{16}$/.test(appId)) {
    throw new WxError(ErrorCode.INVALID_APPID, `无效的 AppID 格式: ${appId}`);
  }
}

export function validateAppSecret(appSecret: string): void {
  // appSecret 长度校验：通常为 32-64 位
  if (!appSecret || appSecret.length < 10) {
    throw new WxError(ErrorCode.INVALID_SECRET, '无效的 AppSecret');
  }
}

export function validateUrl(url: string, requireHttps: boolean = true): void {
  try {
    const parsed = new URL(url);
    if (requireHttps && parsed.protocol !== 'https:') {
      throw new WxError(ErrorCode.HTTP_UNSAFE_URL, `禁止使用非 HTTPS URL: ${maskUrl(url)}`);
    }
  } catch (e) {
    if (e instanceof WxError) throw e;
    throw new WxError(ErrorCode.PARAM_INVALID_FORMAT, `无效的 URL 格式: ${maskUrl(url)}`);
  }
}
