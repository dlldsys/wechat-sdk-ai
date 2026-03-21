import type { WxResponse, WxBaseResponse } from '../types';
import type { TokenManager } from '../token';

export class BroadcastAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async sendToAll(accessToken: string, message: {
    msgtype: string;
    [key: string]: unknown;
  }): Promise<WxResponse<WxBaseResponse & { msg_id: number; msg_data_id: number }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/mass/sendall?access_token=${accessToken}`;
    const data = {
      ...message,
      filter: { is_to_all: true },
    };
    return this.http.postJson(url, data);
  }

  async sendToTag(accessToken: string, tagId: number, message: {
    msgtype: string;
    [key: string]: unknown;
  }): Promise<WxResponse<WxBaseResponse & { msg_id: number; msg_data_id: number }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/mass/sendall?access_token=${accessToken}`;
    const data = {
      ...message,
      filter: { is_to_all: false, tag_id: tagId },
    };
    return this.http.postJson(url, data);
  }

  async sendToUsers(accessToken: string, toUsers: string[], message: {
    msgtype: string;
    [key: string]: unknown;
  }): Promise<WxResponse<WxBaseResponse & { msg_id: number; msg_data_id: number }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/mass/send?access_token=${accessToken}`;
    const data = {
      ...message,
      touser: toUsers,
    };
    return this.http.postJson(url, data);
  }

  async sendTextToAll(accessToken: string, content: string): Promise<WxResponse<WxBaseResponse & { msg_id: number; msg_data_id: number }>> {
    return this.sendToAll(accessToken, {
      msgtype: 'text',
      text: { content },
    });
  }

  async sendTextToTag(accessToken: string, tagId: number, content: string): Promise<WxResponse<WxBaseResponse & { msg_id: number; msg_data_id: number }>> {
    return this.sendToTag(accessToken, tagId, {
      msgtype: 'text',
      text: { content },
    });
  }

  async sendTextToUsers(accessToken: string, toUsers: string[], content: string): Promise<WxResponse<WxBaseResponse & { msg_id: number; msg_data_id: number }>> {
    return this.sendToUsers(accessToken, toUsers, {
      msgtype: 'text',
      text: { content },
    });
  }

  async sendImageToAll(accessToken: string, mediaId: string): Promise<WxResponse<WxBaseResponse & { msg_id: number; msg_data_id: number }>> {
    return this.sendToAll(accessToken, {
      msgtype: 'image',
      image: { media_id: mediaId },
    });
  }

  async sendVoiceToAll(accessToken: string, mediaId: string): Promise<WxResponse<WxBaseResponse & { msg_id: number; msg_data_id: number }>> {
    return this.sendToAll(accessToken, {
      msgtype: 'voice',
      voice: { media_id: mediaId },
    });
  }

  async sendMpNewsToAll(accessToken: string, mediaId: string): Promise<WxResponse<WxBaseResponse & { msg_id: number; msg_data_id: number }>> {
    return this.sendToAll(accessToken, {
      msgtype: 'mpnews',
      mpnews: { media_id: mediaId },
    });
  }

  async sendVideoToAll(accessToken: string, mediaId: string, title: string, description: string): Promise<WxResponse<WxBaseResponse & { msg_id: number; msg_data_id: number }>> {
    return this.sendToAll(accessToken, {
      msgtype: 'mpvideo',
      mpvideo: { media_id: mediaId, title, description },
    });
  }

  async delete(accessToken: string, msgId: number, articleIdx: number = 0): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/mass/delete?access_token=${accessToken}`;
    return this.http.postJson(url, { msg_id: msgId, article_idx: articleIdx });
  }

  async preview(accessToken: string, toUser: string, message: {
    msgtype: string;
    [key: string]: unknown;
  }, isWxName: boolean = false): Promise<WxResponse<WxBaseResponse & { msg_id: number }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/mass/preview?access_token=${accessToken}`;
    const data = {
      ...message,
      [isWxName ? 'towxname' : 'touser']: toUser,
    };
    return this.http.postJson(url, data);
  }

  async getStatus(accessToken: string, msgId: number): Promise<WxResponse<{ msg_status: string }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/mass/get?access_token=${accessToken}`;
    return this.http.postJson(url, { msg_id: msgId });
  }

  async getSpeed(accessToken: string): Promise<WxResponse<{ speed: number; realspeed: number }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/mass/speed/get?access_token=${accessToken}`;
    return this.http.get(url);
  }

  async setSpeed(accessToken: string, speed: number): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/mass/speed/set?access_token=${accessToken}`;
    return this.http.postJson(url, { speed });
  }
}

export class SubscribeMessageAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async getTemplateList(accessToken: string): Promise<WxResponse<{
    data: Array<{
      id: string;
      title: string;
      content: string;
      example: string;
      type: number;
    }>;
    count: number;
  }>> {
    const url = `https://api.weixin.qq.com/wxaapi/newtmpl/gettemplate?access_token=${accessToken}`;
    return this.http.get(url);
  }

  async getCategory(accessToken: string): Promise<WxResponse<{
    data: Array<{ id: number; name: string }>;
  }>> {
    const url = `https://api.weixin.qq.com/wxaapi/newtmpl/getcategory?access_token=${accessToken}`;
    return this.http.get(url);
  }

  async getPubTemplateTitles(accessToken: string, ids: string, start: number = 0, limit: number = 30): Promise<WxResponse<{
    count: number;
    data: Array<{
      tid: string;
      title: string;
      type: number;
      category: string;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/wxaapi/newtmpl/getpubtemplatetitles?access_token=${accessToken}&ids=${ids}&start=${start}&limit=${limit}`;
    return this.http.get(url);
  }

  async getPubTemplateKeywords(accessToken: string, tid: string): Promise<WxResponse<{
    count: number;
    data: Array<{
      kid: number;
      name: string;
      example: string;
      rule: string;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/wxaapi/newtmpl/getpubtemplatekeywords?access_token=${accessToken}&tid=${tid}`;
    return this.http.get(url);
  }

  async addTemplate(accessToken: string, tid: string, kidList: number[], sceneDesc: string = ''): Promise<WxResponse<{ priTmplId: string }>> {
    const url = `https://api.weixin.qq.com/wxaapi/newtmpl/addtemplate?access_token=${accessToken}`;
    return this.http.postJson(url, { tid, kidList, sceneDesc });
  }

  async deleteTemplate(accessToken: string, priTmplId: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/wxaapi/newtmpl/deltemplate?access_token=${accessToken}`;
    return this.http.postJson(url, { priTmplId });
  }

  async send(accessToken: string, message: {
    touser: string;
    template_id: string;
    page?: string;
    data: Record<string, { value: string }>;
    miniprogram_state?: 'developer' | 'trial' | 'formal';
    lang?: 'zh_CN' | 'zh_TW' | 'en';
  }): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/bizsend?access_token=${accessToken}`;
    return this.http.postJson(url, message);
  }
}
