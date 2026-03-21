import type { WxResponse } from '../types';
import type { TokenManager } from '../token';
import { generateSignature, generateNonceStr, generateTimestamp } from '../token';

export class OAuthAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  getAuthorizeUrl(appId: string, redirectUri: string, scope: 'snsapi_base' | 'snsapi_userinfo' = 'snsapi_base', state: string = ''): string {
    const encodedRedirect = encodeURIComponent(redirectUri);
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodedRedirect}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;
  }

  async getAccessToken(appId: string, appSecret: string, code: string): Promise<WxResponse<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    openid: string;
    scope: string;
    unionid?: string;
  }>> {
    const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;
    return this.http.get(url);
  }

  async refreshAccessToken(appId: string, refreshToken: string): Promise<WxResponse<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    openid: string;
    scope: string;
  }>> {
    const url = `https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=${appId}&grant_type=refresh_token&refresh_token=${refreshToken}`;
    return this.http.get(url);
  }

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
    const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openId}&lang=${lang}`;
    return this.http.get(url);
  }

  async checkToken(accessToken: string, openId: string): Promise<WxResponse<{ errcode: number; errmsg: string }>> {
    const url = `https://api.weixin.qq.com/sns/auth?access_token=${accessToken}&openid=${openId}`;
    return this.http.get(url);
  }
}

export class JsApiAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async getTicket(accessToken: string): Promise<WxResponse<{ ticket: string; expires_in: number }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`;
    return this.http.get(url);
  }

  async getCardTicket(accessToken: string): Promise<WxResponse<{ ticket: string; expires_in: number }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=wx_card`;
    return this.http.get(url);
  }

  generateConfig(appId: string, ticket: string, url: string, debug: boolean = false, jsApiList: string[] = []): {
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
    debug: boolean;
    jsApiList: string[];
  } {
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

  async getConfig(appId: string, _appSecret: string, accessToken: string, url: string, debug: boolean = false, jsApiList: string[] = []): Promise<WxResponse<{
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
    debug: boolean;
    jsApiList: string[];
  }>> {
    const ticketResult = await this.tokenManager.getJsApiTicket(appId, accessToken);
    
    if (ticketResult.err) {
      return { err: ticketResult.err, data: null as unknown as ReturnType<typeof this.generateConfig> };
    }
    
    const config = this.generateConfig(appId, ticketResult.data.ticket, url, debug, jsApiList);
    return { err: null, data: config };
  }
}
