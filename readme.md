# koishi-plugin-ai-midjourney-draw

[![npm](https://img.shields.io/npm/v/koishi-plugin-ai-midjourney-draw?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-ai-midjourney-draw)

## 🎐 简介

无需科学上网环境，25 元/月 Midjourney 无限绘图。自带提示词生成器、英译中、提示词辅助工具、合并图片、缩短提示词、图片转提示词等功能。

## 🎉 安装

您可通过 Koishi 插件市场搜索并安装该插件。或者，您可以手动安装：

```bash
npm install koishi-plugin-ai-midjourney-draw
```

## 🎮 使用

1.  **获取授权码：**
    - 在 [aiMidjourney](https://buy.ai-mj.cn/) 平台购买套餐。
    - 在 [aiMidjourney](https://draw.ai-mj.com/login) 平台登录。
    - 登录后，F12 打开控制台，切换网络选项卡。
    - 在网页输入框中输入 `/shorten a dog` 并发送。
    - 在控制台中找到 `shorten` 请求。
    - 复制 `Authorization` 字段的值（即授权码）。
2.  **配置插件：**  填写 `authorization` 配置项。

```typescript
authorization: 'YOUR_AUTHORIZATION_CODE' // 替换为你的授权码
```

3.  **开始使用：**  在聊天中使用 `aiMidjourney.绘图` 命令即可开始绘图。
    - 如何将 4 小图放大：引用回复数字 `1/2/3/4` 即可，可同时放大多张。
- **建议自行添加别名：** 例如，可以将 `aiMidjourney.绘图` 添加别名为 `绘图` 或 `画图`，以便更方便地使用。

## ⚙️ 配置项

| 配置项        | 类型   | 描述                                             |
| --------------- | ------ | ------------------------------------------------ |
| `authorization` | string | **必填**。aiMidjourney 授权码。                     |

## 🌼 指令

| 指令                       | 描述                       |
| ---------------------------- |--------------------------|
| `aiMidjourney`                | aiMidjourney 帮助          |
| `aiMidjourney.相关资源`         | AI 绘图相关资源                |
| `aiMidjourney.提示词生成器 <prompt>` | 生成提示词                    |
| `aiMidjourney.英译中 <prompt>`   | 翻译英文到中文                  |
| `aiMidjourney.中译英 <prompt>`   | 翻译中文到英文（Claude-3.5-Sonnet） |
| `aiMidjourney.提示词辅助工具`      | 提示词辅助工具链接                |
| `aiMidjourney.合并图片`         | 合并多张图片（最多5张）             |
| `aiMidjourney.缩短提示词 <prompt>`  | 分析并缩短提示词                 |
| `aiMidjourney.图片转提示词`       | 图片转提示词                   |
| `aiMidjourney.放大 <taskId> <customId>` | 放大图片 (此命令由插件自动调用，无需手动输入) |
| `aiMidjourney.绘图 <prompt>`       | 绘一张图                     |

## 🌸 测试图


## 🙏 致谢

*   [Koishi](https://koishi.chat/)  - 机器人框架
*   [aiMidjourney](https://buy.ai-mj.cn/)  - AI 绘图平台

## 🐱 QQ 群

-   956758505

## ✨ License

MIT License © 2024

希望您喜欢这款插件！ 💫

如有任何问题或建议，欢迎联系我哈~ 🎈
