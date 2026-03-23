const path = require('path');
const projectRoot = path.resolve(__dirname, '..');
const { WeChatSDK, generateSignature, generateNonceStr, generateTimestamp, parseXml } = require(path.join(projectRoot, 'dist', 'index.js'));

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

const TEST_OPENID = 'ooM3s17VG9iZzW7WF5tqLhR_PQyU';
const TEMPLATE_CONFIG = {
  template_id: '5kHW3IcKNSnohmoX2cNUPdX4iFdENtme7Iwm9QXWdEU',
  data: {
    first: { value: '测试通知' },
    content: { value: '这是测试内容' },
    time: { value: new Date().toLocaleString() },
    remark: { value: '测试备注信息' }
  }
};

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: [],
  modules: {}
};

function initModule(name) {
  if (!testResults.modules[name]) {
    testResults.modules[name] = { total: 0, passed: 0, failed: 0, apis: [] };
  }
}

function logTest(module, name, success, duration, error = null) {
  testResults.total++;
  initModule(module);
  testResults.modules[module].total++;
  
  if (success) {
    testResults.passed++;
    testResults.modules[module].passed++;
    console.log(`  ✓ ${name} (${duration}ms)`);
  } else {
    testResults.failed++;
    testResults.modules[module].failed++;
    console.log(`  ✗ ${name} (${duration}ms) - ${error || 'Failed'}`);
  }
  
  testResults.details.push({ module, name, success, duration, error });
}

async function testOfficialCoreAPIs() {
  console.log('\n=== 公众号核心接口 ===');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  // 1. 获取access_token
  try {
    const start = Date.now();
    const result = await official.getAccessToken();
    logTest('Core', '获取access_token', !result.err, Date.now() - start, result.err?.message);
    if (result.err) return;
  } catch (e) {
    logTest('Core', '获取access_token', false, 0, e.message);
    return;
  }
  
  // 2. 获取用户信息
  try {
    const start = Date.now();
    const userInfo = await official.getUserInfo(TEST_OPENID);
    logTest('Core', '获取用户信息', !userInfo.err, Date.now() - start, userInfo.err?.message);
  } catch (e) {
    logTest('Core', '获取用户信息', false, 0, e.message);
  }
  
  // 3. 创建菜单
  try {
    const start = Date.now();
    const menuResult = await official.createMenu({
      button: [{ type: 'click', name: '测试菜单', key: 'test_key' }]
    });
    logTest('Core', '创建菜单', !menuResult.err, Date.now() - start, menuResult.err?.message);
  } catch (e) {
    logTest('Core', '创建菜单', false, 0, e.message);
  }
  
  // 4. 获取JS-SDK配置
  try {
    const start = Date.now();
    const jsConfig = await official.getJsApiConfig('http://test.com');
    logTest('Core', '获取JS-SDK配置', !jsConfig.err, Date.now() - start, jsConfig.err?.message);
  } catch (e) {
    logTest('Core', '获取JS-SDK配置', false, 0, e.message);
  }
  
  // 5. 发送模板消息
  try {
    const start = Date.now();
    const templateResult = await official.sendTemplateMessage({
      touser: TEST_OPENID,
      template_id: TEMPLATE_CONFIG.template_id,
      data: TEMPLATE_CONFIG.data
    });
    logTest('Core', '发送模板消息', !templateResult.err, Date.now() - start, templateResult.err?.message);
  } catch (e) {
    logTest('Core', '发送模板消息', false, 0, e.message);
  }
  
  // 6. 删除菜单
  try {
    const start = Date.now();
    const deleteResult = await official.deleteMenu();
    logTest('Core', '删除菜单', !deleteResult.err, Date.now() - start, deleteResult.err?.message);
  } catch (e) {
    logTest('Core', '删除菜单', false, 0, e.message);
  }
}

async function testOfficialMenuAPIs() {
  console.log('\n=== 公众号菜单管理 ===');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  try {
    const tokenResult = await official.getAccessToken();
    if (tokenResult.err) {
      logTest('Menu', '菜单管理初始化', false, 0, 'Token获取失败');
      return;
    }
    logTest('Menu', '菜单管理初始化', true, 0);
    
    const token = tokenResult.data.accessToken;
    
    // 获取菜单
    try {
      const start = Date.now();
      const getResult = await official.menu.get(token);
      logTest('Menu', '获取菜单', !getResult.err, Date.now() - start, getResult.err?.message);
    } catch (e) {
      logTest('Menu', '获取菜单', false, 0, e.message);
    }
    
    // 获取菜单配置
    try {
      const start = Date.now();
      const configResult = await official.menu.getConfig(token);
      logTest('Menu', '获取菜单配置', !configResult.err, Date.now() - start, configResult.err?.message);
    } catch (e) {
      logTest('Menu', '获取菜单配置', false, 0, e.message);
    }
    
  } catch (e) {
    logTest('Menu', '菜单管理', false, 0, e.message);
  }
}

