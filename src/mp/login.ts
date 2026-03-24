import * as crypto from 'crypto';
import type { WxResponse, WxBaseResponse } from '../types';
import type { TokenManager } from '../token';
import { WxError, ErrorCode } from '../types/error';

/**
 * 小程序登录 API
 * 补充入参校验和错误处理
 */
export class LoginAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  /**
   * code2Session - 通过 code 获取 session
   * @param appId - 应用ID
   * @param appSecret - 应用密钥
   * @param jsCode - 登录时获取的 code
   */
  async code2Session(appId: string, appSecret: string, jsCode: string): Promise<WxResponse<{
    openid: string;
    sessionKey: string;
    unionid?: string;
  }>> {
    // 入参校验
    if (!appId || !/^wx[0-9a-zA-Z]{16}$/.test(appId)) {
      return { 
        err: new WxError(ErrorCode.INVALID_APPID, '无效的 AppID'), 
        data: { openid: '', sessionKey: '' }
      };
    }
    if (!appSecret || appSecret.length < 10) {
      return { 
        err: new WxError(ErrorCode.INVALID_SECRET, '无效的 AppSecret'), 
        data: { openid: '', sessionKey: '' }
      };
    }
    if (!jsCode || jsCode.trim() === '') {
      return { 
        err: new WxError(ErrorCode.PARAM_EMPTY_STRING, 'jsCode 不能为空'), 
        data: { openid: '', sessionKey: '' }
      };
    }
    
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${jsCode}&grant_type=authorization_code`;
    const result = await this.http.get<{
      openid?: string;
      session_key?: string;
      unionid?: string;
      errcode?: number;
      errmsg?: string;
    }>(url);

    if (result.err) {
      return { err: result.err, data: { openid: '', sessionKey: '' } };
    }

    const data = result.data;
    if (!data.openid) {
      return {
        err: new WxError(data.errcode ?? ErrorCode.SYSTEM_ERROR, data.errmsg ?? 'code2Session 失败'),
        data: { openid: '', sessionKey: '' },
      };
    }

    return {
      err: null,
      data: {
        openid: data.openid,
        sessionKey: data.session_key ?? '',
        unionid: data.unionid,
      },
    };
  }

  /**
   * 检查 SessionKey 有效性
   * @param accessToken - access_token
   * @param openid - 用户 openid
   * @param sessionKey - session_key
   */
  async checkSessionKey(accessToken: string, openid: string, sessionKey: string): Promise<WxResponse<{ valid: boolean }>> {
    // 入参校验
    if (!accessToken || accessToken.trim() === '') {
      return { 
        err: new WxError(ErrorCode.ACCESS_TOKEN_MISSING, 'accessToken 不能为空'), 
        data: { valid: false }
      };
    }
    if (!openid || openid.trim() === '') {
      return { 
        err: new WxError(ErrorCode.INVALID_OPENID, 'openid 不能为空'), 
        data: { valid: false }
      };
    }
    if (!sessionKey || sessionKey.trim() === '') {
      return { 
        err: new WxError(ErrorCode.PARAM_EMPTY_STRING, 'sessionKey 不能为空'), 
        data: { valid: false }
      };
    }

    const url = `https://api.weixin.qq.com/wxa/checksession?access_token=${accessToken}&signature=${sessionKey}&openid=${openid}&sig_method=hmac_sha256`;
    const result = await this.http.get<WxBaseResponse>(url);
    
    if (result.err) {
      return { err: result.err, data: { valid: false } };
    }
    
    return { err: null, data: { valid: result.data.errcode === 0 } };
  }

  /**
   * 重置用户 session_key
   * @param accessToken - access_token
   * @param openid - 用户 openid
   */
  async resetUserSessionKey(accessToken: string, openid: string): Promise<WxResponse<null>> {
    // 入参校验
    if (!accessToken || accessToken.trim() === '') {
      return { 
        err: new WxError(ErrorCode.ACCESS_TOKEN_MISSING, 'accessToken 不能为空'), 
        data: null
      };
    }
    if (!openid || openid.trim() === '') {
      return { 
        err: new WxError(ErrorCode.INVALID_OPENID, 'openid 不能为空'), 
        data: null
      };
    }

    const url = `https://api.weixin.qq.com/wxa/resetusersessionkey?access_token=${accessToken}`;
    const result = await this.http.postJson<WxBaseResponse>(url, { openid });
    return { err: result.err, data: null };
  }
}

