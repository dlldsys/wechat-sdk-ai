# WeChat SDK 使用指南

## 目录

1. [简介](#简介)
2. [安装](#安装)
3. [快速开始](#快速开始)
4. [配置管理](#配置管理)
5. [小程序开发](#小程序开发)
6. [公众号开发](#公众号开发)
7. [缓存配置](#缓存配置)
8. [安全功能](#安全功能)
9. [调试与日志](#调试与日志)
10. [常见问题](#常见问题)

## 简介

WeChat SDK 是一个功能完善的 Node.js SDK，用于封装微信公众号与小程序所有开放接口。

### 主要特性

- 🚀 **零依赖** - 仅使用 Node.js 内置模块
- 📦 **TypeScript** - 完整类型定义，智能提示
- 🔄 **自动Token管理** - 自动获取、缓存、刷新 access_token
- 🔒 **安全** - AES加密、签名验证、IP白名单
- 📝 **完整API覆盖** - 公众号+小程序全部接口
- 🐛 **Debug模式** - 详细日志输出，方便调试
- 💾 **多缓存后端** - 内存、Redis、文件三种缓存方式
- 🎯 **统一响应格式** - 所有接口返回 `{ err, data }` 格式

## 安装

### 使用 npm

```bash
npm install wechat-sdk
```

### 使用 yarn

```bash
yarn add wechat-sdk
```

### 使用 pnpm

```bash
pnpm add wechat-sdk
```

## 快速开始

### 方式一：从环境变量加载

```bash
# .env 文件
WECHAT_OFFICIAL_APPID=wx1234567890abcdef
WECHAT_OFFICIAL_SECRET=your_secret_here
WECHAT_OFFICIAL_TOKEN=your_token_here
WECHAT_OFFICIAL_AES_KEY=your_aes_key_here

WECHAT_MINI_APPID=wx1234567890abcdef
WECHAT_MINI_SECRET=your_secret_here

WECHAT_DEBUG=true
WECHAT_LOG_LEVEL=debug
```

```typescript
import { WeChatSDK } from 'wechat-sdk';

const sdk = WeChatSDK.fromEnv();
```

### 方式二：从JSON文件加载

```json
// wechat-config.json
{
  "officialAccounts": {
    "default": {
      "appId": "wx1234567890abcdef",
      "appSecret": "your_secret_here",
      "token": "your_token_here",
      "encodingAESKey": "your_aes_key_here"
    }
  },
  "miniPrograms": {
    "default": {
      "appId": "wx1234567890abcdef",
      "appSecret": "your_secret_here"
    }
  },
  "debug": true,
  "logLevel": "debug"
}
```

```typescript
import { WeChatSDK } from 'wechat-sdk';

const sdk = WeChatSDK.fromJson('./wechat-config.json');
```

### 方式三：从配置对象创建

```typescript
import { WeChatSDK } from 'wechat-sdk';

const sdk = WeChatSDK.fromOptions({
  officialAccounts: {
    default: {
      appId: 'wx1234567890abcdef',
      appSecret: 'your_secret_here',
      token: 'your_token_here',
      encodingAESKey: 'your_aes_key_here',
    },
  },
  miniPrograms: {
    default: {
      appId: 'wx1234567890abcdef',
      appSecret: 'your_secret_here',
    },
  },
  debug: true,
  logLevel: 'debug',
});
```

## 配置管理

### 多应用配置

SDK 支持同时配置多个公众号和小程序：

```typescript
const sdk = new WeChatSDK({
  officialAccounts: {
    app1: { appId: 'wx111', appSecret: 'secret1' },
    app2: { appId: 'wx222', appSecret: 'secret2' },
  },
  miniPrograms: {
    mp1: { appId: 'wx333', appSecret: 'secret3' },
    mp2: { appId: 'wx444', appSecret: 'secret4' },
  },
  defaultOfficialAccount: 'app1',
  defaultMiniProgram: 'mp1',
});

// 使用默认应用
sdk.official().getAccessToken();
sdk.mp().code2Session(code);

// 使用指定应用
sdk.official('app2').getAccessToken();
sdk.mp('mp2').code2Session(code);
```

### 运行时添加/删除应用

```typescript
// 添加新公众号
const newOfficial = sdk.addOfficialAccount('new-app', {
  appId: 'wx999',
  appSecret: 'new_secret',
});

// 添加新小程序
const newMP = sdk.addMiniProgram('new-mp', {
  appId: 'wx888',
  appSecret: 'new_mp_secret',
});

// 删除应用
sdk.removeOfficialAccount('app1');
sdk.removeMiniProgram('mp1');
```

### 更新配置

```typescript
// 更新公众号配置
const official = sdk.official();
sdk.config.updateOfficialAccount('default', {
  appSecret: 'new_secret',
});

// 更新小程序配置
const mp = sdk.mp();
sdk.config.updateMiniProgram('default', {
  appSecret: 'new_mp_secret',
});
```

## 小程序开发

### 用户登录

```typescript
const mp = sdk.mp();

// 1. 前端调用 wx.login() 获取 code
// 2. 后端使用 code 换取 openid 和 session_key
const { err, data } = await mp.code2Session(code);

if (err) {
  console.error('登录失败:', err.errmsg);
  return;
}

console.log('openid:', data.openid);
console.log('sessionKey:', data.sessionKey);
console.log('unionid:', data.unionid);

// 3. 将 sessionKey 存储到数据库或缓存
await saveSession(data.openid, data.sessionKey);
```

### 数据解密

#### 解密用户信息

```typescript
// 前端调用 wx.getUserProfile() 获取加密数据
const sessionKey = await getSessionKey(openid);
const { err, data } = await mp.getUserInfo(sessionKey, encryptedData, iv);

if (err) {
  console.error('解密失败:', err.errmsg);
  return;
}

console.log('用户昵称:', data.nickName);
console.log('头像:', data.avatarUrl);
console.log('性别:', data.gender);
```

#### 解密手机号

```typescript
// 前端调用 wx.getPhoneNumber() 获取加密数据
const sessionKey = await getSessionKey(openid);
const { err, data } = await mp.getPhoneNumber(sessionKey, encryptedData, iv);

if (err) {
  console.error('解密失败:', err.errmsg);
  return;
}

console.log('手机号:', data.phoneNumber);
console.log('纯手机号:', data.purePhoneNumber);
console.log('国家代码:', data.countryCode);
```

### 订阅消息

```typescript
// 发送订阅消息
const { err } = await mp.sendSubscribeMessage({
  touser: 'user_openid',
  template_id: 'template_id',
  page: '/pages/index',
  data: {
    thing1: { value: '订单已发货' },
    time2: { value: '2024-01-01 10:00' },
    thing3: { value: '顺丰快递' },
  },
  miniprogram_state: 'formal',
});

if (err) {
  console.error('发送失败:', err.errmsg);
  return;
}

console.log('发送成功');
```

### 内容安全

```typescript
// 文本内容检测
const { err, data } = await mp.msgSecCheck('待检测的文本内容');

if (err) {
  console.error('检测失败:', err.errmsg);
  return;
}

if (data.suggest === 'pass') {
  console.log('内容安全');
} else if (data.suggest === 'review') {
  console.log('内容需要人工审核');
} else {
  console.log('内容违规');
}

// 图片内容检测
const imageBuffer = fs.readFileSync('test.jpg');
const { err } = await mp.imgSecCheck(imageBuffer);

if (err) {
  console.error('图片违规');
}
```

### 生成小程序码

```typescript
// 获取小程序码
const { err, data: qrcode } = await mp.getQrCode({
  path: '/pages/index',
  width: 430,
  auto_color: false,
  line_color: { r: 0, g: 0, b: 0 },
  is_hyaline: true,
});

if (err) {
  console.error('生成失败:', err.errmsg);
  return;
}

// 保存图片
fs.writeFileSync('qrcode.png', qrcode);
```

### 生成 URL Scheme

```typescript
// 生成 URL Scheme（用于短信、邮件等外部场景）
const { err, data: scheme } = await mp.generateUrlScheme({
  jump_wxa: {
    path: '/pages/index',
    query: 'id=123',
    env_version: 'release',
  },
  is_expire: true,
  expire_type: 1,
  expire_interval: 30, // 30天后过期
});

if (err) {
  console.error('生成失败:', err.errmsg);
  return;
}

console.log('URL Scheme:', scheme);
// weixin://dl/business/?t=xxxxx
```

### 云函数调用

```typescript
// 调用云函数
const { err, data } = await mp.invokeCloudFunction(
  'env-id',
  'function-name',
  { param: 'value' }
);

if (err) {
  console.error('调用失败:', err.errmsg);
  return;
}

console.log('云函数返回:', data);
```

## 公众号开发

### 获取 Access Token

SDK 会自动管理 access_token，无需手动获取：

```typescript
const official = sdk.official();

// SDK 自动获取并缓存 token
const { err, data } = await official.getAccessToken();

if (err) {
  console.error('获取失败:', err.errmsg);
  return;
}

console.log('Access Token:', data.accessToken);
console.log('过期时间:', data.expiresIn, '秒');
```

### 自定义菜单

```typescript
// 创建菜单
const { err } = await official.createMenu({
  button: [
    {
      type: 'click',
      name: '今日歌曲',
      key: 'V1001_TODAY_MUSIC',
    },
    {
      name: '菜单',
      sub_button: [
        {
          type: 'view',
          name: '搜索',
          url: 'http://www.soso.com/',
        },
        {
          type: 'view',
          name: '视频',
          url: 'http://v.qq.com/',
        },
      ],
    },
  ],
});

if (err) {
  console.error('创建失败:', err.errmsg);
  return;
}

console.log('菜单创建成功');
```

### 模板消息

```typescript
// 发送模板消息
const { err, data } = await official.sendTemplateMessage({
  touser: 'user_openid',
  template_id: 'template_id',
  url: 'https://example.com/detail',
  data: {
    first: { value: '您好，您有一条新消息', color: '#173177' },
    keyword1: { value: '订单编号：123456' },
    keyword2: { value: '2024-01-01 10:00' },
    remark: { value: '点击查看详情' },
  },
});

if (err) {
  console.error('发送失败:', err.errmsg);
  return;
}

console.log('发送成功，消息ID:', data.msgid);
```

### 客服消息

```typescript
// 发送文本消息
await official.sendKFText('user_openid', '您好，有什么可以帮您的吗？');

// 发送图片消息
await official.sendKFImage('user_openid', 'media_id');

// 发送图文消息
await official.sendKFNews('user_openid', [
  {
    title: '图文标题',
    description: '图文描述',
    url: 'https://example.com',
    picurl: 'https://example.com/image.jpg',
  },
]);
```

### 用户管理

```typescript
// 获取用户基本信息
const { err, data } = await official.getUserInfo('user_openid');

if (err) {
  console.error('获取失败:', err.errmsg);
  return;
}

console.log('用户昵称:', data.nickname);
console.log('用户头像:', data.headimgurl);
console.log('关注状态:', data.subscribe);

// 获取用户列表
const { data: userList } = await official.user.getUserList(accessToken);
console.log('用户总数:', userList.total);
```

### OAuth 网页授权

```typescript
// 1. 生成授权 URL
const redirectUri = 'https://your-domain.com/callback';
const url = official.getOAuthUrl(redirectUri, 'snsapi_userinfo', 'state123');

// 重定向用户到授权页面
res.redirect(url);

// 2. 回调处理授权码
const { err, data } = await official.getOAuthAccessToken(code);

if (err) {
  console.error('授权失败:', err.errmsg);
  return;
}

// 3. 获取用户信息
const { data: userInfo } = await official.oauth.getUserInfo(
  data.accessToken,
  data.openid
);

console.log('用户昵称:', userInfo.nickname);
console.log('用户头像:', userInfo.headimgurl);
```

### JS-SDK 配置

```typescript
// 获取 JS-SDK 配置
const { err, data: config } = await official.getJsApiConfig(
  'https://your-domain.com/page'
);

if (err) {
  console.error('获取失败:', err.errmsg);
  return;
}

// 返回给前端使用
res.json({
  appId: config.appId,
  timestamp: config.timestamp,
  nonceStr: config.nonceStr,
  signature: config.signature,
  jsApiList: config.jsApiList,
});
```

## 缓存配置

### 内存缓存（默认）

```typescript
const sdk = new WeChatSDK();
// 默认使用内存缓存，无需配置
```

### Redis 缓存（推荐生产环境）

```typescript
import { createRedisCache } from 'wechat-sdk';

const cache = createRedisCache({
  host: 'localhost',
  port: 6379,
  password: 'your_password',
  db: 0,
  prefix: 'wechat:',
  ttl: 7200,
});

const sdk = new WeChatSDK({ cache });
```

### 文件缓存

```typescript
import { FileCache } from 'wechat-sdk';

const cache = new FileCache('/path/to/cache', 7200);
const sdk = new WeChatSDK({ cache });
```

## 安全功能

### 消息加解密

```typescript
import { WxCrypto } from 'wechat-sdk';

const crypto = new WxCrypto(appId, token, encodingAESKey);

// 解密消息
const message = crypto.decryptMessage(encrypted, signature, timestamp, nonce);
console.log('解密后的消息:', message);

// 加密消息
const encrypted = crypto.encryptMessage(message, timestamp, nonce);
console.log('加密后的消息:', encrypted);
```

### 签名验证

```typescript
import { verifyWeChatSignature } from 'wechat-sdk';

// 验证微信服务器签名
const valid = verifyWeChatSignature({
  signature: req.query.signature,
  timestamp: req.query.timestamp,
  nonce: req.query.nonce,
  token: 'your_token',
});

if (valid) {
  console.log('签名验证通过');
  res.send(req.query.echostr);
} else {
  console.log('签名验证失败');
  res.status(403).send('Invalid signature');
}
```

### IP 白名单

```typescript
import { IPWhitelist, isWeChatIP, createIPMiddleware } from 'wechat-sdk';

// 创建白名单
const whitelist = new IPWhitelist({
  enabled: true,
});

// 添加允许的 IP
whitelist.add('1.2.3.4');
whitelist.add('5.6.7.8');

// 检查 IP 是否允许
if (whitelist.isAllowed('1.2.3.4')) {
  console.log('IP 允许访问');
}

// 检查是否为微信服务器 IP
if (isWeChatIP('101.226.103.1')) {
  console.log('这是微信服务器 IP');
}

// 使用中间件
app.use(createIPMiddleware(whitelist));
```

## 调试与日志

### 开启 Debug 模式

```typescript
// 初始化时开启
const sdk = new WeChatSDK({ debug: true, logLevel: 'debug' });

// 运行时开启
sdk.setDebug(true);
sdk.setLogLevel('debug');
```

### 日志级别

```typescript
// debug: 最详细的日志
// info: 一般信息
// warn: 警告信息
// error: 仅错误信息

sdk.setLogLevel('info');
```

### 多实例日志隔离

SDK 会为每个应用创建独立的日志实例，日志输出会带上应用前缀：

```
[2024-01-01T10:00:00.000Z] [INFO] [official:default] Request started
[2024-01-01T10:00:00.001Z] [INFO] [mp:default] Code2Session called
```

## 常见问题

### Q1: 如何获取 access_token？

SDK 会自动管理 access_token，无需手动获取。如果需要查看：

```typescript
const { data } = await sdk.official().getAccessToken();
console.log(data.accessToken);
```

### Q2: Token 过期了怎么办？

SDK 会自动检测并刷新过期的 token，无需手动处理。

### Q3: 如何处理并发请求？

SDK 内部使用分布式锁机制，确保同一时间只有一个请求在刷新 token。

### Q4: 如何提高性能？

1. 使用 Redis 缓存代替内存缓存
2. 合理设置 token 缓存时间
3. 使用批量接口减少请求次数

### Q5: 如何调试？

1. 开启 debug 模式查看详细日志
2. 使用 Mock 服务器进行本地测试
3. 查看错误码和错误消息

### Q6: 错误码含义？

常见错误码：

- `40001`: AppSecret 错误
- `40014`: access_token 无效
- `42001`: access_token 过期
- `45009`: 接口调用超过限制
- `45011`: 频率限制

完整错误码请参考微信官方文档。

### Q7: 如何处理回调？

公众号消息回调需要验证签名并解密消息：

```typescript
import { verifyWeChatSignature, WxCrypto } from 'wechat-sdk';

// 1. 验证签名
const valid = verifyWeChatSignature({
  signature: req.query.signature,
  timestamp: req.query.timestamp,
  nonce: req.query.nonce,
  token: official.token,
});

if (!valid) {
  return res.status(403).send('Invalid signature');
}

// 2. 解密消息
const crypto = new WxCrypto(
  official.appId,
  official.token,
  official.encodingAESKey
);

const message = crypto.decryptMessage(
  req.body.Encrypt,
  req.body.MsgSignature,
  req.body.TimeStamp,
  req.body.Nonce
);

// 3. 处理消息
console.log('收到消息:', message);
```

## 更多资源

- [微信官方文档](https://developers.weixin.qq.com/doc/)
- [微信公众号 API](https://developers.weixin.qq.com/doc/offiaccount/)
- [小程序 API](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [示例项目](../examples/)

## 许可证

MIT License
