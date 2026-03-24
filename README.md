# wechat-sdk-ai

[![npm version](https://badge.fury.io/js/wechat-sdk-ai.svg)](https://badge.fury.io/js/wechat-sdk-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Test Pass Rate](https://img.shields.io/badge/Test%20Pass%20Rate-32.9%25-red.svg)](https://github.com/dlldsys/wechat-sdk-ai)

---

> ### ⚠️ 重要警告
>
> **本 SDK 未经过完整测试，使用存在风险！**
>
> - 最新测试通过率仅为 **32.9%** (23/70 项通过)
> - 大部分接口因 HTTP 412 错误（IP 未备案）失败
> - 部分模块方法未完全暴露
> - **生产环境使用前请务必进行充分测试**

---

一个全面的 Node.js 微信开发 SDK，支持微信公众号和小程序，零依赖，TypeScript 开发。

## Features

- 🚀 **Zero Dependencies** - Uses only Node.js built-in modules
- 📦 **TypeScript** - Full type definitions included
- 🔄 **Auto Token Management** - Automatic token refresh with caching
- 🔒 **Security** - AES encryption, signature verification, IP whitelist
- 📝 **Complete API Coverage** - All official WeChat APIs
- 🐛 **Debug Mode** - Detailed logging for troubleshooting
- 💾 **Multiple Cache Backends** - Memory, Redis, File

## ⚠️ 使用前必读

### 测试状态

| 指标 | 数值 | 状态 |
|------|------|------|
| 测试时间 | 2026-03-24 | - |
| 测试通过率 | 32.9% | ❌ 风险 |
| 测试总数 | 70 项 | - |
| 通过项 | 23 项 | - |
| 失败项 | 47 项 | - |

### 已知问题

1. **HTTP 412 错误** - 大部分接口因服务器 IP 未加入微信白名单而失败
2. **部分方法不存在** - 以下模块方法可能未完全暴露
3. **测试环境限制** - `code2Session` 需要真实小程序前端 code

### 建议

- ⚠️ 生产环境使用前请充分测试
- ⚠️ 确保服务器 IP 已加入微信公众平台白名单
- ⚠️ 重要功能建议使用官方接口直接验证

## 📦 安装

```bash
npm install wechat-sdk-ai
```

### 本地开发

```bash
cd test_program
npm install
node full-test.js
```

## 🔧 快速开始

### 初始化 SDK

```typescript
import { WeChatSDK } from 'wechat-sdk-ai';

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

// 获取公众号实例
const official = sdk.official('default');

// 获取小程序实例
const mp = sdk.mp('default');
```

---

## 📚 API 使用文档

### 一、SDK 核心方法

#### 1.1 初始化方式

```typescript
// 方式1：从选项创建
const sdk = WeChatSDK.fromOptions({
  officialAccounts: { default: { appId, appSecret } },
  miniPrograms: { default: { appId, appSecret } },
  debug: true,
});

// 方式2：从环境变量创建
const sdk = WeChatSDK.fromEnv('WECHAT');

// 方式3：从 JSON 文件创建
const sdk = WeChatSDK.fromJson('./config.json');
```

#### 1.2 实例获取

```typescript
// 获取公众号实例
const official = sdk.official('name');  // 或 sdk.official() 使用默认

// 获取小程序实例
const mp = sdk.mp('name');  // 或 sdk.mp() 使用默认
```

#### 1.3 动态添加配置

```typescript
// 添加公众号
sdk.addOfficialAccount('myOA', {
  appId: 'wx...',
  appSecret: '...',
  token: '...',
  encodingAESKey: '...',
});

// 添加小程序
sdk.addMiniProgram('myMP', {
  appId: 'wx...',
  appSecret: '...',
});
```

---

### 二、公众号 API (`sdk.official()`)

#### 2.1 Token 管理

```typescript
// 获取 Access Token (自动缓存)
const { err, data } = await official.getAccessToken();

// 强制刷新 Token
const { err, data } = await official.refreshAccessToken();

// 获取 JS-SDK Ticket
const { err, data } = await official.getJsApiTicket(accessToken, true);

// 获取 JS-SDK 配置
const { err, data } = await official.getJsApiConfig('https://example.com/page', false, [
  'chooseImage', 'uploadImage', 'previewImage'
]);
```

#### 2.2 用户管理 (`official.user`)

```typescript
// 获取用户基本信息
const { err, data } = await official.user.getUserInfo(openId, 'zh_CN');

// 获取用户列表
const { err, data } = await official.user.getUserList(nextOpenId);

// 设置用户备注
const { err } = await official.user.setUserRemark(openId, '备注名');

// 获取用户黑名单
const { err, data } = await official.user.getBlackList(beginOpenId);

// 批量拉黑用户
const { err } = await official.user.batchBlackList(openIdList);

// 批量取消拉黑
const { err } = await official.user.batchUnblackList(openIdList);

// 批量获取用户信息
const { err, data } = await official.user.getUserInfoList(userList);
```

#### 2.3 用户标签 (`official.tag`)

```typescript
// 创建标签
const { err, data } = await official.tag.create(token, '标签名');

// 获取所有标签
const { err, data } = await official.tag.get(token);

// 更新标签
const { err } = await official.tag.update(token, tagId, '新标签名');

// 删除标签
const { err } = await official.tag.delete(token, tagId);

// 获取标签下用户列表
const { err, data } = await official.tag.getUsersByTag(token, tagId);

// 批量为用户打标签
const { err } = await official.tag.batchTagUsers(token, tagId, openIdList);

// 批量为用户取消标签
const { err } = await official.tag.batchUntagUsers(token, tagId, openIdList);

// 获取用户身上的标签
const { err, data } = await official.tag.getUserTags(token, openId);
```

#### 2.4 菜单管理 (`official.menu`)

```typescript
// 创建菜单
const { err } = await official.menu.create(token, {
  button: [
    { type: 'click', name: '菜单1', key: 'MENU_1' },
    { type: 'view', name: '网页', url: 'https://example.com' },
    { name: '子菜单', sub_button: [
      { type: 'click', name: '子菜单1', key: 'SUB_1' },
    ]}
  ]
});

// 获取菜单
const { err, data } = await official.menu.get(token);

// 删除菜单
const { err } = await official.menu.delete(token);

// 创建个性化菜单
const { err, data } = await official.menu.addConditional(token, {
  button: [...],
  matchrule: { group_id: '100', sex: '1' }
});

// 删除个性化菜单
const { err } = await official.menu.delConditional(token, menuid);

// 测试个性化菜单
const { err, data } = await official.menu.tryMatch(token, userId);

// 获取自定义菜单配置
const { err, data } = await official.menu.getConfig(token);
```

#### 2.5 模板消息 (`official.template`)

```typescript
// 设置行业
const { err } = await official.template.setIndustry(token, 1, 2);

// 获取行业信息
const { err, data } = await official.template.getIndustry(token);

// 获取模板列表
const { err, data } = await official.template.getTemplateList(token);

// 添加模板
const { err, data } = await official.template.addTemplate(token, templateIdShort, keywordList);

// 删除模板
const { err } = await official.template.deleteTemplate(token, templateId);

// 发送模板消息
const { err, data } = await official.template.send(token, {
  touser: openId,
  template_id: 'template_id',
  url: 'https://example.com/page',
  data: {
    first: { value: '您好', color: '#173177' },
    keyword1: { value: '测试内容' },
    remark: { value: '如有疑问请联系客服', color: '#FF0000' }
  }
});

// 便捷方法：直接发送
const { err } = await official.sendTemplateMessage({
  touser: openId,
  template_id: 'template_id',
  data: { first: { value: '通知' }, content: { value: '内容' } }
});
```

#### 2.6 客服消息 (`official.kf`)

```typescript
// 添加客服账号
const { err } = await official.kf.addKF(token, 'account@test', '昵称', 'password');

// 更新客服账号
const { err } = await official.kf.updateKF(token, 'account@test', '新昵称', 'new_password');

// 删除客服账号
const { err } = await official.kf.deleteKF(token, 'account@test');

// 获取客服列表
const { err, data } = await official.kf.getKFLists(token);

// 发送文本消息
const { err } = await official.kf.sendText(token, openId, '您好，有什么可以帮您？');

// 发送图片消息
const { err } = await official.kf.sendImage(token, openId, mediaId);

// 发送语音消息
const { err } = await official.kf.sendVoice(token, openId, mediaId);

// 发送视频消息
const { err } = await official.kf.sendVideo(token, openId, mediaId, thumbMediaId, '标题', '描述');

// 发送音乐消息
const { err } = await official.kf.sendMusic(token, openId, '标题', '描述', musicUrl, hqMusicUrl, thumbMediaId);

// 发送图文消息
const { err } = await official.kf.sendNews(token, openId, [{ title, description, url, picurl }]);

// 发送小程序卡片
const { err } = await official.kf.sendMpNews(token, openId, mediaId);

// 发送小程序页面
const { err } = await official.kf.sendMiniProgramPage(token, openId, appId, pagePath, title, thumbMediaId);

// 创建会话
const { err } = await official.kf.createSession(token, kfAccount, openId);

// 关闭会话
const { err } = await official.kf.closeSession(token, kfAccount, openId);

// 获取会话
const { err, data } = await official.kf.getSession(token, openId);

// 获取客服会话列表
const { err, data } = await official.kf.getSessionList(token, kfAccount);

// 获取未接入会话列表
const { err, data } = await official.kf.getWaitCase(token);

// 获取消息记录
const { err, data } = await official.kf.getMsgList(token, startTime, endTime, msgId, number);

// 便捷方法：发送客服文本
const { err } = await official.sendKFText(openId, '消息内容');
```

#### 2.7 网页授权 (`official.oauth`)

```typescript
// 获取授权 URL
const url = official.getOAuthUrl('https://example.com/callback', 'snsapi_userinfo', 'state');

// 获取 Access Token
const { err, data } = await official.getOAuthAccessToken(code);

// 刷新 Access Token
const { err, data } = await official.oauth.refreshAccessToken(token, refreshToken);

// 检验 Access Token
const { err } = await official.oauth.checkAccessToken(token, openId);

// 获取用户信息
const { err, data } = await official.oauth.getUserInfo(token, openId, 'zh_CN');
```

#### 2.8 二维码 (`official.qrcode`)

```typescript
// 创建永久二维码
const { err, data } = await official.qrcode.createLimit(token, 'scene');

// 创建临时二维码
const { err, data } = await official.qrcode.createTemp(token, 'scene', 604800);

// 获取二维码 URL
const { err, data } = await official.qrcode.getUrl(token, ticket);

// 获取短链接
const { err, data } = await official.qrcode.getShortUrl(token, longUrl);
```

#### 2.9 语义理解 (`official.semantic`)

```typescript
const { err, data } = await official.semantic.understand(token, {
  query: '附近有什么好吃的',
  city: '北京',
  category: '美食'
});
```

#### 2.10 数据分析 (`official.datacube`)

```typescript
// 获取用户增减数据
const { err, data } = await official.datacube.getUserSummary(token, '2024-01-01', '2024-01-07');

// 获取累计用户数据
const { err, data } = await official.datacube.getUserCumulate(token, '2024-01-01', '2024-01-07');

// 获取图文群发每日数据
const { err, data } = await official.datacube.getArticleSummary(token, '2024-01-01', '2024-01-07');

// 获取图文群发总数据
const { err, data } = await official.datacube.getArticleTotal(token, '2024-01-01', '2024-01-07');

// 获取图文分享数据
const { err, data } = await official.datacube.getUserShare(token, '2024-01-01', '2024-01-07');

// 获取图文分享转发分时数据
const { err, data } = await official.datacube.getUserShareHour(token, '2024-01-01', '2024-01-07');

// 获取消息发送概况数据
const { err, data } = await official.datacube.getUpstreamMsg(token, '2024-01-01', '2024-01-07');

// 获取消息发送分时数据
const { err, data } = await official.datacube.getUpstreamMsgHour(token, '2024-01-01', '2024-01-07');

// 获取消息发送周数据
const { err, data } = await official.datacube.getUpstreamMsgWeek(token, '2024-01-01', '2024-01-07');

// 获取消息发送月数据
const { err, data } = await official.datacube.getUpstreamMsgMonth(token, '2024-01-01', '2024-01-07');

// 获取消息发送分布数据
const { err, data } = await official.datacube.getUpstreamMsgDist(token, '2024-01-01', '2024-01-07');

// 获取消息发送分布周数据
const { err, data } = await official.datacube.getUpstreamMsgDistWeek(token, '2024-01-01', '2024-01-07');

// 获取消息发送分布月数据
const { err, data } = await official.datacube.getUpstreamMsgDistMonth(token, '2024-01-01', '2024-01-07');

// 获取接口分析数据
const { err, data } = await official.datacube.getInterfaceSummary(token, '2024-01-01', '2024-01-07');

// 获取接口分析分时数据
const { err, data } = await official.datacube.getInterfaceSummaryHour(token, '2024-01-01', '2024-01-07');
```

#### 2.11 评论管理 (`official.comment`)

```typescript
// 打开评论
const { err } = await official.comment.open(token, articleId, index);

// 关闭评论
const { err } = await official.comment.close(token, articleId, index);

// 查看评论
const { err, data } = await official.comment.list(token, articleId, index, begin, count, type);

// 精选评论
const { err } = await official.comment.markElect(token, articleId, index, commentId);

// 取消精选
const { err } = await official.comment.unmarkElect(token, articleId, index, commentId);

// 回复评论
const { err } = await official.comment.reply(token, articleId, index, commentId, content);

// 删除回复
const { err } = await official.comment.deleteReply(token, articleId, index, commentId);
```

#### 2.12 图文草稿 (`official.draft`)

```typescript
// 新增草稿
const { err, data } = await official.draft.add(token, articles);

// 更新草稿
const { err } = await official.draft.update(token, mediaId, articles);

// 获取草稿列表
const { err, data } = await official.draft.getList(token, offset, count);

// 获取草稿总数
const { err, data } = await official.draft.count(token);

// 删除草稿
const { err } = await official.draft.delete(token, mediaId);
```

#### 2.13 发布能力 (`official.freepublish`)

```typescript
// 发布接口
const { err, data } = await official.freepublish.submit(token, mediaId);

// 发布状态查询
const { err, data } = await official.freepublish.get(token, publishId);

// 删除发布
const { err } = await official.freepublish.delete(token, publishId, index);

// 获取发布列表
const { err, data } = await official.freepublish.getArticleList(token, offset, count);
```

#### 2.14 群发消息 (`official.broadcast`)

```typescript
// 群发消息
const { err, data } = await official.broadcast.send(token, msgType, content);

// 预览群发
const { err, data } = await official.broadcast.preview(token, toUser, msgType, content);

// 获取预览群发接口
const { err, data } = await official.broadcast.getPreviewUrl(token, toUser, msgType, content);

// 设置群发速度
const { err } = await official.broadcast.setSpeed(token, speed);

// 获取群发速度
const { err, data } = await official.broadcast.getSpeed(token);
```

#### 2.15 订阅通知 (`official.subscribe`)

```typescript
// 获取公众号类目
const { err, data } = await official.subscribe.getCategory(token);

// 获取类目下公众模板列表
const { err, data } = await official.subscribe.getPubTemplateTitles(token, ids, start, limit);

// 获取模板标题下的关键词
const { err, data } = await official.subscribe.getPubTemplateKeywords(token, tid);

// 组合模板并添加至账号
const { err, data } = await official.subscribe.addTemplate(token, tid, kidList, sceneDesc);

// 删除模板
const { err } = await official.subscribe.deleteTemplate(token, priTmplId);
```

---

### 三、小程序 API (`sdk.mp()`)

#### 3.1 Token 管理

```typescript
// 获取 Access Token
const { err, data } = await mp.getAccessToken();

// 强制刷新 Token
const { err, data } = await mp.refreshAccessToken();
```

#### 3.2 登录 (`mp.login`)

```typescript
// code2Session
const { err, data } = await mp.code2Session(jsCode);
// 返回: { openid, sessionKey, unionid }

// 检查 SessionKey 有效性
const { err, data } = await mp.login.checkSessionKey(accessToken, openid, sessionKey);

// 重置用户 SessionKey
const { err } = await mp.login.resetUserSessionKey(accessToken, openid);

// 便捷方法
const { err, data } = await mp.code2Session(code);
```

#### 3.3 数据解密 (`mp`)

```typescript
// 解密用户信息
const userInfo = mp.getUserInfo(sessionKey, encryptedData, iv);
// 返回: { openId, unionId, nickName, gender, city, province, country, avatarUrl }

// 解密手机号
const phoneInfo = mp.getPhoneNumber(sessionKey, encryptedData, iv);
// 返回: { phoneNumber, purePhoneNumber, countryCode }

// 解密运动数据
const runData = mp.getRunData(sessionKey, encryptedData, iv);
// 返回: { stepInfoList: [{ timestamp, step }] }

// 解密群信息
const shareInfo = mp.getShareInfo(sessionKey, encryptedData, iv);
// 返回: { openGId }

// 通用解密
const data = mp.decryptData(sessionKey, encryptedData, iv);
```

#### 3.4 消息 (`mp.message`)

```typescript
// 发送订阅消息
const { err } = await mp.message.sendSubscribeMessage(token, {
  touser: openId,
  template_id: 'template_id',
  page: 'pages/index',
  data: { keyword1: { value: '内容' } },
  miniprogram_state: 'formal'
});

// 发送统一服务消息
const { err } = await mp.message.sendUniformMessage(token, {
  touser: openId,
  weapp_template_msg: {
    template_id: 'template_id',
    page: 'pages/index',
    form_id: 'form_id',
    data: { keyword1: { value: '内容' } }
  }
});

// 发送客服消息
const { err } = await mp.message.sendCustomerServiceMessage(token, { touser: openId, msgtype: 'text', text: { content: '...' } });
const { err } = await mp.message.sendCustomerServiceText(token, openId, '文本');
const { err } = await mp.message.sendCustomerServiceImage(token, openId, mediaId);
const { err } = await mp.message.sendCustomerServiceLink(token, openId, title, desc, url, thumbUrl);
const { err } = await mp.message.sendCustomerServiceMiniProgram(token, openId, title, appId, pagePath, thumbMediaId);

// 设置客服输入状态
const { err } = await mp.message.setTyping(token, openId, 'Typing');

// 上传临时素材
const { err, data } = await mp.message.uploadTempMedia(token, 'image', mediaBuffer, 'image.jpg');

// 获取临时素材
const { err, data } = await mp.message.getTempMedia(token, mediaId);

// 便捷方法
const { err } = await mp.sendSubscribeMessage({ touser: openId, template_id: 'template_id', data: {...} });
const { err } = await mp.sendUniformMessage({ touser: openId, weapp_template_msg: {...} });
```

#### 3.5 安全 (`mp.security`)

```typescript
// 文本安全检查
const { err, data } = await mp.security.msgSecCheck(token, content, openId, scene);
// 返回: { suggest: 'pass|risky|...', label: number }

// 图片安全检查
const { err } = await mp.security.imgSecCheck(token, mediaBuffer);

// 异步图片检查
const { err, data } = await mp.security.mediaCheckAsync(token, mediaUrl, mediaType, openId);

// 获取用户风险等级
const { err, data } = await mp.security.getUserRiskRank(token, openId, scene);

// 便捷方法
const { err, data } = await mp.msgSecCheck('文本内容');
const { err } = await mp.imgSecCheck(imageBuffer);
```

#### 3.6 二维码 (`mp.qrcode`)

```typescript
// 生成小程序码
const { err, data } = await mp.qrcode.get(token, {
  path: '/pages/index',
  width: 430,
  auto_color: true,
  is_hyaline: true,
  env_version: 'release'
});

// 生成无限制小程序码
const { err, data } = await mp.qrcode.getUnlimited(token, {
  scene: 'scene_str',
  page: 'pages/index',
  width: 430
});

// 便捷方法
const { err, data } = await mp.getQrCode({ path: '/pages/index' });
const { err, data } = await mp.getUnlimitedQrCode({ scene: 'scene' });
```

#### 3.7 链接 (`mp.urlScheme`, `mp.urlLink`, `mp.shortLink`)

```typescript
// 生成 URL Scheme
const { err, data } = await mp.urlScheme.generate(token, {
  jump_wxa: { path: '/pages/index', query: 'id=1', env_version: 'trial' },
  is_expire: true,
  expire_type: 1,
  expire_interval: 86400
});

// 生成 URL Link
const { err, data } = await mp.urlLink.generate(token, {
  path: '/pages/index',
  query: 'id=1',
  expire_type: 1,
  expire_time: Math.floor(Date.now() / 1000) + 86400,
  env_version: 'release'
});

// 生成短链接
const { err, data } = await mp.shortLink.generate(token, {
  page_url: '/pages/index',
  expire_time: Math.floor(Date.now() / 1000) + 86400
});

// 便捷方法
const { err, data } = await mp.generateUrlScheme({ jump_wxa: { path: '/pages/index' } });
const { err, data } = await mp.generateUrlLink({ path: '/pages/index' });
```

#### 3.8 附近小程序 (`mp.nearby`)

```typescript
// 添加地点
const { err, data } = await mp.nearby.add(token, {
  poi_name: '门店名称',
  address: '门店地址',
  longitude: 116.404,
  latitude: 39.915,
  categories: [5000],
  contract_phone: '13800138000',
  qualification_list: [{ type: 'biz_verification', media_id: '...' }]
});

// 删除地点
const { err } = await mp.nearby.delete(token, poiId);

// 查看地点列表
const { err, data } = await mp.nearby.getList(token, page, rows);

// 设置地点展示状态
const { err } = await mp.nearby.setDisplayStatus(token, poiId, status);
```

#### 3.9 插件管理 (`mp.plugin`)

```typescript
// 申请插件
const { err } = await mp.plugin.apply(token, pluginAppId);

// 删除插件
const { err } = await mp.plugin.unbind(token, pluginAppId);

// 获取插件列表
const { err, data } = await mp.plugin.getList(token);

// 更新插件
const { err } = await mp.plugin.update(token, pluginAppId);

// 获取所有插件使用数据
const { err, data } = await mp.plugin.getDevPluginList(token);

// 同意插件使用申请
const { err } = await mp.plugin.agreeDevPlugin(token, appId, contractNo);
```

#### 3.10 云开发 (`mp.cloud`)

```typescript
// 调用云函数
const { err, data } = await mp.cloud.invokeFunction(token, env, name, data);
// 返回: { resp_data }

// 获取云开发请求令牌
const { err, data } = await mp.cloud.getVoIPSign(token, openIdList, clientNonce);

// 静态网站部署
const { err } = await mp.cloud.deployStaticSite(token, env, staticSiteId);

// 获取数据库授权
const { err, data } = await mp.cloud.database.init(token, env);

// 创建数据库集合
const { err } = await mp.cloud.database.createCollection(token, env, collectionName);

// 上传文件
const { err, data } = await mp.cloud.uploadFile(token, env, cloudPath, fileBuffer);

// 下载文件
const { err, data } = await mp.cloud.downloadFile(token, env, fileId);

// 删除文件
const { err } = await mp.cloud.deleteFile(token, env, fileIdList);

// 获取文件上传链接
const { err, data } = await mp.cloud.getUploadLink(token, env, cloudPathList);

// 获取云托管服务
const { err, data } = await mp.cloud.cloudBaseGetAccessToken(token, env);

// 便捷方法
const { err, data } = await mp.invokeCloudFunction(env, name, data);
```

#### 3.11 物流服务 (`mp.delivery`)

```typescript
// 获取所有快递公司列表
const { err, data } = await mp.delivery.getAllDelivery(token);

// 获取运单
const { err, data } = await mp.delivery.getDeliveryOrder(token, {
  order_id: '运单号',
  delivery_id: 'SF',
  openid: 'openId'
});

// 获取运单轨迹
const { err, data } = await mp.delivery.getDeliveryTrack(token, {
  order_id: '运单号',
  delivery_id: 'SF',
  openid: 'openId',
  getLastImgRecord: true
});

// 下单
const { err, data } = await mp.delivery.addDeliveryOrder(token, {
  add_source: 0,
  order_id: '订单号',
  delivery_id: 'SF',
  // ... 更多参数
});

// 取消下单
const { err } = await mp.delivery.cancelDeliveryOrder(token, {
  order_id: '运单号',
  delivery_id: 'SF',
  openid: 'openId',
  cancel_msg: '取消原因'
});

// 预下单
const { err, data } = await mp.delivery.preAddDeliveryOrder(token, {
  // ... 参数
});

// 预取消
const { err, data } = await mp.delivery.preCancelDeliveryOrder(token, {
  // ... 参数
});

// 重新下单
const { err, data } = await mp.delivery.reOrder(token, {
  // ... 参数
});

// 获取服务商列表
const { err, data } = await mp.delivery.getAgentList(token, {
  // ... 参数
});

// 获取门店编码
const { err, data } = await mp.delivery.getShopCodeList(token, {
  // ... 参数
});
```

#### 3.12 即时配送 (`mp.instantDelivery`)

```typescript
// 绑定配送公司账户
const { err } = await mp.instantDelivery.bindAccount(token, deliveryId, appId, aesKey, iv);

// 下单
const { err, data } = await mp.instantDelivery.addOrder(token, {
  add_source: 0,
  order_type: 1,
  // ... 更多参数
});

// 取消下单
const { err } = await mp.instantDelivery.cancelOrder(token, orderId, openId, cancelReasonId, cancelReason);

// 重新下单
const { err, data } = await mp.instantDelivery.reOrder(token, {
  // ... 参数
});

// 查询订单
const { err, data } = await mp.instantDelivery.getOrder(token, orderId, openId);

// 异步查询
const { err } = await mp.instantDelivery.preQueryOrder(token, orderId, openId);

// 上报异常
const { err } = await mp.instantDelivery.reportUpdate(token, {
  order_id: 'orderId',
  update_type: 1,
  // ... 参数
});

// 更新打印状态
const { err } = await mp.instantDelivery.updatePrinter(token, shopId, printerId, status);

// 绑定打印机
const { err } = await mp.instantDelivery.bindPrinter(token, printerId, printerType);

// 确认收货
const { err } = await mp.instantDelivery.confirmDelivery(token, orderId, openId, recvTime);

// 添加门店
const { err } = await mp.instantDelivery.addShop(token, shopInfo);

// 获取门店
const { err, data } = await mp.instantDelivery.getShop(token, shopId);

// 获取门店列表
const { err, data } = await mp.instantDelivery.getShopList(token, offset, limit);

// 获取运费模板
const { err, data } = await mp.instantDelivery.getDeliveryTypList(token);

// 配送公司列表
const { err, data } = await mp.instantDelivery.getAllImmeDeliveryDelivery(token);
```

#### 3.13 订阅模板 (`mp.subscribeTemplate`)

```typescript
// 添加模板消息
const { err, data } = await mp.subscribeTemplate.addTemplate(token, tid, kidList, sceneDesc);

// 删除模板
const { err } = await mp.subscribeTemplate.deleteTemplate(token, priTmplId);

// 获取类目
const { err, data } = await mp.subscribeTemplate.getCategory(token);

// 获取公共模板标题
const { err, data } = await mp.subscribeTemplate.getPubTemplateTitles(token, ids, start, limit);

// 获取公共模板关键词
const { err, data } = await mp.subscribeTemplate.getPubTemplateKeywords(token, tid);

// 获取模板列表
const { err, data } = await mp.subscribeTemplate.getTemplateList(token);
```

---

### 四、工具函数

#### 4.1 签名相关

```typescript
import { generateSignature, generateNonceStr, generateTimestamp } from 'wechat-sdk-ai';

// 生成签名
const signature = generateSignature({
  token: 'your-token',
  timestamp: '1234567890',
  nonce: 'random-string'
});

// 生成随机字符串
const nonce = generateNonceStr(16);  // 默认 16 位

// 生成时间戳
const timestamp = generateTimestamp();  // 返回 Unix 时间戳（秒）
```

#### 4.2 XML 解析

```typescript
import { parseXml, parseXmlFromBody, XmlParser } from 'wechat-sdk-ai';

// 解析 XML 字符串
const result = parseXml('<xml><name>test</name></xml>');
if (result.success) {
  console.log(result.data);  // { name: 'test' }
}

// 从请求体解析
const result2 = parseXmlFromBody(reqBody);

// 使用 XmlParser 类
const parser = new XmlParser();
const result3 = parser.parse('<xml><code>0</code></xml>');
```

#### 4.3 加密解密

```typescript
import { WxCrypto } from 'wechat-sdk-ai';

const crypto = new WxCrypto(token, encodingAESKey);

// 加密 XML
const { err, data } = crypto.encryptXML(appId, xml);

// 解密 XML
const { err, data } = crypto.decryptXML(appId, encrypt);

// SHA1 哈希
const sha1 = crypto.sha1('test');

// SHA256 哈希
const sha256 = crypto.sha256('test');

// MD5 哈希
const md5 = crypto.md5('test');

// AES 加密
const { err, data } = crypto.aesEncrypt(key, 'plaintext');

// AES 解密
const { err, data } = crypto.aesDecrypt(key, 'ciphertext');

// 生成随机字符串
const randomStr = crypto.getRandomString(16);

// 生成随机字节
const randomBytes = crypto.getRandomBytes(16);
```

#### 4.4 签名验证

```typescript
import { verifyWeChatSignature, verifyMessageSignature, isWeChatIP } from 'wechat-sdk-ai';

// 验证微信签名
const isValid = verifyWeChatSignature({
  signature: '...',
  timestamp: '...',
  nonce: '...'
}, token);

// 验证消息签名
const isValid2 = verifyMessageSignature(token, timestamp, nonce, signature);

// 检查是否微信 IP
const isWechat = isWeChatIP('101.226.211.1');
```

#### 4.5 日志

```typescript
import { createLogger, Logger } from 'wechat-sdk-ai';

// 创建日志实例
const logger = createLogger({ level: 'debug', debug: true });

// 使用日志
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');

// 使用 Logger 类
const customLogger = new Logger({ level: 'info', debug: false });
customLogger.info('Custom log');
```

#### 4.6 缓存

```typescript
import { MemoryCache, FileCache, createRedisCache } from 'wechat-sdk-ai';

// 内存缓存
const cache = new MemoryCache();
cache.set('key', 'value', 3600);  // 过期时间（秒）
const value = cache.get('key');
const has = cache.has('key');
cache.delete('key');
cache.clear();

// 文件缓存
const fileCache = new FileCache('./cache-dir');
fileCache.set('key', 'value', 3600);
const value2 = fileCache.get('key');

// Redis 缓存
const redisCache = createRedisCache({ host: 'localhost', port: 6379 });
redisCache.set('key', 'value', 3600);
const value3 = redisCache.get('key');
```

#### 4.7 错误处理

```typescript
import { WxError, ErrorCode, createSuccessResponse, createErrorResponse } from 'wechat-sdk-ai';

// 创建错误
const err = new WxError(ErrorCode.INVALID_APPID, 'AppID 无效');

// 错误码
ErrorCode.INVALID_APPID      // -40001
ErrorCode.INVALID_SECRET      // -40002
ErrorCode.INVALID_TOKEN       // -40003
ErrorCode.INVALID_OPENID      // -40004
ErrorCode.ENCODING_AES_KEY_ERROR  // -40005
ErrorCode.PARAM_EMPTY_STRING  // -40006

// 创建响应
const success = createSuccessResponse(data);
const error = createErrorResponse(ErrorCode.INVALID_APPID, '错误信息');
```

---

## Cache Configuration

```typescript
// Memory cache (default)
const sdk = new WeChatSDK();

// Redis cache
import { createRedisCache } from 'wechat-sdk-ai';
const cache = createRedisCache({ host: 'localhost', port: 6379 });
const sdk = new WeChatSDK({ cache });

// File cache
import { FileCache } from 'wechat-sdk-ai';
const cache = new FileCache('/path/to/cache');
const sdk = new WeChatSDK({ cache });
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

---

*SDK 版本: wechat-sdk-ai@1.0.4*

*⚠️ 本 SDK 未经过完整测试，生产环境使用前请务必进行充分测试*
