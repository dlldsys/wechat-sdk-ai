/**
 * XML 消息基础接口
 */
export interface XmlMessage {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: string;
}

/**
 * 文本消息
 */
export interface TextMessage extends XmlMessage {
  MsgType: 'text';
  Content: string;
  MsgId: number;
}

/**
 * 图片消息
 */
export interface ImageMessage extends XmlMessage {
  MsgType: 'image';
  PicUrl: string;
  MediaId: string;
  MsgId: number;
}

/**
 * 语音消息
 */
export interface VoiceMessage extends XmlMessage {
  MsgType: 'voice';
  MediaId: string;
  Format: string;
  Recognition?: string;
  MsgId: number;
}

/**
 * 视频消息
 */
export interface VideoMessage extends XmlMessage {
  MsgType: 'video';
  MediaId: string;
  ThumbMediaId: string;
  MsgId: number;
}

/**
 * 小视频消息
 */
export interface ShortVideoMessage extends XmlMessage {
  MsgType: 'shortvideo';
  MediaId: string;
  ThumbMediaId: string;
  MsgId: number;
}

/**
 * 地理位置消息
 */
export interface LocationMessage extends XmlMessage {
  MsgType: 'location';
  Location_X: number;
  Location_Y: number;
  Scale: number;
  Label: string;
  MsgId: number;
}

/**
 * 链接消息
 */
export interface LinkMessage extends XmlMessage {
  MsgType: 'link';
  Title: string;
  Description: string;
  Url: string;
  MsgId: number;
}

/**
 * 事件消息基础接口
 */
export interface EventMessage extends XmlMessage {
  MsgType: 'event';
  Event: string;
}

/**
 * 关注/取消关注事件
 */
export interface SubscribeEvent extends EventMessage {
  Event: 'subscribe' | 'unsubscribe';
  EventKey?: string;
}

/**
 * 扫描带参数二维码事件
 */
export interface QrCodeEvent extends EventMessage {
  Event: 'SCAN';
  EventKey: string;
  Ticket: string;
}

/**
 * 上报地理位置事件
 */
export interface LocationEvent extends EventMessage {
  Event: 'LOCATION';
  Latitude: number;
  Longitude: number;
  Precision: number;
}

/**
 * 点击菜单拉取消息事件
 */
export interface ClickEvent extends EventMessage {
  Event: 'CLICK';
  EventKey: string;
}

/**
 * 点击菜单跳转链接事件
 */
export interface ViewEvent extends EventMessage {
  Event: 'VIEW';
  EventKey: string;
  MenuId?: string;
}

/**
 * 模板消息发送结果事件
 */
export interface TemplateSendJobFinishEvent extends EventMessage {
  Event: 'SEND';
  MsgID: number;
  Status: string;
}

/**
 * 客服会话事件
 */
export interface KfSessionEvent extends EventMessage {
  Event: 'kf_create_session' | 'kf_close_session' | 'kf_switch_session';
  KfAccount: string;
  SessionFrom?: string;
  WechatWork?: string;
}

/**
 * 微信小店订单支付事件
 */
export interface MpOrderPayEvent extends EventMessage {
  Event: 'mp_order_pay';
  OrderId: number;
  OrderStatus: number;
  ProductId: string;
}

/**
 * 审核结果事件
 */
export interface MpWeappAuditResultEvent extends EventMessage {
  Event: 'mp_weapp_audit_result';
  FailTime: string;
  AuditResult: number;
  Reason: string;
  NoticeId: string;
  AuditId: number;
}

/**
 * 所有消息类型的联合类型
 */
export type AnyMessage = 
  | TextMessage
  | ImageMessage
  | VoiceMessage
  | VideoMessage
  | ShortVideoMessage
  | LocationMessage
  | LinkMessage
  | SubscribeEvent
  | QrCodeEvent
  | LocationEvent
  | ClickEvent
  | ViewEvent
  | TemplateSendJobFinishEvent
  | KfSessionEvent
  | MpOrderPayEvent
  | MpWeappAuditResultEvent;

/**
 * XML 解析结果
 */
export interface XmlParseResult<T = AnyMessage> {
  success: boolean;
  data?: T;
  error?: XmlParseError;
}

/**
 * XML 解析错误
 */
export interface XmlParseError {
  code: 'INVALID_XML' | 'INVALID_FORMAT' | 'MISSING_FIELD' | 'PARSE_ERROR';
  message: string;
  rawXml?: string;
}

/**
 * XML 解析选项
 */
export interface XmlParseOptions {
  /**
   * 是否记录详细日志
   */
  verbose?: boolean;
  /**
   * 是否自动转换特殊字符
   */
  autoEscape?: boolean;
  /**
   * 是否忽略命名空间
   */
  ignoreNamespace?: boolean;
}
