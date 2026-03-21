import { MenuAPI, KFMessageAPI } from './menu';
import { TemplateMessageAPI, UserAPI, UserTagAPI } from './template';
import { MaterialAPI, MediaAPI } from './material';
import { OAuthAPI, JsApiAPI } from './oauth';
import { BroadcastAPI, SubscribeMessageAPI } from './broadcast';
import { QrCodeAPI, SemanticAPI } from './qrcode';
import type { TokenManager } from '../token';
import type { WxResponse, OfficialAccountConfig } from '../types';

export class WeChatOfficial {
  private config: OfficialAccountConfig;
  private tokenManager: TokenManager;

  public menu: MenuAPI;
  public kf: KFMessageAPI;
  public template: TemplateMessageAPI;
  public user: UserAPI;
  public tag: UserTagAPI;
  public material: MaterialAPI;
  public media: MediaAPI;
  public oauth: OAuthAPI;
  public jsapi: JsApiAPI;
  public broadcast: BroadcastAPI;
  public subscribe: SubscribeMessageAPI;
  public qrcode: QrCodeAPI;
  public semantic: SemanticAPI;

  constructor(
    config: OfficialAccountConfig,
    tokenManager: TokenManager
  ) {
    this.config = config;
    this.tokenManager = tokenManager;

    this.menu = new MenuAPI(tokenManager);
    this.kf = new KFMessageAPI(tokenManager);
    this.template = new TemplateMessageAPI(tokenManager);
    this.user = new UserAPI(tokenManager);
    this.tag = new UserTagAPI(tokenManager);
    this.material = new MaterialAPI(tokenManager);
    this.media = new MediaAPI(tokenManager);
    this.oauth = new OAuthAPI(tokenManager);
    this.jsapi = new JsApiAPI(tokenManager);
    this.broadcast = new BroadcastAPI(tokenManager);
    this.subscribe = new SubscribeMessageAPI(tokenManager);
    this.qrcode = new QrCodeAPI(tokenManager);
    this.semantic = new SemanticAPI(tokenManager);
  }

  get appId(): string {
    return this.config.appId;
  }

  get appSecret(): string {
    return this.config.appSecret;
  }

  get token(): string | undefined {
    return this.config.token;
  }

  get encodingAESKey(): string | undefined {
    return this.config.encodingAESKey;
  }

  async getAccessToken(forceRefresh: boolean = false): Promise<WxResponse<{ accessToken: string; expiresIn: number }>> {
    const result = await this.tokenManager.getAccessToken(this.config.appId, this.config.appSecret, forceRefresh);
    
    if (result.err) {
      return { err: result.err, data: { accessToken: '', expiresIn: 0 } };
    }
    
    return {
      err: null,
      data: {
        accessToken: result.data.accessToken,
        expiresIn: result.data.expiresIn,
      },
    };
  }

  async refreshAccessToken(): Promise<WxResponse<{ accessToken: string; expiresIn: number }>> {
    return this.getAccessToken(true);
  }

  async getJsApiTicket(accessToken: string, forceRefresh: boolean = false): Promise<WxResponse<{ ticket: string; expiresIn: number }>> {
    const result = await this.tokenManager.getJsApiTicket(this.config.appId, accessToken, forceRefresh);
    
    if (result.err) {
      return { err: result.err, data: { ticket: '', expiresIn: 0 } };
    }
    
    return {
      err: null,
      data: {
        ticket: result.data.ticket,
        expiresIn: result.data.expiresIn,
      },
    };
  }

  async getJsApiConfig(url: string, debug: boolean = false, jsApiList?: string[]): Promise<WxResponse<{
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
    debug: boolean;
    jsApiList: string[];
  }>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.err) {
      return { err: tokenResult.err, data: null as unknown as ReturnType<typeof this.jsapi.generateConfig> };
    }

    const ticketResult = await this.getJsApiTicket(tokenResult.data.accessToken);
    if (ticketResult.err) {
      return { err: ticketResult.err, data: null as unknown as ReturnType<typeof this.jsapi.generateConfig> };
    }

    const config = this.jsapi.generateConfig(this.config.appId, ticketResult.data.ticket, url, debug, jsApiList);
    return { err: null, data: config };
  }

  async sendTemplateMessage(message: {
    touser: string;
    template_id: string;
    url?: string;
    miniprogram?: { appid: string; pagepath?: string };
    data: Record<string, { value: string; color?: string }>;
  }): Promise<WxResponse<{ msgid: number }>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.err) {
      return { err: tokenResult.err, data: { msgid: 0 } };
    }

    const result = await this.template.send(tokenResult.data.accessToken, message);
    if (result.err) {
      return { err: result.err, data: { msgid: 0 } };
    }

    return { err: null, data: { msgid: result.data.msgid ?? 0 } };
  }

  async sendKFText(openId: string, content: string, kfAccount?: string): Promise<WxResponse<null>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.err) {
      return { err: tokenResult.err, data: null };
    }

    const result = await this.kf.sendText(tokenResult.data.accessToken, openId, content, kfAccount);
    return { err: result.err, data: null };
  }

  async getUserInfo(openId: string, lang: string = 'zh_CN'): Promise<WxResponse<{
    subscribe: number;
    openid: string;
    nickname?: string;
    sex?: number;
    province?: string;
    city?: string;
    country?: string;
    headimgurl?: string;
    privilege?: string[];
    unionid?: string;
  }>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.err) {
      return { err: tokenResult.err, data: null as unknown as ReturnType<typeof this.user.getUserInfo> extends WxResponse<infer T> ? T : never };
    }

    return this.user.getUserInfo(tokenResult.data.accessToken, openId, lang);
  }

  async createMenu(menu: {
    button: Array<{
      type?: string;
      name: string;
      key?: string;
      url?: string;
      sub_button?: unknown[];
    }>;
  }): Promise<WxResponse<null>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.err) {
      return { err: tokenResult.err, data: null };
    }

    const result = await this.menu.create(tokenResult.data.accessToken, menu);
    return { err: result.err, data: null };
  }

  async deleteMenu(): Promise<WxResponse<null>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.err) {
      return { err: tokenResult.err, data: null };
    }

    const result = await this.menu.delete(tokenResult.data.accessToken);
    return { err: result.err, data: null };
  }

  async getOAuthAccessToken(code: string): Promise<WxResponse<{
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    openid: string;
    scope: string;
    unionid?: string;
  }>> {
    const result = await this.oauth.getAccessToken(this.config.appId, this.config.appSecret, code);
    
    if (result.err) {
      return { err: result.err, data: null as unknown as ReturnType<typeof this.oauth.getAccessToken> extends WxResponse<infer T> ? T : never };
    }

    return {
      err: null,
      data: {
        accessToken: result.data.access_token,
        expiresIn: result.data.expires_in,
        refreshToken: result.data.refresh_token,
        openid: result.data.openid,
        scope: result.data.scope,
        unionid: result.data.unionid,
      },
    };
  }

  getOAuthUrl(redirectUri: string, scope: 'snsapi_base' | 'snsapi_userinfo' = 'snsapi_base', state: string = ''): string {
    return this.oauth.getAuthorizeUrl(this.config.appId, redirectUri, scope, state);
  }
}

export { MenuAPI, KFMessageAPI, TemplateMessageAPI, UserAPI, UserTagAPI, MaterialAPI, MediaAPI, OAuthAPI, JsApiAPI, BroadcastAPI, SubscribeMessageAPI, QrCodeAPI, SemanticAPI };
