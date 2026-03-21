export class WxError extends Error {
  public readonly errcode: number;
  public readonly errmsg: string;
  public readonly requestId?: string;

  constructor(errcode: number, errmsg: string, requestId?: string) {
    super(`[${errcode}] ${errmsg}`);
    this.name = 'WxError';
    this.errcode = errcode;
    this.errmsg = errmsg;
    this.requestId = requestId;
  }

  static isWxError(error: unknown): error is WxError {
    return error instanceof WxError;
  }

  static fromResponse(response: { errcode?: number; errmsg?: string }, requestId?: string): WxError | null {
    if (response.errcode && response.errcode !== 0) {
      return new WxError(response.errcode, response.errmsg || 'Unknown error', requestId);
    }
    return null;
  }
}

export const ErrorCode = {
  OK: 0,
  SYSTEM_ERROR: -1,
  INVALID_APPID: 40001,
  INVALID_SECRET: 40002,
  INVALID_GRANT_TYPE: 40003,
  INVALID_REFRESH_TOKEN: 40030,
  INVALID_OPENID: 40003,
  INVALID_CODE: 40029,
  ACCESS_TOKEN_EXPIRED: 42001,
  ACCESS_TOKEN_INVALID: 40014,
  ACCESS_TOKEN_MISSING: 41001,
  RATE_LIMIT: 45009,
  TOO_MANY_REQUESTS: 45011,
  SIGNATURE_ERROR: 40001,
  ENCODING_AES_KEY_ERROR: 40004,
  ENCRYPT_ERROR: 40005,
  DECRYPT_ERROR: 40006,
} as const;

export const ErrorMessage: Record<number, string> = {
  [-1]: '系统繁忙，此时请开发者稍候再试',
  [40001]: 'AppSecret 错误或者 AppSecret 不属于这个公众号',
  [40002]: '请确保 grant_type 字段值为 client_credential',
  [40003]: '不合法的 OpenID',
  [40014]: '不合法的 access_token',
  [40029]: '不合法的 code',
  [40030]: '不合法的 refresh_token',
  [41001]: '缺少 access_token 参数',
  [42001]: 'access_token 超时',
  [45009]: '接口调用超过限制',
  [45011]: '频率限制',
};
