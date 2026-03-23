import { LoginAPI, DecryptAPI } from './login';
import { MessageAPI, SubscribeTemplateAPI } from './message';
import { CloudAPI, SecurityAPI } from './cloud';
import { QrCodeAPI, NearbyAPI, PluginAPI, UrlSchemeAPI, UrlLinkAPI, ShortLinkAPI } from './qrcode';
import { DeliveryAPI, InstantDeliveryAPI } from './delivery';
import type { TokenManager } from '../token';
import type { WxResponse, MiniProgramConfig } from '../types';

export class WeChatMP {
  private config: MiniProgramConfig;
  private tokenManager: TokenManager;
  private decryptAPI: DecryptAPI;

  public login: LoginAPI;
  public message: MessageAPI;
  public subscribeTemplate: SubscribeTemplateAPI;
  public cloud: CloudAPI;
  public security: SecurityAPI;
  public qrcode: QrCodeAPI;
  public nearby: NearbyAPI;
  public plugin: PluginAPI;
  public urlScheme: UrlSchemeAPI;
  public urlLink: UrlLinkAPI;
  public shortLink: ShortLinkAPI;
  public delivery: DeliveryAPI;
  public instantDelivery: InstantDeliveryAPI;

  constructor(
    config: MiniProgramConfig,
    tokenManager: TokenManager
  ) {
    this.config = config;
    this.tokenManager = tokenManager;
    this.decryptAPI = new DecryptAPI(config.appId);

    this.login = new LoginAPI(tokenManager);
    this.message = new MessageAPI(tokenManager);
    this.subscribeTemplate = new SubscribeTemplateAPI(tokenManager);
    this.cloud = new CloudAPI(tokenManager);
    this.security = new SecurityAPI(tokenManager);
    this.qrcode = new QrCodeAPI(tokenManager);
    this.nearby = new NearbyAPI(tokenManager);
    this.plugin = new PluginAPI(tokenManager);
    this.urlScheme = new UrlSchemeAPI(tokenManager);
    this.urlLink = new UrlLinkAPI(tokenManager);
    this.shortLink = new ShortLinkAPI(tokenManager);
    this.delivery = new DeliveryAPI(tokenManager);
    this.instantDelivery = new InstantDeliveryAPI(tokenManager);
  }

  get appId(): string {
    return this.config.appId;
  }

  get appSecret(): string {
    return this.config.appSecret;
  }

  async getAccessToken(forceRefresh: boolean = false): Promise<WxResponse<{ accessToken: string; expiresIn: number }>> {
    const result = await this.tokenManager.getAccessToken(this.config.appId, this.config.appSecret, forceRefresh);
    
    if (result.err) {
      return { err: result.err, data: null as unknown as { accessToken: string; expiresIn: number } };
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

  async code2Session(jsCode: string): Promise<WxResponse<{
    openid: string;
    sessionKey: string;
    unionid?: string;
  }>> {
    return this.login.code2Session(this.config.appId, this.config.appSecret, jsCode);
  }

  decryptData(sessionKey: string, encryptedData: string, iv: string): unknown {
    return this.decryptAPI.decryptData(sessionKey, encryptedData, iv);
  }

  getUserInfo(sessionKey: string, encryptedData: string, iv: string): ReturnType<DecryptAPI['getUserInfo']> {
    return this.decryptAPI.getUserInfo(sessionKey, encryptedData, iv);
  }

  getPhoneNumber(sessionKey: string, encryptedData: string, iv: string): ReturnType<DecryptAPI['getPhoneNumber']> {
    return this.decryptAPI.getPhoneNumber(sessionKey, encryptedData, iv);
  }

  async sendSubscribeMessage(message: {
    touser: string;
    template_id: string;
    page?: string;
    data: Record<string, { value: string }>;
    miniprogram_state?: 'developer' | 'trial' | 'formal';
    lang?: 'zh_CN' | 'zh_TW' | 'en';
  }): Promise<WxResponse<null>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.err) {
      return { err: tokenResult.err, data: null };
    }

    const result = await this.message.sendSubscribeMessage(tokenResult.data?.accessToken ?? '', message);
    return { err: result.err, data: null };
  }

