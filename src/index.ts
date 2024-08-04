import {Context, h, Schema, Element} from 'koishi'
import {} from '@koishijs/plugin-help'

export const name = 'ai-midjourney-draw'
export const inject = {
  required: ['database'],
}
export const usage = `## 🎮 使用

1. **获取授权码：**

- 在 [aiMidjourney](https://buy.ai-mj.cn/) 平台购买套餐。
- 在 [aiMidjourney](https://draw.ai-mj.com/login) 平台登录。
- 登录后，F12 打开控制台，切换网络选项卡。
- 在网页输入框中输入 \`/shorten a dog\` 并发送。
- 在控制台中找到 \`shorten\` 请求。
- 复制 \`Authorization\` 字段的值（即授权码）。

2. **配置插件：**  填写 \`authorization\` 配置项。

\`\`\`typescript
authorization: 'YOUR_AUTHORIZATION_CODE' // 替换为你的授权码
\`\`\`

3. **开始使用：**  在聊天中使用 \`aiMidjourney.绘图\` 命令即可开始绘图。

- 如何将 4 小图放大：引用回复数字 \`1/2/3/4\` 即可，可同时放大多张。
- **建议自行添加别名：** 例如，可以将 \`aiMidjourney.绘图\` 添加别名为 \`绘图\` 或 \`画图\`，以便更方便地使用。

## ⚙️ 配置项

| 配置项             | 类型     | 描述                       |
|-----------------|--------|--------------------------|
| \`authorization\` | string | **必填**。aiMidjourney 授权码。 |

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
| \`aiMidjourney.图片转链接\`            | 图片转链接                       |
`

export interface Config {
  authorization: string
}

