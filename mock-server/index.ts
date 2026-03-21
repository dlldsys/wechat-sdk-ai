import http from 'http';
import { URL } from 'url';

const PORT = process.env.PORT || 4000;

const mockResponses: Record<string, Record<string, unknown>> = {
  '/cgi-bin/token': {
    access_token: 'mock_access_token_' + Date.now(),
    expires_in: 7200,
  },
  '/cgi-bin/ticket/getticket': {
    ticket: 'mock_ticket_' + Date.now(),
    expires_in: 7200,
    errcode: 0,
    errmsg: 'ok',
  },
  '/sns/jscode2session': {
    openid: 'mock_openid_' + Date.now(),
    session_key: 'mock_session_key',
    unionid: 'mock_unionid',
  },
  '/cgi-bin/menu/create': {
    errcode: 0,
    errmsg: 'ok',
  },
  '/cgi-bin/menu/get': {
    menu: {
      button: [
        { type: 'click', name: '菜单1', key: 'menu1' },
        { type: 'view', name: '菜单2', url: 'https://example.com' },
      ],
    },
  },
  '/cgi-bin/message/template/send': {
    errcode: 0,
    errmsg: 'ok',
    msgid: Date.now(),
  },
  '/cgi-bin/user/info': {
    subscribe: 1,
    openid: 'mock_openid',
    nickname: 'Mock User',
    sex: 1,
    province: 'Beijing',
    city: 'Beijing',
    country: 'China',
    headimgurl: 'https://example.com/avatar.jpg',
  },
  '/wxa/img_sec_check': {
    errcode: 0,
    errmsg: 'ok',
  },
  '/wxa/msg_sec_check': {
    errcode: 0,
    errmsg: 'ok',
    result: {
      suggest: 'pass',
      label: 0,
    },
  },
  '/cgi-bin/message/subscribe/send': {
    errcode: 0,
    errmsg: 'ok',
  },
  '/wxa/getwxacode': Buffer.from('mock_qrcode_image'),
  '/wxa/getwxacodeunlimit': Buffer.from('mock_qrcode_image'),
  '/wxa/generatescheme': {
    openlink: 'weixin://dl/business/?t=mock_scheme',
  },
  '/wxa/generate_urllink': {
    url_link: 'https://wxaurl.cn/mock_link',
  },
  '/tcb/invokecloudfunction': {
    errcode: 0,
    errmsg: 'ok',
    resp_data: { result: 'mock_result' },
  },
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;

  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Request-Id', 'mock_' + Date.now());

  if (req.method === 'GET' && pathname === '/health') {
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  const mockResponse = mockResponses[pathname];
  
  if (mockResponse) {
    if (Buffer.isBuffer(mockResponse)) {
      res.setHeader('Content-Type', 'image/png');
      res.end(mockResponse);
      return;
    }

    if (pathname === '/cgi-bin/token') {
      const response = {
        ...mockResponse,
        access_token: 'mock_access_token_' + Date.now(),
      };
      res.end(JSON.stringify(response));
      return;
    }

    if (pathname === '/sns/jscode2session') {
      const code = url.searchParams.get('js_code');
      const response = {
        ...mockResponse,
        openid: 'mock_openid_' + code,
        session_key: 'mock_session_key_' + code,
      };
      res.end(JSON.stringify(response));
      return;
    }

    res.end(JSON.stringify(mockResponse));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({
    errcode: 404,
    errmsg: 'Not found',
  }));
});

server.listen(PORT, () => {
  console.log(`Mock WeChat server running on port ${PORT}`);
});

export default server;
