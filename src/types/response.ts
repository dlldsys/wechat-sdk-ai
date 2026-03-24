import { WxError } from './error';

// [加固] 统一响应格式，消除 any
export interface WxResponse<T = unknown> {
  err: WxError | null;
  data: T;
}

export interface WxBaseResponse {
  errcode?: number;
  errmsg?: string;
}

// [加固] 补全所有接口返回类型

// Access Token
export interface AccessTokenResponse extends WxBaseResponse {
  access_token: string;
  expires_in: number;
}

// JS Ticket
export interface JsApiTicketResponse extends WxBaseResponse {
  ticket: string;
  expires_in: number;
}

// 小程序登录
export interface Code2SessionResponse extends WxBaseResponse {
  openid: string;
  session_key: string;
  unionid?: string;
}

// 用户信息
export interface UserInfo {
  openid: string;
  nickname?: string;
  sex?: number;
  province?: string;
  city?: string;
  country?: string;
  headimgurl?: string;
  privilege?: string[];
  unionid?: string;
  subscribe?: number;
  subscribe_time?: number;
  remark?: string;
  groupid?: number;
  tagid_list?: number[];
  subscribe_scene?: string;
  qr_scene?: number;
  qr_scene_str?: string;
}

// 菜单按钮
export interface MenuButton {
  type?: 'click' | 'view' | 'scancode_push' | 'scancode_waitmsg' | 'pic_sysphoto' | 'pic_photo_or_album' | 'pic_weixin' | 'location_select' | 'media_id' | 'view_limited' | 'miniprogram';
  name: string;
  key?: string;
  url?: string;
  media_id?: string;
  appid?: string;
  pagepath?: string;
  sub_button?: MenuButton[];
}

export interface MenuData {
  button: MenuButton[];
}

// 模板消息
export interface TemplateMessage {
  touser: string;
  template_id: string;
  url?: string;
  miniprogram?: {
    appid: string;
    pagepath?: string;
  };
  data: Record<string, { value: string; color?: string }>;
}

// 订阅消息
export interface SubscribeMessage {
  touser: string;
  template_id: string;
  page?: string;
  data: Record<string, { value: string }>;
  miniprogram_state?: 'developer' | 'trial' | 'formal';
  lang?: 'zh_CN' | 'zh_TW' | 'en';
}

// 素材
export interface MaterialItem {
  media_id: string;
  name?: string;
  update_time?: number;
  url?: string;
  content?: {
    news_item: MaterialNewsItem[];
  };
}

export interface MaterialNewsItem {
  title: string;
  thumb_media_id: string;
  author?: string;
  digest?: string;
  show_cover_pic?: number;
  content: string;
  content_source_url?: string;
  need_open_comment?: number;
  only_fans_can_comment?: number;
}

// OAuth
export interface OAuthAccessToken extends WxBaseResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
  unionid?: string;
}

export interface OAuthUserInfo {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  unionid?: string;
}

// 二维码
export interface QrCodeResponse extends WxBaseResponse {
  ticket: string;
  expire_seconds?: number;
  url: string;
}

// 手机号
export interface PhoneNumberInfo {
  phoneNumber: string;
  purePhoneNumber: string;
  countryCode: string;
  watermark: {
    timestamp: number;
    appid: string;
  };
}

// 数据解密
export interface DecryptDataResult {
  openId: string;
  unionId?: string;
  watermark: {
    appid: string;
    timestamp: number;
  };
  // [加固] 使用 Record 替代 any，支持可选属性
  [key: string]: string | number | boolean | Record<string, unknown> | undefined;
}

// 内容安全检测
export interface ContentSecurityResult extends WxBaseResponse {
  result?: {
    suggest: 'pass' | 'review' | 'risky';
    label: number;
  };
  trace_id?: string;
}

// 云函数
export interface CloudFunctionResult extends WxBaseResponse {
  resp_data?: unknown;
}

// 附近小程序
export interface NearbyPoi {
  poi_id: string;
  qualification_address: string;
  qualification_num: string;
  audit_id?: string;
  audit_status?: number;
  display_status?: number;
}

// [加固] 辅助函数：创建成功响应
export function createSuccessResponse<T>(data: T): WxResponse<T> {
  return { err: null, data };
}

// [加固] 辅助函数：创建错误响应
export function createErrorResponse<T = unknown>(error: WxError, defaultData: T): WxResponse<T> {
  return { err: error, data: defaultData };
}

// [加固] 辅助函数：包装微信响应，自动处理错误
export function wrapWxResponse<T extends WxBaseResponse, R>(
  response: T,
  successMapper: (res: T) => R
): WxResponse<R> {
  const error = WxError.fromResponse(response);
  if (error) {
    return { err: error, data: null as R };
  }
  return { err: null, data: successMapper(response) };
}
