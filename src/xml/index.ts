import type { XmlParseResult, XmlParseError, AnyMessage, XmlParseOptions } from './types';

/**
 * XML 解析器 - 用于解析微信公众号推送的 XML 消息
 */
export class XmlParser {
  private options: Required<XmlParseOptions>;

  constructor(options: XmlParseOptions = {}) {
    this.options = {
      verbose: options.verbose ?? false,
      autoEscape: options.autoEscape ?? true,
      ignoreNamespace: options.ignoreNamespace ?? true,
    };
  }

  /**
   * 解析 XML 字符串为 JSON 对象
   * @param xml - XML 字符串
   * @returns 解析结果
   */
  parse(xml: string): XmlParseResult {
    try {
      if (!xml || typeof xml !== 'string') {
        return this.createError('INVALID_XML', 'Invalid or empty XML input', xml);
      }

      // 清理 XML 字符串
      const cleanedXml = this.cleanXml(xml);
      
      // 解析 XML
      const parsed = this.simpleParse(cleanedXml);
      
      if (!parsed) {
        return this.createError('PARSE_ERROR', 'Failed to parse XML', xml);
      }

      // 验证并转换消息类型
      const message = this.validateMessage(parsed);
      
      if (!message) {
        return this.createError('INVALID_FORMAT', 'Invalid message format', xml);
      }

      return {
        success: true,
        data: message,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createError('PARSE_ERROR', errorMessage, xml);
    }
  }

  /**
   * 清理 XML 字符串
   */
  private cleanXml(xml: string): string {
    // 移除 XML 声明
    let cleaned = xml.replace(/<\?xml[^?]*\?>/g, '');
    
    // 移除命名空间（如果配置了）
    if (this.options.ignoreNamespace) {
      cleaned = cleaned.replace(/\s+xmlns[^=]*="[^"]*"/g, '');
    }
    
    // 移除多余的空白
    cleaned = cleaned.replace(/>\s+</g, '><');
    
    return cleaned.trim();
  }

  /**
   * 简单 XML 解析
   */
  private simpleParse(xml: string): Record<string, unknown> | null {
    try {
      // 移除 <xml> 和 </xml> 标签
      const rootMatch = xml.match(/<([a-zA-Z_][\w-]*)\s*>/);
      if (!rootMatch) return null;
      
      const rootName = rootMatch[1];
      const endTag = `</${rootName}>`;
      const endPos = xml.indexOf(endTag);
      
      if (endPos === -1) return null;
      
      const content = xml.slice(rootMatch[0].length, endPos);
      
      // 解析子元素
      const result: Record<string, unknown> = {};
      this.parseChildren(content, result);
      
      return result;
    } catch {
      return null;
    }
  }

  /**
   * 解析子元素
   */
  private parseChildren(content: string, result: Record<string, unknown>): void {
    let remaining = content.trim();
    
    while (remaining.length > 0) {
      // 跳过空白
      remaining = remaining.trim();
      if (!remaining) break;
      
      if (remaining[0] !== '<') {
        break;
      }
      
      // 检查是否是 CDATA
      if (remaining.startsWith('<![CDATA[')) {
        const cdataEnd = remaining.indexOf(']]>');
        if (cdataEnd !== -1) {
          remaining = remaining.slice(cdataEnd + 3);
        }
        continue;
      }
      
      // 找到标签名结束位置
      let pos = 1;
      while (pos < remaining.length && !/\s|>/.test(remaining[pos]!)) {
        pos++;
      }
      
      const tagName = remaining.slice(1, pos);
      
      // 检查是否是自闭合标签
      if (remaining.slice(pos, pos + 2) === '/>') {
        result[tagName] = '';
        remaining = remaining.slice(pos + 2);
        continue;
      }
      
      // 跳过标签属性部分
      while (pos < remaining.length && remaining[pos] !== '>') {
        pos++;
      }
      
      if (pos >= remaining.length) break;
      
      pos++; // 跳过 >
      
      // 查找结束标签
      const endTag = `</${tagName}>`;
      const endPos = remaining.indexOf(endTag, pos);
      
      if (endPos === -1) {
        // 没有结束标签，获取到下一个标签之前的内容
        const nextTagPos = remaining.indexOf('<', pos);
        if (nextTagPos === -1) {
          result[tagName] = this.decodeXml(remaining.slice(pos).trim());
          break;
        } else {
          result[tagName] = this.decodeXml(remaining.slice(pos, nextTagPos).trim());
          remaining = remaining.slice(nextTagPos);
        }
      } else {
        const tagContent = remaining.slice(pos, endPos);
        
        // 检查是否包含 CDATA
        const cdataMatch = tagContent.match(/<!\[CDATA\[(.*?)\]\]>/s);
        if (cdataMatch) {
          // 有 CDATA，直接提取内容
          result[tagName] = cdataMatch[1];
        } else if (tagContent.includes('<')) {
          // 有子元素，递归解析
          const childResult: Record<string, unknown> = {};
          this.parseChildren(tagContent, childResult);
          result[tagName] = childResult;
        } else {
          // 纯文本内容
          result[tagName] = this.decodeXml(tagContent.trim());
        }
        
        remaining = remaining.slice(endPos + endTag.length);
      }
    }
  }

  /**
   * XML 实体解码
   */
  private decodeXml(text: string): string {
    if (!this.options.autoEscape) {
      return text;
    }

    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  /**
   * 验证消息格式并转换为具体类型
   */
  private validateMessage(data: Record<string, unknown>): AnyMessage | null {
    // 基础验证
    if (!data['MsgType']) {
      return null;
    }

    const msgType = String(data['MsgType']);
    
    // 转换基础字段
    const baseMessage = {
      ToUserName: String(data['ToUserName'] ?? ''),
      FromUserName: String(data['FromUserName'] ?? ''),
      CreateTime: this.toNumber(data['CreateTime']),
      MsgType: msgType,
    };

    // 根据消息类型验证
    switch (msgType) {
      case 'text':
        return {
          ...baseMessage,
          MsgType: 'text' as const,
          Content: String(data['Content'] ?? ''),
          MsgId: this.toNumber(data['MsgId']),
        };

      case 'image':
        return {
          ...baseMessage,
          MsgType: 'image' as const,
          PicUrl: String(data['PicUrl'] ?? ''),
          MediaId: String(data['MediaId'] ?? ''),
          MsgId: this.toNumber(data['MsgId']),
        };

      case 'voice':
        return {
          ...baseMessage,
          MsgType: 'voice' as const,
          MediaId: String(data['MediaId'] ?? ''),
          Format: String(data['Format'] ?? ''),
          Recognition: data['Recognition'] ? String(data['Recognition']) : undefined,
          MsgId: this.toNumber(data['MsgId']),
        };

      case 'video':
        return {
          ...baseMessage,
          MsgType: 'video' as const,
          MediaId: String(data['MediaId'] ?? ''),
          ThumbMediaId: String(data['ThumbMediaId'] ?? ''),
          MsgId: this.toNumber(data['MsgId']),
        };

      case 'shortvideo':
        return {
          ...baseMessage,
          MsgType: 'shortvideo' as const,
          MediaId: String(data['MediaId'] ?? ''),
          ThumbMediaId: String(data['ThumbMediaId'] ?? ''),
          MsgId: this.toNumber(data['MsgId']),
        };

      case 'location':
        return {
          ...baseMessage,
          MsgType: 'location' as const,
          Location_X: this.toNumber(data['Location_X']),
          Location_Y: this.toNumber(data['Location_Y']),
          Scale: this.toNumber(data['Scale']),
          Label: String(data['Label'] ?? ''),
          MsgId: this.toNumber(data['MsgId']),
        };

      case 'link':
        return {
          ...baseMessage,
          MsgType: 'link' as const,
          Title: String(data['Title'] ?? ''),
          Description: String(data['Description'] ?? ''),
          Url: String(data['Url'] ?? ''),
          MsgId: this.toNumber(data['MsgId']),
        };

      case 'event':
        return this.validateEvent(baseMessage, data);

      default:
        return null;
    }
  }

  /**
   * 验证事件消息
   */
  private validateEvent(baseMessage: any, data: Record<string, unknown>): AnyMessage | null {
    const event = String(data['Event'] ?? '');

    switch (event) {
      case 'subscribe':
      case 'unsubscribe':
        return {
          ...baseMessage,
          MsgType: 'event' as const,
          Event: event,
          EventKey: data['EventKey'] ? String(data['EventKey']) : undefined,
        };

      case 'SCAN':
        return {
          ...baseMessage,
          MsgType: 'event' as const,
          Event: 'SCAN',
          EventKey: String(data['EventKey'] ?? ''),
          Ticket: String(data['Ticket'] ?? ''),
        };

      case 'LOCATION':
        return {
          ...baseMessage,
          MsgType: 'event' as const,
          Event: 'LOCATION',
          Latitude: this.toNumber(data['Latitude']),
          Longitude: this.toNumber(data['Longitude']),
          Precision: this.toNumber(data['Precision']),
        };

      case 'CLICK':
        return {
          ...baseMessage,
          MsgType: 'event' as const,
          Event: 'CLICK',
          EventKey: String(data['EventKey'] ?? ''),
        };

      case 'VIEW':
        return {
          ...baseMessage,
          MsgType: 'event' as const,
          Event: 'VIEW',
          EventKey: String(data['EventKey'] ?? ''),
          MenuId: data['MenuId'] ? String(data['MenuId']) : undefined,
        };

      case 'SEND':
        return {
          ...baseMessage,
          MsgType: 'event' as const,
          Event: 'SEND',
          MsgID: this.toNumber(data['MsgID']),
          Status: String(data['Status'] ?? ''),
        };

      case 'kf_create_session':
      case 'kf_close_session':
      case 'kf_switch_session':
        return {
          ...baseMessage,
          MsgType: 'event' as const,
          Event: event,
          KfAccount: String(data['KfAccount'] ?? ''),
          SessionFrom: data['SessionFrom'] ? String(data['SessionFrom']) : undefined,
          WechatWork: data['WechatWork'] ? String(data['WechatWork']) : undefined,
        };

      case 'mp_order_pay':
        return {
          ...baseMessage,
          MsgType: 'event' as const,
          Event: 'mp_order_pay',
          OrderId: this.toNumber(data['OrderId']),
          OrderStatus: this.toNumber(data['OrderStatus']),
          ProductId: String(data['ProductId'] ?? ''),
        };

      case 'mp_weapp_audit_result':
        return {
          ...baseMessage,
          MsgType: 'event' as const,
          Event: 'mp_weapp_audit_result',
          FailTime: String(data['FailTime'] ?? ''),
          AuditResult: this.toNumber(data['AuditResult']),
          Reason: String(data['Reason'] ?? ''),
          NoticeId: String(data['NoticeId'] ?? ''),
          AuditId: this.toNumber(data['AuditId']),
        };

      default:
        return {
          ...baseMessage,
          MsgType: 'event' as const,
          Event: event,
        } as AnyMessage;
    }
  }

  /**
   * 转换为数字
   */
  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  /**
   * 创建错误对象
   */
  private createError(code: XmlParseError['code'], message: string, rawXml?: string): XmlParseResult {
    const error: XmlParseError = {
      code,
      message,
      rawXml: this.options.verbose ? rawXml : undefined,
    };

    if (this.options.verbose) {
      // eslint-disable-next-line no-console
      console.error('[XmlParser] Error:', error);
    }

    return {
      success: false,
      error,
    };
  }
}

/**
 * 便捷解析函数
 */
export function parseXml(xml: string, options?: XmlParseOptions): XmlParseResult {
  const parser = new XmlParser(options);
  return parser.parse(xml);
}

/**
 * 从 HTTP 请求体解析 XML
 */
export function parseXmlFromBody(body: string | Buffer, options?: XmlParseOptions): XmlParseResult {
  const xmlString = typeof body === 'string' ? body : body.toString('utf-8');
  return parseXml(xmlString, options);
}