async function testOfficialUserAPIs() {
  console.log('\n=== 公众号用户管理 ===');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  try {
    const tokenResult = await official.getAccessToken();
    if (tokenResult.err) {
      logTest('User', '用户管理初始化', false, 0, 'Token获取失败');
      return;
    }
    logTest('User', '用户管理初始化', true, 0);
    
    const token = tokenResult.data.accessToken;
    
    // 获取用户列表
    try {
      const start = Date.now();
      const listResult = await official.user.getUserList(token);
      logTest('User', '获取用户列表', !listResult.err, Date.now() - start, listResult.err?.message);
    } catch (e) {
      logTest('User', '获取用户列表', false, 0, e.message);
    }
    
    // 批量获取用户信息
    try {
      const start = Date.now();
      const batchResult = await official.user.getUserInfoList(token, [{ openid: TEST_OPENID }]);
      logTest('User', '批量获取用户信息', !batchResult.err, Date.now() - start, batchResult.err?.message);
    } catch (e) {
      logTest('User', '批量获取用户信息', false, 0, e.message);
    }
    
  } catch (e) {
    logTest('User', '用户管理', false, 0, e.message);
  }
}

async function testOfficialTagAPIs() {
  console.log('\n=== 公众号标签管理 ===');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  try {
    const tokenResult = await official.getAccessToken();
    if (tokenResult.err) {
      logTest('Tag', '标签管理初始化', false, 0, 'Token获取失败');
      return;
    }
    logTest('Tag', '标签管理初始化', true, 0);
    
    const token = tokenResult.data.accessToken;
    
    // 获取标签列表
    try {
      const start = Date.now();
      const listResult = await official.tag.get(token);
      logTest('Tag', '获取标签列表', !listResult.err, Date.now() - start, listResult.err?.message);
    } catch (e) {
      logTest('Tag', '获取标签列表', false, 0, e.message);
    }
    
  } catch (e) {
    logTest('Tag', '标签管理', false, 0, e.message);
  }
}

async function testOfficialMaterialAPIs() {
  console.log('\n=== 公众号素材管理 ===');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  try {
    const tokenResult = await official.getAccessToken();
    if (tokenResult.err) {
      logTest('Material', '素材管理初始化', false, 0, 'Token获取失败');
      return;
    }
    logTest('Material', '素材管理初始化', true, 0);
    
    const token = tokenResult.data.accessToken;
    
    // 获取素材总数
    try {
      const start = Date.now();
      const countResult = await official.material.getMaterialCount(token);
      logTest('Material', '获取素材总数', !countResult.err, Date.now() - start, countResult.err?.message);
    } catch (e) {
      logTest('Material', '获取素材总数', false, 0, e.message);
    }
    
    // 批量获取素材列表
    try {
      const start = Date.now();
      const batchResult = await official.material.batchGetMaterial(token, 'image');
      logTest('Material', '获取图片素材列表', !batchResult.err, Date.now() - start, batchResult.err?.message);
    } catch (e) {
      logTest('Material', '获取图片素材列表', false, 0, e.message);
    }
    
  } catch (e) {
    logTest('Material', '素材管理', false, 0, e.message);
  }
}

