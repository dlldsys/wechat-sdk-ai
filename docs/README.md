# WeChat SDK

一个功能完善的 Node.js SDK，用于封装微信公众号与小程序所有开放接口。

## 特性

- 🚀 **零依赖** - 仅使用 Node.js 内置模块
- 📦 **TypeScript** - 完整类型定义
- 🔄 **自动Token管理** - 自动获取、缓存、刷新
- 🔒 **安全** - AES加密、签名验证、IP白名单
- 📝 **完整API覆盖** - 公众号+小程序全部接口
- 🐛 **Debug模式** - 详细日志输出
- 💾 **多缓存后端** - 内存、Redis、文件

## 安装

```bash
npm install wechat-sdk
```

## 快速开始

```typescript
import { WeChatSDK } from 'wechat-sdk';

// 方式1: 从环境变量加载
const sdk = WeChatSDK.fromEnv();

// 方式2: 从JSON文件加载
const sdk = WeChatSDK.fromJson('./wechat-config.json');

// 方式3: 从配置对象创建
const sdk = WeChatSDK.fromOptions({
  officialAccounts: {
    default: {
      appId: 'your-appid',
      appSecret: 'your-secret',
      token: 'your-token',
      encodingAESKey: 'your-aes-key',
    },
  },
  miniPrograms: {
    default: {
      appId: 'your-appid',
      appSecret: 'your-secret',
    },
  },
  debug: true,
  logLevel: 'debug',
});
```

## 小程序API

### 登录

```typescript
const mp = sdk.mp();

// 登录凭证校验
const { err, data } = await mp.code2Session(code);
if (!err) {
  console.log('openid:', data.openid);
  console.log('sessionKey:', data.sessionKey);
}
```

### 数据解密

```typescript
// 解密用户信息
const userInfo = mp.getUserInfo(sessionKey, encryptedData, iv);

// 解密手机号
const phone = mp.getPhoneNumber(sessionKey, encryptedData, iv);
```

### 订阅消息

```typescript
await mp.sendSubscribeMessage({
  touser: openid,
  template_id: 'template_id',
  page: '/pages/index',
  data: {
    thing1: { value: '内容' },
    time2: { value: '2024-01-01' },
  },
});
```

### 内容安全

```typescript
// 文本检测
const { data } = await mp.msgSecCheck('待检测内容');

// 图片检测
await mp.imgSecCheck(imageBuffer);
```

### 二维码

```typescript
// 获取小程序码
const { data: qrcode } = await mp.getQrCode({
  path: '/pages/index',
  width: 430,
});

// 无限制小程序码
const { data: qrcode } = await mp.getUnlimitedQrCode({
  scene: 'a=1&b=2',
  page: '/pages/index',
});
```

### URL Scheme/Link

```typescript
// 生成 URL Scheme
const { data: scheme } = await mp.generateUrlScheme({
  jump_wxa: { path: '/pages/index' },
  is_expire: true,
  expire_type: 1,
  expire_interval: 30,
});

// 生成 URL Link
const { data: link } = await mp.generateUrlLink({
  path: '/pages/index',
  is_expire: true,
  expire_type: 1,
  expire_interval: 30,
});
```

### 云调用

```typescript
// 调用云函数
const { data } = await mp.invokeCloudFunction('env-id', 'functionName', {
  param: 'value',
});
```

## 公众号API

### 菜单管理

```typescript
const official = sdk.official();

// 创建菜单
await official.createMenu({
  button: [
    { type: 'click', name: '菜单1', key: 'menu1' },
    { type: 'view', name: '菜单2', url: 'https://example.com' },
  ],
});

// 删除菜单
await official.deleteMenu();
```

### 模板消息

```typescript
await official.sendTemplateMessage({
  touser: openid,
  template_id: 'template_id',
  url: 'https://example.com',
  data: {
    first: { value: '您好', color: '#173177' },
    keyword1: { value: '内容' },
    remark: { value: '感谢使用' },
  },
});
```

### 客服消息

```typescript
// 发送文本消息
await official.sendKFText(openid, '您好');

// 发送图片消息
await official.sendKFText(openid, 'media_id');
```

### 用户管理

```typescript
// 获取用户信息
const { data } = await official.getUserInfo(openid);

// 获取用户列表
const { data } = await official.user.getUserList(accessToken);
```

### OAuth授权

```typescript
// 获取授权URL
const url = official.getOAuthUrl(redirectUri, 'snsapi_userinfo', 'state');

// 获取访问令牌
const { data } = await official.getOAuthAccessToken(code);

// 获取用户信息
const userInfo = await official.oauth.getUserInfo(data.accessToken, data.openid);
```

### JS-SDK

