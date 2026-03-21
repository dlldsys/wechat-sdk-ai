import type { WxResponse, WxBaseResponse } from '../types';
import type { TokenManager } from '../token';

export class MenuAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async create(accessToken: string, menu: {
    button: Array<{
      type?: string;
      name: string;
      key?: string;
      url?: string;
      sub_button?: unknown[];
    }>;
  }): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${accessToken}`;
    return this.http.postJson<WxBaseResponse>(url, { button: menu.button });
  }

  async get(accessToken: string): Promise<WxResponse<{ menu: unknown; conditionalmenu?: unknown }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/menu/get?access_token=${accessToken}`;
    return this.http.get(url);
  }

  async delete(accessToken: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/menu/delete?access_token=${accessToken}`;
    return this.http.get(url);
  }

  async addConditional(accessToken: string, menu: {
    button: Array<{
      type?: string;
      name: string;
      key?: string;
      url?: string;
      sub_button?: unknown[];
    }>;
    matchrule: {
      group_id?: string;
      sex?: string;
      country?: string;
      province?: string;
      city?: string;
      client_platform_type?: string;
      language?: string;
    };
  }): Promise<WxResponse<WxBaseResponse & { menuid: string }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/menu/addconditional?access_token=${accessToken}`;
    return this.http.postJson(url, menu);
  }

  async delConditional(accessToken: string, menuid: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/menu/delconditional?access_token=${accessToken}`;
    return this.http.postJson<WxBaseResponse>(url, { menuid });
  }

  async tryMatch(accessToken: string, userId: string): Promise<WxResponse<{ button: unknown[] }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/menu/trymatch?access_token=${accessToken}`;
    return this.http.postJson(url, { user_id: userId });
  }

  async getConfig(accessToken: string): Promise<WxResponse<{ is_menu_open: number; selfmenu_mode: number }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/get_current_selfmenu_info?access_token=${accessToken}`;
    return this.http.get(url);
  }
}

export class KFMessageAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async addKF(accessToken: string, kfAccount: string, nickname: string, password: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/customservice/kfaccount/add?access_token=${accessToken}`;
    return this.http.postJson(url, { kf_account: kfAccount, nickname, password });
  }

  async updateKF(accessToken: string, kfAccount: string, nickname: string, password?: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/customservice/kfaccount/update?access_token=${accessToken}`;
    return this.http.postJson(url, { kf_account: kfAccount, nickname, password });
  }

  async deleteKF(accessToken: string, kfAccount: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/customservice/kfaccount/del?access_token=${accessToken}`;
    return this.http.postJson(url, { kf_account: kfAccount });
  }

  async getKFLists(accessToken: string): Promise<WxResponse<{ kf_list: Array<{ kf_account: string; kf_nick: string; kf_id: string; kf_headimgurl?: string }> }>> {
    const url = `https://api.weixin.qq.com/customservice/kfaccount/getkflist?access_token=${accessToken}`;
    return this.http.get(url);
  }

  async sendText(accessToken: string, toUser: string, content: string, kfAccount?: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;
    const data: Record<string, unknown> = {
      touser: toUser,
      msgtype: 'text',
      text: { content },
    };
    if (kfAccount) {
      data['customservice'] = { kf_account: kfAccount };
    }
    return this.http.postJson(url, data);
  }

  async sendImage(accessToken: string, toUser: string, mediaId: string, kfAccount?: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;
    const data: Record<string, unknown> = {
      touser: toUser,
      msgtype: 'image',
      image: { media_id: mediaId },
    };
    if (kfAccount) {
      data['customservice'] = { kf_account: kfAccount };
    }
    return this.http.postJson(url, data);
  }

  async sendVoice(accessToken: string, toUser: string, mediaId: string, kfAccount?: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;
    const data: Record<string, unknown> = {
      touser: toUser,
      msgtype: 'voice',
      voice: { media_id: mediaId },
    };
    if (kfAccount) {
      data['customservice'] = { kf_account: kfAccount };
    }
    return this.http.postJson(url, data);
  }

  async sendVideo(accessToken: string, toUser: string, mediaId: string, thumbMediaId: string, title?: string, description?: string, kfAccount?: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;
    const data: Record<string, unknown> = {
      touser: toUser,
      msgtype: 'video',
      video: { media_id: mediaId, thumb_media_id: thumbMediaId, title, description },
    };
    if (kfAccount) {
      data['customservice'] = { kf_account: kfAccount };
    }
    return this.http.postJson(url, data);
  }

  async sendMusic(accessToken: string, toUser: string, title: string, description: string, musicUrl: string, hqMusicUrl: string, thumbMediaId: string, kfAccount?: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;
    const data: Record<string, unknown> = {
      touser: toUser,
      msgtype: 'music',
      music: { title, description, musicurl: musicUrl, hqmusicurl: hqMusicUrl, thumb_media_id: thumbMediaId },
    };
    if (kfAccount) {
      data['customservice'] = { kf_account: kfAccount };
    }
    return this.http.postJson(url, data);
  }

  async sendNews(accessToken: string, toUser: string, articles: Array<{ title: string; description: string; url: string; picurl: string }>, kfAccount?: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;
    const data: Record<string, unknown> = {
      touser: toUser,
      msgtype: 'news',
      news: { articles },
    };
    if (kfAccount) {
      data['customservice'] = { kf_account: kfAccount };
    }
    return this.http.postJson(url, data);
  }

  async sendMpNews(accessToken: string, toUser: string, mediaId: string, kfAccount?: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;
    const data: Record<string, unknown> = {
      touser: toUser,
      msgtype: 'mpnews',
      mpnews: { media_id: mediaId },
    };
    if (kfAccount) {
      data['customservice'] = { kf_account: kfAccount };
    }
    return this.http.postJson(url, data);
  }

  async sendMiniProgramPage(accessToken: string, toUser: string, appId: string, pagePath: string, title: string, thumbMediaId: string, kfAccount?: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;
    const data: Record<string, unknown> = {
      touser: toUser,
      msgtype: 'miniprogrampage',
      miniprogrampage: { title, appid: appId, pagepath: pagePath, thumb_media_id: thumbMediaId },
    };
    if (kfAccount) {
      data['customservice'] = { kf_account: kfAccount };
    }
    return this.http.postJson(url, data);
  }

  async createSession(accessToken: string, kfAccount: string, openId: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/customservice/kfsession/create?access_token=${accessToken}`;
    return this.http.postJson(url, { kf_account: kfAccount, openid: openId });
  }

  async closeSession(accessToken: string, kfAccount: string, openId: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/customservice/kfsession/close?access_token=${accessToken}`;
    return this.http.postJson(url, { kf_account: kfAccount, openid: openId });
  }

  async getSession(accessToken: string, openId: string): Promise<WxResponse<{ kf_account: string; createtime: number }>> {
    const url = `https://api.weixin.qq.com/customservice/kfsession/getsession?access_token=${accessToken}&openid=${openId}`;
    return this.http.get(url);
  }

  async getSessionList(accessToken: string, kfAccount: string): Promise<WxResponse<{ sessionlist: Array<{ openid: string; createtime: number }> }>> {
    const url = `https://api.weixin.qq.com/customservice/kfsession/getsessionlist?access_token=${accessToken}&kf_account=${kfAccount}`;
    return this.http.get(url);
  }

  async getWaitCase(accessToken: string): Promise<WxResponse<{ count: number; caselist: Array<{ kf_account: string; openid: string; createtime: number }> }>> {
    const url = `https://api.weixin.qq.com/customservice/kfsession/getwaitcase?access_token=${accessToken}`;
    return this.http.get(url);
  }

  async getMsgList(accessToken: string, startTime: number, endTime: number, msgId: number = 1, number: number = 10000): Promise<WxResponse<{ msg_list: unknown[]; msgid: number }>> {
    const url = `https://api.weixin.qq.com/customservice/msgrecord/getmsglist?access_token=${accessToken}`;
    return this.http.postJson(url, { starttime: startTime, endtime: endTime, msgid: msgId, number });
  }
}
