import { message } from 'antd';
import { Assistant } from '@/types/app/assistant';

/**
 * 将用户输入的通用模型名（不区分大小写）映射为实际 API 使用的模型名
 */
export const getModelName = (rawModel: string): string => {
  const key = rawModel.toLowerCase().trim();

  const modelMap: Record<string, string> = {
    // === OpenAI ===
    'gpt-3.5': 'gpt-3.5-turbo',
    'gpt-3.5-16k': 'gpt-3.5-turbo-16k',
    'gpt-4': 'gpt-4',
    'gpt-4-32k': 'gpt-4-32k',
    'gpt-4o': 'gpt-4o',
    'gpt-4-turbo': 'gpt-4-turbo',

    // === Moonshot ===
    moonshot: 'moonshot-v1-8k',
    'moonshot-8k': 'moonshot-v1-8k',
    'moonshot-32k': 'moonshot-v1-32k',

    // === DeepSeek ===
    deepseek: 'deepseek-chat',
    'deepseek-coder': 'deepseek-coder',

    // === Kimi（Moonshot）===
    kimi: 'moonshot-v1-8k',

    // === Claude（Anthropic）兼容 OpenAI 接口时的别名 ===
    claude: 'claude-3-opus-20240229',
    'claude-3': 'claude-3-opus-20240229',
    'claude-opus': 'claude-3-opus-20240229',
    'claude-sonnet': 'claude-3-sonnet-20240229',
    'claude-haiku': 'claude-3-haiku-20240307',

    // === MiniMax ===
    minimax: 'abab5.5s-chat',
    'minimax-5.5': 'abab5.5s-chat',
    'minimax-pro': 'abab6-chat',

    // === 通义 Qwen（阿里）===
    qwen: 'qwen-max',
    'qwen-plus': 'qwen-plus',
    'qwen-max': 'qwen-max',
    'qwen-turbo': 'qwen-turbo',

    // === 智谱 AI ===
    glm: 'glm-4',
    'glm-3': 'glm-3-turbo',
    'glm-4': 'glm-4',
    chatglm: 'glm-3-turbo',
    chatglm3: 'glm-3-turbo',
    chatglm4: 'glm-4',

    // === 百川 Baichuan ===
    baichuan: 'baichuan2-53b',
    baichuan2: 'baichuan2-53b',
    'baichuan-13b': 'baichuan2-13b-chat',
    'baichuan-53b': 'baichuan2-53b',

    // === 01.AI（Yi）===
    yi: 'yi-34b-chat',
    'yi-6b': 'yi-6b-chat',
    'yi-34b': 'yi-34b-chat',

    // === 上海 AI 实验室 InternLM ===
    internlm: 'internlm2-chat-20b',
    internlm2: 'internlm2-chat-20b',

    // === Mistral / Mixtral ===
    mistral: 'mistral-7b-instruct',
    mixtral: 'mixtral-8x7b-instruct',

    // === Command R (by Cohere) ===
    'command-r': 'command-r',
    'command-r+': 'command-r-plus',
    'command-r-plus': 'command-r-plus',

    // === Google Gemini（如通过 proxy 接 OpenAI 格式）===
    gemini: 'gemini-pro',
    'gemini-pro': 'gemini-pro',

    // === 豆包（字节）===
    doubao: 'doubao-2', // 通用别名
    'doubao-2': 'doubao-2', // 官方 API 兼容模型
    'doubao-lite': 'doubao-lite',
    'doubao-pro': 'doubao-pro',
  };

  return modelMap[key] || rawModel;
};

/**
 * 测试助手连接是否正常
 */
export const testAssistantConnection = async (assistant: Assistant): Promise<boolean> => {
  try {
    const baseUrl = assistant.url || 'https://api.deepseek.com/v1';
    const apiKey = assistant.key.trim();

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: getModelName(assistant.model),
        messages: [
          {
            role: 'system',
            content: '你是一个 AI 助手，致力于为用户提供安全、准确、有帮助的中文和英文服务。',
          },
          {
            role: 'user',
            content: '测试连接',
          },
        ],
        temperature: 0.3,
      }),
    });

    if (response.ok) {
      message.success('测试连接成功');
      return true;
    } else {
      const json = await response.json().catch(() => null);
      const errMsg = json?.error?.message || response.statusText;
      message.error(`测试连接失败：${errMsg}`);
      return false;
    }
  } catch (err: any) {
    message.error(`测试连接异常：${err.message}`);
    return false;
  }
};

/**
 * 调用助手接口获取响应（支持流式和非流式）
 */
export const callAssistantAPI = async (
  assistant: Assistant,
  messages: Array<{ role: string; content: string }>,
  options: {
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
  } = {},
): Promise<any> => {
  try {
    const baseUrl = assistant.url || 'https://api.deepseek.com/v1';
    const apiKey = assistant.key.trim();

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: getModelName(assistant.model),
        messages,
        stream: options.stream ?? false,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.max_tokens,
      }),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => null);
      const errMsg = json?.error?.message || response.statusText;
      throw new Error(`助手 API 调用失败：${errMsg}`);
    }

    if (options.stream) {
      return response.body?.getReader(); // 由上层组件处理事件流
    }

    return await response.json();
  } catch (error: any) {
    message.error(error.message || '调用助手API失败');
    throw error;
  }
};
