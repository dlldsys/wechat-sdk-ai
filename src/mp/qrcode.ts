import type { WxResponse, WxBaseResponse } from '../types';
import type { TokenManager } from '../token';

export class QrCodeAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async get(accessToken: string, options: {
    path?: string;
    scene?: string;
    width?: number;
    auto_color?: boolean;
    line_color?: { r: number; g: number; b: number };
    is_hyaline?: boolean;
    env_version?: 'release' | 'trial' | 'develop';
    check_path?: boolean;
  }): Promise<WxResponse<Buffer>> {
    const url = `https://api.weixin.qq.com/wxa/getwxacode?access_token=${accessToken}`;
    return this.http.postJson(url, options);
  }

  async getUnlimited(accessToken: string, options: {
    scene: string;
    page?: string;
    width?: number;
    auto_color?: boolean;
    line_color?: { r: number; g: number; b: number };
    is_hyaline?: boolean;
    env_version?: 'release' | 'trial' | 'develop';
    check_path?: boolean;
  }): Promise<WxResponse<Buffer>> {
    const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`;
    return this.http.postJson(url, options);
  }

  async createQRCode(accessToken: string, path: string, width: number = 430): Promise<WxResponse<Buffer>> {
    const url = `https://api.weixin.qq.com/cgi-bin/wxaapp/createwxaqrcode?access_token=${accessToken}`;
    return this.http.postJson(url, { path, width });
  }
}

export class NearbyAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async add(accessToken: string, poi: {
    related_name: string;
    related_credential: string;
    related_address: string;
    related_proof_material: string;
  }): Promise<WxResponse<{ data: { audit_id: string } }>> {
    const url = `https://api.weixin.qq.com/wxa/addnearbypoi?access_token=${accessToken}`;
    return this.http.postJson(url, poi);
  }

  async delete(accessToken: string, poiId: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/wxa/delnearbypoi?access_token=${accessToken}`;
    return this.http.postJson(url, { poi_id: poiId });
  }

  async getList(accessToken: string, page: number = 1, pageRows: number = 10): Promise<WxResponse<{
    left_apply_num: number;
    max_apply_num: number;
    data: Array<{
      poi_id: string;
      qualification_address: string;
      qualification_num: string;
      audit_id: string;
      audit_status: number;
      display_status: number;
      refuse_reason: string;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/getnearbypoilist?access_token=${accessToken}&page=${page}&page_rows=${pageRows}`;
    return this.http.get(url);
  }

  async setDisplayStatus(accessToken: string, poiId: string, status: number): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/wxa/setnearbypoistatus?access_token=${accessToken}`;
    return this.http.postJson(url, { poi_id: poiId, status });
  }
}

export class PluginAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async apply(accessToken: string, pluginAppId: string, reason?: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/wxa/plugin?access_token=${accessToken}`;
    return this.http.postJson(url, { action: 'apply', plugin_appid: pluginAppId, reason });
  }

  async unbind(accessToken: string, pluginAppId: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/wxa/plugin?access_token=${accessToken}`;
    return this.http.postJson(url, { action: 'unbind', plugin_appid: pluginAppId });
  }

  async getList(accessToken: string, page: number = 1, num: number = 20): Promise<WxResponse<{
    plugin_list: Array<{
      appid: string;
      status: number;
      nickname: string;
      headimgurl: string;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/plugin?access_token=${accessToken}`;
    return this.http.postJson(url, { action: 'list', page, num });
  }

  async update(accessToken: string, pluginAppId: string, userVersion: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/wxa/updateplugin?access_token=${accessToken}`;
    return this.http.postJson(url, { plugin_appid: pluginAppId, user_version: userVersion });
  }

  async getDevPluginList(accessToken: string, page: number = 1, num: number = 20): Promise<WxResponse<{
    apply_list: Array<{
      appid: string;
      status: number;
      nickname: string;
      headimgurl: string;
      reason: string;
      apply_time: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/devplugin?access_token=${accessToken}`;
    return this.http.postJson(url, { action: 'list', page, num });
  }

  async agreeDevPlugin(accessToken: string, appId: string, agree: boolean = true): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/wxa/devplugin?access_token=${accessToken}`;
    return this.http.postJson(url, { action: agree ? 'agree' : 'refuse', appid: appId });
  }
}

export class UrlSchemeAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async generate(accessToken: string, options: {
    jump_wxa?: {
      path?: string;
      query?: string;
      env_version?: 'release' | 'trial' | 'develop';
    };
    is_expire?: boolean;
    expire_type?: number;
    expire_time?: number;
    expire_interval?: number;
  }): Promise<WxResponse<{ openlink: string }>> {
    const url = `https://api.weixin.qq.com/wxa/generatescheme?access_token=${accessToken}`;
    return this.http.postJson(url, options);
  }

  async query(accessToken: string, scheme: string): Promise<WxResponse<{
    scheme_info: {
      appid: string;
      create_time: number;
      expire_time: number;
      jump_wxa: { path: string; query: string };
    };
    visit_openid: string;
  }>> {
    const url = `https://api.weixin.qq.com/wxa/queryscheme?access_token=${accessToken}`;
    return this.http.postJson(url, { scheme });
  }
}

export class UrlLinkAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async generate(accessToken: string, options: {
    path?: string;
    query?: string;
    expire_type?: number;
    expire_time?: number;
    expire_interval?: number;
    env_version?: 'release' | 'trial' | 'develop';
  }): Promise<WxResponse<{ url_link: string }>> {
    const url = `https://api.weixin.qq.com/wxa/generate_urllink?access_token=${accessToken}`;
    return this.http.postJson(url, options);
  }
}

export class ShortLinkAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async generate(accessToken: string, options: {
    page_url: string;
    page_title: string;
    is_expire?: boolean;
    expire_type?: number;
    expire_time?: number;
    expire_interval?: number;
  }): Promise<WxResponse<{ link: string }>> {
    const url = `https://api.weixin.qq.com/wxa/genwxashortlink?access_token=${accessToken}`;
    return this.http.postJson(url, options);
  }
}
