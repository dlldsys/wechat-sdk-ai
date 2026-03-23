import type { WxResponse, WxBaseResponse } from '../types';
import type { TokenManager } from '../token';

export class DraftAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async add(accessToken: string, articles: Array<{
    title: string;
    author?: string;
    digest?: string;
    content: string;
    content_source_url?: string;
    thumb_media_id: string;
    show_cover_pic: number;
    need_open_comment?: number;
    only_fans_can_comment?: number;
  }>): Promise<WxResponse<{ media_id: string }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`;
    return this.http.postJson(url, { articles });
  }

  async update(accessToken: string, mediaId: string, index: number, article: {
    title: string;
    author?: string;
    digest?: string;
    content: string;
    content_source_url?: string;
    thumb_media_id: string;
    show_cover_pic: number;
    need_open_comment?: number;
    only_fans_can_comment?: number;
  }): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/draft/update?access_token=${accessToken}`;
    return this.http.postJson(url, {
      media_id: mediaId,
      index,
      articles: article,
    });
  }

  async get(accessToken: string, offset: number = 0, count: number = 20): Promise<WxResponse<{
    total_count: number;
    item_count: number;
    item: Array<{
      media_id: string;
      content: {
        news_item: Array<{
          title: string;
          author: string;
          digest: string;
          content: string;
          content_source_url: string;
          thumb_media_id: string;
          show_cover_pic: number;
          need_open_comment: number;
          only_fans_can_comment: number;
          url: string;
          create_time: number;
          update_time: number;
        }>;
        create_time: number;
        update_time: number;
      };
      update_time: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/draft/get?access_token=${accessToken}`;
    return this.http.postJson(url, { offset, count });
  }

  async delete(accessToken: string, mediaId: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/draft/delete?access_token=${accessToken}`;
    return this.http.postJson(url, { media_id: mediaId });
  }

  async count(accessToken: string): Promise<WxResponse<{ total_count: number }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/draft/count?access_token=${accessToken}`;
    return this.http.get(url);
  }
}

export class FreePublishAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async submit(accessToken: string, mediaId: string): Promise<WxResponse<{ publish_id: number }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${accessToken}`;
    return this.http.postJson(url, { media_id: mediaId });
  }

  async get(accessToken: string, publishId: number): Promise<WxResponse<{
    publish_id: number;
    publish_status: number;
    article_id?: string;
    fail_idx?: number[];
    msg_data_id?: number;
  }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/freepublish/get?access_token=${accessToken}`;
    return this.http.postJson(url, { publish_id: publishId });
  }

  async delete(accessToken: string, articleId: string, index: number = 0): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/freepublish/delete?access_token=${accessToken}`;
    return this.http.postJson(url, { article_id: articleId, index });
  }

  async getArticleList(accessToken: string, offset: number = 0, count: number = 20): Promise<WxResponse<{
    item: Array<{
      article_id: string;
      content: {
        news_item: Array<{
          title: string;
          author: string;
          digest: string;
          content: string;
          content_source_url: string;
          thumb_media_id: string;
          show_cover_pic: number;
          url: string;
          need_open_comment: number;
          only_fans_can_comment: number;
        }>;
      };
      update_time: number;
      create_time: number;
    }>;
    total_count: number;
    item_count: number;
  }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/freepublish/getarticle?access_token=${accessToken}`;
    return this.http.postJson(url, { offset, count });
  }
}
