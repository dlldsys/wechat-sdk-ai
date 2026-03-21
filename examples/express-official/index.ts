import express, { Request, Response, NextFunction } from 'express';
import { WeChatSDK, WxCrypto, verifyWeChatSignature, IPWhitelist, createIPMiddleware } from 'wechat-sdk';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sdk = WeChatSDK.fromOptions({
  officialAccounts: {
    default: {
      appId: process.env.WECHAT_OFFICIAL_APPID!,
      appSecret: process.env.WECHAT_OFFICIAL_SECRET!,
      token: process.env.WECHAT_OFFICIAL_TOKEN!,
      encodingAESKey: process.env.WECHAT_OFFICIAL_AES_KEY!,
    },
  },
  debug: process.env.NODE_ENV === 'development',
  logLevel: 'debug',
});

const ipWhitelist = new IPWhitelist({
  enabled: process.env.ENABLE_IP_WHITELIST === 'true',
});

app.get('/wechat/message', async (req: Request, res: Response) => {
  const { signature, timestamp, nonce, echostr } = req.query as {
    signature: string;
    timestamp: string;
    nonce: string;
    echostr: string;
  };

  const official = sdk.official();
  const token = official.token;

  if (!token) {
    res.status(500).send('Token not configured');
    return;
  }

  const valid = verifyWeChatSignature({
    signature,
    timestamp,
    nonce,
    token,
  });

  if (valid) {
    res.send(echostr);
  } else {
    res.status(403).send('Invalid signature');
  }
});

app.post('/wechat/message', async (req: Request, res: Response) => {
  const { signature, timestamp, nonce, openid } = req.query as {
    signature: string;
    timestamp: string;
    nonce: string;
    openid: string;
  };

  const official = sdk.official();
  const token = official.token;
  const encodingAESKey = official.encodingAESKey;

  if (!token || !encodingAESKey) {
    res.status(500).send('Configuration error');
    return;
  }

  const valid = verifyWeChatSignature({
    signature,
    timestamp,
    nonce,
    token,
  });

  if (!valid) {
    res.status(403).send('Invalid signature');
    return;
  }

  const crypto = new WxCrypto(official.appId, token, encodingAESKey);

  try {
    const body = req.body;
    let message: string;

    if (body.Encrypt) {
      message = crypto.decryptMessage(
        body.Encrypt,
        body.MsgSignature,
        body.TimeStamp,
        body.Nonce
      );
    } else {
      message = typeof body === 'string' ? body : JSON.stringify(body);
    }

    console.log('Received message:', message);

    const reply = `<xml>
      <ToUserName><![CDATA[${openid}]]></ToUserName>
      <FromUserName><![CDATA[${official.appId}]]></FromUserName>
      <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[收到您的消息]]></Content>
    </xml>`;

    res.send(reply);
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).send('Error');
  }
});

app.post('/api/menu', async (req: Request, res: Response) => {
  const { err } = await sdk.official().createMenu(req.body);
  
  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  
  res.json({ success: true });
});

app.get('/api/menu', async (req: Request, res: Response) => {
  const official = sdk.official();
  const { err, data } = await official.getAccessToken();
  
  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  
  const menuResult = await official.menu.get(data.accessToken);
  res.json(menuResult);
});

app.post('/api/template/send', async (req: Request, res: Response) => {
  const { err, data } = await sdk.official().sendTemplateMessage(req.body);
  
  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  
  res.json({ success: true, msgid: data.msgid });
});

app.get('/api/oauth/url', (req: Request, res: Response) => {
  const { redirect, scope = 'snsapi_base', state = '' } = req.query as {
    redirect: string;
    scope?: 'snsapi_base' | 'snsapi_userinfo';
    state?: string;
  };
  
  const url = sdk.official().getOAuthUrl(redirect, scope, state);
  res.json({ url });
});

app.get('/api/oauth/callback', async (req: Request, res: Response) => {
  const { code } = req.query as { code: string };
  
  const { err, data } = await sdk.official().getOAuthAccessToken(code);
  
  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  
  res.json(data);
});

app.get('/api/jsapi/config', async (req: Request, res: Response) => {
  const { url } = req.query as { url: string };
  
  const { err, data } = await sdk.official().getJsApiConfig(url);
  
  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  
  res.json(data);
});

app.get('/api/user/:openid', async (req: Request, res: Response) => {
  const { openid } = req.params;
  
  const { err, data } = await sdk.official().getUserInfo(openid);
  
  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  
  res.json(data);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