```typescript
// 获取JS-SDK配置
const { data: config } = await official.getJsApiConfig(url);
// 返回给前端使用
```

## 缓存配置

### 内存缓存（默认）

```typescript
const sdk = new WeChatSDK();
```

### Redis缓存

```typescript
import { createRedisCache } from 'wechat-sdk';

const cache = createRedisCache({
  host: 'localhost',
  port: 6379,
  password: 'password',
  db: 0,
});

const sdk = new WeChatSDK({ cache });
```

### 文件缓存

```typescript
import { FileCache } from 'wechat-sdk';

const cache = createRedisCache({
  host: 'localhost',
  port: 6379,
  password: 'password',
  db: 0,
});

const sdk = new WeChatSDK({ cache });
```

### 文件缓存

```typescript
import { FileCache } from 'wechat-sdk';

const cache = new FileCache('/path/to/cache');
const sdk = new WeChatSDK({ cache });
```

## Debug模式

```typescript
// 初始化时开启
const sdk = new WeChatSDK({ debug: true, logLevel: 'debug' });

// 运行时开启
sdk.setDebug(true);
sdk.setLogLevel('debug');
```

## 环境变量

```bash
# 公众号配置
WECHAT_OFFICIAL_APPID=wx1234567890
WECHAT_OFFICIAL_SECRET=your_secret
WECHAT_OFFICIAL_TOKEN=your_token
WECHAT_OFFICIAL_AES_KEY=your_aes_key

# 小程序配置
WECHAT_MINI_APPID=wx1234567890
WECHAT_MINI_SECRET=your_secret

# 调试配置
WECHAT_DEBUG=true
WECHAT_LOG_LEVEL=debug
```

## 多应用配置

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

// 使用指定应用
sdk.official('app2').getAccessToken();
sdk.mp('mp2').code2Session(code);
```

## 安全模块

### 消息加解密

```typescript
import { WxCrypto } from 'wechat-sdk';

const crypto = new WxCrypto(appId, token, encodingAESKey);

// 解密消息
const message = crypto.decryptMessage(encrypted, signature, timestamp, nonce);

// 加密消息
const encrypted = crypto.encryptMessage(message, timestamp, nonce);
```

### 签名验证

```typescript
import { verifyWeChatSignature } from 'wechat-sdk';

const valid = verifyWeChatSignature({
  signature,
  timestamp,
  nonce,
  token,
});
```

### IP白名单

```typescript
import { IPWhitelist, isWeChatIP } from 'wechat-sdk';

const whitelist = new IPWhitelist();
whitelist.add('1.2.3.4');

// 检查是否允许
whitelist.isAllowed('1.2.3.4'); // true

// 检查是否为微信IP
isWeChatIP('101.226.103.1'); // true
```

## API参考

### 小程序API

| 方法 | 说明 |
|------|------|
| `code2Session(code)` | 登录凭证校验 |
| `getUserInfo(sessionKey, encryptedData, iv)` | 解密用户信息 |
| `getPhoneNumber(sessionKey, encryptedData, iv)` | 解密手机号 |
| `sendSubscribeMessage(message)` | 发送订阅消息 |
| `sendUniformMessage(message)` | 发送统一服务消息 |
| `imgSecCheck(media)` | 图片内容安全 |
| `msgSecCheck(content, openid?, scene?)` | 文本内容安全 |
| `getQrCode(options)` | 获取小程序码 |
| `getUnlimitedQrCode(options)` | 获取无限制小程序码 |
| `generateUrlScheme(options)` | 生成URL Scheme |
| `generateUrlLink(options)` | 生成URL Link |
| `invokeCloudFunction(env, name, data)` | 调用云函数 |

### 公众号API

| 方法 | 说明 |
|------|------|
| `getAccessToken()` | 获取访问令牌 |
| `createMenu(menu)` | 创建菜单 |
| `deleteMenu()` | 删除菜单 |
| `sendTemplateMessage(message)` | 发送模板消息 |
| `sendKFText(openid, content)` | 发送客服文本 |
| `getUserInfo(openid)` | 获取用户信息 |
| `getOAuthUrl(redirect, scope, state)` | 获取OAuth URL |
| `getOAuthAccessToken(code)` | 获取OAuth令牌 |
| `getJsApiConfig(url)` | 获取JS-SDK配置 |

## 示例项目

### Express 公众号网关

```bash
cd examples/express-official
npm install
npm run dev
```

### Koa 小程序服务

```bash
cd examples/koa-miniprogram
npm install
npm run dev
```

## Docker部署

```bash
docker-compose up -d
```

## 开发

```bash
# 安装依赖
npm install

# 类型检查
npm run typecheck

# 构建
npm run build

# 测试
npm test

# 测试覆盖率
npm run test:coverage
```

## License

MIT
