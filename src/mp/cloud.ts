import type { WxResponse, WxBaseResponse } from '../types';
import type { TokenManager } from '../token';

export class CloudAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async invokeFunction(accessToken: string, env: string, name: string, data: unknown): Promise<WxResponse<{ resp_data: unknown }>> {
    const url = `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${accessToken}&env=${env}&name=${name}`;
    return this.http.postJson(url, data);
  }

  async databaseAdd(accessToken: string, env: string, query: string): Promise<WxResponse<{ id_list: string[] }>> {
    const url = `https://api.weixin.qq.com/tcb/databaseadd?access_token=${accessToken}`;
    return this.http.postJson(url, { env, query });
  }

  async databaseDelete(accessToken: string, env: string, query: string): Promise<WxResponse<{ deleted: number }>> {
    const url = `https://api.weixin.qq.com/tcb/databasedelete?access_token=${accessToken}`;
    return this.http.postJson(url, { env, query });
  }

  async databaseUpdate(accessToken: string, env: string, query: string): Promise<WxResponse<{ matched: number; modified: number; id?: string }>> {
    const url = `https://api.weixin.qq.com/tcb/databaseupdate?access_token=${accessToken}`;
    return this.http.postJson(url, { env, query });
  }

  async databaseQuery(accessToken: string, env: string, query: string): Promise<WxResponse<{ pager: { limit: number; offset: number; total: number }; data: string[] }>> {
    const url = `https://api.weixin.qq.com/tcb/databasequery?access_token=${accessToken}`;
    return this.http.postJson(url, { env, query });
  }

  async databaseAggregate(accessToken: string, env: string, query: string): Promise<WxResponse<{ data: string[] }>> {
    const url = `https://api.weixin.qq.com/tcb/databaseaggregate?access_token=${accessToken}`;
    return this.http.postJson(url, { env, query });
  }

  async databaseCount(accessToken: string, env: string, query: string): Promise<WxResponse<{ count: number }>> {
    const url = `https://api.weixin.qq.com/tcb/databasecount?access_token=${accessToken}`;
    return this.http.postJson(url, { env, query });
  }

  async uploadFile(accessToken: string, env: string, path: string): Promise<WxResponse<{ url: string; fileid: string; upload_url: string; upload_header: Record<string, string> }>> {
    const url = `https://api.weixin.qq.com/tcb/uploadfile?access_token=${accessToken}`;
    return this.http.postJson(url, { env, path });
  }

  async downloadFile(accessToken: string, env: string, fileList: string[]): Promise<WxResponse<{ fileList: { fileid: string; status: number; errmsg: string; url?: string }[] }>> {
    const url = `https://api.weixin.qq.com/tcb/batchdownloadfile?access_token=${accessToken}`;
    return this.http.postJson(url, { env, file_list: fileList });
  }

  async deleteFile(accessToken: string, env: string, fileList: string[]): Promise<WxResponse<{ delete_list: { fileid: string; status: number; errmsg: string }[] }>> {
    const url = `https://api.weixin.qq.com/tcb/batchdeletefile?access_token=${accessToken}`;
    return this.http.postJson(url, { env, fileid_list: fileList });
  }

  async getQrCode(accessToken: string, env: string): Promise<WxResponse<{ qrcode_url: string }>> {
    const url = `https://api.weixin.qq.com/tcb/getqrcode?access_token=${accessToken}`;
    return this.http.postJson(url, { env });
  }

  async createEnvAndResource(accessToken: string, env: string, nickname: string): Promise<WxResponse<{ env: string; domain: string }>> {
    const url = `https://api.weixin.qq.com/tcb/envcreate?access_token=${accessToken}`;
    return this.http.postJson(url, { env, nickname });
  }

  async describeEnv(accessToken: string, env?: string): Promise<WxResponse<{ envList: { env: string; alias: string; status: number; databases: unknown[]; storages: unknown[]; functions: unknown[] }[] }>> {
    const url = `https://api.weixin.qq.com/tcb/describeenvs?access_token=${accessToken}`;
    return this.http.postJson(url, { env });
  }

  async modifyEnv(accessToken: string, env: string, nickname?: string): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/tcb/modifyenv?access_token=${accessToken}`;
    return this.http.postJson(url, { env, nickname });
  }
}

export class SecurityAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async imgSecCheck(accessToken: string, media: Buffer, filename: string = 'file'): Promise<WxResponse<WxBaseResponse>> {
    const url = `https://api.weixin.qq.com/wxa/img_sec_check?access_token=${accessToken}`;
    return this.http.postForm(url, { media, filename });
  }

  async msgSecCheck(accessToken: string, content: string, openid?: string, scene?: number, version?: number): Promise<WxResponse<{ result: { suggest: string; label: number } }>> {
    const url = `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${accessToken}`;
    const data: Record<string, unknown> = { content, version: version ?? 2 };
    if (openid) data['openid'] = openid;
    if (scene) data['scene'] = scene;
    return this.http.postJson(url, data);
  }

  async mediaCheckAsync(accessToken: string, mediaUrl: string, mediaType: number, openid?: string, scene?: number): Promise<WxResponse<{ trace_id: string }>> {
    const url = `https://api.weixin.qq.com/wxa/media_check_async?access_token=${accessToken}`;
    const data: Record<string, unknown> = { media_url: mediaUrl, media_type: mediaType };
    if (openid) data['openid'] = openid;
    if (scene) data['scene'] = scene;
    return this.http.postJson(url, data);
  }

  async getUserRiskRank(accessToken: string, options: {
    appid: string;
    openid: string;
    scene: number;
    client_ip?: string;
    mobile_no?: string;
    bank_card_no?: string;
    cert_no?: string;
    email_address?: string;
    extended_info?: string;
    is_test?: boolean;
  }): Promise<WxResponse<{ risk_rank: number; hit_info?: { type: number; value: string }[] }>> {
    const url = `https://api.weixin.qq.com/wxa/getuserriskrank?access_token=${accessToken}`;
    return this.http.postJson(url, options);
  }
}
