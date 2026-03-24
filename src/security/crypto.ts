import * as crypto from 'crypto';
import { WxError, ErrorCode } from '../types/error';

/**
 * 微信加解密工具
 * 补充入参校验和统一错误处理
 */

/**
 * 微信公众号消息加解密类
 */
export class WxCrypto {
  private readonly appId: string;
  private readonly token: string;
  private readonly key: Buffer;
  private readonly iv: Buffer;

  constructor(appId: string, token: string, encodingAESKey: string) {
    // 入参校验
    if (!appId || !/^wx[0-9a-zA-Z]{16}$/.test(appId)) {
      throw new WxError(ErrorCode.INVALID_APPID, '无效的 AppID');
    }
    if (!token || token.trim() === '') {
      throw new WxError(ErrorCode.PARAM_EMPTY_STRING, 'token 不能为空');
    }
    if (!encodingAESKey || encodingAESKey.length !== 43) {
      throw new WxError(ErrorCode.ENCODING_AES_KEY_ERROR, 'EncodingAESKey 长度必须为 43 位');
    }

    this.appId = appId;
    this.token = token;
    
    // AES Key 必须是 32 字节 (256 bits)
    try {
      this.key = Buffer.from(encodingAESKey + '=', 'base64');
      if (this.key.length !== 32) {
        throw new WxError(ErrorCode.ENCODING_AES_KEY_ERROR, 'EncodingAESKey 解码后长度必须为 32 字节');
      }
    } catch (e) {
      if (e instanceof WxError) throw e;
      throw new WxError(ErrorCode.ENCODING_AES_KEY_ERROR, 'EncodingAESKey 格式错误');
    }
    
    this.iv = this.key.slice(0, 16);
  }

  /**
   * 加密消息
   * @param message - 待加密消息（XML 格式）
   */
  encrypt(message: string): string {
    if (!message || message.trim() === '') {
      throw new WxError(ErrorCode.PARAM_EMPTY_STRING, '待加密消息不能为空');
    }

    const random = crypto.randomBytes(16);
    const msgLen = Buffer.alloc(4);
    msgLen.writeUInt32BE(Buffer.byteLength(message), 0);
    
    const msgBuffer = Buffer.from(message, 'utf8');
    const appIdBuffer = Buffer.from(this.appId);
    
    const content = Buffer.concat([random, msgLen, msgBuffer, appIdBuffer]);
    
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, this.iv);
    cipher.setAutoPadding(true);
    