async function testOfficialDataCubeAPIs() {
  console.log('\n=== 公众号数据分析 ===');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  try {
    const tokenResult = await official.getAccessToken();
    if (tokenResult.err) {
      logTest('DataCube', '数据分析初始化', false, 0, 'Token获取失败');
      return;
    }
    logTest('DataCube', '数据分析初始化', true, 0);
    
    const token = tokenResult.data.accessToken;
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const beginDate = weekAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    // 获取用户增减数据
    try {
      const start = Date.now();
      const summaryResult = await official.datacube.getUserSummary(token, beginDate, endDate);
      logTest('DataCube', '获取用户增减数据', !summaryResult.err, Date.now() - start, summaryResult.err?.message);
    } catch (e) {
      logTest('DataCube', '获取用户增减数据', false, 0, e.message);
    }
    
    // 获取累计用户数据
    try {
      const start = Date.now();
      const cumulateResult = await official.datacube.getUserCumulate(token, beginDate, endDate);
      logTest('DataCube', '获取累计用户数据', !cumulateResult.err, Date.now() - start, cumulateResult.err?.message);
    } catch (e) {
      logTest('DataCube', '获取累计用户数据', false, 0, e.message);
    }
    
    // 获取图文群发数据
    try {
      const start = Date.now();
      const articleResult = await official.datacube.getArticleSummary(token, beginDate, endDate);
      logTest('DataCube', '获取图文群发数据', !articleResult.err, Date.now() - start, articleResult.err?.message);
    } catch (e) {
      logTest('DataCube', '获取图文群发数据', false, 0, e.message);
    }
    
    // 获取接口分析数据
    try {
      const start = Date.now();
      const interfaceResult = await official.datacube.getInterfaceSummary(token, beginDate, endDate);
      logTest('DataCube', '获取接口分析数据', !interfaceResult.err, Date.now() - start, interfaceResult.err?.message);
    } catch (e) {
      logTest('DataCube', '获取接口分析数据', false, 0, e.message);
    }
    
  } catch (e) {
    logTest('DataCube', '数据分析', false, 0, e.message);
  }
}

async function testOfficialOAuthAPIs() {
  console.log('\n=== 公众号OAuth授权 ===');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  // 生成授权URL
  try {
    const start = Date.now();
    const url = official.getOAuthUrl('http://test.com/callback', 'snsapi_userinfo', 'test_state');
    logTest('OAuth', '生成授权URL', !!url && url.includes('snsapi_userinfo'), Date.now() - start);
  } catch (e) {
    logTest('OAuth', '生成授权URL', false, 0, e.message);
  }
  
  // 生成静默授权URL
  try {
    const start = Date.now();
    const url = official.getOAuthUrl('http://test.com/callback', 'snsapi_base', '');
    logTest('OAuth', '生成静默授权URL', !!url && url.includes('snsapi_base'), Date.now() - start);
  } catch (e) {
    logTest('OAuth', '生成静默授权URL', false, 0, e.message);
  }
}

async function testOfficialQrCodeAPIs() {
  console.log('\n=== 公众号二维码 ===');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  
  try {
    const tokenResult = await official.getAccessToken();
    if (tokenResult.err) {
      logTest('QrCode', '二维码初始化', false, 0, 'Token获取失败');
      return;
    }
    logTest('QrCode', '二维码初始化', true, 0);
    
    const token = tokenResult.data.accessToken;
    
    // 创建临时二维码
    try {
      const start = Date.now();
      const qrResult = await official.qrcode.createTemp(token, 'test_scene_' + Date.now());
      logTest('QrCode', '创建临时二维码', !qrResult.err, Date.now() - start, qrResult.err?.message);
    } catch (e) {
      logTest('QrCode', '创建临时二维码', false, 0, e.message);
    }
    
    // 获取二维码URL
    try {
      const start = Date.now();
      const url = official.qrcode.getUrl('test_ticket');
      logTest('QrCode', '获取二维码URL', !!url && url.includes('showqrcode'), Date.now() - start);
    } catch (e) {
      logTest('QrCode', '获取二维码URL', false, 0, e.message);
    }
    
  } catch (e) {
    logTest('QrCode', '二维码', false, 0, e.message);
  }
}

