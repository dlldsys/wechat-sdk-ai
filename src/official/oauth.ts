import type { WxResponse } from '../types';
import type { TokenManager } from '../token';
import { generateSignature, generateNonceStr, generateTimestamp } from '../token';
import { WxError, ErrorCode } from '../types/error';

/**
 * OAuth API
 * 补充入参校验和 URL 安全校验
 */
export class OAuthAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  /**
   * 获取授权 URL
   * @param appId - 应用ID
   * @param redirectUri - 回调地址（必须 HTTPS）
   * @param scope - 授权作用域
   * @param state - 状态参数
   */
  getAuthorizeUrl(appId: string, redirectUri: string, scope: 'snsapi_base' | 'snsapi_userinfo' = 'snsapi_base', state: string = ''): string {
    // 入参校验
    if (!appId || !/^wx[0-9a-zA-Z]{16}$/.test(appId)) {
      throw new WxError(ErrorCode.INVALID_APPID, '无效的 AppID');
    }
    if (!redirectUri) {
      throw new WxError(ErrorCode.PARAM_MISSING, 'redirectUri 不能为空');
    }
    
    // HTTPS 校验
    try {
      const parsed = new URL(redirectUri);
      if (parsed.protocol !== 'https:') {
        throw new WxError(ErrorCode.HTTP_UNSAFE_URL, 'redirectUri 必须使用 HTTPS');
      }
    } catch (e) {
      if (e instanceof WxError) throw e;
      throw new WxError(ErrorCode.PARAM_INVALID_FORMAT, '无效的 redirectUri 格式');
    }
    
    const encodedRedirect = encodeURIComponent(redirectUri);
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodedRedirect}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;
  }

  /**
   * 通过 code 获取 access_token
   */
  async getAccessToken(appId: string, appSecret: string, code: string): Promise<WxResponse<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    openid: string;
    scope: string;
    unionid?: string;
  }>> {
    // 入参校验
    if (!appId || !/^wx[0-9a-zA-Z]{16}$/.test(appId)) {
      return { 
        err: new WxError(ErrorCode.INVALID_APPID, '无效的 AppID'), 
        data: null as unknown as { access_token: string; expires_in: number; refresh_token: string; openid: string; scope: string; unionid?: string }
      };
    }
    if (!appSecret || appSecret.length < 10) {
      return { 
        err: new WxError(ErrorCode.INVALID_SECRET, '无效的 AppSecret'), 
        data: null as unknown as { access_token: string; expires_in: number; refresh_token: string; openid: string; scope: string; unionid?: string }
      };
    }
    if (!code || code.trim() === '') {
      return { 
        err: new WxError(ErrorCode.PARAM_EMPTY_STRING, 'code 不能为空'), 
        data: null as unknown as { access_token: string; expires_in: number; refresh_token: string; openid: string; scope: string; unionid?: string }
      };
    }

    const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;
    return this.http.get(url);
  }

  /**
   * 刷新 access_token
   */
  async refreshAccessToken(appId: string, refreshToken: string): Promise<WxResponse<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    openid: string;
    scope: string;
  }>> {
    // 入参校验
    if (!appId || !/^wx[0-9a-zA-Z]{16}$/.test(appId)) {
      return { 
        err: new WxError(ErrorCode.INVALID_APPID, '无效的 AppID'), 
        data: null as unknown as { access_token: string; expires_in: number; refresh_token: string; openid: string; scope: string }
      };
    }
    if (!refreshToken || refreshToken.trim() === '') {
      return { 
        err: new WxError(ErrorCode.PARAM_EMPTY_STRING, 'refreshToken 不能为空'), 
        data: null as unknown as { access_token: string; expires_in: number; refresh_token: string; openid: string; scope: string }
      };
    }

    const url = `https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=${appId}&grant_type=refresh_token&refresh_token=${refreshToken}`;
    return this.http.get(url);
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(accessToken: string, openId: string, lang: string = 'zh_CN'): Promise<WxResponse<{
    openid: string;
    nickname: string;
    sex: number;
    province: string;
    city: string;
    country: string;
    headimgurl: string;
    privilege: string[];
    unionid?: string;
  }>> {
    // 入参校验
    if (!accessToken || accessToken.trim() === '') {
      return { 
        err: new WxError(ErrorCode.ACCESS_TOKEN_MISSING, 'accessToken 不能为空'), 
        data: null as unknown as { openid: string; nickname: string; sex: number; province: string; city: string; country: string; headimgurl: string; privilege: string[]; unionid?: string }
      };
    }
    if (!openId || openId.trim() === '') {
      return { 
        err: new WxError(ErrorCode.INVALID_OPENID, 'openId 不能为空'), 
        data: null as unknown as { openid: string; nickname: string; sex: number; province: string; city: string; country: string; headimgurl: string; privilege: string[]; unionid?: string }
      };
    }
    // lang 参数校验
    if (!['zh_CN', 'zh_TW', 'en'].includes(lang)) {
      lang = 'zh_CN';
    }

    const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openId}&lang=${lang}`;
    return this.http.get(url);
  }

  /**
   * 校验 token 有效性
   */
  async checkToken(accessToken: string, openId: string): Promise<WxResponse<{ errcode: number; errmsg: string }>> {
    // 入参校验
    if (!accessToken || accessToken.trim() === '') {
      return { 
        err: new WxError(ErrorCode.ACCESS_TOKEN_MISSING, 'accessToken 不能为空'), 
        data: null as unknown as { errcode: number; errmsg: string }
      };
    }
    if (!openId || openId.trim() === '') {
      return { 
        err: new WxError(ErrorCode.INVALID_OPENID, 'openId 不能为空'), 
        data: null as unknown as { errcode: number; errmsg: string }
      };
    }

    const url = `https://api.weixin.qq.com/sns/auth?access_token=${accessToken}&openid=${openId}`;
    return this.http.get(url);
  }
}

