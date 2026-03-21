import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WxError, ErrorCode, ErrorMessage } from '../src/types/error';

describe('WxError', () => {
  it('should create WxError with correct properties', () => {
    const error = new WxError(40001, 'Invalid AppSecret');
    
    expect(error.errcode).toBe(40001);
    expect(error.errmsg).toBe('Invalid AppSecret');
    expect(error.name).toBe('WxError');
    expect(error.message).toBe('[40001] Invalid AppSecret');
  });

  it('should create WxError with requestId', () => {
    const error = new WxError(40001, 'Invalid AppSecret', 'req-123');
    
    expect(error.requestId).toBe('req-123');
  });

  it('should check if error is WxError', () => {
    const wxError = new WxError(40001, 'Test');
    const normalError = new Error('Test');
    
    expect(WxError.isWxError(wxError)).toBe(true);
    expect(WxError.isWxError(normalError)).toBe(false);
  });

  it('should create WxError from response', () => {
    const response = { errcode: 40001, errmsg: 'Invalid AppSecret' };
    const error = WxError.fromResponse(response, 'req-123');
    
    expect(error).not.toBeNull();
    expect(error!.errcode).toBe(40001);
    expect(error!.errmsg).toBe('Invalid AppSecret');
    expect(error!.requestId).toBe('req-123');
  });

  it('should return null for successful response', () => {
    const response = { errcode: 0, errmsg: 'ok' };
    const error = WxError.fromResponse(response);
    
    expect(error).toBeNull();
  });

  it('should have correct error codes', () => {
    expect(ErrorCode.OK).toBe(0);
    expect(ErrorCode.SYSTEM_ERROR).toBe(-1);
    expect(ErrorCode.ACCESS_TOKEN_EXPIRED).toBe(42001);
  });

  it('should have error messages', () => {
    expect(ErrorMessage[40001]).toBe('AppSecret 错误或者 AppSecret 不属于这个公众号');
    expect(ErrorMessage[42001]).toBe('access_token 超时');
  });
});
