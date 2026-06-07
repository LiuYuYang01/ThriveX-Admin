import deepseekLogo from './assets/deepseek.svg';
import qwenLogo from './assets/qwen.svg';
import glmLogo from './assets/glm.webp';
import ernieLogo from './assets/ernie.png';
import doubaoLogo from './assets/doubao.png';
import defaultLogo from './assets/default.svg';

export type AssistantProviderInfo = {
  desc: string;
  label: string;
  /** OpenAI 兼容接口基地址（不含 /chat/completions） */
  apiUrl: string;
};

export type AssistantModelTheme = {
  bgClass: string;
  textClass: string;
  icon: string;
  logo?: string;
  logoShape?: 'avatar' | 'default';
};

/** 预设服务商（面向文本创作与长文写作场景） */
export const ASSISTANT_PROVIDER_MAP: Record<string, AssistantProviderInfo> = {
  'deepseek-v3': {
    desc: 'DeepSeek 文本模型，中文写作与多轮改写表现优异，适合博客创作与长文生成',
    label: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1',
  },
  'qwen-max': {
    desc: '通义千问旗舰文本模型，擅长中文长文创作、文案撰写与内容润色',
    label: '通义千问',
    apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
  'glm-4-long': {
    desc: '智谱超长文本模型，支持百万字级上下文，适合长篇文章写作与深度编辑',
    label: '智谱 GLM',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4',
  },
  'ernie-4.5-turbo-128k': {
    desc: '文心一言长文本模型，擅长中文写作、内容改写与多轮对话式编辑',
    label: '文心一言',
    apiUrl: 'https://qianfan.baidubce.com/v2',
  },
  'doubao-pro-128k': {
    desc: '豆包长文本模型，适合新媒体文章、标题摘要与批量内容生成',
    label: '豆包',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  },
};

/** @deprecated 使用 ASSISTANT_PROVIDER_MAP */
export const ASSISTANT_MODEL_INFO_MAP = ASSISTANT_PROVIDER_MAP;

export const ASSISTANT_PROVIDER_LIST = Object.entries(ASSISTANT_PROVIDER_MAP).map(([id, info]) => ({
  id,
  ...info,
}));

const ASSISTANT_MODEL_THEME_MAP: Record<string, AssistantModelTheme> = {
  'deepseek-v3': {
    bgClass: 'bg-blue-100 dark:bg-blue-900/40',
    textClass: 'text-blue-600 dark:text-blue-400',
    icon: 'DS',
    logo: deepseekLogo,
  },
  'qwen-max': {
    bgClass: 'bg-red-100 dark:bg-red-900/40',
    textClass: 'text-red-600 dark:text-red-400',
    icon: 'QW',
    logo: qwenLogo,
  },
  'glm-4-long': {
    bgClass: 'bg-pink-100 dark:bg-pink-900/40',
    textClass: 'text-pink-600 dark:text-pink-400',
    icon: 'GLM',
    logo: glmLogo,
    logoShape: 'avatar',
  },
  'ernie-4.5-turbo-128k': {
    bgClass: 'bg-amber-100 dark:bg-amber-900/40',
    textClass: 'text-amber-600 dark:text-amber-400',
    icon: 'EB',
    logo: ernieLogo,
  },
  'doubao-pro-128k': {
    bgClass: 'bg-indigo-100 dark:bg-indigo-900/40',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    icon: 'DB',
    logo: doubaoLogo,
    logoShape: 'avatar',
  },
};

const DEFAULT_MODEL_THEME: AssistantModelTheme = {
  bgClass: 'bg-slate-100 dark:bg-slate-800/60',
  textClass: 'text-slate-600 dark:text-slate-400',
  icon: 'AI',
  logo: defaultLogo,
};

export function resolveProviderId(model: string): string {
  const key = model.toLowerCase().trim();
  if (ASSISTANT_PROVIDER_MAP[key]) return key;

  if (key.startsWith('deepseek')) return 'deepseek-v3';
  if (key.startsWith('qwen')) return 'qwen-max';
  if (key.startsWith('glm') || key.startsWith('chatglm')) return 'glm-4-long';
  if (key.startsWith('ernie')) return 'ernie-4.5-turbo-128k';
  if (key.startsWith('doubao')) return 'doubao-pro-128k';

  return key;
}

export function getAssistantProvider(modelOrId: string): AssistantProviderInfo | undefined {
  return ASSISTANT_PROVIDER_MAP[resolveProviderId(modelOrId)];
}

export function getAssistantProviderApiUrl(modelOrId: string): string | undefined {
  return getAssistantProvider(modelOrId)?.apiUrl;
}

export function getAssistantModelTheme(model: string): AssistantModelTheme {
  const themeKey = resolveProviderId(model);
  return ASSISTANT_MODEL_THEME_MAP[themeKey] ?? DEFAULT_MODEL_THEME;
}

export function getAssistantModelLogo(model: string): string {
  return getAssistantModelTheme(model).logo ?? defaultLogo;
}

export function getAssistantModelInfo(model: string): AssistantProviderInfo | undefined {
  return getAssistantProvider(model);
}

export function getAssistantDisplayLabel(model: string): string {
  return getAssistantProvider(model)?.label ?? model;
}
