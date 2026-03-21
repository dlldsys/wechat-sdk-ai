import * as crypto from 'crypto';
import type { WxResponse, WxBaseResponse } from '../types';
import type { TokenManager } from '../token';
import { WxError } from '../types';

export class LoginAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async code2Session(appId: string, appSecret: string, jsCode: string): Promise<WxResponse<{
    openid: string;
    sessionKey: string;
    unionid?: string;
  }>> {
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
        err: new WxError(data.errcode ?? -1, data.errmsg ?? 'code2Session failed'),
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

  async checkSessionKey(accessToken: string, openid: string, sessionKey: string): Promise<WxResponse<{ valid: boolean }>> {
    const url = `https://api.weixin.qq.com/wxa/checksession?access_token=${accessToken}&signature=${sessionKey}&openid=${openid}&sig_method=hmac_sha256`;
    const result = await this.http.get<WxBaseResponse>(url);
    
    if (result.err) {
      return { err: result.err, data: { valid: false } };
    }
    
    return { err: null, data: { valid: result.data.errcode === 0 } };
  }

  async resetUserSessionKey(accessToken: string, openid: string): Promise<WxResponse<null>> {
    const url = `https://api.weixin.qq.com/wxa/resetusersessionkey?access_token=${accessToken}`;
    const result = await this.http.postJson<WxBaseResponse>(url, { openid });
    return { err: result.err, data: null };
  }
}

export class DecryptAPI {
  private appId: string;

  constructor(appId: string) {
    this.appId = appId;
  }

  decryptData(sessionKey: string, encryptedData: string, iv: string): unknown {
    const sessionKeyBuffer = Buffer.from(sessionKey, 'base64');
    const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');

    const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer);
    decipher.setAutoPadding(true);

    const decrypted = Buffer.concat([
      decipher.update(encryptedDataBuffer),
      decipher.final(),
    ]);

    const decoded = JSON.parse(decrypted.toString('utf8'));

    if (decoded.watermark.appid !== this.appId) {
      throw new Error('AppId mismatch');
    }

    return decoded;
  }

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
    return this.decryptData(sessionKey, encryptedData, iv) as ReturnType<typeof this.getUserInfo>;
  }

  getPhoneNumber(sessionKey: string, encryptedData: string, iv: string): {
    phoneNumber: string;
    purePhoneNumber: string;
    countryCode: string;
    watermark: { timestamp: number; appid: string };
  } {
    return this.decryptData(sessionKey, encryptedData, iv) as ReturnType<typeof this.getPhoneNumber>;
  }

  getRunData(sessionKey: string, encryptedData: string, iv: string): {
    stepInfoList: Array<{
      timestamp: number;
      step: number;
    }>;
    watermark: { timestamp: number; appid: string };
  } {
    return this.decryptData(sessionKey, encryptedData, iv) as ReturnType<typeof this.getRunData>;
  }

  getShareInfo(sessionKey: string, encryptedData: string, iv: string): {
    openGId: string;
    watermark: { timestamp: number; appid: string };
  } {
    return this.decryptData(sessionKey, encryptedData, iv) as ReturnType<typeof this.getShareInfo>;
  }
}
