import { useEffect } from 'react';
import DefaultLayout from '@/layout/DefaultLayout';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

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
import Setup from '@/pages/setup';
import File from '@/pages/file';
import Iterative from '@/pages/iterative';
import Login from '@/pages/login';
import Work from '@/pages/work';
import Draft from '@/pages/draft';
import Decycle from '@/pages/decycle';
import Record from '@/pages/record';
import Storage from '@/pages/storage';
import Assistant from '@/pages/assistant';
import Config from '@/pages/config';

import PageTitle from '../PageTitle';

import { useUserStore } from '@/stores';
import { isCheckTokenAPI } from '@/api/user';
import NotFound from '../NotFound';

export default () => {
  const navigate = useNavigate();
  const store = useUserStore();
  const { pathname } = useLocation();
  const isLoginRoute = pathname === '/login' || pathname === '/auth';

  const routes = [
    { path: '/', title: '仪表盘', component: <Home /> },
    { path: '/create', title: '发挥灵感', component: <Create /> },
    { path: '/create_record', title: '闪念', component: <CreateRecord /> },
    { path: '/draft', title: '草稿箱', component: <Draft /> },
    { path: '/recycle', title: '回收站', component: <Decycle /> },
    { path: '/cate', title: '导航管理', component: <Cate /> },
    { path: '/article', title: '文章管理', component: <Article /> },
    { path: '/record', title: '说说管理', component: <Record /> },
    { path: '/tag', title: '标签管理', component: <Tag /> },
    { path: '/comment', title: '评论管理', component: <Comment /> },
    { path: '/wall', title: '评论管理', component: <Wall /> },
    { path: '/web', title: '网站管理', component: <Web /> },
    { path: '/swiper', title: '轮播图管理', component: <Swiper /> },
    { path: '/footprint', title: '足迹管理', component: <Footprint /> },
    { path: '/storage', title: '存储管理', component: <Storage /> },
    { path: '/setup', title: '项目配置', component: <Setup /> },
    { path: '/file', title: '文件管理', component: <File /> },
    { path: '/iter', title: '项目更新记录', component: <Iterative /> },
    { path: '/work', title: '工作台', component: <Work /> },
    { path: '/assistant', title: '助手管理', component: <Assistant /> },
    { path: '/config', title: '项目配置', component: <Config /> },
  ];

  useEffect(() => {
    // 如果没有token并且不在登录相关页面就强制跳转到登录页
    if (!store.token && !isLoginRoute) return navigate('/login');
  }, [store, isLoginRoute]);

  useEffect(() => {
    console.log(pathname);
    
    if (pathname === '/login') return;
    isCheckTokenAPI();
  }, [pathname]);

  if (isLoginRoute) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <>
              <PageTitle title="ThriveX | 现代化博客管理系统" />
              <Login />
            </>
          }
        />
      </Routes>
    );
  }

  return (
    <DefaultLayout>
      <Routes>
        {routes.map(({ path, title, component }) => (
          <Route
            key={path}
            path={path}
            element={
              <>
                <PageTitle title={`ThriveX - ${title}`} />
                {component}
              </>
            }
          />
        ))}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </DefaultLayout>
  );
};