  async sendUniformMessage(message: {
    touser: string;
    mp_template_msg?: {
      appid: string;
      template_id: string;
      url?: string;
      miniprogram?: { appid: string; pagepath?: string };
      data: Record<string, { value: string; color?: string }>;
    };
    weapp_template_msg?: {
      template_id: string;
      page?: string;
      form_id: string;
      data: Record<string, { value: string; color?: string }>;
      emphasis_keyword?: string;
    };
  }): Promise<WxResponse<null>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.err) {
      return { err: tokenResult.err, data: null };
    }

    const result = await this.message.sendUniformMessage(tokenResult.data?.accessToken ?? '', message);
    return { err: result.err, data: null };
  }

  async imgSecCheck(media: Buffer): Promise<WxResponse<null>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.err) {
      return { err: tokenResult.err, data: null };
    }

    const result = await this.security.imgSecCheck(tokenResult.data?.accessToken ?? '', media);
    return { err: result.err, data: null };
  }

  async msgSecCheck(content: string, openid?: string, scene?: number): Promise<WxResponse<{ suggest: string; label: number }>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.err) {
      return { err: tokenResult.err, data: { suggest: '', label: 0 } };
    }

    const result = await this.security.msgSecCheck(tokenResult.data?.accessToken ?? '', content, openid, scene);
    if (result.err) {
      return { err: result.err, data: { suggest: '', label: 0 } };
    }

    return { err: null, data: result.data.result };
  }

  async getQrCode(options: {
    path?: string;
    scene?: string;
    width?: number;
    auto_color?: boolean;
    line_color?: { r: number; g: number; b: number };
    is_hyaline?: boolean;
    env_version?: 'release' | 'trial' | 'develop';
  }): Promise<WxResponse<Buffer>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.err) {
      return { err: tokenResult.err, data: Buffer.alloc(0) };
    }

    return this.qrcode.get(tokenResult.data?.accessToken ?? '', options);
  }

  async getUnlimitedQrCode(options: {
    scene: string;
    page?: string;
    width?: number;
    auto_color?: boolean;
    line_color?: { r: number; g: number; b: number };
    is_hyaline?: boolean;
    env_version?: 'release' | 'trial' | 'develop';
  }): Promise<WxResponse<Buffer>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.err) {
      return { err: tokenResult.err, data: Buffer.alloc(0) };
    }

    return this.qrcode.getUnlimited(tokenResult.data?.accessToken ?? '', options);
  }

  async generateUrlScheme(options: {
    jump_wxa?: {
      path?: string;
      query?: string;
      env_version?: 'release' | 'trial' | 'develop';
    };
    is_expire?: boolean;
    expire_type?: number;
    expire_time?: number;
    expire_interval?: number;
  }): Promise<WxResponse<string>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.err) {
      return { err: tokenResult.err, data: '' };
    }

    const result = await this.urlScheme.generate(tokenResult.data?.accessToken ?? '', options);
    if (result.err) {
      return { err: result.err, data: '' };
    }

    return { err: null, data: result.data.openlink };
  }

  async generateUrlLink(options: {
    path?: string;
    query?: string;
    expire_type?: number;
    expire_time?: number;
    expire_interval?: number;
    env_version?: 'release' | 'trial' | 'develop';
  }): Promise<WxResponse<string>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.err) {
      return { err: tokenResult.err, data: '' };
    }

    const result = await this.urlLink.generate(tokenResult.data?.accessToken ?? '', options);
    if (result.err) {
      return { err: result.err, data: '' };
    }

    return { err: null, data: result.data.url_link };
  }

  async invokeCloudFunction(env: string, name: string, data: unknown): Promise<WxResponse<unknown>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.err) {
      return { err: tokenResult.err, data: null };
    }

    const result = await this.cloud.invokeFunction(tokenResult.data?.accessToken ?? '', env, name, data);
    if (result.err) {
      return { err: result.err, data: null };
    }

    return { err: null, data: result.data.resp_data };
  }
}

export { LoginAPI, DecryptAPI, MessageAPI, SubscribeTemplateAPI, CloudAPI, SecurityAPI, QrCodeAPI, NearbyAPI, PluginAPI, UrlSchemeAPI, UrlLinkAPI, ShortLinkAPI, DeliveryAPI, InstantDeliveryAPI };
