# koishi-plugin-ai-midjourney-draw

[![npm](https://img.shields.io/npm/v/koishi-plugin-ai-midjourney-draw?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-ai-midjourney-draw)

## 简介

Koishi 的 MidjourneyAI 绘图（非官方）插件。25 元/月 无限绘图。

## 使用

1. 获取授权码：

- 购买 [https://buy.ai-mj.cn/](https://buy.ai-mj.cn/)。
- 登录 [https://draw.ai-mj.com/login](https://draw.ai-mj.com/login)。
- F12 打开控制台，切换到网络选项卡。
- 发送 `/shorten a dog`。
- 找到 `shorten` 请求。
- 复制 `Authorization` 字段值。

2. 设置指令别名。

## 特性

- `onebot` 适配器：合并图片时，可通过 @ 多个用户，合并头像。

## Q&A

1. 如何获得图片种子？

- 引用回复 `seed` 或 `种子`。

2. 如何放大 4 小图？

- 引用回复数字 `1/2/3/4`。可同时放大多张。

## 注意事项

- 合并图片最多 5 张。
- 放大无需指令，直接引用回复。

## 致谢

* [Koishi](https://koishi.chat/)
* [MidjourneyAI 国内版](https://buy.ai-mj.cn/)

## QQ 群

- 956758505

## License

MIT License © 2024
