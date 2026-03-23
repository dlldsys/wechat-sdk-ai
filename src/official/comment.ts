import type { WxResponse, WxBaseResponse } from '../types';
import type { TokenManager } from '../token';

export class CommentAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async open(accessToken: string, msgDataId: number, index: number): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/comment/open?access_token=${accessToken}`;
    return this.http.postJson(url, { msg_data_id: msgDataId, index });
  }

  async close(accessToken: string, msgDataId: number, index: number): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/comment/close?access_token=${accessToken}`;
    return this.http.postJson(url, { msg_data_id: msgDataId, index });
  }

  async list(accessToken: string, msgDataId: number, index: number, begin: number = 0, count: number = 10, type: number = 0): Promise<WxResponse<{
    comment: Array<{
      user_name: string;
      content: string;
      create_time: number;
      comment_id: number;
      upper_comment_id?: number;
      reply_id?: number;
      reply_content?: string;
    }>;
    selected_comment_count: number;
    public_commented_count: number;
    public_reply_count: number;
  }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/comment/list?access_token=${accessToken}`;
    return this.http.postJson(url, {
      msg_data_id: msgDataId,
      index,
      begin,
      count,
      type,
    });
  }

  async markElect(accessToken: string, msgDataId: number, index: number, commentId: number): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/comment/markelect?access_token=${accessToken}`;
    return this.http.postJson(url, {
      msg_data_id: msgDataId,
      index,
      comment_id: commentId,
    });
  }

  async unmarkElect(accessToken: string, msgDataId: number, index: number, commentId: number): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/comment/unmarkelect?access_token=${accessToken}`;
    return this.http.postJson(url, {
      msg_data_id: msgDataId,
      index,
      comment_id: commentId,
    });
  }

  async reply(accessToken: string, msgDataId: number, index: number, commentId: number, content: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/comment/reply/add?access_token=${accessToken}`;
    return this.http.postJson(url, {
      msg_data_id: msgDataId,
      index,
      comment_id: commentId,
      content,
    });
  }

  async deleteReply(accessToken: string, msgDataId: number, index: number, commentId: number): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/comment/reply/delete?access_token=${accessToken}`;
    return this.http.postJson(url, {
      msg_data_id: msgDataId,
      index,
      comment_id: commentId,
    });
  }
}
