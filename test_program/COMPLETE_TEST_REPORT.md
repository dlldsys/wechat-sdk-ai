# WeChat SDK AI 本地包完整测试报告

> ### ⚠️ 警告：本 SDK 未经过完整测试，使用存在风险！

## 测试信息

| 项目 | 内容 |
|------|------|
| **测试时间** | 2026-03-24 11:20:41 |
| **SDK 版本** | wechat-sdk-ai@1.0.4 |
| **测试方式** | 本地包 (`file:..`) |
| **测试文件** | test_program/full-test.js |
| **总耗时** | 53,042ms |
| **测试环境** | Node.js >=18.0.0 |

---

## ⚠️ 测试结果汇总

| 指标 | 数值 | 状态 |
|------|------|------|
| **总计测试项** | 70 项 | - |
| **通过** | 23 项 | ✓ |
| **失败** | 47 项 | ❌ |
| **成功率** | **32.9%** | ⚠️ 风险 |

---

## 按模块分类统计

| 模块 | 通过 | 失败 | 成功率 | 状态 |
|------|------|------|--------|------|
| **Token管理** | 4 | 0 | 100% | ✓ |
| **JS-SDK** | 2 | 0 | 100% | ✓ |
| **小程序订阅模板** | 2 | 0 | 100% | ✓ |
| **工具函数** | 5 | 1 | 83.3% | ⚠️ |
| **用户管理** | 2 | 1 | 66.7% | ⚠️ |
| **菜单管理** | 2 | 2 | 50.0% | ⚠️ |
| **模板消息** | 1 | 1 | 50.0% | ⚠️ |
| **群发消息** | 1 | 1 | 50.0% | ⚠️ |
| **图文草稿** | 1 | 1 | 50.0% | ⚠️ |
| **网页授权** | 1 | 2 | 33.3% | ❌ |
| **小程序登录** | 1 | 2 | 33.3% | ❌ |
| **用户标签** | 1 | 3 | 25.0% | ❌ |
| **二维码** | 1 | 3 | 25.0% | ❌ |
| **客服消息** | 0 | 3 | 0.0% | ❌ |
| **数据分析** | 0 | 4 | 0.0% | ❌ |
| **语义理解** | 0 | 1 | 0.0% | ❌ |
| **素材管理** | 0 | 2 | 0.0% | ❌ |
| **评论管理** | 0 | 2 | 0.0% | ❌ |
| **发布能力** | 0 | 2 | 0.0% | ❌ |
| **订阅通知** | 0 | 1 | 0.0% | ❌ |
| **小程序消息** | 0 | 3 | 0.0% | ❌ |
| **小程序安全** | 0 | 4 | 0.0% | ❌ |
| **小程序二维码** | 0 | 2 | 0.0% | ❌ |
| **小程序链接** | 0 | 3 | 0.0% | ❌ |
| **小程序附近** | 0 | 2 | 0.0% | ❌ |
| **小程序云开发** | 0 | 1 | 0.0% | ❌ |
| **小程序物流** | 0 | 2 | 0.0% | ❌ |

---

## ⚠️ 详细测试结果

### ✓ 通过的接口 (23项)

| 序号 | 模块 | 接口名 | 耗时 | 说明 |
|------|------|--------|------|------|
| 1 | Token管理 | getAccessToken (公众号) | 401ms | 正常 |
| 2 | Token管理 | refreshAccessToken (公众号) | 0ms | 正常 |
| 3 | Token管理 | getAccessToken (小程序) | 243ms | 正常 |
| 4 | Token管理 | refreshAccessToken (小程序) | 0ms | 正常 |
| 5 | 用户管理 | user.getUserInfo | 249ms | 正常 |
| 6 | 用户管理 | user.getUserList | 202ms | 正常 |
| 7 | 用户标签 | tag.get | 1325ms | 正常 |
| 8 | 菜单管理 | menu.delete | 355ms | 正常 |
| 9 | 菜单管理 | menu.getConfig | 167ms | 正常 |
| 10 | 模板消息 | template.getTemplateList | 175ms | 正常 |
| 11 | 网页授权 | getOAuthUrl | 0ms | 正常 |
| 12 | JS-SDK | getJsApiConfig | 1459ms | 正常 |
| 13 | JS-SDK | jsapi.getCardTicket | 118ms | 正常 |
| 14 | 二维码 | qrcode.getUrl | 0ms | 正常 |
| 15 | 群发消息 | broadcast.getSpeed | 1281ms | 正常 |
| 16 | 图文草稿 | draft.count | 1286ms | 正常 |
| 17 | 小程序订阅模板 | subscribeTemplate.getCategory | 1701ms | 正常 |
| 18 | 小程序订阅模板 | subscribeTemplate.getTemplateList | 215ms | 正常 |
| 19 | 工具函数 | generateSignature | 0ms | 正常 |
| 20 | 工具函数 | generateNonceStr(16) | 0ms | 正常 |
| 21 | 工具函数 | generateNonceStr(32) | 0ms | 正常 |
| 22 | 工具函数 | generateTimestamp | 0ms | 正常 |
| 23 | 工具函数 | parseXml | 1ms | 正常 |

