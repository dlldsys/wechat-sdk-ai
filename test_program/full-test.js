/**
 * WeChat SDK AI 完整接口测试
 * 使用本地包 wechat-sdk-ai
 * 测试覆盖：公众号、小程序、工具函数 所有接口
 */

const { 
  WeChatSDK, 
  generateSignature, 
  generateNonceStr, 
  generateTimestamp, 
  parseXml, 
  parseXmlFromBody,
  XmlParser,
  WxCrypto,
  createLogger,
  Logger,
  verifyWeChatSignature,
  verifyMessageSignature,
  isWeChatIP,
  MemoryCache,
  FileCache,
  RedisCache,
  createRedisCache,
  WxError,
  ErrorCode
} = require('wechat-sdk-ai');

// 测试配置
const config = {
  officialAccounts: {
    test: {
      appId: 'wx1e5466401a31c0b6',
      appSecret: '8e3c288468368acd1cf9bb3bc4ff4883'
    }
  },
  miniPrograms: {
    test: {
      appId: 'wx45b7d4e30d226b77',
      appSecret: 'f59072c2fc6d92dac553f9fafa46518f'
    }
  },
  debug: false
};

// 测试数据
const TEST_OPENID = 'ooM3s17VG9iZzW7WF5tqLhR_PQyU';
const TEST_UNIONID = '';

// 统计结果
const testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    categories: {}
  },
  details: [],
  timestamp: new Date().toISOString(),
  sdkVersion: '1.0.4',
  localPackage: true
};

const categoryStack = [];

