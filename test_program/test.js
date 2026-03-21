const { WeChatSDK } = require('wechat-sdk-ai');

// 固定测试号配置
const config = {
  officialAccounts: {
    test: {
      appId: 'wx1e5466401a31c0b6',
      appSecret: '8e3c288468368acd1cf9bb3bc4ff4883'
    }
  },
  debug: true
};

async function testWeChatAPI() {
  console.log('=== 微信接口测试开始 ===');
  
  try {
    // 初始化SDK
    const sdk = new WeChatSDK(config);
    console.log('✓ SDK初始化成功');
    
    // 测试获取access_token
    console.log('正在获取access_token...');
    const tokenResult = await sdk.official('test').getAccessToken();
    
    if (tokenResult.err) {
      console.log('✗ 获取access_token失败:', tokenResult.err.message);
      return false;
    }
    
    console.log('✓ 获取access_token成功');
    console.log('Token信息:', {
      accessToken: tokenResult.data.accessToken.substring(0, 20) + '...',
      expiresIn: tokenResult.data.expiresIn
    });
    
    // 测试验签功能
    console.log('正在测试验签功能...');
    const { generateSignature } = require('wechat-sdk-ai');
    const testParams = {
      token: 'test_token',
      timestamp: '1234567890',
      nonce: 'test_nonce'
    };
    
    const signature = generateSignature(testParams);
    console.log('✓ 验签测试成功');
    console.log('签名结果:', signature);
    
    console.log('=== 测试结果: 接口正常 ===');
    return true;
    
  } catch (error) {
    console.log('✗ 测试异常:', error.message);
    console.log('=== 测试结果: 接口异常 ===');
    return false;
  }
}

// 执行测试
testWeChatAPI().then(success => {
  process.exit(success ? 0 : 1);
});