### ❌ 失败的接口 (47项)

#### HTTP 412 错误 (~30项)
| 序号 | 模块 | 接口名 | 耗时 | 错误 |
|------|------|--------|------|------|
| 1 | 用户管理 | user.setUserRemark | 42ms | HTTP 412 |
| 2 | 用户标签 | tag.create | 1172ms | HTTP 412 |
| 3 | 用户标签 | tag.getUserTags | 42ms | HTTP 412 |
| 4 | 菜单管理 | menu.create | 1202ms | HTTP 412 |
| 5 | 模板消息 | sendTemplateMessage | 274ms | HTTP 412 |
| 6 | 客服消息 | kf.sendText | 42ms | HTTP 412 |
| 7 | 二维码 | qrcode.createLimit | 1192ms | HTTP 412 |
| 8 | 二维码 | qrcode.getShortUrl | 1175ms | HTTP 412 |
| 9 | 语义理解 | semantic.understand | 1179ms | HTTP 412 |
| 10 | 数据分析 | datacube.getUserSummary | 1188ms | HTTP 412 |
| 11 | 数据分析 | datacube.getUserCumulate | 1172ms | HTTP 412 |
| 12 | 数据分析 | datacube.getInterfaceSummary | 1166ms | HTTP 412 |
| 13 | 评论管理 | comment.open | 39ms | HTTP 412 |
| 14 | 评论管理 | comment.close | 1187ms | HTTP 412 |
| 15 | 发布能力 | freepublish.getArticleList | 41ms | HTTP 412 |
| 16 | 小程序消息 | sendSubscribeMessage | 236ms | HTTP 412 |
| 17 | 小程序消息 | sendUniformMessage | 1193ms | HTTP 412 |
| 18 | 小程序安全 | msgSecCheck | 1181ms | HTTP 412 |
| 19 | 小程序安全 | imgSecCheck | 1174ms | HTTP 412 |
| 20 | 小程序安全 | mediaCheckAsync | 1183ms | HTTP 412 |
| 21 | 小程序安全 | getUserRiskRank | 1177ms | HTTP 412 |
| 22 | 小程序二维码 | getQrCode | 1413ms | HTTP 412 |
| 23 | 小程序二维码 | getUnlimitedQrCode | 1170ms | HTTP 412 |
| 24 | 小程序链接 | urlScheme.generate | 1185ms | HTTP 412 |
| 25 | 小程序链接 | urlLink.generate | 1202ms | HTTP 412 |
| 26 | 小程序链接 | shortLink.generate | 1175ms | HTTP 412 |
| 27 | 小程序附近 | nearby.add | 1177ms | HTTP 412 |
| 28 | 小程序插件 | plugin.getDevPluginList | 39ms | HTTP 412 |
| 29 | 小程序云开发 | cloud.invokeFunction | 1170ms | HTTP 412 |
| 30 | 小程序物流 | delivery.getDeliveryOrder | 43ms | HTTP 412 |

#### 方法不存在 (~10项)
| 序号 | 模块 | 接口名 | 错误 |
|------|------|--------|------|
| 1 | 网页授权 | oauth.checkAccessToken | 方法不存在 |
| 2 | 客服消息 | kf.getKfList | 方法不存在 |
| 3 | 客服消息 | kf.getOnlineList | 方法不存在 |
| 4 | 素材管理 | material.getCount | 方法不存在 |
| 5 | 素材管理 | material.batchGet | 方法不存在 |
| 6 | 群发消息 | broadcast.getPreviewUrl | 方法不存在 |
| 7 | 图文草稿 | draft.getList | 方法不存在 |
| 8 | 发布能力 | freepublish.getArticleStatus | 方法不存在 |
| 9 | 小程序登录 | checkSession | 方法不存在 |

#### 请求超时 (~5项)
| 序号 | 模块 | 接口名 | 耗时 |
|------|------|--------|------|
| 1 | 菜单管理 | menu.get | 3456ms |
| 2 | 订阅通知 | subscribe.getCategory | 3389ms |
| 3 | 小程序登录 | code2Session | 3378ms |
| 4 | 小程序附近 | nearby.getList | 3344ms |
| 5 | 小程序物流 | delivery.getAllDelivery | 3273ms |