export const Config: Schema<Config> = Schema.object({
  authorization: Schema.string().required().description('aiMidjourney 授权码。'),
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
      await sendMessage(session, `# 提示词

## 辅助工具

https://www.ai-mj.cn/prompt.html

## 生成器

https://www.ai-mj.cn/gpt_prompt.html

## 咒语分享

https://tieba.baidu.com/p/8448977788

## sref 风格码

https://midjourneysref.com/

## 通用

https://ai-mj-cn.feishu.cn/docx/SJNAdnBWsoKTrVxvuwrc0ANxnkd
https://ai-mj-cn.feishu.cn/docx/LVzldxL1foFWlAxYSOecPqlVnkh

## 人物姿态控制

https://ai-mj-cn.feishu.cn/docx/VgUwdFqXMo5bqBxr2lnchgsenQb

## 3D

https://ai-mj-cn.feishu.cn/docx/EboidKOpionXNvx520Uc5kVHnVc

## 辞典

https://ai-mj-cn.feishu.cn/file/BBPZbdoDDowyPfxxdpUcEkiJnUc

## 风格

https://ai-mj-cn.feishu.cn/file/XBjTbokkBom5nfx6PAOcB8rCnWh

## 小红书案例参考

https://www.xiaohongshu.com/user/profile/602b7fa700000000010068ab?exSource=https://ai-mj-cn.feishu.cn/

> 小红书 + 特定风格

# 教程

## 官方文档

https://docs.midjourney.com/

## 基础入门

https://www.midjourny.cn/tutorial/10.html
https://blog.csdn.net/weixin_42080277/article/details/130274792

## 参数&指令解析

https://ai-mj-cn.feishu.cn/docx/BLfEdffiNoxMZIxQmaYc54wXnif

## 进阶

https://www.midjourny.cn/tutorial/32.html
https://learningprompt.wiki/zh-Hans/docs/midjourney-learning-path

# 第三方分类图库（用于关键词参考）

https://www.gate2ai.com/zh-cn/prompts-midjourney
https://musesai.io/zh
https://paooo.com/ai-gallery/
https://www.aigallery.top/
https://www.ai-img-gen.com/
https://www.yangpiancool.com/`)
    })
  // sctsc* sc*
  ctx.command('aiMidjourney.提示词生成器 <prompt:text>', '生成提示词')
    .action(async ({session}, prompt) => {
      if (!prompt) {
        await sendMessage(session, `缺少提示词。`);
        return
      }
      const result = await fetchCompletions(`# Command area

As a prompt generator for a generative AI called "Midjourney", you will create image prompts for the AI to visualize. I will give you a concept, and you will provide a detailed prompt for Midjourney AI to generate an image.

Please adhere to the structure and formatting below, and follow these guidelines:

Do not use the words "description" or ":" in any form.
Do not place a comma between [ar] and [v].
Write each prompt in one line without using return.
Structure:
[1] = a simple concept or object.
[2] = a detailed description of [1] with specific imagery details.
[3] = a detailed description of the scene's environment.
[4] = a detailed description of the compositions.
[5] = a detailed description of the scene's mood, feelings, and atmosphere.
[6] = A style (e.g. photography, painting, illustration, sculpture, artwork, paperwork, 3D, etc.) for [1].
[7] =  a detailed description of the scene's mood, feelings, and atmosphere.
[ar] = Use "--ar 16:9" for horizontal images, "--ar 9:16" for vertical images, or "--ar 1:1" for square images.
[v] = Use "--niji 6.1" for Japanese art style, or "--v 6.1" for other styles.


Formatting:
Follow this prompt structure: "/imagine prompt: [1], [2], [3], [4], [5], [6], [7], [ar] [v]".

Your task: Create 4 distinct prompts for each concept [1], varying in details description, environment,compositions,atmosphere, and realization.

Write your prompts in english.
Do not describe unreal concepts as "real" or "photographic".
Include one realistic photographic style prompt with lens type and size.
Separate different prompts with two new lines.
Example Prompts:

/imagine prompt: cute dog, fluffy fur, wagging tail, playful expression, sitting on a grassy field, under a clear blue sky, with a colorful collar, in a natural and vibrant setting, by a lake, captured with a Nikon D750 camera, 50mm lens, shallow depth of field, composition focused on the dog's face, capturing its joyful spirit, in a style reminiscent of William Wegman's iconic dog portraits. --ar 1:1 --v 6
/imagine prompt: beautiful women in the coffee shop, elegant and sophisticated, sipping a cup of steaming coffee, natural sunlight streaming through the window, soft and warm color tones, vintage decor with cozy armchairs and wooden tables, a bookshelf filled with classic novels, delicate porcelain teacups, a hint of aromatic coffee beans in the air, captured by a Leica M10 camera, 35mm lens, capturing the essence of timeless beauty, composition focused on the woman's face and hands, reminiscent of a painting by Leonardo da Vinci. --ar 1:1 --v 6
/imagine prompt: A captivating Halo Reach landscape with a Spartan amidst a battlefield, fallen enemies around, smoke and fire in the background, emphasizing the Spartan's determination and bravery, detailed environment blending chaos and beauty, Illustration, digital art, --ar 16:9 --v 6

# Interaction region

User: Create 4 distinct prompts for each concept [1], varying in details description, environment, compositions, atmosphere, and realization.

Assistant: Sure, please provide the concept you want me to create prompts for.

User: ${prompt}

Assistant: Here are 4 distinct English prompts for the concept "${prompt}":`);
      await sendMessage(session, `${result}`);
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
      const result = await fetchCompletions(`# Command area

You are a professional Chinese to English translator. Translate the given Chinese text into fluent, natural-sounding English. Aim for accuracy in conveying the original meaning while adapting to English language conventions and style. Preserve any specific terms, names, or cultural references, providing brief explanations in brackets if necessary for clarity. Produce a translation that reads smoothly to native English speakers while faithfully representing the source content.

# Interaction region

User: 你好，我是一只可爱的猫。

Assistant: Hello, I am an adorable cat.

User: 我喜欢吃鱼。

Assistant: I like to eat fish.

User: ${text}

Assistant: `);
      await sendMessage(session, `${result}`);
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
      if (imageUrls.length === 0) {
        await sendMessage(session, '未找到图片。');
        return;
      }
      if (imageUrls.length > 5) {
        imageUrls = imageUrls.slice(0, 5);
      }
      const base64Array = imageUrls.map(url => `data:image/jpeg;base64,${getImageBase64(url)}`);
      const taskId = await submitTask('blend', {
        botType: "MID_JOURNEY",
        prompt: "",
        base64Array: base64Array,
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
      const imageUrls = getImageUrls(session.event.message.elements);
      if (imageUrls.length > 0) {
        ossUrls = await processImageUrls(imageUrls);
      }
      prompt = `${h.select(prompt, 'text')}`;
      if (!prompt) {
        await sendMessage(session, `缺少绘图提示词。`);
        return
      }
      if (prompt.includes('--repeat') || prompt.includes('--r')) {
        await sendMessage(session, '不支持 --repeat 或 --r 参数。')
        return
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
    while (true) {
      try {
        const result = await fetchTaskResult(taskId);
        if (result.status === 'SUCCESS' || result.status === 'FAILURE') {
          return result;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
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

