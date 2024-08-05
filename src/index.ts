import {Context, h, Schema, Element} from 'koishi'
import {} from '@koishijs/plugin-help'

export const name = 'ai-midjourney-draw'
export const inject = {
  required: ['database'],
}
export const usage = `## 🎮 使用

1. **获取授权码：**

- 前往 [https://buy.ai-mj.cn/](https://buy.ai-mj.cn/) 购买套餐。
- 前往 [https://draw.ai-mj.com/login](https://draw.ai-mj.com/login) 登录。
- 登录后，F12 打开控制台，切换网络选项卡。
- 在网页输入框中输入 \`/shorten a dog\` 并发送。
- 在控制台中找到 \`shorten\` 请求。
- 复制 \`Authorization\` 字段的值（即授权码）。

2. **配置插件：**  填写 \`authorization\` 配置项。

\`\`\`typescript
authorization: 'YOUR_AUTHORIZATION_CODE' // 替换为你的授权码
\`\`\`

3. **开始使用：**  在聊天中使用 \`aiMidjourney.绘图\` 命令即可开始绘图。

- **如何将 4 小图放大：** 引用回复数字 \`1/2/3/4\` 即可，可同时放大多张。善用引用哦！
- **建议自行添加别名：** 例如，可以将 \`aiMidjourney.绘图\` 添加别名为 \`绘图\` 或 \`画图\`，以便更方便地使用。

## ⚙️ 配置项

| 配置项             | 类型      | 描述                       |
|-----------------|---------|--------------------------|
| \`authorization\` | string  | **必填**。aiMidjourney 授权码。 |
| \`autoTranslate\` | boolean | 是否自动翻译提示词。默认为 \`false\`。   |
| \`timeoutDuration\` | number | 请求超时时间（分钟）。默认为 \`10\`。     |

## 🌼 指令

| 指令                                    | 描述                         |
|---------------------------------------|----------------------------|
| \`aiMidjourney\`                        | aiMidjourney 帮助            |
| \`aiMidjourney.相关资源\`                   | AI 绘图相关资源                  |
| \`aiMidjourney.提示词生成器 <prompt>\`        | 生成提示词                      |
| \`aiMidjourney.英译中 <prompt>\`           | 翻译英文到中文                    |
| \`aiMidjourney.中译英 <prompt>\`           | 翻译中文到英文（Claude-3.5-Sonnet） |
| \`aiMidjourney.提示词辅助工具\`                | 提示词辅助工具链接                  |
| \`aiMidjourney.合并图片\`                   | 合并多张图片（最多5张）               |
| \`aiMidjourney.缩短提示词 <prompt>\`         | 分析并缩短提示词                   |
| \`aiMidjourney.图片转提示词\`                 | 图片转提示词                     |
| \`aiMidjourney.放大 <taskId> <customId>\` | 放大图片 (此命令由插件自动调用，无需手动输入)   |
| \`aiMidjourney.绘图 <prompt>\`            | 绘一张图                       |
| \`aiMidjourney.图片转链接\`                  | 图片转链接                      |

## 🐱 QQ 群

- 956758505
`

// pz*
export interface Config {
  authorization: string
  autoTranslate: boolean
  timeoutDuration: number
}

export const Config: Schema<Config> = Schema.object({
  authorization: Schema.string().required().description('aiMidjourney 授权码。'),
  autoTranslate: Schema.boolean().default(false).description('是否自动将中文提示词翻译成英文。'),
  timeoutDuration: Schema.number().default(10).description('任务超时时长（分钟）。'),
})

// smb*
declare module 'koishi' {
  interface Tables {
    'aiMidjourney': AiMidjourney
  }
}

// jk*
export interface AiMidjourney {
  id: number,
  messageId: string,
  taskId: string,
  customIds: string[],
}

interface Button {
  customId: string;
  emoji: string;
  label: string;
  type: number;
  style: number;
}

interface ParsedOutput {
  imaginePromptResult?: string;
  english_translation?: string;
}

