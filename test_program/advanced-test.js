const { WeChatSDK, parseXml, WxCrypto, generateSignature } = require('wechat-sdk-ai');

async function testAdvancedFeatures() {
  console.log('=== 高级功能测试 ===\n');
  
  const sdk = new WeChatSDK({
    officialAccounts: {
      test: {
        appId: 'wx1e5466401a31c0b6',
        appSecret: '8e3c288468368acd1cf9bb3bc4ff4883'
      }
    },
    debug: true
  });
  
  // 1. 测试XML解析复杂结构
  console.log('1. XML解析测试');
  const complexXml = `
  <xml>
    <ToUserName><![CDATA[toUser]]></ToUserName>
    <FromUserName><![CDATA[fromUser]]></FromUserName>
    <CreateTime>1234567890</CreateTime>
    <MsgType><![CDATA[event]]></MsgType>
    <Event><![CDATA[CLICK]]></Event>
    <EventKey><![CDATA[menu_click]]></EventKey>
    <Articles>
      <item>
        <Title><![CDATA[文章标题]]></Title>
        <Description><![CDATA[文章描述]]></Description>
        <PicUrl><![CDATA[http://example.com/pic.jpg]]></PicUrl>
        <Url><![CDATA[http://example.com]]></Url>
      </item>
    </Articles>
  </xml>`;
  
  const parseResult = parseXml(complexXml);
  console.log('✓ XML解析:', parseResult.success ? '成功' : '失败');
  if (parseResult.success) {
    console.log('  - 消息类型:', parseResult.data.MsgType);
    console.log('  - 事件类型:', parseResult.data.Event);
  }
  
  // 2. 测试加密解密功能
  console.log('\n2. 加密解密测试');
  try {
    const crypto = new WxCrypto('test_app_id', 'test_token', '4gK4BqX1C5k2J8rM7n3P9sT6vW2y5z8A9b1D4eF7gH=');
    const message = '这是一个测试消息';
    const encrypted = crypto.encrypt(message);
    const decrypted = crypto.decrypt(encrypted);
    console.log('✓ 加密解密:', decrypted === message ? '成功' : '失败');
    console.log('  - 原文:', message);
    console.log('  - 密文长度:', encrypted.length);
  } catch (e) {
    console.log('✗ 加密解密: 失败 -', e.message);
  }
  
  // 3. 测试签名生成
  console.log('\n3. 签名生成测试');
  const params = {
    token: 'test_token',
    timestamp: '1234567890',
    nonce: 'test_nonce'
  };
  const signature = generateSignature(params);
  console.log('✓ 签名生成: 成功');
  console.log('  - 签名结果:', signature);
  
  // 4. 测试缓存功能
  console.log('\n4. 缓存功能测试');
  const cache = sdk.getCache();
  const testKey = 'test_key';
  const testValue = { data: 'test_value', timestamp: Date.now() };
  
  try {
    await cache.set(testKey, testValue, 60);
    const retrieved = await cache.get(testKey);
    console.log('✓ 缓存功能:', retrieved ? '成功' : '失败');
    console.log('  - 存储值:', JSON.stringify(testValue));
    console.log('  - 获取值:', JSON.stringify(retrieved));
    await cache.delete(testKey);
  } catch (e) {
    console.log('✗ 缓存功能: 失败 -', e.message);
  }
  
  // 5. 测试配置管理
  console.log('\n5. 配置管理测试');
  try {
    const official = sdk.official('test');
    console.log('✓ 配置管理: 成功');
    console.log('  - 公众号配置:', official.config.appId);
    
    // 测试动态配置
    sdk.setDebug(false);
    sdk.setLogLevel('warn');
    console.log('✓ 动态配置: 成功');
    console.log('  - 调试模式:', sdk.config.isDebug());
    console.log('  - 日志级别:', sdk.config.getLogLevel());
  } catch (e) {
    console.log('✗ 配置管理: 失败 -', e.message);
  }
  
  // 6. 测试错误处理
  console.log('\n6. 错误处理测试');
  try {
    // 故意使用错误的配置
    const wrongSdk = new WeChatSDK({});
    const wrongOfficial = wrongSdk.official('nonexistent');
  } catch (e) {
    console.log('✓ 错误处理: 成功');
    console.log('  - 错误信息:', e.message);
  }
  
  console.log('\n=== 高级功能测试完成 ===');
}

async function testPerformance() {
  console.log('\n=== 性能测试 ===\n');
  
  const sdk = new WeChatSDK({
    officialAccounts: {
      test: {
        appId: 'wx1e5466401a31c0b6',
        appSecret: '8e3c288468368acd1cf9bb3bc4ff4883'
      }
    }
  });
  
  // 1. 并发请求测试
  console.log('1. 并发请求测试');
  const startTime = Date.now();
  const promises = [];
  
  for (let i = 0; i < 5; i++) {
    promises.push(sdk.official('test').getAccessToken());
  }
  
  try {
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    console.log('✓ 并发请求: 成功');
    console.log('  - 请求数量:', 5);
    console.log('  - 总耗时:', duration + 'ms');
    console.log('  - 平均耗时:', (duration / 5).toFixed(2) + 'ms');
  } catch (e) {
    console.log('✗ 并发请求: 失败 -', e.message);
  }
  
  // 2. 内存使用测试
  console.log('\n2. 内存使用测试');
  const memBefore = process.memoryUsage();
  
  // 创建大量实例
  const instances = [];
  for (let i = 0; i < 100; i++) {
    instances.push(new WeChatSDK({
      officialAccounts: {
        [`test${i}`]: {
          appId: `wx${i}`,
          appSecret: `secret${i}`
        }
      }
    }));
  }
  
  const memAfter = process.memoryUsage();
  const heapDiff = memAfter.heapUsed - memBefore.heapUsed;
  
  console.log('✓ 内存使用: 完成');
  console.log('  - 实例数量:', 100);
  console.log('  - 内存增长:', (heapDiff / 1024 / 1024).toFixed(2) + 'MB');
  console.log('  - 平均内存:', (heapDiff / 100 / 1024).toFixed(2) + 'KB/实例');
  
  console.log('\n=== 性能测试完成 ===');
}

async function runAllTests() {
  console.log('🚀 开始 wechat-sdk-ai@latest 功能测试\n');
  
  await testAdvancedFeatures();
  await testPerformance();
  
  console.log('\n✅ 所有测试完成');
}

runAllTests().catch(console.error);
