import Koa from 'koa';
import Router from '@koa/router';
import { bodyParser } from '@koa/bodyparser';
import { WeChatSDK } from 'wechat-sdk';

const app = new Koa();
const router = new Router();

app.use(bodyParser());

const sdk = WeChatSDK.fromOptions({
  miniPrograms: {
    default: {
      appId: process.env.WECHAT_MINI_APPID!,
      appSecret: process.env.WECHAT_MINI_SECRET!,
    },
  },
  debug: process.env.NODE_ENV === 'development',
  logLevel: 'debug',
});

router.post('/api/login', async (ctx) => {
  const { code } = ctx.request.body as { code: string };
  
  const { err, data } = await sdk.mp().code2Session(code);
  
  if (err) {
    ctx.status = 400;
    ctx.body = { error: err.message };
    return;
  }
  
  ctx.body = {
    openid: data.openid,
    sessionKey: data.sessionKey,
    unionid: data.unionid,
  };
});

router.post('/api/decrypt', async (ctx) => {
  const { sessionKey, encryptedData, iv } = ctx.request.body as {
    sessionKey: string;
    encryptedData: string;
    iv: string;
  };
  
  try {
    const data = sdk.mp().decryptData(sessionKey, encryptedData, iv);
    ctx.body = data;
  } catch (error) {
    ctx.status = 400;
    ctx.body = { error: (error as Error).message };
  }
});

router.post('/api/phone', async (ctx) => {
  const { sessionKey, encryptedData, iv } = ctx.request.body as {
    sessionKey: string;
    encryptedData: string;
    iv: string;
  };
  
  try {
    const data = sdk.mp().getPhoneNumber(sessionKey, encryptedData, iv);
    ctx.body = data;
  } catch (error) {
    ctx.status = 400;
    ctx.body = { error: (error as Error).message };
  }
});

router.post('/api/subscribe/send', async (ctx) => {
  const { touser, template_id, page, data } = ctx.request.body as {
    touser: string;
    template_id: string;
    page?: string;
    data: Record<string, { value: string }>;
  };
  
  const { err } = await sdk.mp().sendSubscribeMessage({
    touser,
    template_id,
    page,
    data,
  });
  
  if (err) {
    ctx.status = 400;
    ctx.body = { error: err.message };
    return;
  }
  
  ctx.body = { success: true };
});

router.post('/api/uniform-message/send', async (ctx) => {
  const body = ctx.request.body as {
    touser: string;
    mp_template_msg?: {
      appid: string;
      template_id: string;
      url?: string;
      miniprogram?: { appid: string; pagepath?: string };
      data: Record<string, { value: string; color?: string }>;
    };
    weapp_template_msg?: {
      template_id: string;
      page?: string;
      form_id: string;
      data: Record<string, { value: string; color?: string }>;
      emphasis_keyword?: string;
    };
  };
  
  const { err } = await sdk.mp().sendUniformMessage(body);
  
  if (err) {
    ctx.status = 400;
    ctx.body = { error: err.message };
    return;
  }
  
  ctx.body = { success: true };
});

router.post('/api/security/img-check', async (ctx) => {
  const { media } = ctx.request.body as { media: string };
  
  const buffer = Buffer.from(media, 'base64');
  const { err } = await sdk.mp().imgSecCheck(buffer);
  
  if (err) {
    ctx.status = 400;
    ctx.body = { error: err.message, risky: true };
    return;
  }
  
  ctx.body = { success: true, risky: false };
});

router.post('/api/security/msg-check', async (ctx) => {
  const { content, openid, scene } = ctx.request.body as {
    content: string;
    openid?: string;
    scene?: number;
  };
  
  const { err, data } = await sdk.mp().msgSecCheck(content, openid, scene);
  
  if (err) {
    ctx.status = 400;
    ctx.body = { error: err.message };
    return;
  }
  
  ctx.body = data;
});

router.post('/api/qrcode', async (ctx) => {
  const { path, scene, width, env_version } = ctx.request.body as {
    path?: string;
    scene?: string;
    width?: number;
    env_version?: 'release' | 'trial' | 'develop';
  };
  
  const { err, data } = await sdk.mp().getQrCode({
    path,
    scene,
    width,
    env_version,
  });
  
  if (err) {
    ctx.status = 400;
    ctx.body = { error: err.message };
    return;
  }
  
  ctx.set('Content-Type', 'image/png');
  ctx.body = data;
});

router.post('/api/qrcode/unlimited', async (ctx) => {
  const { scene, page, width, env_version } = ctx.request.body as {
    scene: string;
    page?: string;
    width?: number;
    env_version?: 'release' | 'trial' | 'develop';
  };
  
  const { err, data } = await sdk.mp().getUnlimitedQrCode({
    scene,
    page,
    width,
    env_version,
  });
  
  if (err) {
    ctx.status = 400;
    ctx.body = { error: err.message };
    return;
  }
  
  ctx.set('Content-Type', 'image/png');
  ctx.body = data;
});

router.post('/api/url-scheme', async (ctx) => {
  const { jump_wxa, is_expire, expire_type, expire_time, expire_interval } = ctx.request.body as {
    jump_wxa?: {
      path?: string;
      query?: string;
      env_version?: 'release' | 'trial' | 'develop';
    };
    is_expire?: boolean;
    expire_type?: number;
    expire_time?: number;
    expire_interval?: number;
  };
  
  const { err, data } = await sdk.mp().generateUrlScheme({
    jump_wxa,
    is_expire,
    expire_type,
    expire_time,
    expire_interval,
  });
  
  if (err) {
    ctx.status = 400;
    ctx.body = { error: err.message };
    return;
  }
  
  ctx.body = { scheme: data };
});

router.post('/api/url-link', async (ctx) => {
  const { path, query, expire_type, expire_time, expire_interval, env_version } = ctx.request.body as {
    path?: string;
    query?: string;
    expire_type?: number;
    expire_time?: number;
    expire_interval?: number;
    env_version?: 'release' | 'trial' | 'develop';
  };
  
  const { err, data } = await sdk.mp().generateUrlLink({
    path,
    query,
    expire_type,
    expire_time,
    expire_interval,
    env_version,
  });
  
  if (err) {
    ctx.status = 400;
    ctx.body = { error: err.message };
    return;
  }
  
  ctx.body = { urlLink: data };
});

router.post('/api/cloud/invoke', async (ctx) => {
  const { env, name, data } = ctx.request.body as {
    env: string;
    name: string;
    data: unknown;
  };
  
  const result = await sdk.mp().invokeCloudFunction(env, name, data);
  
  if (result.err) {
    ctx.status = 400;
    ctx.body = { error: result.err.message };
    return;
  }
  
  ctx.body = { data: result.data };
});

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