#### 其他错误 (~2项)
| 序号 | 模块 | 接口名 | 错误 |
|------|------|--------|------|
| 1 | 二维码 | qrcode.createTemp | ticket 为空 |
| 2 | 网页授权 | oauth.refreshAccessToken | 无效的 AppID |

---

## ⚠️ 失败原因分析

### 1. HTTP 412 错误 (主要原因)
**原因**: 服务器 IP 未加入微信公众平台安全白名单

**影响范围**: 
- 大部分需要调用微信 API 的接口
- 涉及用户操作、消息发送等敏感功能

**解决方案**:
1. 登录微信公众平台
2. 进入「设置与开发」→「基本配置」
3. 将服务器 IP 添加到白名单

### 2. 方法不存在
**原因**: SDK 某些模块方法可能未完全暴露

**涉及接口**:
- `kf.getKfList`, `kf.getOnlineList`
- `oauth.checkAccessToken`
- `checkSession`
- `material.getCount`, `material.batchGet`
- `draft.getList`
- `freepublish.getArticleStatus`
- `broadcast.getPreviewUrl`

**解决方案**:
- 需要补充 SDK 缺失的方法
- 或直接调用底层 HTTP 请求

### 3. 请求超时
**原因**: 网络问题或微信服务器响应慢

**涉及接口**:
- `menu.get`
- `code2Session`
- `nearby.getList`
- `subscribe.getCategory`
- `delivery.getAllDelivery`

### 4. 测试环境限制
**原因**: 小程序登录需要通过前端获取真实的 js_code

**解决方案**: 需要在小程序前端配合测试

---

## ⚠️ 使用建议

1. **生产环境使用前请充分测试**
2. **确保服务器 IP 已加入微信公众平台白名单**
3. **重要功能建议使用官方接口直接验证**
4. **关注 SDK 更新，修复已知问题**

---

## 本地包验证

```json
{
  "package.json": {
    "wechat-sdk-ai": "file:.."
  },
  "mainProject": "wechat-sdk-ai@1.0.4",
  "linkMethod": "npm symlink",
  "dist": {
    "es": "dist/index.js",
    "cjs": "dist/index.cjs",
    "types": "dist/index.d.ts"
  },
  "verification": "✓ 本地包引用成功"
}
```

---

## 附录：SDK 完整模块列表

### 公众号模块
- menu (菜单管理) ⚠️ 部分通过
- kf (客服消息) ❌ 未通过
- template (模板消息) ⚠️ 部分通过
- user (用户管理) ⚠️ 部分通过
- tag (用户标签) ⚠️ 部分通过
- material (素材管理) ❌ 方法缺失
- media (媒体上传) ⚠️ 未测试
- oauth (网页授权) ⚠️ 部分通过
- jsapi (JS-SDK) ✓ 全部通过
- broadcast (群发消息) ⚠️ 部分通过
- subscribe (订阅消息) ❌ 未通过
- qrcode (二维码) ⚠️ 部分通过
- semantic (语义理解) ❌ 未通过
- datacube (数据分析) ❌ 未通过
- comment (评论管理) ❌ 未通过
- draft (图文草稿) ⚠️ 部分通过
- freepublish (发布能力) ❌ 未通过

### 小程序模块
- login (登录) ⚠️ 部分通过
- message (消息) ❌ 未通过
- subscribeTemplate (订阅模板) ✓ 全部通过
- cloud (云开发) ❌ 未通过
- security (安全) ❌ 未通过
- qrcode (二维码) ❌ 未通过
- nearby (附近) ❌ 未通过
- plugin (插件) ❌ 未通过
- urlScheme (URL Scheme) ❌ 未通过
- urlLink (URL Link) ❌ 未通过
- shortLink (短链接) ❌ 未通过
- delivery (物流服务) ❌ 未通过

### 工具模块
- generateSignature ✓ 通过
- generateNonceStr ✓ 通过
- generateTimestamp ✓ 通过
- parseXml ✓ 通过
- XmlParser ⚠️ 部分通过
- WxCrypto ⚠️ 未测试
- Logger ✓ 通过
- MemoryCache ✓ 通过
- FileCache ✓ 通过
- WxError ✓ 通过

---

*⚠️ 本报告标注未经过完整测试，使用有风险*

*本报告由 test_program/full-test.js 自动生成*
*生成时间: 2026-03-24T03:20:41.856Z*
