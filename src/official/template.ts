import type { WxResponse, WxBaseResponse } from '../types';
import type { TokenManager } from '../token';

export class TemplateMessageAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async setIndustry(accessToken: string, industryId1: string | number, industryId2: string | number): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/template/api_set_industry?access_token=${accessToken}`;
    return this.http.postJson(url, { industry_id1: industryId1, industry_id2: industryId2 });
  }

  async getIndustry(accessToken: string): Promise<WxResponse<{ primary_industry: { first_class: string; second_class: string }; secondary_industry: { first_class: string; second_class: string } }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/template/get_industry?access_token=${accessToken}`;
    return this.http.get(url);
  }

  async getTemplateList(accessToken: string): Promise<WxResponse<{ template_list: Array<{ template_id: string; title: string; primary_industry: string; deputy_industry: string; content: string; example: string }> }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/template/get_all_private_template?access_token=${accessToken}`;
    return this.http.get(url);
  }

  async addTemplate(accessToken: string, templateId: string, keywordList: string[]): Promise<WxResponse<{ template_id: string }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/template/api_add_template?access_token=${accessToken}`;
    return this.http.postJson(url, { template_id: templateId, keyword_list: keywordList });
  }

  async deleteTemplate(accessToken: string, templateId: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/template/del_private_template?access_token=${accessToken}`;
    return this.http.postJson(url, { template_id: templateId });
  }

  async send(accessToken: string, template: {
    touser: string;
    template_id: string;
    url?: string;
    miniprogram?: { appid: string; pagepath?: string };
    data: Record<string, { value: string; color?: string }>;
  }): Promise<WxResponse<WxBaseResponse & { msgid: number }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
    return this.http.postJson(url, template);
  }
}

export class UserAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async getUserInfo(accessToken: string, openId: string, lang: string = 'zh_CN'): Promise<WxResponse<{
    subscribe: number;
    openid: string;
    nickname: string;
    sex: number;
    province: string;
    city: string;
    country: string;
    headimgurl: string;
    privilege: string[];
    unionid?: string;
  }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${openId}&lang=${lang}`;
    return this.http.get(url);
  }

  async getUserList(accessToken: string, nextOpenId: string = ''): Promise<WxResponse<{ total: number; count: number; data: { openid: string[] }; next_openid: string }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/user/get?access_token=${accessToken}&next_openid=${nextOpenId}`;
    return this.http.get(url);
  }

  async getFollowers(accessToken: string, nextOpenId: string = ''): Promise<WxResponse<{ total: number; count: number; data: { openid: string[] }; next_openid: string }>> {
    return this.getUserList(accessToken, nextOpenId);
  }

  async setUserRemark(accessToken: string, openId: string, remark: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/user/info/updateremark?access_token=${accessToken}`;
    return this.http.postJson(url, { openid: openId, remark });
  }

  async getBlackList(accessToken: string, beginOpenId: string = ''): Promise<WxResponse<{ total: number; count: number; data: { openid: string[] }; next_begin_openid: string }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/tags/members/getblacklist?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_openid: beginOpenId });
  }

  async batchBlackList(accessToken: string, openIdList: string[]): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/tags/members/batchblacklist?access_token=${accessToken}`;
    return this.http.postJson(url, { opened_list: openIdList });
  }

  async batchUnblackList(accessToken: string, openIdList: string[]): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/tags/members/batchunblacklist?access_token=${accessToken}`;
    return this.http.postJson(url, { opened_list: openIdList });
  }

  async getUserInfoList(accessToken: string, userList: Array<{ openid: string; lang?: string }>): Promise<WxResponse<{ user_info_list: unknown[] }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/user/info/batchget?access_token=${accessToken}`;
    return this.http.postJson(url, { user_list: userList });
  }
}

export class UserTagAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async create(accessToken: string, name: string): Promise<WxResponse<{ tag: { id: number; name: string } }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/tags/create?access_token=${accessToken}`;
    return this.http.postJson(url, { tag: { name } });
  }

  async get(accessToken: string): Promise<WxResponse<{ tags: Array<{ id: number; name: string; count: number }> }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/tags/get?access_token=${accessToken}`;
    return this.http.get(url);
  }

  async update(accessToken: string, id: number, name: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/tags/update?access_token=${accessToken}`;
    return this.http.postJson(url, { tag: { id, name } });
  }

  async delete(accessToken: string, id: number): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/tags/delete?access_token=${accessToken}`;
    return this.http.postJson(url, { tag: { id } });
  }

  async getUsersByTag(accessToken: string, tagId: number, nextOpenId: string = ''): Promise<WxResponse<{ count: number; data: { openid: string[] }; next_openid: string }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/tags/get?access_token=${accessToken}`;
    return this.http.postJson(url, { tagid: tagId, next_openid: nextOpenId });
  }

  async batchTagUsers(accessToken: string, tagId: number, openIdList: string[]): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/tags/members/batchtagging?access_token=${accessToken}`;
    return this.http.postJson(url, { tagid: tagId, openid_list: openIdList });
  }

  async batchUntagUsers(accessToken: string, tagId: number, openIdList: string[]): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/cgi-bin/tags/members/batchuntagging?access_token=${accessToken}`;
    return this.http.postJson(url, { tagid: tagId, openid_list: openIdList });
  }

  async getUserTags(accessToken: string, openId: string): Promise<WxResponse<{ tagid_list: number[] }>> {
    const url = `https://api.weixin.qq.com/cgi-bin/tags/getidlist?access_token=${accessToken}`;
    return this.http.postJson(url, { openid: openId });
  }
}
