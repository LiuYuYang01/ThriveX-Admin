import { message } from 'antd';
import { getAssistantProviderApiUrl } from '@/pages/assistant/modelConfig';
import { Assistant } from '@/types/app/assistant';

function resolveBaseUrl(assistant: Assistant): string {
  return assistant.url || getAssistantProviderApiUrl(assistant.model) || 'https://api.deepseek.com/v1';
}

/**
 * 将用户输入的通用模型名（不区分大小写）映射为实际 API 使用的模型名
 */
export const getModelName = (rawModel: string): string => {
  const key = rawModel.toLowerCase().trim();

  const modelMap: Record<string, string> = {
    deepseek: 'deepseek-chat',
    'deepseek-v3': 'deepseek-chat',
    qwen: 'qwen-max',
    'qwen-max': 'qwen-max',
    glm: 'glm-4-long',
    'glm-4': 'glm-4-long',
    'glm-4-plus': 'glm-4-long',
    'glm-4-long': 'glm-4-long',
    ernie: 'ernie-4.5-turbo-128k',
    'ernie-4.5': 'ernie-4.5-turbo-128k',
    'ernie-4.5-turbo-128k': 'ernie-4.5-turbo-128k',
    doubao: 'doubao-pro-128k',
    'doubao-pro': 'doubao-pro-128k',
    'doubao-pro-128k': 'doubao-pro-128k',
  };

  return modelMap[key] || rawModel;
};

/**
 * 测试助手连接是否正常
 */
export const testAssistantConnection = async (assistant: Assistant): Promise<boolean> => {
  try {
    const baseUrl = resolveBaseUrl(assistant);
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
  } catch (error) {
    console.error(`测试连接异常：${error}`);
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
): Promise<ReadableStreamDefaultReader<Uint8Array>> => {
  try {
    const baseUrl = resolveBaseUrl(assistant);
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
  } catch (error) {
    console.error(error);
    throw error;
  }
};
