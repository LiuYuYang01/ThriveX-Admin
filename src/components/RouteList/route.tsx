import { BiEditAlt, BiFolderOpen, BiHomeSmile, BiSliderAlt, BiCategoryAlt, BiBug, BiPlug } from 'react-icons/bi';
import { TbBrandAirtable } from 'react-icons/tb';
import React from 'react';

import Home from '@/pages/dashboard';
import Create from '@/pages/create';
import CreateRecord from '@/pages/create_record';
import Cate from '@/pages/cate';
import Article from '@/pages/article';
import Comment from '@/pages/comment';
import Wall from '@/pages/wall';
import Tag from '@/pages/tag';
import Web from '@/pages/web';
import Swiper from '@/pages/swiper';
import Footprint from '@/pages/footprint';
import SystemConfig from '@/pages/setup/system';
import ThirdPartyConfig from '@/pages/setup/third_party';
import File from '@/pages/file';
import Iterative from '@/pages/iterative';
import Work from '@/pages/work';
import Draft from '@/pages/draft';
import Decycle from '@/pages/decycle';
import Record from '@/pages/record';
import Assistant from '@/pages/assistant';
import Config from '@/pages/config';

// 路由配置接口
export interface RouteConfig {
  path: string;
  title: string;
  icon?: React.ReactNode;
}

export interface AppRouteItem extends RouteConfig {
  element: React.ReactNode;
}

/** 应用内业务路由（顺序即注册顺序；标题与侧边栏/标签页一致） */
export const routes: AppRouteItem[] = [
  { path: '/', title: '仪表盘', icon: <BiHomeSmile className="text-base" />, element: <Home /> },
  { path: '/create', title: '发挥灵感', icon: <BiEditAlt className="text-base" />, element: <Create /> },
  { path: '/create_record', title: '闪念', icon: <BiEditAlt className="text-base" />, element: <CreateRecord /> },
  { path: '/draft', title: '草稿箱', icon: <BiEditAlt className="text-base" />, element: <Draft /> },
  { path: '/recycle', title: '回收站', icon: <BiEditAlt className="text-base" />, element: <Decycle /> },
  { path: '/cate', title: '分类管理', icon: <BiCategoryAlt className="text-base" />, element: <Cate /> },
  { path: '/article', title: '文章管理', icon: <BiCategoryAlt className="text-base" />, element: <Article /> },
  { path: '/record', title: '说说管理', icon: <BiCategoryAlt className="text-base" />, element: <Record /> },
  { path: '/tag', title: '标签管理', icon: <BiCategoryAlt className="text-base" />, element: <Tag /> },
  { path: '/comment', title: '评论管理', icon: <BiCategoryAlt className="text-base" />, element: <Comment /> },
  { path: '/wall', title: '留言管理', icon: <BiCategoryAlt className="text-base" />, element: <Wall /> },
  { path: '/web', title: '网站管理', icon: <BiCategoryAlt className="text-base" />, element: <Web /> },
  { path: '/swiper', title: '轮播图管理', icon: <BiCategoryAlt className="text-base" />, element: <Swiper /> },
  { path: '/footprint', title: '足迹管理', icon: <BiCategoryAlt className="text-base" />, element: <Footprint /> },
  { path: '/setup/system', title: '系统配置', icon: <BiSliderAlt className="text-base" />, element: <SystemConfig /> },
  { path: '/setup/third_party', title: '第三方配置', icon: <BiPlug className="text-base" />, element: <ThirdPartyConfig /> },
  { path: '/file', title: '文件管理', icon: <BiFolderOpen className="text-base" />, element: <File /> },
  { path: '/iter', title: '项目更新记录', icon: <BiBug className="text-base" />, element: <Iterative /> },
  { path: '/work', title: '工作台', icon: <TbBrandAirtable className="text-base" />, element: <Work /> },
  { path: '/assistant', title: '助手管理', icon: <BiCategoryAlt className="text-base" />, element: <Assistant /> },
  { path: '/config', title: '项目配置', icon: <BiCategoryAlt className="text-base" />, element: <Config /> },
];

const routeConfigMap: Record<string, RouteConfig> = Object.fromEntries(
  routes.map(({ path, title, icon: routeIcon }) => [path, { path, title, icon: routeIcon }]),
);

/**
 * 根据路径获取路由配置
 */
export const getRouteConfig = (pathname: string): RouteConfig | null => {
  if (routeConfigMap[pathname]) {
    return routeConfigMap[pathname];
  }

  for (const [path, config] of Object.entries(routeConfigMap)) {
    if (pathname.startsWith(path) && path !== '/') {
      return config;
    }
  }

  return null;
};
