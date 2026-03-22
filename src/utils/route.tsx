import { BiEditAlt, BiFolderOpen, BiHomeSmile, BiSliderAlt, BiCategoryAlt, BiBug } from 'react-icons/bi';
import { TbBrandAirtable } from 'react-icons/tb';
import React from 'react';

// 路由配置接口
export interface RouteConfig {
  path: string;
  title: string;
  icon?: React.ReactNode;
}

// 路由配置映射
const routeConfigMap: Record<string, RouteConfig> = {
  '/': {
    path: '/',
    title: '首页',
    icon: <BiHomeSmile className="text-base" />,
  },
  '/create': {
    path: '/create',
    title: '发挥灵感',
    icon: <BiEditAlt className="text-base" />,
  },
  '/create_record': {
    path: '/create_record',
    title: '闪念',
    icon: <BiEditAlt className="text-base" />,
  },
  '/draft': {
    path: '/draft',
    title: '草稿箱',
    icon: <BiEditAlt className="text-base" />,
  },
  '/recycle': {
    path: '/recycle',
    title: '回收站',
    icon: <BiEditAlt className="text-base" />,
  },
  '/cate': {
    path: '/cate',
    title: '导航管理',
    icon: <BiCategoryAlt className="text-base" />,
  },
  '/article': {
    path: '/article',
    title: '文章管理',
    icon: <BiCategoryAlt className="text-base" />,
  },
  '/record': {
    path: '/record',
    title: '说说管理',
    icon: <BiCategoryAlt className="text-base" />,
  },
  '/tag': {
    path: '/tag',
    title: '标签管理',
    icon: <BiCategoryAlt className="text-base" />,
  },
  '/comment': {
    path: '/comment',
    title: '评论管理',
    icon: <BiCategoryAlt className="text-base" />,
  },
  '/wall': {
    path: '/wall',
    title: '留言管理',
    icon: <BiCategoryAlt className="text-base" />,
  },
  '/web': {
    path: '/web',
    title: '网站管理',
    icon: <BiCategoryAlt className="text-base" />,
  },
  '/swiper': {
    path: '/swiper',
    title: '轮播图管理',
    icon: <BiCategoryAlt className="text-base" />,
  },
  '/footprint': {
    path: '/footprint',
    title: '足迹管理',
    icon: <BiCategoryAlt className="text-base" />,
  },
  // '/storage': {
  //   path: '/storage',
  //   title: '存储管理',
  //   icon: <BiCategoryAlt className="text-base" />,
  // },
  '/setup': {
    path: '/setup',
    title: '项目配置',
    icon: <BiSliderAlt className="text-base" />,
  },
  '/file': {
    path: '/file',
    title: '文件管理',
    icon: <BiFolderOpen className="text-base" />,
  },
  '/iter': {
    path: '/iter',
    title: '项目更新记录',
    icon: <BiBug className="text-base" />,
  },
  '/work': {
    path: '/work',
    title: '工作台',
    icon: <TbBrandAirtable className="text-base" />,
  },
  '/assistant': {
    path: '/assistant',
    title: '助手管理',
    icon: <BiCategoryAlt className="text-base" />,
  },
  '/config': {
    path: '/config',
    title: '项目配置',
    icon: <BiCategoryAlt className="text-base" />,
  },
};

/**
 * 根据路径获取路由配置
 */
export const getRouteConfig = (pathname: string): RouteConfig | null => {
  // 精确匹配
  if (routeConfigMap[pathname]) {
    return routeConfigMap[pathname];
  }

  // 模糊匹配（用于带参数的路由）
  for (const [path, config] of Object.entries(routeConfigMap)) {
    if (pathname.startsWith(path) && path !== '/') {
      return config;
    }
  }

  return null;
};
