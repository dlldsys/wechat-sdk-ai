import type { WxResponse } from '../types';
import type { TokenManager } from '../token';

export class DataAnalysisAPI {
  private tokenManager: TokenManager;

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  private get http() {
    return this.tokenManager.getHttpClient();
  }

  async getUserSummary(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    list: Array<{
      ref_date: string;
      user_source: number;
      new_user: number;
      cancel_user: number;
      cumulate_user: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getusersummary?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }

  async getUserCumulate(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    list: Array<{
      ref_date: string;
      cumulate_user: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getusercumulate?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }

  async getArticleSummary(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    list: Array<{
      ref_date: string;
      msgid: number;
      title: string;
      int_page_read_count: number;
      int_page_read_user: number;
      ori_page_read_count: number;
      ori_page_read_user: number;
      share_user: number;
      share_count: number;
      add_to_fav_user: number;
      add_to_fav_count: number;
      cumulate_count: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getarticlesummary?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }

  async getArticleTotal(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    list: Array<{
      ref_date: string;
      msgid: number;
      title: string;
      details: Array<{
        stat_date: string;
        target_user: number;
        int_page_read_count: number;
        int_page_read_user: number;
        ori_page_read_count: number;
        ori_page_read_user: number;
        share_user: number;
        share_count: number;
        add_to_fav_user: number;
        add_to_fav_count: number;
        int_page_from_session_read_count: number;
        int_page_from_session_read_user: number;
        int_page_from_historical_msg_read_count: number;
        int_page_from_historical_msg_read_user: number;
        int_page_from_feedback_read_count: number;
        int_page_from_feedback_read_user: number;
        int_page_from_shake_page_read_count: number;
        int_page_from_shake_page_read_user: number;
        ori_page_from_session_read_count: number;
        ori_page_from_session_read_user: number;
        ori_page_from_historical_msg_read_count: number;
        ori_page_from_historical_msg_read_user: number;
        ori_page_from_feedback_read_count: number;
        ori_page_from_feedback_read_user: number;
        ori_page_from_shake_page_read_count: number;
        ori_page_from_shake_page_read_user: number;
      }>;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getarticletotal?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }

  async getUserShare(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    list: Array<{
      ref_date: string;
      share_scene: number;
      share_count: number;
      share_user: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getusershare?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }

  async getUserShareHour(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    list: Array<{
      ref_date: string;
      ref_hour: number;
      share_scene: number;
      share_count: number;
      share_user: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getusersharehour?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }

  async getUpstreamMsg(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    list: Array<{
      ref_date: string;
      msg_type: number;
      msg_user: number;
      count: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getupstreammsg?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }

  async getUpstreamMsgHour(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    list: Array<{
      ref_date: string;
      ref_hour: number;
      msg_type: number;
      msg_user: number;
      count: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getupstreammsghour?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }

  async getUpstreamMsgWeek(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    list: Array<{
      ref_date: string;
      msg_type: number;
      msg_user: number;
      count: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getupstreammsgweek?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }

  async getUpstreamMsgMonth(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    list: Array<{
      ref_date: string;
      msg_type: number;
      msg_user: number;
      count: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getupstreammsgmonth?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }

  async getUpstreamMsgDist(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    list: Array<{
      ref_date: string;
      count_interval: number;
      msg_user: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getupstreammsgdist?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }

  async getUpstreamMsgDistWeek(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    list: Array<{
      ref_date: string;
      count_interval: number;
      msg_user: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getupstreammsgdistweek?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }

  async getUpstreamMsgDistMonth(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    list: Array<{
      ref_date: string;
      count_interval: number;
      msg_user: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getupstreammsgdistmonth?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }

  async getInterfaceSummary(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    list: Array<{
      ref_date: string;
      callback_count: number;
      fail_count: number;
      total_time_cost: number;
      max_time_cost: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getinterfacesummary?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }

  async getInterfaceSummaryHour(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    list: Array<{
      ref_date: string;
      ref_hour: number;
      callback_count: number;
      fail_count: number;
      total_time_cost: number;
      max_time_cost: number;
    }>;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getinterfacesummaryhour?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }

  async getMessageAnalyze(accessToken: string, beginDate: string, endDate: string): Promise<WxResponse<{
    ref_date: string;
    msg_type: number;
    msg_count: number;
    user_count: number;
  }>> {
    const url = `https://api.weixin.qq.com/datacube/getupstreammsg?access_token=${accessToken}`;
    return this.http.postJson(url, { begin_date: beginDate, end_date: endDate });
  }
}