    const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);
    
    return encrypted.toString('base64');
  }

  /**
   * 解密消息
   * @param encrypted - 加密的密文
   */
  decrypt(encrypted: string): string {
    if (!encrypted || encrypted.trim() === '') {
      throw new WxError(ErrorCode.PARAM_EMPTY_STRING, '待解密消息不能为空');
    }

    let encryptedBuffer: Buffer;
    try {
      encryptedBuffer = Buffer.from(encrypted, 'base64');
    } catch {
      throw new WxError(ErrorCode.DECRYPT_ERROR, '密文格式错误');
    }
    
    if (encryptedBuffer.length < 32) {
      throw new WxError(ErrorCode.DECRYPT_ERROR, '密文长度不足');
    }
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, this.iv);
    decipher.setAutoPadding(true);
    
    let decrypted: Buffer;
    try {
      decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    } catch {
      throw new WxError(ErrorCode.DECRYPT_ERROR, '解密失败：密钥不匹配');
    }
    
    const content = decrypted.slice(16);
    const msgLen = content.readUInt32BE(0);
    
    if (msgLen < 0 || msgLen > content.length) {
      throw new WxError(ErrorCode.DECRYPT_ERROR, '消息长度异常');
    }
    
    const message = content.slice(4, 4 + msgLen).toString('utf8');
    const fromAppId = content.slice(4 + msgLen).toString('utf8');
    
    if (fromAppId !== this.appId) {
      throw new WxError(ErrorCode.DECRYPT_ERROR, 'AppId 不匹配');
    }
    
    return message;
  }

  /**
   * 生成签名
   */
  generateSignature(timestamp: string, nonce: string, encrypted?: string): string {
    if (!timestamp || timestamp.trim() === '') {
      throw new WxError(ErrorCode.PARAM_EMPTY_STRING, 'timestamp 不能为空');
    }
    if (!nonce || nonce.trim() === '') {
      throw new WxError(ErrorCode.PARAM_EMPTY_STRING, 'nonce 不能为空');
    }

    const arr = [this.token, timestamp, nonce];
    if (encrypted) {
      arr.push(encrypted);
    }
    arr.sort();
    
    const str = arr.join('');
    return crypto.createHash('sha1').update(str).digest('hex');
  }

  /**
   * 验证签名
   */
  verifySignature(signature: string, timestamp: string, nonce: string, encrypted?: string): boolean {
    if (!signature || signature.trim() === '') {
      return false;
    }
    
    try {
      const expected = this.generateSignature(timestamp, nonce, encrypted);
      // 使用 timingSafeEqual 防止时序攻击
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  /**
   * 加密消息并生成签名
   */
  encryptMessage(message: string, timestamp: string, nonce: string): {
    Encrypt: string;
    MsgSignature: string;
    TimeStamp: string;
    Nonce: string;
  } {
    const encrypted = this.encrypt(message);
    const msgSignature = this.generateSignature(timestamp, nonce, encrypted);
    
    return {
      Encrypt: encrypted,
      MsgSignature: msgSignature,
      TimeStamp: timestamp,
      Nonce: nonce,
    };
  }

  /**
   * 验证并解密消息
   */
  decryptMessage(encrypted: string, msgSignature: string, timestamp: string, nonce: string): string {
    if (!msgSignature || msgSignature.trim() === '') {
      throw new WxError(ErrorCode.PARAM_MISSING, 'MsgSignature 不能为空');
    }
    
    if (!this.verifySignature(msgSignature, timestamp, nonce, encrypted)) {
      throw new WxError(ErrorCode.SIGNATURE_ERROR, '签名验证失败');
    }
    
    return this.decrypt(encrypted);
  }
}

/**
 * SHA1 哈希
 */
export function sha1(data: string): string {
  if (typeof data !== 'string') {
    throw new WxError(ErrorCode.INVALID_PARAMETER, 'SHA1 输入必须是字符串');
  }
  return crypto.createHash('sha1').update(data).digest('hex');
}

/**
 * SHA256 哈希
 */
export function sha256(data: string): string {
  if (typeof data !== 'string') {
    throw new WxError(ErrorCode.INVALID_PARAMETER, 'SHA256 输入必须是字符串');
  }
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * HMAC-SHA256
 */
export function hmacSha256(data: string, key: string): string {
  if (typeof data !== 'string') {
    throw new WxError(ErrorCode.INVALID_PARAMETER, 'HMAC 输入必须是字符串');
  }
  if (typeof key !== 'string') {
    throw new WxError(ErrorCode.INVALID_PARAMETER, 'HMAC 密钥必须是字符串');
  }
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

/**
 * MD5 哈希
 */
export function md5(data: string): string {
  if (typeof data !== 'string') {
    throw new WxError(ErrorCode.INVALID_PARAMETER, 'MD5 输入必须是字符串');
  }
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * 验证微信服务器签名（GET 请求）
 * 用于验证服务器配置
 */
export function verifyWeChatSignature(params: {
  signature: string;
  timestamp: string;
  nonce: string;
  token: string;
  echostr?: string;
}): boolean {
  const { signature, timestamp, nonce, token } = params;
  
  if (!signature || !timestamp || !nonce || !token) {
    return false;
  }
  
  const arr = [token, timestamp, nonce].sort();
  const str = arr.join('');
  const expected = sha1(str);
  
  // 使用 timingSafeEqual 防止时序攻击
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * 验证消息签名（POST 请求）
 */
export function verifyMessageSignature(params: {
  signature: string;
  timestamp: string;
  nonce: string;
  token: string;
  encrypted?: string;
}): boolean {
  const { signature, timestamp, nonce, token, encrypted } = params;
  
  if (!signature || !timestamp || !nonce || !token) {
    return false;
  }
  
  const arr = [token, timestamp, nonce];
  if (encrypted) {
    arr.push(encrypted);
  }
  arr.sort();
  
  const str = arr.join('');
  const expected = sha1(str);
  
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * 创建 WxCrypto 实例（工厂函数）
 */
export function createWxCrypto(appId: string, token: string, encodingAESKey: string): WxCrypto {
  return new WxCrypto(appId, token, encodingAESKey);
}
