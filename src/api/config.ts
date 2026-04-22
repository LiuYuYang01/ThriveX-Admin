import Request from '@/utils/request';
import { Config, EnvConfigName, Other, Theme, Web, WebConfigType } from '@/types/app/config';

type WebConfigValueMap = {
  web: Web;
  theme: Theme;
  other: Other;
};

// 获取网站配置
export const getWebConfigDataAPI = <T extends WebConfigType>(name: T) =>
  Request<{ value: WebConfigValueMap[T] }>('GET', `/web_config/name/${name}`);

// 修改网站配置
export const editWebConfigDataAPI = <T extends WebConfigType>(name: T, data: WebConfigValueMap[T]) =>
  Request<Config>('PATCH', `/web_config/json/name/${name}`, { data });

// 获取环境配置
export const getEnvConfigDataAPI = (name: EnvConfigName) => Request<Config>('GET', `/env_config/name/${name}`);

// 获取环境配置列表
export const getEnvConfigListAPI = () => Request<Config[]>('GET', `/env_config/list`);

// 更新环境配置
export const updateEnvConfigDataAPI = (data: Config) => Request('PATCH', `/env_config/json/${data.id}`, { data: data.value });

// 根据id获取页面配置
export const getPageConfigDataAPI = (id: number) => Request<Config>('GET', `/page_config/${id}`);

// 根据名称获取页面配置
export const getPageConfigDataByNameAPI = (name: string) => Request<Config>('GET', `/page_config/name/${name}`);

// 获取页面配置列表
export const getPageConfigListAPI = () => Request<Config[]>('GET', `/page_config/list`);

// 更新页面配置
export const updatePageConfigDataAPI = (id: number, data: object) => Request('PATCH', `/page_config/json/${id}`, { data });
