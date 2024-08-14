import {Context, h, Schema, Element} from 'koishi'
import {} from '@koishijs/plugin-help'
import path from "path";
import fs from "fs";

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

| 配置项               | 类型      | 描述                       |
|-------------------|---------|--------------------------|
| \`authorization\`   | string  | **必填**。aiMidjourney 授权码。 |
| \`autoTranslate\`   | boolean | 是否自动翻译提示词。默认为 \`false\`。   |
| \`timeoutDuration\` | number  | 请求超时时间（分钟）。默认为 \`10\`。     |
| \`printProgress\`   | boolean | 是否打印绘图进度。默认为 \`true\`。     |

## 🌼 指令

| 指令                                    | 描述                         |
|---------------------------------------|----------------------------|
| \`aiMidjourney\`                        | aiMidjourney 帮助            |
| \`aiMidjourney.相关资源\`                   | Midjourney 绘图相关资源          |
| \`aiMidjourney.参数列表\`                   | Midjourney 参数列表            |
| \`aiMidjourney.提示词生成器 <prompt>\`        | 生成提示词                      |
| \`aiMidjourney.英译中 <prompt>\`           | 翻译英文到中文                    |
| \`aiMidjourney.中译英 <prompt>\`           | 翻译中文到英文（\`智谱AI\`） |
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
  printProgress: boolean
}

export const Config: Schema<Config> = Schema.object({
  authorization: Schema.string().required().description('aiMidjourney 授权码。'),
  autoTranslate: Schema.boolean().default(false).description('是否自动将中文提示词翻译成英文。'),
  timeoutDuration: Schema.number().default(10).description('任务超时时长（分钟）。'),
  printProgress: Schema.boolean().default(true).description('是否打印任务进度。'),
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
  finalPrompt?: string;
  englishTranslation?: string;
}

export function apply(ctx: Context, config: Config) {
  // cl*
  const logger = ctx.logger('aiMidjourney')
  // wj*
  const parameterListFilePath = path.join(__dirname, 'assets', '参数列表.png');
  const parameterListImgBuffer = fs.readFileSync(parameterListFilePath)
  // tzb*
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
    if (session.event.message.quote) {
      let quoteUserId: string | undefined;

      if (session.event.message.quote.member?.user?.id) {
        quoteUserId = session.event.message.quote.member.user.id;
      } else if (session.event.message.quote.user?.id) {
        quoteUserId = session.event.message.quote.user.id;
      }

      if (quoteUserId === session.event.selfId) {
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
        if (content.includes('seed') || content.includes('种子')) {
          const seed = await getSeed(task.taskId);
          if (seed) {
            await sendMessage(session, seed);
          } else {
            await sendMessage(session, '种子获取失败。');
          }
          isExecuted = true;
        }
        if (isExecuted) {
          return;
        }
      }
    }
    return await next();
  }, true);
  // zl*
  // aiMidjourney h* bz*
  ctx.command('aiMidjourney', 'aiMidjourney 帮助')
    .action(async ({session}) => {
      await session.execute(`aiMidjourney -h`)
    })
  // xgzy*
  ctx.command('aiMidjourney.相关资源', 'Midjourney 绘图相关资源')
    .action(async ({session}) => {
      await sendMessage(session, `https://www.yuque.com/r/note/449be76b-f9ef-474a-be12-f3ba213a087b`)
    })
  // cslb*
  ctx.command('aiMidjourney.参数列表', 'Midjourney 参数列表')
    .action(async ({session}) => {
      await sendMessage(session, h.image(parameterListImgBuffer, `image/png`))
    })
  // sctsc* sc*
  ctx.command('aiMidjourney.提示词生成器 <prompt:text>', '生成提示词')
    .action(async ({session}, prompt) => {
      if (!prompt && session.event.message.quote && session.event.message.quote.content) {
        prompt = session.event.message.quote.content
      }
      if (!prompt) {
        await sendMessage(session, `缺少提示词。`);
        return
      }
      const promptSendToAI = `You are an AI assistant specialized in generating detailed Midjourney image prompts. Your task is to create a vivid, descriptive prompt based on the input provided. Follow these steps and guidelines:

1. Analyze the main concept or object given.
2. Develop a detailed description of this concept or object.
3. Incorporate the specified environment and setting.
4. Define the composition and framing of the image.
5. Establish the desired mood and atmosphere.
6. Determine the artistic style and medium.
7. Add finishing touches and additional details.

Use vivid, specific, and descriptive language. Incorporate sensory details (visual, auditory, tactile). Balance broad concepts with specific details. Vary sentence structure and length for interest. Use metaphors or similes to enhance descriptions. Include unexpected or unique elements for creativity. Specify camera angles, distances, and perspectives for photographic styles. Mention lighting conditions, colors, and textures. Incorporate movement or action when appropriate.

Avoid using 'description of' or colons in the prompts. Write the prompt as a continuous string without line breaks.

Structure your prompt in this order:
1. Main concept or object
2. Detailed description
3. Environment and setting
4. Composition and framing
5. Mood, feelings, and atmosphere
6. Artistic style or medium
7. Lighting and color palette
8. Additional elements or details
9. Camera or perspective details (for photographic styles)
10. Texture and material specifications
11. Action or movement (if applicable)
12. Aspect ratio (--ar 16:9, --ar 9:16, or --ar 1:1)
13. Version (--niji 6 for anime and illustrative styles, or --v 6.1 for others)

Example input:
{
"conceptOrObject": "Enchanted forest",
}

Example output:
{
"finalPrompt": "Enchanted forest, ancient gnarled trees with bioluminescent bark, dense misty woodland bathed in twilight hues, winding path leading to a hidden clearing, mysterious and magical atmosphere, digital painting style with rich textures, soft purple and blue color palette with hints of golden light, swirling fireflies creating trails of light, low angle view emphasizing towering trees, intricate root systems and moss-covered stones, gentle breeze rustling leaves, --ar 16:9 --v 6.1"
}

Your output should be a JSON object containing only the "finalPrompt" key and its corresponding value. Do not include any additional text or explanations outside of the JSON object. If the input is not in English, translate it before processing. Provide the output in English only.

input:
{
"conceptOrObject": "${prompt}",
}

output:`
      const result = await fetchCompletions(promptSendToAI);
      if (!result) {
        await sendMessage(session, `生成提示词失败。`);
        return
      }
      await sendMessage(session, `${parseOutputResultToGetFinalPrompt(result)}`);
    })
  // zyy* fy*
  ctx.command('aiMidjourney.中译英 <text:text>', '翻译中文到英文')
    .action(async ({session}, text) => {
      if (!text && session.event.message.quote && session.event.message.quote.content) {
        text = session.event.message.quote.content
      }
      if (!text) {
        await sendMessage(session, `缺少翻译文本。`);
        return
      }
      const result = await translateChineseToEnglish(text);
      if (result === text) {
        await sendMessage(session, `翻译失败。`);
        return
      }
      await sendMessage(session, `${result}`);
    })
  // fy* yyz*
  ctx.command('aiMidjourney.英译中 <prompt:text>', '翻译英文到中文')
    .action(async ({session}, prompt) => {
      if (!prompt && session.event.message.quote && session.event.message.quote.content) {
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
  ctx.command('aiMidjourney.合并图片 [text:text]', '合并多张图片（最多5张）')
    .action(async ({session}, text) => {
      let imageUrls = getImageUrls(session.event.message.elements);
      if (session.event.platform === 'onebot' || session.event.platform === 'red') {
        const headImgUrls = getHeadImgUrls(h.select(text, 'at'))
        if (headImgUrls.length > 0) {
          imageUrls = imageUrls.concat(headImgUrls);
        }
      }
      let imageUrlsAndRestPrompt = extractLinksInPrompts(`${h.select(session.event.message.elements, 'text')}`);
      if (imageUrlsAndRestPrompt.imageUrls.length > 0) {
        imageUrls = imageUrls.concat(imageUrlsAndRestPrompt.imageUrls);
      }
      if (session.event.message.quote && session.event.message.quote.elements) {
        imageUrlsAndRestPrompt = extractLinksInPrompts(`${h.select(session.event.message.quote.elements, 'text')}`);
        if (imageUrlsAndRestPrompt.imageUrls.length > 0) {
          imageUrls = imageUrls.concat(imageUrlsAndRestPrompt.imageUrls);
        }
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
        await sendMessage(session, '最多只能合并五张图片。');
        return;
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
  ctx.command('aiMidjourney.图片转提示词 [text:text]', '图片转提示词')
    .action(async ({session}, text) => {
      let imageUrl = '';
      if (session.event.message.quote && session.event.message.quote.elements) {
        imageUrl = getFirstImageUrl(session.event.message.quote.elements);
      } else {
        imageUrl = getFirstImageUrl(session.event.message.elements);
      }
      if (!imageUrl && (session.event.platform === 'onebot' || session.event.platform === 'red')) {
        const headImgUrls = getHeadImgUrls(h.select(text, 'at'))
        if (headImgUrls.length > 0) {
          imageUrl = headImgUrls[0];
        }
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
  ctx.command('aiMidjourney.图片转链接 [text:text]', '图片转链接')
    .action(async ({session}, text) => {
      let imageUrls = [];
      if (session.event.message.quote && session.event.message.quote.elements) {
        imageUrls = getImageUrls(session.event.message.quote.elements);
      } else {
        imageUrls = getImageUrls(session.event.message.elements);
      }
      if (session.event.platform === 'onebot' || session.event.platform === 'red') {
        const headImgUrls = getHeadImgUrls(h.select(text, 'at'))
        if (headImgUrls.length > 0) {
          imageUrls = imageUrls.concat(headImgUrls);
        }
      }
      if (imageUrls.length === 0) {
        await sendMessage(session, '未找到图片。');
        return;
      }
      let ossUrls = await processImageUrls(imageUrls);
      await sendMessage(session, `${ossUrls.join('\n\n')}`);
    })
  // fd*
  ctx.command('aiMidjourney.放大 <taskId:string> <customId:string>', '放大图片', {hidden: true})
    .usage(`此命令由插件自动调用，无需手动输入。`)
    .usage(`请直接引用 4 小图，回复相应的数字序号即可，可同时输入多个。`)
    .action(async ({session}, taskId, customId) => {
      if (!taskId || !customId) {
        return await sendMessage(session, `此命令由插件自动调用，无需手动输入。
请直接引用 4 小图，回复相应的数字序号即可，可同时输入多个。`);
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

      if (session.event.platform === 'onebot' || session.event.platform === 'red') {
        const headImgUrls = getHeadImgUrls(h.select(prompt, 'at'))
        if (headImgUrls.length > 0) {
          imageUrls = imageUrls.concat(headImgUrls);
        }
      }
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
      } else if (session.event.message.quote && session.event.message.quote.elements) {
        const imageUrlsAndRestPrompt = extractLinksInPrompts(`${h.select(session.event.message.quote.elements, 'text')}`);
        if (imageUrlsAndRestPrompt.imageUrls.length > 0) {
          ossUrls = ossUrls.concat(await processImageUrls(imageUrlsAndRestPrompt.imageUrls));
        }
      }
      if (prompt.includes('--repeat') || prompt.includes('--r')) {
        await sendMessage(session, '不支持 --repeat 或 --r 参数。')
        return
      }

      if (config.autoTranslate) {
        const promptAndParams = separatePromptWordsAndParameters(prompt);
        const imageUrlsAndRestPrompt = extractLinksInPrompts(promptAndParams.prompt);
        const translatedPrompt = await translateChineseToEnglish(imageUrlsAndRestPrompt.rest);
        if (imageUrlsAndRestPrompt.imageUrls.length > 0) {
          ossUrls = ossUrls.concat(await processImageUrls(imageUrlsAndRestPrompt.imageUrls));
        }
        prompt = `${translatedPrompt} ${promptAndParams.params}`;
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
        if (config.printProgress) {
          logger.success(`Task ID: ${taskId} | Prompt: ${prompt}`);
        }
        await sendMessage(session, `已提交绘图任务，请耐心等待。`);
        const result = await pollTaskResult(taskId);
        if (result.status === 'SUCCESS') {
          if (config.printProgress) {
            logger.success(`Task ID: ${taskId} | Image URL: ${result.imageUrl}`);
          }
          const messageId = await sendMessage(session, `${h.image(result.imageUrl)}`);
          await ctx.database.create('aiMidjourney', {
            messageId: messageId,
            taskId,
            customIds: extractCustomIds(result.buttons)
          })
          return
        } else {
          if (config.printProgress) {
            logger.error(`Task ID: ${taskId} | Fail Reason: ${result.failReason}`);
          }
          await sendMessage(session, `${result.failReason}`);
          return
        }
      } catch (error) {
        logger.error(error);
      }
    })

  // hs*
  async function getSeed(taskId: string): Promise<string | null> {
    const url = `https://draw.ai-mj.com/mjapi/mj/task/${taskId}/image-seed`;
    const headers = {
      "content-type": "application/json",
      'Authorization': config.authorization,
    };

    try {
      const response = await fetch(url, {headers});
      if (response.ok) {
        const {result} = await response.json();
        return result;
      } else {
        return null;
      }
    } catch (error) {
      logger.error('Error get seed:', error);
      return null;
    }
  }

  function getHeadImgUrls(atElements: Element[]): string[] {
    return atElements.map(element => {
      const atId = element.attrs.id;
      return `https://q.qlogo.cn/g?b=qq&s=640&nk=${atId}`;
    });
  }

  function extractLinksInPrompts(prompt: string): { imageUrls: string[], rest: string } {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const imageUrls = prompt.match(urlRegex) || [];

    const rest = prompt.replace(urlRegex, '').trim();

    return {
      imageUrls,
      rest
    };
  }

  async function translateChineseToEnglish(text: string): Promise<string> {
    const prompt = `You are an Expert Chinese to English Translator. Your task is to translate Chinese text to natural, fluent English. Follow these instructions:

1. Accurately convey the original tone, style, and cultural context.
2. Consider context for words with multiple meanings.
3. Use appropriate colloquialisms when present in the source.
4. Ensure grammatical correctness and natural flow.
5. Adapt wordplay to maintain the original spirit.
6. Use gender-neutral pronouns for animals unless specified.
7. Use parentheses for necessary clarifications.

If the input text is already in English, return it as is without translation.

Translate the following text:
${text}

Provide your response in JSON format with the following structure:
{
  "englishTranslation": "The translated English text or original English text if no translation was needed."
}

Do not include any additional explanations or meta-commentary outside of the JSON structure.`

    try {
      const result = await fetchCompletions(prompt);
      return parseOutputResultToGetEnglishTranslation(result);
    } catch (error) {
      logger.error('Translation error:', error);
      return text;
    }
  }

  function separatePromptWordsAndParameters(input: string): { prompt: string; params: string } {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    const parts = input.split(' ');

    let promptParts: string[] = [];
    let paramParts: string[] = [];
    let isParam = false;

    for (const part of parts) {
      if (part.startsWith('--')) {
        isParam = true;
      }

      if (isParam) {
        paramParts.push(part);
      } else {
        promptParts.push(part);
      }
    }

    const prompt = promptParts.join(' ').trim();
    const params = paramParts.join(' ').trim();

    return {prompt, params};
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

  function parseOutputResultToGetFinalPrompt(outputResult: string): string | undefined {
    return parseOutputResult(outputResult).finalPrompt ?? outputResult;
  }

  function parseOutputResultToGetEnglishTranslation(outputResult: string): string | undefined {
    return parseOutputResult(outputResult).englishTranslation ?? outputResult;
  }

  async function convertUrlToBase64(url: string): Promise<string> {
    const base64 = await getImageBase64(url);
    return `data:image/jpeg;base64,${base64}`;
  }

  async function convertUrlsToBase64(ossUrls: string[]): Promise<string[]> {
    return Promise.all(ossUrls.map(convertUrlToBase64));
  }

  async function fetchCompletions(text) {
    const json = {
      "temperature": 1,
      "model": "glm-4-flash",
      "max_tokens": 4095,
      "stream": false,
      "messages": [
        {"role": "user", "content": text},
      ]
    };

    try {
      const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 6cb933cef62c71921abae1d511184c3d.w2OraEpWLytNG1J1'
        },
        body: JSON.stringify(json)
      });
      const result = await response.json();
      return result.choices[0].message.content;
    } catch (error) {
      logger.error('Error:', error);
      return JSON.stringify({
        englishTranslation: 'Translation failed.',
        finalPrompt: 'Prompt generation failed.',
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
        if (config.printProgress) {
          logger.info(`Task ID: ${taskId} | Status: ${result.status}${result.progress ? ` | Progress: ${result.progress}` : ''}`);
        }
        if (result.status === 'SUCCESS' || result.status === 'FAILURE') {
          return result;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        if (error instanceof Error && error.message === `Polling timed out after ${timeoutDuration} minutes`) {
          logger.error(`Polling timed out after ${timeoutDuration} minutes`);
          return {status: 'FAILURE', failReason: '任务超时。'};
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

