/**
 * 统一获取环境变量工具
 * 容器运行时从import.meta.env获取
 * 镜像运行时从window.ENV获取
 */

export const getEnvVar = (key: string): string => {
  // 优先从window.ENV获取
  if (window.ENV && window.ENV[key]) {
    return window.ENV[key] || '';
  }
  
  // 默认从import.meta.env获取
  return import.meta.env[key as keyof ImportMetaEnv] || '';
};