/**
 * 数据解密 API
 * 补充入参校验和错误处理
 */
export class DecryptAPI {
  private readonly appId: string;

  constructor(appId: string) {
    // 入参校验
    if (!appId || !/^wx[0-9a-zA-Z]{16}$/.test(appId)) {
      throw new WxError(ErrorCode.INVALID_APPID, '无效的 AppID');
    }
    this.appId = appId;
  }

  /**
   * 解密用户数据
   * @param sessionKey - session_key
   * @param encryptedData - 加密数据
   * @param iv - 初始向量
   */
  decryptData(sessionKey: string, encryptedData: string, iv: string): unknown {
    // 入参校验
    if (!sessionKey || sessionKey.trim() === '') {
      throw new WxError(ErrorCode.PARAM_EMPTY_STRING, 'sessionKey 不能为空');
    }
    if (!encryptedData || encryptedData.trim() === '') {
      throw new WxError(ErrorCode.PARAM_EMPTY_STRING, 'encryptedData 不能为空');
    }
    if (!iv || iv.trim() === '') {
      throw new WxError(ErrorCode.PARAM_EMPTY_STRING, 'iv 不能为空');
    }

    // 校验 base64 格式
    try {
      const sessionKeyBuffer = Buffer.from(sessionKey, 'base64');
      const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
      const ivBuffer = Buffer.from(iv, 'base64');

      // 校验长度
      if (sessionKeyBuffer.length !== 16) {
        throw new WxError(ErrorCode.PARAM_INVALID_FORMAT, 'sessionKey 长度必须为 16 字节');
      }
      if (ivBuffer.length !== 16) {
        throw new WxError(ErrorCode.PARAM_INVALID_FORMAT, 'iv 长度必须为 16 字节');
      }

      const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer);
      decipher.setAutoPadding(true);

      const decrypted = Buffer.concat([
        decipher.update(encryptedDataBuffer),
        decipher.final(),
      ]);

      const decoded = JSON.parse(decrypted.toString('utf8'));

      // 校验 watermark
      if (!decoded.watermark || decoded.watermark.appid !== this.appId) {
        throw new WxError(ErrorCode.DECRYPT_ERROR, '数据来源无效：AppId 不匹配');
      }

      return decoded;
    } catch (e) {
      if (e instanceof WxError) throw e;
      throw new WxError(ErrorCode.DECRYPT_ERROR, '解密失败：数据格式错误或密钥不匹配');
    }
  }

  /**
   * 解密用户信息
   */
  getUserInfo(sessionKey: string, encryptedData: string, iv: string): {
    openId: string;
    unionId?: string;
    nickName?: string;
    gender?: number;
    city?: string;
    province?: string;
    country?: string;
    avatarUrl?: string;
    watermark: { timestamp: number; appid: string };
  } {
    return this.decryptData(sessionKey, encryptedData, iv) as {
      openId: string;
      unionId?: string;
      nickName?: string;
      gender?: number;
      city?: string;
      province?: string;
      country?: string;
      avatarUrl?: string;
      watermark: { timestamp: number; appid: string };
    };
  }

  /**
   * 解密手机号
   */
  getPhoneNumber(sessionKey: string, encryptedData: string, iv: string): {
    phoneNumber: string;
    purePhoneNumber: string;
    countryCode: string;
    watermark: { timestamp: number; appid: string };
  } {
    return this.decryptData(sessionKey, encryptedData, iv) as {
      phoneNumber: string;
      purePhoneNumber: string;
      countryCode: string;
      watermark: { timestamp: number; appid: string };
    };
  }

  /**
   * 解密运动数据
   */
  getRunData(sessionKey: string, encryptedData: string, iv: string): {
    stepInfoList: Array<{
      timestamp: number;
      step: number;
    }>;
    watermark: { timestamp: number; appid: string };
  } {
    return this.decryptData(sessionKey, encryptedData, iv) as {
      stepInfoList: Array<{
        timestamp: number;
        step: number;
      }>;
      watermark: { timestamp: number; appid: string };
    };
  }

  /**
   * 解密群信息
   */
  getShareInfo(sessionKey: string, encryptedData: string, iv: string): {
    openGId: string;
    watermark: { timestamp: number; appid: string };
  } {
    return this.decryptData(sessionKey, encryptedData, iv) as {
      openGId: string;
      watermark: { timestamp: number; appid: string };
    };
  }
}
