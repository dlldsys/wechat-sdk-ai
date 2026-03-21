# wechat-sdk-ai

[![npm version](https://badge.fury.io/js/wechat-sdk-ai.svg)](https://badge.fury.io/js/wechat-sdk-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

一个全面的 Node.js 微信开发 SDK，支持微信公众号和小程序，零依赖，TypeScript 开发。

## Features

- 🚀 **Zero Dependencies** - Uses only Node.js built-in modules
- 📦 **TypeScript** - Full type definitions included
- 🔄 **Auto Token Management** - Automatic token refresh with caching
- 🔒 **Security** - AES encryption, signature verification, IP whitelist
- 📝 **Complete API Coverage** - All official WeChat APIs
- 🐛 **Debug Mode** - Detailed logging for troubleshooting
- 💾 **Multiple Cache Backends** - Memory, Redis, File

## 📦 安装

```bash
npm install wechat-sdk-ai
```

## 🔧 快速开始

### 公众号

```typescript
import { WeChatSDK } from 'wechat-sdk-ai';

// From environment variables
const sdk = WeChatSDK.fromEnv();

// Or from options
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
});
```

## 小程序

```typescript
// Login
const { err, data } = await sdk.mp().code2Session(code);

// Decrypt user data
const userInfo = sdk.mp().getUserInfo(sessionKey, encryptedData, iv);

// Send subscribe message
await sdk.mp().sendSubscribeMessage({
  touser: openid,
  template_id: 'template_id',
  data: { thing1: { value: 'value' } },
});

// Generate QR code
const { data: qrcode } = await sdk.mp().getQrCode({ path: '/pages/index' });

// Content security
const { data } = await sdk.mp().msgSecCheck('content to check');
```

## 公众号

```typescript
// Get access token
const { data } = await sdk.official().getAccessToken();

// Create menu
await sdk.official().createMenu({
  button: [
    { type: 'click', name: 'Menu', key: 'menu1' },
  ],
});

// Send template message
await sdk.official().sendTemplateMessage({
  touser: openid,
  template_id: 'template_id',
  data: { key: { value: 'value' } },
});

// OAuth
const url = sdk.official().getOAuthUrl(redirectUri, 'snsapi_userinfo');
const { data } = await sdk.official().getOAuthAccessToken(code);

// JS-SDK config
const { data: config } = await sdk.official().getJsApiConfig(url);
```

## Cache Configuration

```typescript
// Memory cache (default)
const sdk = new WeChatSDK();

// Redis cache
import { createRedisCache } from 'wechat-sdk';
const cache = createRedisCache({ host: 'localhost', port: 6379 });
const sdk = new WeChatSDK({ cache });

// File cache
import { FileCache } from 'wechat-sdk';
const cache = new FileCache('/path/to/cache');
const sdk = new WeChatSDK({ cache });
```

## Debug Mode

```typescript
const sdk = new WeChatSDK({ debug: true, logLevel: 'debug' });

// Or enable at runtime
sdk.setDebug(true);
```

## Environment Variables

```bash
WECHAT_OFFICIAL_APPID=wx1234567890
WECHAT_OFFICIAL_SECRET=your_secret
WECHAT_OFFICIAL_TOKEN=your_token
WECHAT_OFFICIAL_AES_KEY=your_aes_key
WECHAT_MINI_APPID=wx1234567890
WECHAT_MINI_SECRET=your_secret
WECHAT_DEBUG=true
WECHAT_LOG_LEVEL=debug
```

## License

MIT

## 🔗 链接

- [GitHub 仓库](https://github.com/dlldsys/wechat-sdk-ai)
- [npm 包](https://www.npmjs.com/package/wechat-sdk-ai)
- [问题反馈](https://github.com/dlldsys/wechat-sdk-ai/issues)
