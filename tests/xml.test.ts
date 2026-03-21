import { describe, it, expect } from 'vitest';
import { parseXml, parseXmlFromBody, XmlParser } from '../src/xml';

describe('XmlParser', () => {
  describe('parseXml', () => {
    it('should parse text message', () => {
      const xml = '<xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>1234567890</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[Hello]]></Content><MsgId>1234567890123456</MsgId></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ToUserName: 'toUser',
        FromUserName: 'fromUser',
        CreateTime: 1234567890,
        MsgType: 'text',
        Content: 'Hello',
        MsgId: 1234567890123456,
      });
    });

    it('should parse image message', () => {
      const xml = '<xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>1234567890</CreateTime><MsgType><![CDATA[image]]></MsgType><PicUrl><![CDATA[http://example.com/image.jpg]]></PicUrl><MediaId><![CDATA[media_id]]></MediaId><MsgId>1234567890123456</MsgId></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data?.MsgType).toBe('image');
      expect(result.data).toHaveProperty('PicUrl');
      expect(result.data).toHaveProperty('MediaId');
    });

    it('should parse voice message', () => {
      const xml = '<xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>1234567890</CreateTime><MsgType><![CDATA[voice]]></MsgType><MediaId><![CDATA[media_id]]></MediaId><Format><![CDATA[amr]]></Format><MsgId>1234567890123456</MsgId></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data?.MsgType).toBe('voice');
      expect(result.data).toHaveProperty('MediaId');
      expect(result.data).toHaveProperty('Format');
    });

    it('should parse video message', () => {
      const xml = '<xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>1234567890</CreateTime><MsgType><![CDATA[video]]></MsgType><MediaId><![CDATA[media_id]]></MediaId><ThumbMediaId><![CDATA[thumb_media_id]]></ThumbMediaId><MsgId>1234567890123456</MsgId></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data?.MsgType).toBe('video');
    });

    it('should parse location message', () => {
      const xml = '<xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>1234567890</CreateTime><MsgType><![CDATA[location]]></MsgType><Location_X>23.134521</Location_X><Location_Y>113.358803</Location_Y><Scale>20</Scale><Label><![CDATA[位置信息]]></Label><MsgId>1234567890123456</MsgId></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data?.MsgType).toBe('location');
      expect(result.data).toHaveProperty('Location_X');
      expect(result.data).toHaveProperty('Location_Y');
    });

    it('should parse link message', () => {
      const xml = '<xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>1234567890</CreateTime><MsgType><![CDATA[link]]></MsgType><Title><![CDATA[标题]]></Title><Description><![CDATA[描述]]></Description><Url><![CDATA[http://example.com]]></Url><MsgId>1234567890123456</MsgId></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data?.MsgType).toBe('link');
      expect(result.data).toHaveProperty('Title');
      expect(result.data).toHaveProperty('Description');
      expect(result.data).toHaveProperty('Url');
    });

    it('should parse subscribe event', () => {
      const xml = '<xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>1234567890</CreateTime><MsgType><![CDATA[event]]></MsgType><Event><![CDATA[subscribe]]></Event></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data?.MsgType).toBe('event');
      expect(result.data).toHaveProperty('Event', 'subscribe');
    });

    it('should parse subscribe event with event key', () => {
      const xml = '<xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>1234567890</CreateTime><MsgType><![CDATA[event]]></MsgType><Event><![CDATA[subscribe]]></Event><EventKey><![CDATA[qrscene_123]]></EventKey></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('Event', 'subscribe');
      expect(result.data).toHaveProperty('EventKey', 'qrscene_123');
    });

    it('should parse scan event', () => {
      const xml = '<xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>1234567890</CreateTime><MsgType><![CDATA[event]]></MsgType><Event><![CDATA[SCAN]]></Event><EventKey><![CDATA[scene_id]]></EventKey><Ticket><![CDATA[ticket]]></Ticket></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('Event', 'SCAN');
      expect(result.data).toHaveProperty('EventKey', 'scene_id');
      expect(result.data).toHaveProperty('Ticket', 'ticket');
    });

    it('should parse location event', () => {
      const xml = '<xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>1234567890</CreateTime><MsgType><![CDATA[event]]></MsgType><Event><![CDATA[LOCATION]]></Event><Latitude>23.134521</Latitude><Longitude>113.358803</Longitude><Precision>30</Precision></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('Event', 'LOCATION');
      expect(result.data).toHaveProperty('Latitude', 23.134521);
      expect(result.data).toHaveProperty('Longitude', 113.358803);
    });

    it('should parse click event', () => {
      const xml = '<xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>1234567890</CreateTime><MsgType><![CDATA[event]]></MsgType><Event><![CDATA[CLICK]]></Event><EventKey><![CDATA[V1001_GOOD]]></EventKey></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('Event', 'CLICK');
      expect(result.data).toHaveProperty('EventKey', 'V1001_GOOD');
    });

    it('should parse view event', () => {
      const xml = '<xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>1234567890</CreateTime><MsgType><![CDATA[event]]></MsgType><Event><![CDATA[VIEW]]></Event><EventKey><![CDATA[http://example.com]]></EventKey></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('Event', 'VIEW');
      expect(result.data).toHaveProperty('EventKey', 'http://example.com');
    });

    it('should decode XML entities', () => {
      const xml = '<xml><ToUserName>toUser</ToUserName><FromUserName>fromUser</FromUserName><CreateTime>1234567890</CreateTime><MsgType>text</MsgType><Content>&lt;script&gt;alert(\'xss\')&lt;/script&gt;</Content><MsgId>1234567890123456</MsgId></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data?.Content).toBe("<script>alert('xss')</script>");
    });

    it('should handle empty XML', () => {
      const result = parseXml('');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_XML');
    });

    it('should handle invalid XML', () => {
      const xml = '<xml><ToUserName>toUser</ToUserName>';

      const result = parseXml(xml);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PARSE_ERROR');
    });

    it('should handle XML without MsgType', () => {
      const xml = '<xml><ToUserName>toUser</ToUserName><FromUserName>fromUser</FromUserName><CreateTime>1234567890</CreateTime></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FORMAT');
    });
  });

  describe('parseXmlFromBody', () => {
    it('should parse from string body', () => {
      const body = '<xml><ToUserName>toUser</ToUserName><FromUserName>fromUser</FromUserName><CreateTime>1234567890</CreateTime><MsgType>text</MsgType><Content>Hello</Content><MsgId>123</MsgId></xml>';

      const result = parseXmlFromBody(body);

      expect(result.success).toBe(true);
      expect(result.data?.Content).toBe('Hello');
    });

    it('should parse from Buffer body', () => {
      const body = Buffer.from('<xml><ToUserName>toUser</ToUserName><FromUserName>fromUser</FromUserName><CreateTime>1234567890</CreateTime><MsgType>text</MsgType><Content>Hello</Content><MsgId>123</MsgId></xml>');

      const result = parseXmlFromBody(body);

      expect(result.success).toBe(true);
      expect(result.data?.Content).toBe('Hello');
    });
  });

  describe('XmlParser class', () => {
    it('should create parser with options', () => {
      const parser = new XmlParser({
        verbose: true,
        autoEscape: false,
        ignoreNamespace: false,
      });

      const xml = '<xml><ToUserName>toUser</ToUserName><FromUserName>fromUser</FromUserName><CreateTime>123</CreateTime><MsgType>text</MsgType><Content>Hello</Content><MsgId>123</MsgId></xml>';

      const result = parser.parse(xml);

      expect(result.success).toBe(true);
    });

    it('should disable auto escape', () => {
      const parser = new XmlParser({ autoEscape: false });

      const xml = '<xml><ToUserName>toUser</ToUserName><FromUserName>fromUser</FromUserName><CreateTime>123</CreateTime><MsgType>text</MsgType><Content>&lt;test&gt;</Content><MsgId>123</MsgId></xml>';

      const result = parser.parse(xml);

      expect(result.success).toBe(true);
      expect(result.data?.Content).toBe('&lt;test&gt;');
    });

    it('should handle numeric conversion', () => {
      const parser = new XmlParser();

      const xml = '<xml><ToUserName>toUser</ToUserName><FromUserName>fromUser</FromUserName><CreateTime>1234567890</CreateTime><MsgType>text</MsgType><Content>Hello</Content><MsgId>1234567890123456</MsgId></xml>';

      const result = parser.parse(xml);

      expect(result.success).toBe(true);
      expect(typeof result.data?.CreateTime).toBe('number');
      expect(typeof result.data?.MsgId).toBe('number');
    });
  });

  describe('template message send result event', () => {
    it('should parse template send result event', () => {
      const xml = '<xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>1234567890</CreateTime><MsgType><![CDATA[event]]></MsgType><Event><![CDATA[SEND]]></Event><MsgID>1234567890</MsgID><Status><![CDATA[success]]></Status></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('Event', 'SEND');
      expect(result.data).toHaveProperty('MsgID', 1234567890);
      expect(result.data).toHaveProperty('Status', 'success');
    });
  });

  describe('kf session event', () => {
    it('should parse kf session event', () => {
      const xml = '<xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>1234567890</CreateTime><MsgType><![CDATA[event]]></MsgType><Event><![CDATA[kf_create_session]]></Event><KfAccount><![CDATA[test@account]]></KfAccount><SessionFrom><![CDATA[fromUser]]></SessionFrom></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('Event', 'kf_create_session');
      expect(result.data).toHaveProperty('KfAccount', 'test@account');
    });
  });

  describe('edge cases', () => {
    it('should handle CDATA without content', () => {
      const xml = '<xml><ToUserName><![CDATA[]]></ToUserName><FromUserName>fromUser</FromUserName><CreateTime>123</CreateTime><MsgType>text</MsgType><Content>Hello</Content><MsgId>123</MsgId></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
    });

    it('should handle nested elements', () => {
      const xml = '<xml><ToUserName>toUser</ToUserName><FromUserName>fromUser</FromUserName><CreateTime>123</CreateTime><MsgType>text</MsgType><Content><line1>Hello</line1><line2>World</line2></Content><MsgId>123</MsgId></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      // 嵌套元素会被解析，但 Content 会被转换为字符串
      expect(result.data?.Content).toBeDefined();
    });

    it('should handle XML declaration', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><xml><ToUserName>toUser</ToUserName><FromUserName>fromUser</FromUserName><CreateTime>123</CreateTime><MsgType>text</MsgType><Content>Hello</Content><MsgId>123</MsgId></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(true);
      expect(result.data?.Content).toBe('Hello');
    });

    it('should handle namespace', () => {
      const xml = '<xml xmlns="http://example.com"><ToUserName>toUser</ToUserName><FromUserName>fromUser</FromUserName><CreateTime>123</CreateTime><MsgType>text</MsgType><Content>Hello</Content><MsgId>123</MsgId></xml>';

      const parser = new XmlParser({ ignoreNamespace: true });
      const result = parser.parse(xml);

      expect(result.success).toBe(true);
      expect(result.data?.Content).toBe('Hello');
    });

    it('should handle unknown message type', () => {
      const xml = '<xml><ToUserName>toUser</ToUserName><FromUserName>fromUser</FromUserName><CreateTime>123</CreateTime><MsgType>unknown</MsgType><MsgId>123</MsgId></xml>';

      const result = parseXml(xml);

      expect(result.success).toBe(false);
    });
  });
});
