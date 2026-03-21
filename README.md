# WeChat SDK

A comprehensive Node.js SDK for WeChat Official Accounts and Mini Programs.

## Features

- 🚀 **Zero Dependencies** - Uses only Node.js built-in modules
- 📦 **TypeScript** - Full type definitions included
- 🔄 **Auto Token Management** - Automatic token refresh with caching
- 🔒 **Security** - AES encryption, signature verification, IP whitelist
- 📝 **Complete API Coverage** - All official WeChat APIs
- 🐛 **Debug Mode** - Detailed logging for troubleshooting
- 💾 **Multiple Cache Backends** - Memory, Redis, File

## Installation

```bash
npm install wechat-sdk
```

## Quick Start

```typescript
import { WeChatSDK } from 'wechat-sdk';

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

## Mini Program

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

## Official Account

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