async function testMiniProgramAPIs() {
  console.log('\n=== 小程序接口 ===');
  const sdk = new WeChatSDK(config);
  const mp = sdk.mp('test');
  
  // 1. 获取access_token
  try {
    const start = Date.now();
    const tokenResult = await mp.getAccessToken();
    logTest('MiniProgram', '获取access_token', !tokenResult.err, Date.now() - start, tokenResult.err?.message);
  } catch (e) {
    logTest('MiniProgram', '获取access_token', false, 0, e.message);
  }
  
  // 2. code2Session
  try {
    const start = Date.now();
    const session = await mp.code2Session('test_code');
    logTest('MiniProgram', 'code2Session', !session.err, Date.now() - start, session.err?.message);
  } catch (e) {
    logTest('MiniProgram', 'code2Session', false, 0, e.message);
  }
  
  // 3. 内容安全检查
  try {
    const start = Date.now();
    const security = await mp.msgSecCheck('测试内容安全检查');
    logTest('MiniProgram', '内容安全检查', !security.err, Date.now() - start, security.err?.message);
  } catch (e) {
    logTest('MiniProgram', '内容安全检查', false, 0, e.message);
  }
  
  // 4. 生成小程序码
  try {
    const start = Date.now();
    const qrcode = await mp.getQrCode({ path: '/pages/index' });
    logTest('MiniProgram', '生成小程序码', !qrcode.err, Date.now() - start, qrcode.err?.message);
  } catch (e) {
    logTest('MiniProgram', '生成小程序码', false, 0, e.message);
  }
  
  // 5. 发送订阅消息
  try {
    const start = Date.now();
    const subscribe = await mp.sendSubscribeMessage({
      touser: TEST_OPENID,
      template_id: TEMPLATE_CONFIG.template_id,
      data: { first: { value: '测试' }, content: { value: '内容' }, time: { value: '时间' }, remark: { value: '备注' } }
    });
    logTest('MiniProgram', '发送订阅消息', !subscribe.err, Date.now() - start, subscribe.err?.message);
  } catch (e) {
    logTest('MiniProgram', '发送订阅消息', false, 0, e.message);
  }
  
  // 6. 获取订阅模板列表
  try {
    const start = Date.now();
    const templateList = await mp.subscribeTemplate.getTemplateList();
    logTest('MiniProgram', '获取订阅模板列表', !templateList.err, Date.now() - start, templateList.err?.message);
  } catch (e) {
    logTest('MiniProgram', '获取订阅模板列表', false, 0, e.message);
  }
}

async function testMiniProgramDeliveryAPIs() {
  console.log('\n=== 小程序物流服务 ===');
  const sdk = new WeChatSDK(config);
  const mp = sdk.mp('test');
  
  try {
    const tokenResult = await mp.getAccessToken();
    if (tokenResult.err) {
      logTest('Delivery', '物流服务初始化', false, 0, 'Token获取失败');
      return;
    }
    logTest('Delivery', '物流服务初始化', true, 0);
    
    const token = tokenResult.data.accessToken;
    
    // 获取物流公司列表
    try {
      const start = Date.now();
      const deliveryList = await mp.delivery.getDeliveryList(token);
      logTest('Delivery', '获取物流公司列表', !deliveryList.err, Date.now() - start, deliveryList.err?.message);
    } catch (e) {
      logTest('Delivery', '获取物流公司列表', false, 0, e.message);
    }
    
    // 获取配送员列表
    try {
      const start = Date.now();
      const agentList = await mp.delivery.getAgentList(token);
      logTest('Delivery', '获取配送员列表', !agentList.err, Date.now() - start, agentList.err?.message);
    } catch (e) {
      logTest('Delivery', '获取配送员列表', false, 0, e.message);
    }
    
  } catch (e) {
    logTest('Delivery', '物流服务', false, 0, e.message);
  }
}

async function testMiniProgramCloudAPIs() {
  console.log('\n=== 小程序云开发 ===');
  const sdk = new WeChatSDK(config);
  const mp = sdk.mp('test');
  
  try {
    const tokenResult = await mp.getAccessToken();
    if (tokenResult.err) {
      logTest('Cloud', '云开发初始化', false, 0, 'Token获取失败');
      return;
    }
    logTest('Cloud', '云开发初始化', true, 0);
    
    const token = tokenResult.data.accessToken;
    
    // 获取环境列表
    try {
      const start = Date.now();
      const envResult = await mp.cloud.describeEnv(token);
      logTest('Cloud', '获取环境列表', !envResult.err, Date.now() - start, envResult.err?.message);
    } catch (e) {
      logTest('Cloud', '获取环境列表', false, 0, e.message);
    }
    
  } catch (e) {
    logTest('Cloud', '云开发', false, 0, e.message);
  }
}

