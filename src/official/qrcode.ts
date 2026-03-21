import type { WxResponse } from '../types';
import type { TokenManager } from '../token';

export class QrCodeAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async create(accessToken: string, options: {
    expire_seconds?: number;
    action_name: 'QR_SCENE' | 'QR_STR_SCENE' | 'QR_LIMIT_SCENE' | 'QR_LIMIT_STR_SCENE';
    action_info: {
      scene: {
        scene_id?: number;
        scene_str?: string;
      };
    };
  }): Promise<WxResponse<{ ticket: string; expire_seconds?: number; url: string }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`;
    return this.http.postJson(url, options);
  }

  async createTemp(accessToken: string, sceneId: number | string, expireSeconds: number = 604800): Promise<WxResponse<{ ticket: string; expire_seconds: number; url: string }>> {
    const actionName = typeof sceneId === 'number' ? 'QR_SCENE' : 'QR_STR_SCENE';
    const sceneKey = typeof sceneId === 'number' ? 'scene_id' : 'scene_str';
    
    const result = await this.create(accessToken, {
      expire_seconds: expireSeconds,
      action_name: actionName,
      action_info: {
        scene: { [sceneKey]: sceneId },
      },
    });

    return {
      err: result.err,
      data: {
        ticket: result.data.ticket,
        expire_seconds: result.data.expire_seconds ?? expireSeconds,
        url: result.data.url,
      },
    };
  }

  async createLimit(accessToken: string, sceneId: number | string): Promise<WxResponse<{ ticket: string; url: string }>> {
    const actionName = typeof sceneId === 'number' ? 'QR_LIMIT_SCENE' : 'QR_LIMIT_STR_SCENE';
    const sceneKey = typeof sceneId === 'number' ? 'scene_id' : 'scene_str';
    
    return this.create(accessToken, {
      action_name: actionName,
      action_info: {
        scene: { [sceneKey]: sceneId },
      },
    });
  }

  getUrl(ticket: string): string {
    return `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(ticket)}`;
  }

  async showQrCode(_accessToken: string, ticket: string): Promise<WxResponse<Buffer>> {
    const url = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(ticket)}`;
    return this.http.get(url);
  }

  async getShortUrl(accessToken: string, longUrl: string): Promise<WxResponse<{ short_url: string }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/shorturl?access_token=${accessToken}`;
    return this.http.postJson(url, { action: 'long2short', long_url: longUrl });
  }
}

export class SemanticAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async understand(accessToken: string, query: string, category: string, openid?: string, latitude?: number, longitude?: number, city?: string, region?: string): Promise<WxResponse<unknown>> {
    const url = `https://api.weixin.qq.com/semantic/semproxy/search?access_token=${accessToken}`;
    const data: Record<string, unknown> = { query, category, appid: openid };
    if (openid) data['openid'] = openid;
    if (latitude && longitude) {
      data['latitude'] = latitude;
      data['longitude'] = longitude;
    }
    if (city) data['city'] = city;
    if (region) data['region'] = region;
    return this.http.postJson(url, data);
  }
}
