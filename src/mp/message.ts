import type { WxResponse, WxBaseResponse } from '../types';
import type { TokenManager } from '../token';

export class MessageAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async sendUniformMessage(accessToken: string, message: {
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
  }): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/wxopen/template/uniform_send?access_token=${accessToken}`;
    return this.http.postJson(url, message);
  }

  async sendSubscribeMessage(accessToken: string, message: {
    touser: string;
    template_id: string;
    page?: string;
    data: Record<string, { value: string }>;
    miniprogram_state?: 'developer' | 'trial' | 'formal';
    lang?: 'zh_CN' | 'zh_TW' | 'en';
  }): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;
    return this.http.postJson(url, message);
  }

  async sendCustomerServiceMessage(accessToken: string, message: {
    touser: string;
    msgtype: string;
    [key: string]: unknown;
  }): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;
    return this.http.postJson(url, message);
  }

  async sendCustomerServiceText(accessToken: string, toUser: string, content: string): Promise<WxResponse<WxBaseResponse>> {
    return this.sendCustomerServiceMessage(accessToken, {
      touser: toUser,
      msgtype: 'text',
      text: { content },
    });
  }

  async sendCustomerServiceImage(accessToken: string, toUser: string, mediaId: string): Promise<WxResponse<WxBaseResponse>> {
    return this.sendCustomerServiceMessage(accessToken, {
      touser: toUser,
      msgtype: 'image',
      image: { media_id: mediaId },
    });
  }

  async sendCustomerServiceLink(accessToken: string, toUser: string, title: string, description: string, url: string, thumbUrl: string): Promise<WxResponse<WxBaseResponse>> {
    return this.sendCustomerServiceMessage(accessToken, {
      touser: toUser,
      msgtype: 'link',
      link: { title, description, url, thumb_url: thumbUrl },
    });
  }

  async sendCustomerServiceMiniProgram(accessToken: string, toUser: string, title: string, appId: string, pagePath: string, thumbMediaId: string): Promise<WxResponse<WxBaseResponse>> {
    return this.sendCustomerServiceMessage(accessToken, {
      touser: toUser,
      msgtype: 'miniprogrampage',
      miniprogrampage: { title, appid: appId, pagepath: pagePath, thumb_media_id: thumbMediaId },
    });
  }

  async setTyping(accessToken: string, toUser: string, command: 'Typing' | 'CancelTyping'): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/typing?access_token=${accessToken}`;
    return this.http.postJson(url, { touser: toUser, command });
  }

  async uploadTempMedia(accessToken: string, type: 'image' | 'voice' | 'video' | 'file', media: Buffer, filename: string = 'file'): Promise<WxResponse<{ type: string; media_id: string; created_at: number }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${accessToken}&type=${type}`;
    return this.http.postForm(url, { media, filename });
  }

  async getTempMedia(accessToken: string, mediaId: string): Promise<WxResponse<Buffer | unknown>> {
    const url = `https://api.weixin.qq.com/cgi-bin/media/get?access_token=${accessToken}&media_id=${mediaId}`;
    return this.http.get(url);
  }
}

export class SubscribeTemplateAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async addTemplate(accessToken: string, tid: string, kidList: number[], sceneDesc?: string): Promise<WxResponse<{ priTmplId: string }>> {
    const url = `https://api.weixin.qq.com/wxaapi/newtmpl/addtemplate?access_token=${accessToken}`;
    return this.http.postJson(url, { tid, kidList, sceneDesc });
  }

  async deleteTemplate(accessToken: string, priTmplId: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/wxaapi/newtmpl/deltemplate?access_token=${accessToken}`;
    return this.http.postJson(url, { priTmplId });
  }

  async getCategory(accessToken: string): Promise<WxResponse<{ data: { id: number; name: string }[] }>> {
    const url = `https://api.weixin.qq.com/wxaapi/newtmpl/getcategory?access_token=${accessToken}`;
    return this.http.get(url);
  }

  async getPubTemplateKeywords(accessToken: string, tid: string): Promise<WxResponse<{ count: number; data: { kid: number; name: string; example: string; rule: string }[] }>> {
    const url = `https://api.weixin.qq.com/wxaapi/newtmpl/getpubtemplatekeywords?access_token=${accessToken}&tid=${tid}`;
    return this.http.get(url);
  }

  async getPubTemplateTitles(accessToken: string, ids: string, start: number = 0, limit: number = 30): Promise<WxResponse<{ count: number; data: { tid: string; title: string; type: number; category: string }[] }>> {
    const url = `https://api.weixin.qq.com/wxaapi/newtmpl/getpubtemplatetitles?access_token=${accessToken}&ids=${ids}&start=${start}&limit=${limit}`;
    return this.http.get(url);
  }

  async getTemplateList(accessToken: string): Promise<WxResponse<{ count: number; data: { priTmplId: string; title: string; content: string; example: string; type: number }[] }>> {
    const url = `https://api.weixin.qq.com/wxaapi/newtmpl/gettemplate?access_token=${accessToken}`;
    return this.http.get(url);
  }
}