function logTest(name, success, duration, error = null, category = 'General') {
  testResults.summary.total++;
  if (success) {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
  
  const status = success ? '✓' : '✗';
  const timeInfo = duration > 0 ? `(${duration}ms)` : '';
  const errorInfo = error ? ` - ${error}` : '';
  console.log(`  ${status} ${name} ${timeInfo}${errorInfo}`);
  
  testResults.details.push({ name, success, duration, error, category });
  
  if (!testResults.summary.categories[category]) {
    testResults.summary.categories[category] = { passed: 0, failed: 0, total: 0 };
  }
  testResults.summary.categories[category].total++;
  if (success) {
    testResults.summary.categories[category].passed++;
  } else {
    testResults.summary.categories[category].failed++;
  }
}

function startCategory(name) {
  categoryStack.push(name);
  console.log(`\n=== ${name} ===`);
}

function endCategory() {
  categoryStack.pop();
}

// ==================== 公众号接口测试 ====================

async function testOfficialToken() {
  startCategory('公众号 - Token管理');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  // 获取access_token
  try {
    const start = Date.now();
    const result = await official.getAccessToken();
    logTest('getAccessToken', !result.err, Date.now() - start, result.err?.message);
    
    // 强制刷新
    try {
      const start2 = Date.now();
      const refresh = await official.refreshAccessToken();
      logTest('refreshAccessToken', !refresh.err, Date.now() - start2, refresh.err?.message);
    } catch (e) {
      logTest('refreshAccessToken', false, 0, e.message);
    }
    
    return result;
  } catch (e) {
    logTest('Token获取', false, 0, e.message);
    return null;
  }
}

async function testOfficialUser(tokenResult) {
  startCategory('公众号 - 用户管理');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('用户接口', false, 0, 'Token不可用', '公众号 - 用户管理');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 获取用户信息
  try {
    const start = Date.now();
    const userInfo = await official.user.getUserInfo(token, TEST_OPENID);
    logTest('user.getUserInfo', !userInfo.err, Date.now() - start, userInfo.err?.message);
  } catch (e) {
    logTest('user.getUserInfo', false, 0, e.message);
  }
  
  // 获取用户列表
  try {
    const start = Date.now();
    const userList = await official.user.getUserList(token);
    logTest('user.getUserList', !userList.err, Date.now() - start, userList.err?.message);
  } catch (e) {
    logTest('user.getUserList', false, 0, e.message);
  }
  
  // 设置用户备注
  try {
    const start = Date.now();
    const remark = await official.user.setUserRemark(token, TEST_OPENID, '测试备注');
    logTest('user.setUserRemark', !remark.err, Date.now() - start, remark.err?.message);
  } catch (e) {
    logTest('user.setUserRemark', false, 0, e.message);
  }
}

async function testOfficialTags(tokenResult) {
  startCategory('公众号 - 用户标签');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('标签接口', false, 0, 'Token不可用', '公众号 - 用户标签');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 创建标签
  let tagId = 0;
  try {
    const start = Date.now();
    const createTag = await official.tag.create(token, '测试标签');
    logTest('tag.create', !createTag.err, Date.now() - start, createTag.err?.message);
    tagId = createTag.data?.tag?.id || 0;
  } catch (e) {
    logTest('tag.create', false, 0, e.message);
  }
  
  // 获取标签列表
  try {
    const start = Date.now();
    const tagList = await official.tag.get(token);
    logTest('tag.get', !tagList.err, Date.now() - start, tagList.err?.message);
  } catch (e) {
    logTest('tag.get', false, 0, e.message);
  }
  
  // 更新标签
  if (tagId > 0) {
    try {
      const start = Date.now();
      const updateTag = await official.tag.update(token, tagId, '新标签名');
      logTest('tag.update', !updateTag.err, Date.now() - start, updateTag.err?.message);
    } catch (e) {
      logTest('tag.update', false, 0, e.message);
    }
    
    // 删除标签
    try {
      const start = Date.now();
      const deleteTag = await official.tag.delete(token, tagId);
      logTest('tag.delete', !deleteTag.err, Date.now() - start, deleteTag.err?.message);
    } catch (e) {
      logTest('tag.delete', false, 0, e.message);
    }
  }
  
  // 获取用户身上的标签
  try {
    const start = Date.now();
    const userTags = await official.tag.getUserTags(token, TEST_OPENID);
    logTest('tag.getUserTags', !userTags.err, Date.now() - start, userTags.err?.message);
  } catch (e) {
    logTest('tag.getUserTags', false, 0, e.message);
  }
}

async function testOfficialMenu(tokenResult) {
  startCategory('公众号 - 菜单管理');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('菜单接口', false, 0, 'Token不可用', '公众号 - 菜单管理');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 创建菜单
  try {
    const start = Date.now();
    const createMenu = await official.menu.create(token, {
      button: [
        { type: 'click', name: '测试菜单', key: 'test_key' }
      ]
    });
    logTest('menu.create', !createMenu.err, Date.now() - start, createMenu.err?.message);
  } catch (e) {
    logTest('menu.create', false, 0, e.message);
  }
  
  // 获取菜单
  try {
    const start = Date.now();
    const getMenu = await official.menu.get(token);
    logTest('menu.get', !getMenu.err, Date.now() - start, getMenu.err?.message);
  } catch (e) {
    logTest('menu.get', false, 0, e.message);
  }
  
  // 删除菜单
  try {
    const start = Date.now();
    const deleteMenu = await official.menu.delete(token);
    logTest('menu.delete', !deleteMenu.err, Date.now() - start, deleteMenu.err?.message);
  } catch (e) {
    logTest('menu.delete', false, 0, e.message);
  }
  
  // 获取自定义菜单配置
  try {
    const start = Date.now();
    const getConfig = await official.menu.getConfig(token);
    logTest('menu.getConfig', !getConfig.err, Date.now() - start, getConfig.err?.message);
  } catch (e) {
    logTest('menu.getConfig', false, 0, e.message);
  }
}

async function testOfficialTemplate(tokenResult) {
  startCategory('公众号 - 模板消息');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('模板接口', false, 0, 'Token不可用', '公众号 - 模板消息');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 获取模板列表
  try {
    const start = Date.now();
    const templateList = await official.template.getTemplateList(token);
    logTest('template.getTemplateList', !templateList.err, Date.now() - start, templateList.err?.message);
  } catch (e) {
    logTest('template.getTemplateList', false, 0, e.message);
  }
  
  // 发送模板消息
  try {
    const start = Date.now();
    const sendTemplate = await official.sendTemplateMessage({
      touser: TEST_OPENID,
      template_id: '5kHW3IcKNSnohmoX2cNUPdX4iFdENtme7Iwm9QXWdEU',
      data: {
        first: { value: '测试通知' },
        content: { value: '这是测试内容' },
        time: { value: new Date().toLocaleString() },
        remark: { value: '测试备注' }
      }
    });
    logTest('sendTemplateMessage', !sendTemplate.err, Date.now() - start, sendTemplate.err?.message);
  } catch (e) {
    logTest('sendTemplateMessage', false, 0, e.message);
  }
}

async function testOfficialOAuth(tokenResult) {
  startCategory('公众号 - 网页授权');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  // 获取授权URL
  try {
    const start = Date.now();
    const authUrl = official.getOAuthUrl('https://example.com/callback', 'snsapi_userinfo', 'state123');
    logTest('getOAuthUrl', !!authUrl && authUrl.includes('weixin.qq.com'), Date.now() - start);
  } catch (e) {
    logTest('getOAuthUrl', false, 0, e.message);
  }
  
  if (!tokenResult?.data?.accessToken) {
    logTest('OAuth接口', false, 0, 'Token不可用', '公众号 - 网页授权');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 刷新access_token
  try {
    const start = Date.now();
    const refresh = await official.oauth.refreshAccessToken(token, 'test_refresh_token');
    logTest('oauth.refreshAccessToken', !refresh.err, Date.now() - start, refresh.err?.message);
  } catch (e) {
    logTest('oauth.refreshAccessToken', false, 0, e.message);
  }
  
  // 检查access_token
  try {
    const start = Date.now();
    const check = await official.oauth.checkAccessToken(token, TEST_OPENID);
    logTest('oauth.checkAccessToken', !check.err, Date.now() - start, check.err?.message);
  } catch (e) {
    logTest('oauth.checkAccessToken', false, 0, e.message);
  }
}

async function testOfficialJsApi(tokenResult) {
  startCategory('公众号 - JS-SDK');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  // 获取JS-SDK配置
  try {
    const start = Date.now();
    const jsConfig = await official.getJsApiConfig('https://example.com', false, [
      'chooseImage', 'uploadImage'
    ]);
    logTest('getJsApiConfig', !jsConfig.err, Date.now() - start, jsConfig.err?.message);
  } catch (e) {
    logTest('getJsApiConfig', false, 0, e.message);
  }
  
  // 获取卡券签名
  if (!tokenResult?.data?.accessToken) return;
  try {
    const start = Date.now();
    const cardTicket = await official.jsapi.getCardTicket(tokenResult.data.accessToken);
    logTest('jsapi.getCardTicket', !cardTicket.err, Date.now() - start, cardTicket.err?.message);
  } catch (e) {
    logTest('jsapi.getCardTicket', false, 0, e.message);
  }
}

async function testOfficialKF(tokenResult) {
  startCategory('公众号 - 客服消息');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('客服接口', false, 0, 'Token不可用', '公众号 - 客服消息');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 发送客服文本消息
  try {
    const start = Date.now();
    const sendText = await official.kf.sendText(token, TEST_OPENID, '测试消息');
    logTest('kf.sendText', !sendText.err, Date.now() - start, sendText.err?.message);
  } catch (e) {
    logTest('kf.sendText', false, 0, e.message);
  }
  
  // 获取客服列表
  try {
    const start = Date.now();
    const kfList = await official.kf.getKfList(token);
    logTest('kf.getKfList', !kfList.err, Date.now() - start, kfList.err?.message);
  } catch (e) {
    logTest('kf.getKfList', false, 0, e.message);
  }
  
  // 获取在线客服列表
  try {
    const start = Date.now();
    const onlineList = await official.kf.getOnlineList(token);
    logTest('kf.getOnlineList', !onlineList.err, Date.now() - start, onlineList.err?.message);
  } catch (e) {
    logTest('kf.getOnlineList', false, 0, e.message);
  }
}

async function testOfficialQrcode(tokenResult) {
  startCategory('公众号 - 二维码');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('二维码接口', false, 0, 'Token不可用', '公众号 - 二维码');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 创建永久二维码
  try {
    const start = Date.now();
    const createQrcode = await official.qrcode.createLimit(token, 'test_scene');
    logTest('qrcode.createLimit', !createQrcode.err, Date.now() - start, createQrcode.err?.message);
  } catch (e) {
    logTest('qrcode.createLimit', false, 0, e.message);
  }
  
  // 创建临时二维码
  try {
    const start = Date.now();
    const tempQrcode = await official.qrcode.createTemp(token, 'test_scene_2', 604800);
    logTest('qrcode.createTemp', !tempQrcode.err, Date.now() - start, tempQrcode.err?.message);
  } catch (e) {
    logTest('qrcode.createTemp', false, 0, e.message);
  }
  
  // 获取二维码URL
  try {
    const start = Date.now();
    const qrcodeUrl = await official.qrcode.getUrl(token, 'ticket_string');
    logTest('qrcode.getUrl', !qrcodeUrl.err, Date.now() - start, qrcodeUrl.err?.message);
  } catch (e) {
    logTest('qrcode.getUrl', false, 0, e.message);
  }
  
  // 获取短链接
  try {
    const start = Date.now();
    const shortUrl = await official.qrcode.getShortUrl(token, 'https://example.com/very/long/url');
    logTest('qrcode.getShortUrl', !shortUrl.err, Date.now() - start, shortUrl.err?.message);
  } catch (e) {
    logTest('qrcode.getShortUrl', false, 0, e.message);
  }
}

async function testOfficialSemantic(tokenResult) {
  startCategory('公众号 - 语义理解');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('语义接口', false, 0, 'Token不可用', '公众号 - 语义理解');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  try {
    const start = Date.now();
    const semantic = await official.semantic.understand(token, {
      query: '附近有什么好吃的',
      city: '北京',
      category: '美食'
    });
    logTest('semantic.understand', !semantic.err, Date.now() - start, semantic.err?.message);
  } catch (e) {
    logTest('semantic.understand', false, 0, e.message);
  }
}

async function testOfficialDataCube(tokenResult) {
  startCategory('公众号 - 数据分析');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('数据接口', false, 0, 'Token不可用', '公众号 - 数据分析');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const formatDate = (d) => d.toISOString().split('T')[0];
  
  // 获取用户增减数据
  try {
    const start = Date.now();
    const userSummary = await official.datacube.getUserSummary(token, formatDate(weekAgo), formatDate(today));
    logTest('datacube.getUserSummary', !userSummary.err, Date.now() - start, userSummary.err?.message);
  } catch (e) {
    logTest('datacube.getUserSummary', false, 0, e.message);
  }
  
  // 获取累计用户数据
  try {
    const start = Date.now();
    const userCumulate = await official.datacube.getUserCumulate(token, formatDate(weekAgo), formatDate(today));
    logTest('datacube.getUserCumulate', !userCumulate.err, Date.now() - start, userCumulate.err?.message);
  } catch (e) {
    logTest('datacube.getUserCumulate', false, 0, e.message);
  }
  
  // 获取接口分析数据
  try {
    const start = Date.now();
    const interfaceSummary = await official.datacube.getInterfaceSummary(token, formatDate(weekAgo), formatDate(today));
    logTest('datacube.getInterfaceSummary', !interfaceSummary.err, Date.now() - start, interfaceSummary.err?.message);
  } catch (e) {
    logTest('datacube.getInterfaceSummary', false, 0, e.message);
  }
}

async function testOfficialMaterial(tokenResult) {
  startCategory('公众号 - 素材管理');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('素材接口', false, 0, 'Token不可用', '公众号 - 素材管理');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 获取素材总数
  try {
    const start = Date.now();
    const materialCount = await official.material.getCount(token);
    logTest('material.getCount', !materialCount.err, Date.now() - start, materialCount.err?.message);
  } catch (e) {
    logTest('material.getCount', false, 0, e.message);
  }
  
  // 获取素材列表
  try {
    const start = Date.now();
    const materialList = await official.material.batchGet(token, 'image', 0, 10);
    logTest('material.batchGet', !materialList.err, Date.now() - start, materialList.err?.message);
  } catch (e) {
    logTest('material.batchGet', false, 0, e.message);
  }
}

async function testOfficialBroadcast(tokenResult) {
  startCategory('公众号 - 群发消息');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('群发接口', false, 0, 'Token不可用', '公众号 - 群发消息');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 获取预览群发接口地址
  try {
    const start = Date.now();
    const previewUrl = await official.broadcast.getPreviewUrl(token, TEST_OPENID, 'text', { content: '测试预览' });
    logTest('broadcast.getPreviewUrl', !previewUrl.err, Date.now() - start, previewUrl.err?.message);
  } catch (e) {
    logTest('broadcast.getPreviewUrl', false, 0, e.message);
  }
  
  // 获取群发速度
  try {
    const start = Date.now();
    const speed = await official.broadcast.getSpeed(token);
    logTest('broadcast.getSpeed', !speed.err, Date.now() - start, speed.err?.message);
  } catch (e) {
    logTest('broadcast.getSpeed', false, 0, e.message);
  }
}

async function testOfficialComment(tokenResult) {
  startCategory('公众号 - 评论管理');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('评论接口', false, 0, 'Token不可用', '公众号 - 评论管理');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 打开已群发消息的评论功能
  try {
    const start = Date.now();
    const openComment = await official.comment.open(token, 'article_id_123', 0);
    logTest('comment.open', !openComment.err, Date.now() - start, openComment.err?.message);
  } catch (e) {
    logTest('comment.open', false, 0, e.message);
  }
  
  // 关闭已群发消息的评论功能
  try {
    const start = Date.now();
    const closeComment = await official.comment.close(token, 'article_id_123', 0);
    logTest('comment.close', !closeComment.err, Date.now() - start, closeComment.err?.message);
  } catch (e) {
    logTest('comment.close', false, 0, e.message);
  }
}

async function testOfficialDraft(tokenResult) {
  startCategory('公众号 - 图文草稿');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('草稿接口', false, 0, 'Token不可用', '公众号 - 图文草稿');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 获取草稿总数
  try {
    const start = Date.now();
    const draftCount = await official.draft.count(token);
    logTest('draft.count', !draftCount.err, Date.now() - start, draftCount.err?.message);
  } catch (e) {
    logTest('draft.count', false, 0, e.message);
  }
  
  // 获取草稿列表
  try {
    const start = Date.now();
    const draftList = await official.draft.getList(token, 0, 10);
    logTest('draft.getList', !draftList.err, Date.now() - start, draftList.err?.message);
  } catch (e) {
    logTest('draft.getList', false, 0, e.message);
  }
}

async function testOfficialFreePublish(tokenResult) {
  startCategory('公众号 - 发布能力');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('发布接口', false, 0, 'Token不可用', '公众号 - 发布能力');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 获取发布能力状态
  try {
    const start = Date.now();
    const publishStatus = await official.freepublish.getArticleStatus(token, 'article_id');
    logTest('freepublish.getArticleStatus', !publishStatus.err, Date.now() - start, publishStatus.err?.message);
  } catch (e) {
    logTest('freepublish.getArticleStatus', false, 0, e.message);
  }
  
  // 获取已发布文章列表
  try {
    const start = Date.now();
    const articleList = await official.freepublish.getArticleList(token, 0, 10);
    logTest('freepublish.getArticleList', !articleList.err, Date.now() - start, articleList.err?.message);
  } catch (e) {
    logTest('freepublish.getArticleList', false, 0, e.message);
  }
}

async function testOfficialSubscribe(tokenResult) {
  startCategory('公众号 - 订阅通知');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('订阅接口', false, 0, 'Token不可用', '公众号 - 订阅通知');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 获取公众号类目
  try {
    const start = Date.now();
    const category = await official.subscribe.getCategory(token);
    logTest('subscribe.getCategory', !category.err, Date.now() - start, category.err?.message);
  } catch (e) {
    logTest('subscribe.getCategory', false, 0, e.message);
  }
}

// ==================== 小程序接口测试 ====================

async function testMiniProgramToken() {
  startCategory('小程序 - Token管理');
  const sdk = new WeChatSDK(config);
  const mp = sdk.mp('test');
  
  try {
    const start = Date.now();
    const result = await mp.getAccessToken();
    logTest('getAccessToken', !result.err, Date.now() - start, result.err?.message);
    
    // 强制刷新
    try {
      const start2 = Date.now();
      const refresh = await mp.refreshAccessToken();
      logTest('refreshAccessToken', !refresh.err, Date.now() - start2, refresh.err?.message);
    } catch (e) {
      logTest('refreshAccessToken', false, 0, e.message);
    }
    
    return result;
  } catch (e) {
    logTest('Token获取', false, 0, e.message);
    return null;
  }
}

async function testMiniProgramLogin(tokenResult) {
  startCategory('小程序 - 登录');
  const sdk = new WeChatSDK(config);
  const mp = sdk.mp('test');
  
  // code2Session
  try {
    const start = Date.now();
    const session = await mp.code2Session('test_code_123');
    logTest('code2Session', !session.err, Date.now() - start, session.err?.message);
  } catch (e) {
    logTest('code2Session', false, 0, e.message);
  }
  
  // checkSession
  if (!tokenResult?.data?.accessToken) {
    logTest('checkSession', false, 0, 'Token不可用', '小程序 - 登录');
    return;
  }
  
  try {
    const start = Date.now();
    const check = await mp.login.checkSession(tokenResult.data.accessToken, 'session_key');
    logTest('checkSession', !check.err, Date.now() - start, check.err?.message);
  } catch (e) {
    logTest('checkSession', false, 0, e.message);
  }
}

async function testMiniProgramMessage(tokenResult) {
  startCategory('小程序 - 消息');
  const sdk = new WeChatSDK(config);
  const mp = sdk.mp('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('消息接口', false, 0, 'Token不可用', '小程序 - 消息');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 发送订阅消息
  try {
    const start = Date.now();
    const subscribe = await mp.sendSubscribeMessage({
      touser: TEST_OPENID,
      template_id: '5kHW3IcKNSnohmoX2cNUPdX4iFdENtme7Iwm9QXWdEU',
      data: {
        first: { value: '测试通知' },
        content: { value: '这是测试内容' }
      }
    });
    logTest('sendSubscribeMessage', !subscribe.err, Date.now() - start, subscribe.err?.message);
  } catch (e) {
    logTest('sendSubscribeMessage', false, 0, e.message);
  }
  
  // 发送统一服务消息
  try {
    const start = Date.now();
    const uniform = await mp.sendUniformMessage({
      touser: TEST_OPENID,
      weapp_template_msg: {
        template_id: 'template_id',
        page: 'pages/index',
        form_id: 'form_id',
        data: { keyword1: { value: 'test' } }
      }
    });
    logTest('sendUniformMessage', !uniform.err, Date.now() - start, uniform.err?.message);
  } catch (e) {
    logTest('sendUniformMessage', false, 0, e.message);
  }
}

async function testMiniProgramSecurity(tokenResult) {
  startCategory('小程序 - 安全');
  const sdk = new WeChatSDK(config);
  const mp = sdk.mp('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('安全接口', false, 0, 'Token不可用', '小程序 - 安全');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 文本安全检查
  try {
    const start = Date.now();
    const msgCheck = await mp.security.msgSecCheck(token, '这是一条正常的测试消息');
    logTest('msgSecCheck', !msgCheck.err, Date.now() - start, msgCheck.err?.message);
  } catch (e) {
    logTest('msgSecCheck', false, 0, e.message);
  }
  
  // 图片安全检查 (模拟)
  try {
    const start = Date.now();
    const imgCheck = await mp.security.imgSecCheck(token, Buffer.from('fake image data'));
    logTest('imgSecCheck', !imgCheck.err, Date.now() - start, imgCheck.err?.message);
  } catch (e) {
    logTest('imgSecCheck', false, 0, e.message);
  }
  
  // 异步图片检查
  try {
    const start = Date.now();
    const mediaCheck = await mp.security.mediaCheckAsync(token, 'https://example.com/image.jpg');
    logTest('mediaCheckAsync', !mediaCheck.err, Date.now() - start, mediaCheck.err?.message);
  } catch (e) {
    logTest('mediaCheckAsync', false, 0, e.message);
  }
  
  // 获取用户风险等级
  try {
    const start = Date.now();
    const riskRank = await mp.security.getUserRiskRank(token, TEST_OPENID);
    logTest('getUserRiskRank', !riskRank.err, Date.now() - start, riskRank.err?.message);
  } catch (e) {
    logTest('getUserRiskRank', false, 0, e.message);
  }
}

async function testMiniProgramQrcode(tokenResult) {
  startCategory('小程序 - 二维码');
  const sdk = new WeChatSDK(config);
  const mp = sdk.mp('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('二维码接口', false, 0, 'Token不可用', '小程序 - 二维码');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 生成小程序码
  try {
    const start = Date.now();
    const qrcode = await mp.getQrCode({ path: '/pages/index' });
    logTest('getQrCode', !qrcode.err, Date.now() - start, qrcode.err?.message);
  } catch (e) {
    logTest('getQrCode', false, 0, e.message);
  }
  
  // 生成无限制小程序码
  try {
    const start = Date.now();
    const unlimitedQrcode = await mp.getUnlimitedQrCode({ scene: 'test' });
    logTest('getUnlimitedQrCode', !unlimitedQrcode.err, Date.now() - start, unlimitedQrcode.err?.message);
  } catch (e) {
    logTest('getUnlimitedQrCode', false, 0, e.message);
  }
}

async function testMiniProgramUrlScheme(tokenResult) {
  startCategory('小程序 - 链接');
  const sdk = new WeChatSDK(config);
  const mp = sdk.mp('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('链接接口', false, 0, 'Token不可用', '小程序 - 链接');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 生成URL Scheme
  try {
    const start = Date.now();
    const urlScheme = await mp.urlScheme.generate(token, {
      jump_wxa: { path: '/pages/index', env_version: 'trial' }
    });
    logTest('urlScheme.generate', !urlScheme.err, Date.now() - start, urlScheme.err?.message);
  } catch (e) {
    logTest('urlScheme.generate', false, 0, e.message);
  }
  
  // 生成URL Link
  try {
    const start = Date.now();
    const urlLink = await mp.urlLink.generate(token, {
      path: '/pages/index',
      env_version: 'trial'
    });
    logTest('urlLink.generate', !urlLink.err, Date.now() - start, urlLink.err?.message);
  } catch (e) {
    logTest('urlLink.generate', false, 0, e.message);
  }
  
  // 短链接
  try {
    const start = Date.now();
    const shortLink = await mp.shortLink.generate(token, {
      page_url: '/pages/index',
      expire_time: Math.floor(Date.now() / 1000) + 86400
    });
    logTest('shortLink.generate', !shortLink.err, Date.now() - start, shortLink.err?.message);
  } catch (e) {
    logTest('shortLink.generate', false, 0, e.message);
  }
}

async function testMiniProgramNearby(tokenResult) {
  startCategory('小程序 - 附近');
  const sdk = new WeChatSDK(config);
  const mp = sdk.mp('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('附近接口', false, 0, 'Token不可用', '小程序 - 附近');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 添加地点
  try {
    const start = Date.now();
    const addPoi = await mp.nearby.add(token, {
      poi_name: '测试门店',
      address: '测试地址',
      longitude: 116.404,
      latitude: 39.915,
      categories: [5000],
      contract_phone: '13800138000',
      qualification_list: []
    });
    logTest('nearby.add', !addPoi.err, Date.now() - start, addPoi.err?.message);
  } catch (e) {
    logTest('nearby.add', false, 0, e.message);
  }
  
  // 查看地点列表
  try {
    const start = Date.now();
    const list = await mp.nearby.getList(token, 0, 10);
    logTest('nearby.getList', !list.err, Date.now() - start, list.err?.message);
  } catch (e) {
    logTest('nearby.getList', false, 0, e.message);
  }
}

async function testMiniProgramPlugin(tokenResult) {
  startCategory('小程序 - 插件');
  const sdk = new WeChatSDK(config);
  const mp = sdk.mp('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('插件接口', false, 0, 'Token不可用', '小程序 - 插件');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 获取当前插件使用数据
  try {
    const start = Date.now();
    const pluginDevList = await mp.plugin.getDevPluginList(token);
    logTest('plugin.getDevPluginList', !pluginDevList.err, Date.now() - start, pluginDevList.err?.message);
  } catch (e) {
    logTest('plugin.getDevPluginList', false, 0, e.message);
  }
}

async function testMiniProgramCloud(tokenResult) {
  startCategory('小程序 - 云开发');
  const sdk = new WeChatSDK(config);
  const mp = sdk.mp('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('云开发接口', false, 0, 'Token不可用', '小程序 - 云开发');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 调用云函数
  try {
    const start = Date.now();
    const cloudFunc = await mp.cloud.invokeFunction(token, 'env-id', 'testFunction', { data: 'test' });
    logTest('cloud.invokeFunction', !cloudFunc.err, Date.now() - start, cloudFunc.err?.message);
  } catch (e) {
    logTest('cloud.invokeFunction', false, 0, e.message);
  }
}

async function testMiniProgramDelivery(tokenResult) {
  startCategory('小程序 - 物流服务');
  const sdk = new WeChatSDK(config);
  const mp = sdk.mp('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('物流接口', false, 0, 'Token不可用', '小程序 - 物流服务');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 获取所有快递公司
  try {
    const start = Date.now();
    const allDelivery = await mp.delivery.getAllDelivery(token);
    logTest('delivery.getAllDelivery', !allDelivery.err, Date.now() - start, allDelivery.err?.message);
  } catch (e) {
    logTest('delivery.getAllDelivery', false, 0, e.message);
  }
  
  // 获取运单信息
  try {
    const start = Date.now();
    const order = await mp.delivery.getDeliveryOrder(token, {
      order_id: 'test_order',
      delivery_id: 'SF'
    });
    logTest('delivery.getDeliveryOrder', !order.err, Date.now() - start, order.err?.message);
  } catch (e) {
    logTest('delivery.getDeliveryOrder', false, 0, e.message);
  }
}

async function testMiniProgramSubscribeTemplate(tokenResult) {
  startCategory('小程序 - 订阅模板');
  const sdk = new WeChatSDK(config);
  const mp = sdk.mp('test');
  
  if (!tokenResult?.data?.accessToken) {
    logTest('订阅模板接口', false, 0, 'Token不可用', '小程序 - 订阅模板');
    return;
  }
  
  const token = tokenResult.data.accessToken;
  
  // 获取类目
  try {
    const start = Date.now();
    const category = await mp.subscribeTemplate.getCategory(token);
    logTest('subscribeTemplate.getCategory', !category.err, Date.now() - start, category.err?.message);
  } catch (e) {
    logTest('subscribeTemplate.getCategory', false, 0, e.message);
  }
  
  // 获取模板列表
  try {
    const start = Date.now();
    const list = await mp.subscribeTemplate.getTemplateList(token, 0, 10);
    logTest('subscribeTemplate.getTemplateList', !list.err, Date.now() - start, list.err?.message);
  } catch (e) {
    logTest('subscribeTemplate.getTemplateList', false, 0, e.message);
  }
}

// ==================== 工具函数测试 ====================

function testUtilityFunctions() {
  startCategory('工具 - 签名相关');
  
  // generateSignature
  try {
    const start = Date.now();
    const signature = generateSignature({
      token: 'test_token',
      timestamp: '1234567890',
      nonce: 'test_nonce'
    });
    logTest('generateSignature', !!signature && typeof signature === 'string', Date.now() - start);
  } catch (e) {
    logTest('generateSignature', false, 0, e.message);
  }
  
  // generateNonceStr
  try {
    const start = Date.now();
    const nonce = generateNonceStr(16);
    logTest('generateNonceStr(16)', nonce.length === 16, Date.now() - start);
    
    const nonce32 = generateNonceStr(32);
    logTest('generateNonceStr(32)', nonce32.length === 32, 0);
  } catch (e) {
    logTest('generateNonceStr', false, 0, e.message);
  }
  
  // generateTimestamp
  try {
    const start = Date.now();
    const timestamp = generateTimestamp();
    logTest('generateTimestamp', typeof timestamp === 'number' && timestamp > 0, Date.now() - start);
  } catch (e) {
    logTest('generateTimestamp', false, 0, e.message);
  }
}

function testUtilityXML() {
  startCategory('工具 - XML解析');
  
  // parseXml
  try {
    const start = Date.now();
    const xml = '<xml><ToUserName>test</ToUserName><FromUserName>user</FromUserName><MsgType>text</MsgType><Content>Hello</Content></xml>';
    const parseResult = parseXml(xml);
    logTest('parseXml', parseResult.success, Date.now() - start, parseResult.error?.message);
  } catch (e) {
    logTest('parseXml', false, 0, e.message);
  }
  
  // XmlParser class
  try {
    const start = Date.now();
    const parser = new XmlParser();
    const result = parser.parse('<xml><code>0</code></xml>');
    logTest('XmlParser.parse', result.success, Date.now() - start);
  } catch (e) {
    logTest('XmlParser', false, 0, e.message);
  }
}

function testUtilityCrypto() {
  startCategory('工具 - 加密解密');
  const crypto = new WxCrypto('test_token', 'test_encoding_aes_key_12345678901234567');
  
  // XML加密
  try {
    const start = Date.now();
    const encrypted = crypto.encryptXML('test_appid', '<xml>test</xml>');
    logTest('WxCrypto.encryptXML', !encrypted.err, Date.now() - start, encrypted.err?.message);
  } catch (e) {
    logTest('WxCrypto.encryptXML', false, 0, e.message);
  }
  
  // XML解密
  try {
    const start = Date.now();
    const decrypted = crypto.decryptXML('test_appid', 'encrypted_data');
    logTest('WxCrypto.decryptXML', !decrypted.err, Date.now() - start, decrypted.err?.message);
  } catch (e) {
    logTest('WxCrypto.decryptXML', false, 0, e.message);
  }
  
  // SHA1
  try {
    const start = Date.now();
    const sha1 = crypto.sha1('test');
    logTest('WxCrypto.sha1', sha1 === 'a9f03805c7cb7960fe120c18ff2c3d0eeb8edb74', Date.now() - start);
  } catch (e) {
    logTest('WxCrypto.sha1', false, 0, e.message);
  }
  
  // SHA256
  try {
    const start = Date.now();
    const sha256 = crypto.sha256('test');
    logTest('WxCrypto.sha256', !!sha256 && sha256.length === 64, Date.now() - start);
  } catch (e) {
    logTest('WxCrypto.sha256', false, 0, e.message);
  }
  
  // MD5
  try {
    const start = Date.now();
    const md5 = crypto.md5('test');
    logTest('WxCrypto.md5', !!md5 && md5.length === 32, Date.now() - start);
  } catch (e) {
    logTest('WxCrypto.md5', false, 0, e.message);
  }
  
  // AES加密
  try {
    const start = Date.now();
    const aes = crypto.aesEncrypt('test_key_16bytes!', 'test data');
    logTest('WxCrypto.aesEncrypt', !aes.err, Date.now() - start, aes.err?.message);
  } catch (e) {
    logTest('WxCrypto.aesEncrypt', false, 0, e.message);
  }
  
  // AES解密
  try {
    const start = Date.now();
    const aesDec = crypto.aesDecrypt('test_key_16bytes!', 'encrypted_base64');
    logTest('WxCrypto.aesDecrypt', !aesDec.err, Date.now() - start, aesDec.err?.message);
  } catch (e) {
    logTest('WxCrypto.aesDecrypt', false, 0, e.message);
  }
  
  // 随机字符串
  try {
    const start = Date.now();
    const randomStr = crypto.getRandomString(16);
    logTest('WxCrypto.getRandomString', randomStr.length === 16, Date.now() - start);
  } catch (e) {
    logTest('WxCrypto.getRandomString', false, 0, e.message);
  }
  
  // 获取随机字节
  try {
    const start = Date.now();
    const randomBytes = crypto.getRandomBytes(16);
    logTest('WxCrypto.getRandomBytes', Buffer.isBuffer(randomBytes) && randomBytes.length === 16, Date.now() - start);
  } catch (e) {
    logTest('WxCrypto.getRandomBytes', false, 0, e.message);
  }
}

function testUtilityLogger() {
  startCategory('工具 - 日志');
  
  // createLogger
  try {
    const start = Date.now();
    const logger = createLogger({ level: 'debug' });
    logTest('createLogger', !!logger && typeof logger.debug === 'function', Date.now() - start);
    
    logger.debug('test debug message');
    logger.info('test info message');
    logger.warn('test warn message');
    logger.error('test error message');
  } catch (e) {
    logTest('createLogger', false, 0, e.message);
  }
  
  // Logger class
  try {
    const start = Date.now();
    const customLogger = new Logger({ level: 'info', debug: false });
    logTest('Logger class', !!customLogger, Date.now() - start);
  } catch (e) {
    logTest('Logger', false, 0, e.message);
  }
}

function testUtilityCache() {
  startCategory('工具 - 缓存');
  
  // MemoryCache
  try {
    const start = Date.now();
    const cache = new MemoryCache();
    cache.set('test_key', 'test_value', 3600);
    const value = cache.get('test_key');
    logTest('MemoryCache.set/get', value === 'test_value', Date.now() - start);
    
    const has = cache.has('test_key');
    logTest('MemoryCache.has', has === true, 0);
    
    cache.delete('test_key');
    const afterDelete = cache.get('test_key');
    logTest('MemoryCache.delete', afterDelete === undefined, 0);
    
    cache.clear();
    const afterClear = cache.get('test_key');
    logTest('MemoryCache.clear', afterClear === undefined, 0);
  } catch (e) {
    logTest('MemoryCache', false, 0, e.message);
  }
  
  // FileCache
  try {
    const start = Date.now();
    const fileCache = new FileCache('./test_cache');
    logTest('FileCache.init', !!fileCache, Date.now() - start);
  } catch (e) {
    logTest('FileCache', false, 0, e.message);
  }
}

function testUtilityError() {
  startCategory('工具 - 错误处理');
  
  // WxError
  try {
    const start = Date.now();
    const err = new WxError(ErrorCode.INVALID_APPID, '测试错误');
    logTest('WxError.create', err.code === ErrorCode.INVALID_APPID, Date.now() - start);
    
    logTest('WxError.toJSON', JSON.stringify(err).includes('INVALID_APPID'), 0);
    logTest('WxError.toString', err.toString().includes('INVALID_APPID'), 0);
  } catch (e) {
    logTest('WxError', false, 0, e.message);
  }
  
  // ErrorCode
  logTest('ErrorCode.INVALID_APPID', ErrorCode.INVALID_APPID === -40001, 0);
  logTest('ErrorCode.PARAM_EMPTY_STRING', ErrorCode.PARAM_EMPTY_STRING === -40006, 0);
  logTest('ErrorCode.CONFIG_NOT_FOUND', ErrorCode.CONFIG_NOT_FOUND === -40010, 0);
}

function testUtilitySignature() {
  startCategory('工具 - 签名验证');
  
  // verifyWeChatSignature
  try {
    const start = Date.now();
    const params = {
      signature: 'test_sig',
      timestamp: '1234567890',
      nonce: 'test_nonce'
    };
    const valid = verifyWeChatSignature(params, 'test_token');
    logTest('verifyWeChatSignature', typeof valid === 'boolean', Date.now() - start);
  } catch (e) {
    logTest('verifyWeChatSignature', false, 0, e.message);
  }
  
  // verifyMessageSignature
  try {
    const start = Date.now();
    const valid = verifyMessageSignature('test_token', '1234567890', 'test_nonce', 'test_sig');
    logTest('verifyMessageSignature', typeof valid === 'boolean', Date.now() - start);
  } catch (e) {
    logTest('verifyMessageSignature', false, 0, e.message);
  }
  
  // isWeChatIP
  try {
    const start = Date.now();
    const isWechat = isWeChatIP('101.226.211.1');
    logTest('isWeChatIP', typeof isWechat === 'boolean', Date.now() - start);
  } catch (e) {
    logTest('isWeChatIP', false, 0, e.message);
  }
}

// ==================== SDK 核心功能测试 ====================

function testSDKCore() {
  startCategory('SDK - 核心功能');
  
  // SDK 初始化
  try {
    const start = Date.now();
    const sdk = new WeChatSDK(config);
    logTest('SDK.init', !!sdk, Date.now() - start);
  } catch (e) {
    logTest('SDK.init', false, 0, e.message);
  }
  
  // fromOptions
  try {
    const start = Date.now();
    const sdk2 = WeChatSDK.fromOptions(config);
    logTest('SDK.fromOptions', !!sdk2, Date.now() - start);
  } catch (e) {
    logTest('SDK.fromOptions', false, 0, e.message);
  }
  
  // 获取公众号实例
  try {
    const sdk = new WeChatSDK(config);
    const official = sdk.official('test');
    logTest('SDK.official', !!official && !!official.appId, 0);
  } catch (e) {
    logTest('SDK.official', false, 0, e.message);
  }
  
  // 获取小程序实例
  try {
    const sdk = new WeChatSDK(config);
    const mp = sdk.mp('test');
    logTest('SDK.mp', !!mp && !!mp.appId, 0);
  } catch (e) {
    logTest('SDK.mp', false, 0, e.message);
  }
  
  // 动态添加公众号
  try {
    const sdk = new WeChatSDK();
    const added = sdk.addOfficialAccount('dynamic', {
      appId: 'wx1e5466401a31c0b6',
      appSecret: '8e3c288468368acd1cf9bb3bc4ff4883'
    });
    logTest('SDK.addOfficialAccount', !!added && !!added.appId, 0);
  } catch (e) {
    logTest('SDK.addOfficialAccount', false, 0, e.message);
  }
  
  // 动态添加小程序
  try {
    const sdk = new WeChatSDK();
    const added = sdk.addMiniProgram('dynamic_mp', {
      appId: 'wx45b7d4e30d226b77',
      appSecret: 'f59072c2fc6d92dac553f9fafa46518f'
    });
    logTest('SDK.addMiniProgram', !!added && !!added.appId, 0);
  } catch (e) {
    logTest('SDK.addMiniProgram', false, 0, e.message);
  }
  
  // 列表方法
  try {
    const sdk = new WeChatSDK(config);
    const officialList = sdk.listOfficialAccounts();
    const mpList = sdk.listMiniPrograms();
    logTest('SDK.listOfficialAccounts', Array.isArray(officialList), 0);
    logTest('SDK.listMiniPrograms', Array.isArray(mpList), 0);
  } catch (e) {
    logTest('SDK.list*', false, 0, e.message);
  }
  
  // 配置验证
  try {
    const sdk = new WeChatSDK(config);
    const sdkConfig = sdk.getConfig();
    logTest('SDK.getConfig', !!sdkConfig, 0);
  } catch (e) {
    logTest('SDK.getConfig', false, 0, e.message);
  }
}

// ==================== 主函数 ====================

async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║      WeChat SDK AI - 本地包完整接口测试 (v1.0.4)               ║');
  console.log('║      Package: file:.. (本地开发包)                             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  const startTime = Date.now();
  
  try {
    // 公众号接口测试
    const tokenResult = await testOfficialToken();
    await testOfficialUser(tokenResult);
    await testOfficialTags(tokenResult);
    await testOfficialMenu(tokenResult);
    await testOfficialTemplate(tokenResult);
    await testOfficialOAuth(tokenResult);
    await testOfficialJsApi(tokenResult);
    await testOfficialKF(tokenResult);
    await testOfficialQrcode(tokenResult);
    await testOfficialSemantic(tokenResult);
    await testOfficialDataCube(tokenResult);
    await testOfficialMaterial(tokenResult);
    await testOfficialBroadcast(tokenResult);
    await testOfficialComment(tokenResult);
    await testOfficialDraft(tokenResult);
    await testOfficialFreePublish(tokenResult);
    await testOfficialSubscribe(tokenResult);
    
    // 小程序接口测试
    const mpTokenResult = await testMiniProgramToken();
    await testMiniProgramLogin(mpTokenResult);
    await testMiniProgramMessage(mpTokenResult);
    await testMiniProgramSecurity(mpTokenResult);
    await testMiniProgramQrcode(mpTokenResult);
    await testMiniProgramUrlScheme(mpTokenResult);
    await testMiniProgramNearby(mpTokenResult);
    await testMiniProgramPlugin(mpTokenResult);
    await testMiniProgramCloud(mpTokenResult);
    await testMiniProgramDelivery(mpTokenResult);
    await testMiniProgramSubscribeTemplate(mpTokenResult);
    
    // 工具函数测试
    testUtilityFunctions();
    testUtilityXML();
    testUtilityCrypto();
    testUtilityLogger();
    testUtilityCache();
    testUtilityError();
    testUtilitySignature();
    
    // SDK核心功能测试
    testSDKCore();
    
  } catch (e) {
    console.error('测试执行异常:', e);
  }
  
  const totalTime = Date.now() - startTime;
  
  // 生成报告
  generateReport(totalTime);
}

function generateReport(totalTime) {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                       测试结果汇总                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  console.log(`\n总计耗时: ${totalTime}ms`);
  console.log(`\n总计: ${testResults.summary.total} 项`);
  console.log(`通过: ${testResults.summary.passed} 项`);
  console.log(`失败: ${testResults.summary.failed} 项`);
  console.log(`成功率: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
  
  console.log('\n--- 按分类统计 ---');
  for (const [category, stats] of Object.entries(testResults.summary.categories)) {
    const rate = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`${category}: ${stats.passed}/${stats.total} (${rate}%)`);
  }
  
  // 保存JSON报告
  const jsonReport = {
    ...testResults,
    totalTime,
    successRate: ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1) + '%'
  };
  
  require('fs').writeFileSync('test-report-full.json', JSON.stringify(jsonReport, null, 2));
  console.log('\n详细JSON报告已保存到: test-report-full.json');
  
  // 返回结果用于进程退出
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// 执行测试
runAllTests().catch(console.error);