/**
 * JS-SDK API
 * 补充入参校验和 URL 安全校验
 */
export class JsApiAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  /**
   * 获取 JS-SDK Ticket
   */
  async getTicket(accessToken: string): Promise<WxResponse<{ ticket: string; expires_in: number }>> {
    // 入参校验
    if (!accessToken || accessToken.trim() === '') {
      return { 
        err: new WxError(ErrorCode.ACCESS_TOKEN_MISSING, 'accessToken 不能为空'), 
        data: null as unknown as { ticket: string; expires_in: number }
      };
    }

    const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`;
    return this.http.get(url);
  }

  /**
   * 获取卡券 Ticket
   */
  async getCardTicket(accessToken: string): Promise<WxResponse<{ ticket: string; expires_in: number }>> {
    // 入参校验
    if (!accessToken || accessToken.trim() === '') {
      return { 
        err: new WxError(ErrorCode.ACCESS_TOKEN_MISSING, 'accessToken 不能为空'), 
        data: null as unknown as { ticket: string; expires_in: number }
      };
    }

    const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=wx_card`;
    return this.http.get(url);
  }

  /**
   * 生成 JS-SDK 配置
   * @param appId - 应用ID
   * @param ticket - JS-SDK Ticket
   * @param url - 当前网页 URL（必须 HTTPS）
   * @param debug - 是否调试模式
   * @param jsApiList - 需要使用的 JS 接口列表
   */
  generateConfig(appId: string, ticket: string, url: string, debug: boolean = false, jsApiList: string[] = []): {
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
    debug: boolean;
    jsApiList: string[];
  } {
    // 入参校验
    if (!appId || !/^wx[0-9a-zA-Z]{16}$/.test(appId)) {
      throw new WxError(ErrorCode.INVALID_APPID, '无效的 AppID');
    }
    if (!ticket || ticket.trim() === '') {
      throw new WxError(ErrorCode.PARAM_EMPTY_STRING, 'ticket 不能为空');
    }
    if (!url || url.trim() === '') {
      throw new WxError(ErrorCode.PARAM_EMPTY_STRING, 'url 不能为空');
    }
    
    // URL 安全校验：必须 HTTPS
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') {
        throw new WxError(ErrorCode.HTTP_UNSAFE_URL, 'URL 必须使用 HTTPS');
      }
    } catch (e) {
      if (e instanceof WxError) throw e;
      throw new WxError(ErrorCode.PARAM_INVALID_FORMAT, '无效的 URL 格式');
    }
    
    const timestamp = generateTimestamp();
    const nonceStr = generateNonceStr();
    
    const params = {
      jsapi_ticket: ticket,
      noncestr: nonceStr,
      timestamp,
      url,
    };
    
    const signature = generateSignature(params, false);
    
    return {
      appId,
      timestamp,
      nonceStr,
      signature,
      debug,
      jsApiList: jsApiList.length > 0 ? jsApiList : [
        'updateAppMessageShareData',
        'updateTimelineShareData',
        'onMenuShareTimeline',
        'onMenuShareAppMessage',
        'onMenuShareQQ',
        'onMenuShareWeibo',
        'onMenuShareQZone',
        'startRecord',
        'stopRecord',
        'onVoiceRecordEnd',
        'playVoice',
        'pauseVoice',
        'stopVoice',
        'onVoicePlayEnd',
        'uploadVoice',
        'downloadVoice',
        'chooseImage',
        'previewImage',
        'uploadImage',
        'downloadImage',
        'translateVoice',
        'getNetworkType',
        'openLocation',
        'getLocation',
        'hideOptionMenu',
        'showOptionMenu',
        'hideMenuItems',
        'showMenuItems',
        'hideAllNonBaseMenuItem',
        'showAllNonBaseMenuItem',
        'closeWindow',
        'scanQRCode',
        'chooseWXPay',
        'openProductSpecificView',
        'addCard',
        'chooseCard',
        'openCard',
      ],
    };
  }

  /**
   * 获取配置（通过 accessToken）
   */
  async getConfig(appId: string, _appSecret: string, accessToken: string, url: string, debug: boolean = false, jsApiList: string[] = []): Promise<WxResponse<{
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
    debug: boolean;
    jsApiList: string[];
  }>> {
    // 入参校验
    if (!accessToken || accessToken.trim() === '') {
      return { 
        err: new WxError(ErrorCode.ACCESS_TOKEN_MISSING, 'accessToken 不能为空'), 
        data: null as unknown as ReturnType<typeof this.generateConfig>
      };
    }
    if (!url || url.trim() === '') {
      return { 
        err: new WxError(ErrorCode.PARAM_EMPTY_STRING, 'url 不能为空'), 
        data: null as unknown as ReturnType<typeof this.generateConfig>
      };
    }

    const ticketResult = await this.tokenManager.getJsApiTicket(appId, accessToken);
    
    if (ticketResult.err) {
      return { err: ticketResult.err, data: null as unknown as ReturnType<typeof this.generateConfig> };
    }
    
    // 验证 URL
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') {
        return { 
          err: new WxError(ErrorCode.HTTP_UNSAFE_URL, 'URL 必须使用 HTTPS'), 
          data: null as unknown as ReturnType<typeof this.generateConfig>
        };
      }
    } catch {
      return { 
        err: new WxError(ErrorCode.PARAM_INVALID_FORMAT, '无效的 URL 格式'), 
        data: null as unknown as ReturnType<typeof this.generateConfig>
      };
    }
    
    const config = this.generateConfig(appId, ticketResult.data.ticket, url, debug, jsApiList);
    return { err: null, data: config };
  }
}