export function apply(ctx: Context, config: Config) {
  // cl*
  const logger = ctx.logger('aiMidjourney')
  //tzb*
  ctx.database.extend('aiMidjourney', {
    id: 'unsigned',
    taskId: 'string',
    customIds: 'json',
    messageId: 'string',
  }, {
    autoInc: true,
    primary: 'id',
  })
  // zjj*
  ctx.middleware(async (session, next) => {
    if (session.event.message.quote && session.event.message.quote.member.user.id === session.event.selfId) {
      let isExecuted = false;
      const content = `${h.select(session.event.message.elements, 'text')}`
      const [task] = await ctx.database.get('aiMidjourney', {messageId: session.event.message.quote.id})
      if (!task) {
        return await next();
      }
      if (content.includes('1')) {
        await session.execute(`aiMidjourney.放大 ${task.taskId} ${task.customIds[0]}`)
        isExecuted = true;
      }
      if (content.includes('2')) {
        await session.execute(`aiMidjourney.放大 ${task.taskId} ${task.customIds[1]}`)
        isExecuted = true;
      }
      if (content.includes('3')) {
        await session.execute(`aiMidjourney.放大 ${task.taskId} ${task.customIds[2]}`)
        isExecuted = true;
      }
      if (content.includes('4')) {
        await session.execute(`aiMidjourney.放大 ${task.taskId} ${task.customIds[3]}`)
        isExecuted = true;
      }
      if (isExecuted) {
        return;
      }
      return await next();
    } else {
      return await next();
    }
  });
  // aiMidjourney h* bz*
  ctx.command('aiMidjourney', 'aiMidjourney 帮助')
    .action(async ({session}) => {
      await session.execute(`aiMidjourney -h`)
    })
  // xgzy*
  ctx.command('aiMidjourney.相关资源', 'AI 绘图相关资源')
    .action(async ({session}) => {
      await sendMessage(session, `AI 绘图资源汇总
====================

学习资料
--------
* 官方文档：https://docs.midjourney.com/
  - 最权威的 Midjourney 使用指南
* 基础入门：https://www.midjourny.cn/tutorial/10.html
  - 新手必读的入门教程
* 进阶技巧：https://www.midjourny.cn/tutorial/32.html
  - 提升技能的进阶指南
* 学习路径：https://learningprompt.wiki/zh-Hans/docs/midjourney-learning-path
  - 系统化的 Midjourney 学习路径

提示词工具
----------
* 生成器：https://www.ai-mj.cn/gpt_prompt.html
  - AI 辅助创作提示词
* 风格参考：https://midjourneysref.com/
  - sref 风格码查询工具
* 提示词辞典：https://ai-mj-cn.feishu.cn/file/BBPZbdoDDowyPfxxdpUcEkiJnUc
  - 常用提示词汇集合

参考资源
--------
* 通用指南：https://ai-mj-cn.feishu.cn/docx/SJNAdnBWsoKTrVxvuwrc0ANxnkd
  - 全面的提示词技巧和建议
* 人物姿态：https://ai-mj-cn.feishu.cn/docx/VgUwdFqXMo5bqBxr2lnchgsenQb
  - 精确控制人物造型的方法
* 3D 效果：https://ai-mj-cn.feishu.cn/docx/EboidKOpionXNvx520Uc5kVHnVc
  - 创作立体感作品的指南
* 风格示例：https://ai-mj-cn.feishu.cn/file/XBjTbokkBom5nfx6PAOcB8rCnWh
  - 多种艺术风格的参考

灵感来源
--------
* Gate2AI：https://www.gate2ai.com/zh-cn/prompts-midjourney
* MusesAI：https://musesai.io/zh
* Paooo：https://paooo.com/ai-gallery/
* AI Gallery：https://www.aigallery.top/

小贴士
------
- 结合多个资源，创作出独特作品
- 持续学习和实践，掌握 Midjourney 的精髓
- 关注社区分享，获取最新技巧和灵感

祝你创作愉快！`)
    })
  // sctsc* sc*
  ctx.command('aiMidjourney.提示词生成器 <prompt:text>', '生成提示词')
    .action(async ({session}, prompt) => {
      if (!prompt) {
        await sendMessage(session, `缺少提示词。`);
        return
      }
      const json = {
        "task": "Generate a detailed Midjourney AI image prompt based on a given concept or object",
        "input": {
          "conceptOrObject": prompt
        },
        "output": {
          "format": "JSON",
          "structure": {
            "conceptOrObject": "Input concept or object",
            "thinkStepByStep": [
              "Step 1",
              "Step 2",
              "..."
            ],
            "imaginePromptResult": "Final prompt string"
          }
        },
        "guidelines": [
          "Use vivid and specific language",
          "Include details about appearance, environment, composition, mood, and style",
          "Vary the focus and interpretation across the prompt",
          "Avoid using 'description' or ':' in the prompts",
          "Include one realistic photographic style with lens type and size",
          "Write the prompt as a continuous string without line breaks"
        ],
        "promptStructure": [
          "[1] Simple concept or object",
          "[2] Detailed description of [1]",
          "[3] Scene environment",
          "[4] Composition",
          "[5] Mood, feelings, and atmosphere",
          "[6] Style (e.g., photography, painting, 3D)",
          "[7] Additional mood or atmosphere details",
          "[ar] Aspect ratio (--ar 16:9, --ar 9:16, or --ar 1:1)",
          "[v] Version (--niji 6 for Japanese style, or --v 6.1 for others)"
        ],
        "promptFormat": "[1], [2], [3], [4], [5], [6], [7], [ar] [v]",
        "note": "If the input is not in English, translate it before processing. Output the JSON object in English only. Only JSON object, no additional text."
      };
      const result = await fetchCompletions(JSON.stringify(json));
      await sendMessage(session, `${parseOutputResultToGetImaginePromptResult(result)}`);
    })
  // zyy* fy*
  ctx.command('aiMidjourney.中译英 <text:text>', '翻译中文到英文')
    .action(async ({session}, text) => {
      if (session.event.message.quote && session.event.message.quote.content) {
        text = session.event.message.quote.content
      }
      if (!text) {
        await sendMessage(session, `缺少翻译文本。`);
        return
      }
      await sendMessage(session, `${await translateChineseToEnglish(text)}`);
    })
  // fy* yyz*
  ctx.command('aiMidjourney.英译中 <prompt:text>', '翻译英文到中文')
    .action(async ({session}, prompt) => {
      if (session.event.message.quote && session.event.message.quote.content) {
        prompt = session.event.message.quote.content
      }
      if (!prompt) {
        await sendMessage(session, `缺少翻译文本。`);
        return
      }
      const result = await submitTranslation(prompt);
      await sendMessage(session, `${result}`);
      return
    })
  // fzgj*
  ctx.command('aiMidjourney.提示词辅助工具', '提示词辅助工具')
    .action(async ({session}) => {
      await sendMessage(session, `https://www.ai-mj.cn/prompt.html`)
    })
  // rh* hb*
  ctx.command('aiMidjourney.合并图片', '合并多张图片（最多5张）')
    .action(async ({session}) => {
      let imageUrls = getImageUrls(session.event.message.elements);
      if (session.event.message.quote && session.event.message.quote.elements) {
        const quoteImageUrls = getImageUrls(session.event.message.quote.elements);
        if (quoteImageUrls.length > 0) {
          imageUrls = imageUrls.concat(quoteImageUrls);
        }
      }
      if (imageUrls.length === 0) {
        await sendMessage(session, '未找到图片。');
        return;
      }
      if (imageUrls.length < 2) {
        await sendMessage(session, '至少需要两张图片。');
        return;
      }
      if (imageUrls.length > 5) {
        imageUrls = imageUrls.slice(0, 5);
      }
      const base64Array: string[] = await convertUrlsToBase64(imageUrls);
      const taskId = await submitTask('blend', {
        "botType": "MID_JOURNEY",
        "base64Array": base64Array,
        "dimensions": "SQUARE",
        "accountFilter": {
          "instanceId": "",
          "channelId": "",
          "remark": "",
          "modes": [],
          "remix": false,
          "remixAutoConsidered": false
        },
        "notifyHook": "",
        "state": ""
      });
      await sendMessage(session, `已提交合并图片任务，请耐心等待。`);
      const result = await pollTaskResult(taskId);
      if (result.status === 'SUCCESS') {
        const messageId = await sendMessage(session, `${h.image(result.imageUrl)}`);
        await ctx.database.create('aiMidjourney', {
          messageId: messageId,
          taskId,
          customIds: extractCustomIds(result.buttons)
        })
        return
      } else {
        await sendMessage(session, `${result.failReason}`);
        return
      }
    })
  // fxbsd*
  ctx.command('aiMidjourney.缩短提示词 <prompt:text>', '分析并缩短提示词')
    .action(async ({session}, prompt) => {
      if (session.event.message.quote && session.event.message.quote.elements) {
        prompt = `${h.select(session.event.message.quote.elements, 'text')}`;
      }
      if (!prompt) {
        await sendMessage(session, `缺少提示词。`);
        return
      }
      const taskId = await submitTask('shorten', {
        "botType": "MID_JOURNEY",
        "prompt": prompt,
        "accountFilter": {
          "instanceId": "",
          "channelId": "",
          "remark": "",
          "modes": [],
          "remix": false,
          "remixAutoConsidered": false
        },
        "notifyHook": "",
        "state": ""
      });
      const result = await pollTaskResult(taskId);
      if (result.status === 'SUCCESS') {
        await sendMessage(session, `${getShortenedPrompts(result.properties.finalPrompt)}`);
        return
      } else {
        await sendMessage(session, `${result.failReason}`);
        return
      }
    })
  // tpztsc* ms*
  ctx.command('aiMidjourney.图片转提示词', '图片转提示词')
    .action(async ({session}) => {
      let imageUrl = '';
      if (session.event.message.quote && session.event.message.quote.elements) {
        imageUrl = getFirstImageUrl(session.event.message.quote.elements);
      } else {
        imageUrl = getFirstImageUrl(session.event.message.elements);
      }
      if (!imageUrl) {
        await sendMessage(session, '未找到图片。');
        return;
      }
      const base64 = await getImageBase64(imageUrl);
      const taskId = await submitTask('describe', {
        "botType": "MID_JOURNEY",
        "base64": `data:image/jpeg;base64,${base64}`,
        "accountFilter": {
          "instanceId": "",
          "channelId": "",
          "remark": "",
          "modes": [],
          "remix": false,
          "remixAutoConsidered": false
        },
        "notifyHook": "",
        "state": ""
      });
      const result = await pollTaskResult(taskId);
      if (result.status === 'SUCCESS') {
        await sendMessage(session, `${result.prompt}`);
        return
      } else {
        await sendMessage(session, `${result.failReason}`);
        return
      }
    })
  // tpzurl* zlj*
  ctx.command('aiMidjourney.图片转链接', '图片转链接')
    .action(async ({session}) => {
      let imageUrls = [];
      if (session.event.message.quote && session.event.message.quote.elements) {
        imageUrls = getImageUrls(session.event.message.quote.elements);
      } else {
        imageUrls = getImageUrls(session.event.message.elements);
      }
      if (imageUrls.length === 0) {
        await sendMessage(session, '未找到图片。');
        return;
      }
      const ossUrls = await processImageUrls(imageUrls);
      await sendMessage(session, `${ossUrls.join('\n\n')}`);
    })
  // fd*
  ctx.command('aiMidjourney.放大 <taskId:string> <customId:string>', '放大图片', {hidden: true})
    .action(async ({session}, taskId, customId) => {
      if (!taskId || !customId) {
        return
      }
      try {
        const newTaskId = await submitTask('action', {
          "customId": customId,
          "taskId": taskId
        });
        const result = await pollTaskResult(newTaskId);
        if (result.status === 'SUCCESS') {
          await sendMessage(session, `${h.image(result.imageUrl)}`);
          return
        } else {
          await sendMessage(session, `${result.failReason}`);
          return
        }
      } catch (error) {
        logger.error(error);
      }
    })
  // ht* d*
  ctx.command('aiMidjourney.绘图 <prompt:text>', '绘一张图')
    .action(async ({session}, prompt) => {
      let ossUrls = []
      let imageUrls = getImageUrls(session.event.message.elements);
      if (session.event.message.quote && session.event.message.quote.elements) {
        const quoteImageUrls = getImageUrls(session.event.message.quote.elements);
        if (quoteImageUrls.length > 0) {
          imageUrls = imageUrls.concat(quoteImageUrls);
        }
      }
      if (imageUrls.length > 0) {
        ossUrls = await processImageUrls(imageUrls);
      }

      prompt = `${h.select(prompt, 'text')}`;
      if (!prompt) {
        if (session.event.message.quote && session.event.message.quote.elements) {
          prompt = `${h.select(session.event.message.quote.elements, 'text')}`;
        }
        if (!prompt) {
          await sendMessage(session, `缺少绘图提示词。`);
          return
        }
      }
      if (prompt.includes('--repeat') || prompt.includes('--r')) {
        await sendMessage(session, '不支持 --repeat 或 --r 参数。')
        return
      }
      if (config.autoTranslate) {
        const parsePromptResult = parsePrompt(prompt);
        const translatedPrompt = await translateChineseToEnglish(parsePromptResult.prompt);
        prompt = `${translatedPrompt} ${parsePromptResult.params}`;
      }

      prompt = ossUrls.length > 0 ? `${ossUrls.join(' ')} ${prompt}` : prompt;
      try {
        const taskId = await submitTask('imagine', {
            botType: "MID_JOURNEY",
            prompt: prompt,
            base64Array: [],
            accountFilter: {
              instanceId: "",
              channelId: "",
              remark: "",
              modes: [],
              remix: false,
              remixAutoConsidered: false
            },
            notifyHook: "",
            state: ""
          }
        );
        await sendMessage(session, `已提交绘图任务，请耐心等待。`);
        const result = await pollTaskResult(taskId);
        if (result.status === 'SUCCESS') {
          const messageId = await sendMessage(session, `${h.image(result.imageUrl)}`);
          ctx.database.create('aiMidjourney', {
            messageId: messageId,
            taskId,
            customIds: extractCustomIds(result.buttons)
          })
          return
        } else {
          await sendMessage(session, `${result.failReason}`);
          return
        }
      } catch (error) {
        logger.error(error);
      }
    })

  // hs*
  async function translateChineseToEnglish(text: string): Promise<string> {
    const json = {
      "role": "Expert Chinese to English Translator",
      "task": "Translate Chinese text to natural, fluent English",
      "instructions": [
        "Maintain original tone and style",
        "Adapt idioms and expressions",
        "Preserve cultural nuances",
        "Use brief parenthetical explanations if needed",
        "Consider context for words with multiple meanings",
        "Use appropriate colloquialisms when present in source",
        "Ensure grammatical correctness and natural flow",
        "Adapt wordplay to maintain original spirit",
        "Use gender-neutral pronouns for animals unless specified"
      ],
      "input": {
        "chinese_text": text
      },
      "output_format": "JSON",
      "output_structure": {
        "english_translation": "String containing only the translated text"
      },
      "notes": "Exclude additional explanations or meta-commentary in the output. Output the JSON object in English only. Only JSON object, no additional text."
    };

    try {
      const result = await fetchCompletions(JSON.stringify(json));
      return parseOutputResultToGetEnglishTranslation(result);
    } catch (error) {
      logger.error('Translation error:', error);
      return 'Translation failed.';
    }
  }

  function parsePrompt(prompt: string): { prompt: string; params: string } {
    if (typeof prompt !== 'string') {
      throw new Error('Input must be a string');
    }

    const lastParamIndex = prompt.lastIndexOf('--');

    if (lastParamIndex === -1) {
      return { prompt: prompt.trim(), params: '' };
    }

    // 检查 "--" 是否在字符串的开头
    if (lastParamIndex === 0) {
      return { prompt: '', params: prompt.trim() };
    }

    const promptText = prompt.slice(0, lastParamIndex).trim();
    const params = prompt.slice(lastParamIndex).trim();

    return { prompt: promptText, params: params };
  }

  function parseOutputResult(outputResult: string): ParsedOutput {
    if (typeof outputResult !== 'string') {
      throw new TypeError("Input must be a string");
    }

    const trimmedResult = outputResult.trim();

    const jsonRegex = /^\s*({[\s\S]*}|\[[\s\S]*\])\s*$/;
    const match = trimmedResult.match(jsonRegex);

    if (!match) {
      const partialJsonRegex = /{[\s\S]*}|\[[\s\S]*\]/;
      const partialMatch = trimmedResult.match(partialJsonRegex);

      if (!partialMatch) {
        throw new Error("No valid JSON structure found in the output result");
      }

      try {
        return JSON.parse(partialMatch[0]) as ParsedOutput;
      } catch (error) {
        logger.warn(`Found JSON-like structure but failed to parse: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return {};
      }
    }

    try {
      const parsedJson = JSON.parse(match[0]);
      if (typeof parsedJson !== 'object' || parsedJson === null) {
        throw new TypeError("Parsed result is not an object or array");
      }
      return parsedJson as ParsedOutput;
    } catch (error) {
      logger.error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {};
    }
  }

  function parseOutputResultToGetImaginePromptResult(outputResult: string): string | undefined {
    return parseOutputResult(outputResult).imaginePromptResult ?? outputResult;
  }

  function parseOutputResultToGetEnglishTranslation(outputResult: string): string | undefined {
    return parseOutputResult(outputResult).english_translation ?? outputResult;
  }

  async function convertUrlToBase64(url: string): Promise<string> {
    const base64 = await getImageBase64(url);
    return `data:image/jpeg;base64,${base64}`;
  }

  async function convertUrlsToBase64(ossUrls: string[]): Promise<string[]> {
    return Promise.all(ossUrls.map(convertUrlToBase64));
  }

  async function fetchCompletions(text) {
    const url = 'https://sourcegraph.com/.api/graphql';
    const token = "sgp_a0d7ccb4f752ea73_62464a2e9174c0d45f46f9885c742f5b53510030";

    const query = `
    query($input: CompletionsInput!) {
      completions(input: $input)
    }
  `;

    const variables = {
      input: {
        messages: [{text, speaker: "HUMAN"}],
        temperature: 1,
        maxTokensToSample: 4000,
        topK: 50,
        topP: 1
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({query, variables}),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors.map(e => e.message).join(', '));
      }

      if (data.data && data.data.completions) {
        return data.data.completions;
      } else {
        throw new Error('Unexpected response structure');
      }
    } catch (error) {
      logger.error('Error:', error);
      return JSON.stringify({
        english_translation: 'Translation failed.',
        imaginePromptResult: 'Prompt generation failed.',
      });
    }
  }

  async function submitTranslation(prompt: string): Promise<string> {
    const json = {prompt: prompt};

    const response = await fetch("https://diablo4.kandouyin.com/getTrans", {
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(json),
      method: "POST"
    });

    const result = await response.json();

    if (result.success !== 1 || !result.data || result.data.length === 0) {
      logger.error("Translation failed or no data returned");
    }

    return result.data[0];
  }

  function getShortenedPrompts(finalPrompt: string): string {
    const marker = "## Shortened prompts";
    const index = finalPrompt.indexOf(marker);

    if (index === -1) {
      return "";
    }

    return finalPrompt.slice(index + "## Shortened prompts".length).trim();
  }

  async function processImageUrls(imageUrls: string[]): Promise<string[]> {
    const ossUrlPromises: Promise<string>[] = imageUrls.map(async (imageUrl) => {
      try {
        const base64 = await getImageBase64(imageUrl);

        return await uploadBase64ToOss(base64);
      } catch (error) {
        logger.error(`处理图片 ${imageUrl} 时出错:`, error);
        return '';
      }
    });

    return await Promise.all(ossUrlPromises);
  }

  function getImageUrls(elements: Element[]): string[] {
    return elements
      .filter(element => element.type === 'img')
      .map(element => element.attrs.url || element.attrs.src)
      .filter(Boolean);
  }

  async function getImageBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        logger.error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      const buffer = Buffer.from(arrayBuffer);

      return buffer.toString('base64');
    } catch (error) {
      logger.error('Error fetching image:', error);
      throw error;
    }
  }

  function getFirstImageUrl(elements: Element[]): string | null {
    for (const element of elements) {
      if (element.type === 'img') {
        return element.attrs.src || element.attrs.url || null;
      }
    }

    return null;
  }

  async function uploadBase64ToOss(base64: string): Promise<string> {
    const requestOptions = {
      method: 'POST',
      headers: {
        "content-type": "application/json",
        'authorization': config.authorization,
      },
      body: JSON.stringify({
        "base64": `data:image/png;base64,${base64}`
      }),
    };

    const response = await fetch('https://draw.ai-mj.com/mjapi/ai/aliyunOss/uploadFromBase64', requestOptions);

    if (!response.ok) {
      logger.error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data.ossUrl;
  }

  function extractCustomIds(buttons: Button[]): string[] {
    return buttons.map(button => button.customId);
  }

  async function pollTaskResult(taskId: string): Promise<any> {
    const startTime = Date.now();
    const timeoutDuration = config.timeoutDuration * 60 * 1000;

    while (true) {
      try {
        if (Date.now() - startTime > timeoutDuration) {
          throw new Error(`Polling timed out after ${timeoutDuration} minutes`);
        }

        const result = await fetchTaskResult(taskId);

        if (result.code === 500 || result.msg === '任务超时。如涉及垫图/反推等与图片相关的操作，请优先使用平台的上传图片功能，使用外链图片可能会造成任务失败。') {
          logger.error('Task timed out due to image processing issues');
          return {
            status: 'FAILURE',
            failReason: '任务超时。可能是因为图片处理问题，建议使用平台的上传图片功能。'
          };
        }

        if (result.status === 'SUCCESS' || result.status === 'FAILURE') {
          return result;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        if (error instanceof Error && error.message === `Polling timed out after ${timeoutDuration} minutes`) {
          logger.error(`Polling timed out after ${timeoutDuration} minutes`);
          return {status: 'FAILURE', failReason: '任务超时'};
        }
        logger.error('Error fetching task result:', error);
      }
    }
  }

  async function fetchTaskResult(taskId: string): Promise<any> {
    const url = `https://draw.ai-mj.com/mjapi/mj/task/${taskId}/fetch`;
    const headers = {
      "content-type": "application/json",
      "authorization": config.authorization
    };

    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      logger.error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async function submitTask(type: string, requestBody): Promise<string> {

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': config.authorization
      },
      body: JSON.stringify(requestBody)
    };

    const response = await fetch(`https://draw.ai-mj.com/mjapi/mj/submit/${type}`, requestOptions);
    const data = await response.json();

    if (data.code !== 1) {
      logger.error(`Failed to submit task.`);
    }

    return data.result;
  }


  async function sendMessage(session, text) {
    const [messageId] = await session.send(`${h.quote(session.messageId)}${text}`)
    return messageId
  }
}

