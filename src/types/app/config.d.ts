// 网站配置类型
export type WebConfigType = 'web' | 'theme' | 'other';

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
  reco_article: string[];
  social: string[];
  covers: string[];
  record_name: string;
  record_info: string;
}

// 其他配置
export interface Other {
  email: string;
}

export type EnvConfigName =
  | 'baidu_statis'
  | 'baidu_statis_key'
  | 'email'
  | 'gaode_map'
  | 'gaode_coordinate'
  | 'qiniu_storage'
  | 'hcaptcha';

export interface Config {
  id: string;
  name: string;
  // value: string,
  value: object;
  notes: string;
}
