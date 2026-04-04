export type AssistantModelInfo = {
  desc: string;
  label: string;
};

export type AssistantModelTheme = {
  color: string;
  icon: string;
};

/** 预设模型展示信息（可继续扩展） */
export const ASSISTANT_MODEL_INFO_MAP: Record<string, AssistantModelInfo> = {
  'deepseek-chat': {
    desc: '通用聊天模型',
    label: 'DeepSeek Chat',
  },
  'deepseek-reasoner': {
    desc: '多步推理优化模型',
    label: 'DeepSeek Reasoner',
  },
  'moonshot-v1-128k': {
    desc: '长上下文模型，支持128k上下文',
    label: 'Moonshot v1 128k',
  },
  'gpt-4o': {
    desc: '多模态大模型',
    label: 'OpenAI GPT-4o',
  },
  'gpt-3.5-turbo': {
    desc: '轻量快速模型',
    label: 'OpenAI GPT-3.5 Turbo',
  },
  'glm-4': {
    desc: '中文大模型',
    label: '智谱 GLM-4',
  },
  'qwen-turbo': {
    desc: '快速对话模型',
    label: '通义千问 Turbo',
  },
  'ernie-bot': {
    desc: '文心一言大模型',
    label: '百度文心一言大模型',
  },
  'doubao-chat': {
    desc: '字节跳动豆包模型',
    label: '豆包 Chat',
  },
};

const ASSISTANT_MODEL_THEME_MAP: Record<string, AssistantModelTheme> = {
  'deepseek-chat': { color: '#1890ff', icon: 'DS' },
  'deepseek-reasoner': { color: '#722ed1', icon: 'DR' },
  'moonshot-v1-128k': { color: '#13c2c2', icon: 'M' },
  'gpt-4o': { color: '#52c41a', icon: 'GPT4' },
  'gpt-3.5-turbo': { color: '#faad14', icon: 'GPT3' },
  'glm-4': { color: '#eb2f96', icon: 'GLM' },
  'qwen-turbo': { color: '#f5222d', icon: 'QW' },
  'ernie-bot': { color: '#fa8c16', icon: 'EB' },
  'doubao-chat': { color: '#2f54eb', icon: 'DB' },
};

const DEFAULT_MODEL_THEME: AssistantModelTheme = { color: '#8c8c8c', icon: 'AI' };

export function getAssistantModelTheme(model: string): AssistantModelTheme {
  return ASSISTANT_MODEL_THEME_MAP[model] ?? DEFAULT_MODEL_THEME;
}
