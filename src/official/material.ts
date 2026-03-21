import type { WxResponse, WxBaseResponse } from '../types';
import type { TokenManager } from '../token';

export class MaterialAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async addMaterial(accessToken: string, type: 'image' | 'voice' | 'video' | 'thumb', media: Buffer, filename: string = 'file'): Promise<WxResponse<{ media_id: string; url?: string }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=${type}`;
    return this.http.postForm(url, { media, filename });
  }

  async addNews(accessToken: string, articles: Array<{
    title: string;
    thumb_media_id: string;
    author?: string;
    digest?: string;
    show_cover_pic?: number;
    content: string;
    content_source_url?: string;
    need_open_comment?: number;
    only_fans_can_comment?: number;
  }>): Promise<WxResponse<{ media_id: string }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/material/add_news?access_token=${accessToken}`;
    return this.http.postJson(url, { articles });
  }

  async updateNews(accessToken: string, mediaId: string, index: number, article: {
    title: string;
    thumb_media_id: string;
    author?: string;
    digest?: string;
    show_cover_pic?: number;
    content: string;
    content_source_url?: string;
    need_open_comment?: number;
    only_fans_can_comment?: number;
  }): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/material/update_news?access_token=${accessToken}`;
    return this.http.postJson(url, { media_id: mediaId, index, articles: article });
  }

  async getMaterial(accessToken: string, mediaId: string): Promise<WxResponse<Buffer | unknown>> {
    const url = `https://api.weixin.qq.com/cgi-bin/material/get_material?access_token=${accessToken}`;
    return this.http.postJson(url, { media_id: mediaId });
  }

  async deleteMaterial(accessToken: string, mediaId: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/material/del_material?access_token=${accessToken}`;
    return this.http.postJson(url, { media_id: mediaId });
  }

  async getMaterialCount(accessToken: string): Promise<WxResponse<{ voice_count: number; video_count: number; image_count: number; news_count: number }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/material/get_materialcount?access_token=${accessToken}`;
    return this.http.get(url);
  }

  async batchGetMaterial(accessToken: string, type: 'image' | 'video' | 'voice' | 'news', offset: number = 0, count: number = 20): Promise<WxResponse<{
    total_count: number;
    item_count: number;
    item: Array<{
      media_id: string;
      name?: string;
      update_time?: number;
      url?: string;
      content?: unknown;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${accessToken}`;
    return this.http.postJson(url, { type, offset, count });
  }
}

export class MediaAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async upload(accessToken: string, type: 'image' | 'voice' | 'video' | 'thumb', media: Buffer, filename: string = 'file'): Promise<WxResponse<{ type: string; media_id: string; created_at: number }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${accessToken}&type=${type}`;
    return this.http.postForm(url, { media, filename });
  }

  async uploadImg(accessToken: string, media: Buffer, filename: string = 'file'): Promise<WxResponse<{ url: string }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`;
    return this.http.postForm(url, { media, filename });
  }

  async get(accessToken: string, mediaId: string): Promise<WxResponse<Buffer | unknown>> {
    const url = `https://api.weixin.qq.com/cgi-bin/media/get?access_token=${accessToken}&media_id=${mediaId}`;
    return this.http.get(url);
  }

  async uploadVideo(accessToken: string, mediaId: string, title: string, description: string): Promise<WxResponse<{ media_id: string }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/media/uploadvideo?access_token=${accessToken}`;
    return this.http.postJson(url, { media_id: mediaId, title, description });
  }

  async uploadNews(accessToken: string, articles: Array<{
    thumb_media_id: string;
    author?: string;
    title: string;
    content_source_url?: string;
    content: string;
    digest?: string;
    show_cover_pic?: number;
    need_open_comment?: number;
    only_fans_can_comment?: number;
  }>): Promise<WxResponse<{ type: string; media_id: string; created_at: number }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/media/uploadnews?access_token=${accessToken}`;
    return this.http.postJson(url, { articles });
  }
}
