// 网站配置类型
export type WebConfigType = 'web' | 'theme' | 'other' | 'file';

/** 上传图片压缩策略（与七牛 pfop mode 对齐） */
export type UploadCompressMode = 'original' | 'auto' | 'light' | 'medium' | 'strong';

export const UPLOAD_COMPRESS_MODE_OPTIONS: { value: UploadCompressMode; label: string; description: string }[] = [
  { value: 'original', label: '原图', description: '不压缩，保留原始画质与元数据' },
  { value: 'auto', label: '自适应', description: '按图片体积自动选择压缩强度（推荐）' },
  { value: 'light', label: '高清', description: '轻量压缩，画质优先' },
  { value: 'medium', label: '均衡', description: '体积与画质平衡' },
  { value: 'strong', label: '强力', description: '优先减小体积' },
];

export const DEFAULT_FILE_CONFIG: FileConfig = {
  upload_compress_mode: 'auto',
};

// 文件与存储配置
export interface FileConfig {
  upload_compress_mode: UploadCompressMode;
}

export interface Social {
  name: string;
  url: string;
}

// 系统信息
export interface System {
  osName: string;
  osVersion: string;
  totalMemory: number;
  availableMemory: number;
  memoryUsage: number;
}

// 网站信息
export interface Web {
  url: string;
  title: string;
  subhead: string;
  favicon: string;
  description: string;
  keyword: string;
  footer: string;
  icp?: string;
  create_time?: number;
}

export type ArticleLayout = 'classics' | 'card' | 'waterfall' | '';
export type RightSidebar = 'author' | 'hotArticle' | 'randomArticle' | 'newComments';

// 主题配置
export interface Theme {
  is_article_layout: string;
  right_sidebar: string[];
  light_logo: string;
  dark_logo: string;
  swiper_image: string;
  swiper_text: string[];
  reco_article: number[];
  social: string[];
  covers: string[];
  record_name: string;
  record_info: string;
}

// 其他配置
export interface Other {
  email: string;
}

/** 通过名称拉取的环境配置（含第三方与地图等） */
export type EnvConfigName =
  | 'baidu_statis'
  | 'baidu_statis_key'
  | 'email'
  | 'gaode_map'
  | 'gaode_coordinate'
  | 'qiniu_storage'
  | 'hcaptcha';

/** 在项目配置「环境配置」表格中隐藏、改由「第三方配置」页表单维护的 name */
export const THIRD_PARTY_ENV_NAMES = [
  'baidu_statis',
  'baidu_statis_key',
  'email',
  'gaode_map',
  'gaode_coordinate',
  'qiniu_storage',
  'hcaptcha',
] as const;
export type ThirdPartyEnvName = (typeof THIRD_PARTY_ENV_NAMES)[number];

export interface BaiduStatisEnvValue {
  site_id: number;
  access_token: string;
}

/** 百度统计前端脚本等使用的 Key */
export interface BaiduStatisKeyEnvValue {
  key: string;
}

/** hCaptcha 人机验证 */
export interface HcaptchaEnvValue {
  key: string;
}

export interface EmailEnvValue {
  host: string;
  port: number;
  password: string;
  username: string;
}

export interface GaodeMapEnvValue {
  key_code: string;
  security_code: string;
}

export interface GaodeCoordinateEnvValue {
  key: string;
}

export interface QiniuStorageEnvValue {
  domain: string;
  zlevel: number;
  root_dir: string;
  end_point: string;
  access_key: string;
  secret_key: string;
  bucket_name: string;
}

export interface Config {
  id: string;
  name: string;
  // value: string,
  value: object;
  notes: string;
}
