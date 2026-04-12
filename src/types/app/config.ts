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

/** 通过名称拉取的环境配置（含第三方与地图等） */
export type EnvConfigName = 'baidu_statis' | 'email' | 'gaode_map' | 'gaode_coordinate' | 'qiniu_storage';

/** 在项目配置「环境配置」表格中隐藏、改由「第三方配置」页表单维护的 name */
export const THIRD_PARTY_ENV_NAMES = ['baidu_statis', 'email', 'gaode_map', 'gaode_coordinate', 'qiniu_storage'] as const;
export type ThirdPartyEnvName = (typeof THIRD_PARTY_ENV_NAMES)[number];

export interface BaiduStatisEnvValue {
  site_id: number;
  access_token: string;
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
