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
import PageConfig from '@/pages/page_config';
import { getFlatRoutes } from '@/config/routes.tsx';

export interface RouteConfig {
  path: string;
  title: string;
  icon?: React.ReactNode;
}

export interface AppRouteItem extends RouteConfig {
  element: React.ReactNode;
}

const componentMap: Record<string, React.ReactNode> = {
  '/': <Home />,
  '/create': <Create />,
  '/create_record': <CreateRecord />,
  '/draft': <Draft />,
  '/recycle': <Decycle />,
  '/cate': <Cate />,
  '/article': <Article />,
  '/record': <Record />,
  '/tag': <Tag />,
  '/comment': <Comment />,
  '/wall': <Wall />,
  '/web': <Web />,
  '/swiper': <Swiper />,
  '/footprint': <Footprint />,
  '/setup/system': <SystemConfig />,
  '/setup/third_party': <ThirdPartyConfig />,
  '/file': <File />,
  '/iter': <Iterative />,
  '/work': <Work />,
  '/assistant': <Assistant />,
  '/page_config': <PageConfig />,
};

const flatRoutes = getFlatRoutes();

export const routes: AppRouteItem[] = flatRoutes.map(({ path, title, icon }) => ({
  path,
  title,
  icon,
  element: componentMap[path] || null,
})).filter((route) => route.element !== null);

const routeConfigMap: Record<string, RouteConfig> = Object.fromEntries(
  routes.map(({ path, title, icon: routeIcon }) => [path, { path, title, icon: routeIcon }]),
);

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