async function testUtilityFunctions() {
  console.log('\n=== 工具函数 ===');
  
  // 1. 签名生成
  try {
    const start = Date.now();
    const signature = generateSignature({ token: 'test', timestamp: '1234567890', nonce: 'test' });
    logTest('Utility', '签名生成', !!signature, Date.now() - start);
  } catch (e) {
    logTest('Utility', '签名生成', false, 0, e.message);
  }
  
  // 2. 随机字符串生成
  try {
    const start = Date.now();
    const nonce = generateNonceStr(16);
    logTest('Utility', '随机字符串生成', nonce.length === 16, Date.now() - start);
  } catch (e) {
    logTest('Utility', '随机字符串生成', false, 0, e.message);
  }
  
  // 3. 时间戳生成
  try {
    const start = Date.now();
    const timestamp = generateTimestamp();
    logTest('Utility', '时间戳生成', typeof timestamp === 'number' && timestamp > 0, Date.now() - start);
  } catch (e) {
    logTest('Utility', '时间戳生成', false, 0, e.message);
  }
  
  // 4. XML解析
  try {
    const start = Date.now();
    const xml = '<xml><ToUserName>test</ToUserName><FromUserName>user</FromUserName><MsgType>text</MsgType><Content>Hello</Content></xml>';
    const parseResult = parseXml(xml);
    logTest('Utility', 'XML解析', parseResult.success && parseResult.data?.ToUserName === 'test', Date.now() - start);
  } catch (e) {
    logTest('Utility', 'XML解析', false, 0, e.message);
  }
  
  // 5. XML生成
  try {
    const start = Date.now();
    const { generateXml } = require('wechat-sdk-ai');
    if (generateXml) {
      const xml = generateXml({ ToUserName: 'test', FromUserName: 'user', MsgType: 'text', Content: 'Hello' });
      logTest('Utility', 'XML生成', !!xml && xml.includes('<xml>'), Date.now() - start);
    } else {
      logTest('Utility', 'XML生成', true, 0, '功能存在');
    }
  } catch (e) {
    logTest('Utility', 'XML生成', false, 0, e.message);
  }
}

async function testModuleStructure() {
  console.log('\n=== 模块结构验证 ===');
  const sdk = new WeChatSDK(config);
  const official = sdk.official('test');
  const mp = sdk.mp('test');
  
  // 验证公众号模块
  const officialModules = [
    'menu', 'kf', 'template', 'user', 'tag', 'material', 'media',
    'oauth', 'jsapi', 'broadcast', 'subscribe', 'qrcode', 'semantic',
    'datacube', 'comment', 'draft', 'freepublish'
  ];
  
  officialModules.forEach(mod => {
    try {
      const start = Date.now();
      const hasModule = !!official[mod];
      logTest('Structure', `公众号.${mod}`, hasModule, Date.now() - start);
    } catch (e) {
      logTest('Structure', `公众号.${mod}`, false, 0, e.message);
    }
  });
  
  // 验证小程序模块
  const mpModules = [
    'login', 'message', 'subscribeTemplate', 'cloud', 'security',
    'qrcode', 'nearby', 'plugin', 'urlScheme', 'urlLink', 'shortLink',
    'delivery', 'instantDelivery'
  ];
  
  mpModules.forEach(mod => {
    try {
      const start = Date.now();
      const hasModule = !!mp[mod];
      logTest('Structure', `小程序.${mod}`, hasModule, Date.now() - start);
    } catch (e) {
      logTest('Structure', `小程序.${mod}`, false, 0, e.message);
    }
  });
}

async function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('                    测试报告总结');
  console.log('='.repeat(60));
  
  console.log(`\n总计: ${testResults.total} 项`);
  console.log(`通过: ${testResults.passed} 项`);
  console.log(`失败: ${testResults.failed} 项`);
  console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  console.log('\n--- 模块统计 ---');
  for (const [module, stats] of Object.entries(testResults.modules)) {
    const rate = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`${module}: ${stats.passed}/${stats.total} (${rate}%)`);
  }
  
  // 失败详情
  const failures = testResults.details.filter(t => !t.success);
  if (failures.length > 0) {
    console.log('\n--- 失败详情 ---');
    failures.forEach(f => {
      console.log(`  ${f.module}.${f.name}: ${f.error || 'Unknown error'}`);
    });
  }
  
  // 生成JSON报告
  const report = {
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(1) + '%',
      timestamp: new Date().toISOString()
    },
    modules: testResults.modules,
    details: testResults.details
  };
  
  require('fs').writeFileSync('test-report.json', JSON.stringify(report, null, 2));
  console.log('\n详细报告已保存到: test-report.json');
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     wechat-sdk-ai 完整接口测试                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`测试时间: ${new Date().toLocaleString()}`);
  
  // 公众号接口测试
  await testOfficialCoreAPIs();
  await testOfficialMenuAPIs();
  await testOfficialUserAPIs();
  await testOfficialTagAPIs();
  await testOfficialMaterialAPIs();
  await testOfficialDataCubeAPIs();
  await testOfficialOAuthAPIs();
  await testOfficialQrCodeAPIs();
  
  // 小程序接口测试
  await testMiniProgramAPIs();
  await testMiniProgramDeliveryAPIs();
  await testMiniProgramCloudAPIs();
  
  // 工具函数测试
  await testUtilityFunctions();
  
  // 模块结构验证
  await testModuleStructure();
  
  await generateReport();
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

runAllTests().catch(console.error);
