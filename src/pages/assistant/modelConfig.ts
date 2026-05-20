export type AssistantModelInfo = {
  desc: string;
  label: string;
};

export type AssistantModelTheme = {
  /** Tailwind 背景类 */
  bgClass: string;
  /** Tailwind 文字类 */
  textClass: string;
  icon: string;
};

/** 预设模型展示信息（可继续扩展） */
export const ASSISTANT_MODEL_INFO_MAP: Record<string, AssistantModelInfo> = {
  'deepseek-v3': {
    desc: 'DeepSeek最新一代通用大模型，擅长创意写作、文案撰写和长文本生成',
    label: 'DeepSeek V3',
  },
  'qwen-max': {
    desc: '通义千问旗舰模型，擅长文学创作、商业文案和故事写作',
    label: '通义千问 Max',
  },
  'glm-4-plus': {
    desc: '智谱最新旗舰模型，擅长文章写作、创意文案和诗歌创作',
    label: '智谱 GLM-4 Plus',
  },
  'ernie-4.5': {
    desc: '百度文心一言旗舰模型，擅长中文写作、诗词创作和文案策划',
    label: '文心一言 4.5',
  },
  'doubao-pro': {
    desc: '字节跳动豆包旗舰模型，擅长新媒体写作、短视频文案和创意写作',
    label: '豆包 Pro',
  },
};

const ASSISTANT_MODEL_THEME_MAP: Record<string, AssistantModelTheme> = {
  'deepseek-v3': { bgClass: 'bg-blue-100 dark:bg-blue-900/40', textClass: 'text-blue-600 dark:text-blue-400', icon: 'DS' },
  'qwen-max': { bgClass: 'bg-red-100 dark:bg-red-900/40', textClass: 'text-red-600 dark:text-red-400', icon: 'QW' },
  'glm-4-plus': { bgClass: 'bg-pink-100 dark:bg-pink-900/40', textClass: 'text-pink-600 dark:text-pink-400', icon: 'GLM' },
  'kimi-k1.5': { bgClass: 'bg-emerald-100 dark:bg-emerald-900/40', textClass: 'text-emerald-600 dark:text-emerald-400', icon: 'K' },
  'ernie-4.5': { bgClass: 'bg-amber-100 dark:bg-amber-900/40', textClass: 'text-amber-600 dark:text-amber-400', icon: 'EB' },
  'doubao-pro': { bgClass: 'bg-indigo-100 dark:bg-indigo-900/40', textClass: 'text-indigo-600 dark:text-indigo-400', icon: 'DB' },
};

const DEFAULT_MODEL_THEME: AssistantModelTheme = {
  bgClass: 'bg-slate-100 dark:bg-slate-800/60',
  textClass: 'text-slate-600 dark:text-slate-400',
  icon: 'AI',
};

export function getAssistantModelTheme(model: string): AssistantModelTheme {
  return ASSISTANT_MODEL_THEME_MAP[model] ?? DEFAULT_MODEL_THEME;
}
