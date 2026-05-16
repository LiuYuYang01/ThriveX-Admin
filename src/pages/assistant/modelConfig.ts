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
  }
};

const ASSISTANT_MODEL_THEME_MAP: Record<string, AssistantModelTheme> = {
  'deepseek-v3': { color: '#1890ff', icon: 'DS' },
  'qwen-max': { color: '#f5222d', icon: 'QW' },
  'glm-4-plus': { color: '#eb2f96', icon: 'GLM' },
  'kimi-k1.5': { color: '#00b96b', icon: 'K' },
  'ernie-4.5': { color: '#fa8c16', icon: 'EB' },
  'doubao-pro': { color: '#2f54eb', icon: 'DB' },
};

const DEFAULT_MODEL_THEME: AssistantModelTheme = { color: '#8c8c8c', icon: 'AI' };

export function getAssistantModelTheme(model: string): AssistantModelTheme {
  return ASSISTANT_MODEL_THEME_MAP[model] ?? DEFAULT_MODEL_THEME;
}
