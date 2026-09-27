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
// 文章头图风格：slide 轮播大图 / editorial 杂志编辑风
export type ArticleHeroStyle = 'slide' | 'editorial';
// 菜单栏布局：classic 经典通栏 / capsule 悬浮胶囊
export type HeaderLayout = 'classic' | 'capsule';

// 主题配置
export interface Theme {
  is_article_layout: string;
  // 文章头图风格，默认 slide
  article_hero?: ArticleHeroStyle;
  // 菜单栏布局，默认 classic
  header_layout?: HeaderLayout;
  right_sidebar: string[];
  light_logo: string;
  dark_logo: string;
  swiper_image: string;
  swiper_text: string[];
  reco_article: number[];
  social: string[];
  covers: string[];
  record_name: string;
  record_avatar?: string;
  record_cover?: string;
  record_info?: string;
  record_mode?: string;
  record_mode_info?: string;
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
  | 'gaode_map_key'
  | 'gaode_coordinate'
  | 'qiniu_storage'
  | 'local_storage'
  | 'backup_storage'
  | 'hcaptcha_key';

/** 在项目配置「环境配置」表格中隐藏、改由「第三方配置」页表单维护的 name */
export const THIRD_PARTY_ENV_NAMES = [
  'baidu_statis',
  'baidu_statis_key',
  'email',
  'gaode_map_key',
  'gaode_coordinate',
  'qiniu_storage',
  'local_storage',
  'backup_storage',
  'hcaptcha_key',
] as const;
export type ThirdPartyEnvName = (typeof THIRD_PARTY_ENV_NAMES)[number];

export interface BaiduStatisEnvValue {
  site_id: number;
  access_token: string;
  /** 长期刷新凭证，配置后 token 自动续期，无需手动更换 */
  refresh_token: string;
  /** 百度统计数据导出应用的 ApiKey */
  client_id: string;
  /** 百度统计数据导出应用的 SecretKey */
  client_secret: string;
}

/** 百度统计前端脚本等使用的 Key */
export interface BaiduStatisKeyEnvValue {
  key: string;
}

/** hCaptcha 人机验证 */
export interface HcaptchaEnvValue {
  /** 功能开关：开启后前端渲染验证码、后端强制校验 */
  enabled: boolean;
  /** 站点密钥（公钥），下发前端渲染验证组件 */
  key: string;
  /** 服务端校验密钥（私钥），用于 siteverify 接口 */
  secret: string;
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
  root_dir: string;
  end_point: string;
  access_key: string;
  secret_key: string;
  bucket_name: string;
}

/** 文件存储方式：本地磁盘 / 七牛云 */
export type StorageType = 'local' | 'qiniu';

export interface StorageEnvValue {
  type: StorageType;
  /** 本地存储的访问域名（server 后端地址），用于拼接 /static/upload/ 资源链接 */
  domain: string;
}

export const DEFAULT_STORAGE_ENV_VALUE: StorageEnvValue = {
  type: 'local',
  domain: '',
};

/** 数据库备份存储方式 */
export type BackupStorageType = 'local' | 'qiniu';

/** 数据库备份存储与定时备份 */
export interface BackupStorageEnvValue {
  type: BackupStorageType;
  /** 七牛私有桶名称（密钥复用 qiniu_storage 的 AK/SK） */
  bucket_name: string;
  /** 私有桶绑定的下载域名 */
  domain: string;
  /** 定时备份开关 */
  enabled: boolean;
  /** 定时备份 cron 表达式（Spring cron） */
  cron: string;
  /** 定时备份保留份数，0 为不清理 */
  retain_count: number;
}

export interface Config {
  id: string;
  name: string;
  // value: string,
  value: object;
  notes: string;
}
