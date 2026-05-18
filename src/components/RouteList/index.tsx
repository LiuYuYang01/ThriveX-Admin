import { useEffect, useRef, useState } from 'react';
import Layout from '@/layout/Layout';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';

import Login from '@/pages/login';

import PageTitle from '../PageTitle';

import { useUserStore } from '@/stores';
import NotFound from '../NotFound';
import { routes } from '@/components/RouteList/route';
import SetupInitializePage from '@/pages/initialize';
import { getSystemInitStatusAPI } from '@/api/initialize';

export default () => {
  const navigate = useNavigate();
  const store = useUserStore();
  const { pathname } = useLocation();
  const isLoginRoute = pathname === '/login' || pathname === '/auth';
  const [initLoading, setInitLoading] = useState(true);
  const [projectInitialized, setProjectInitialized] = useState(false);
  const hasCheckedInitStatus = useRef(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // 如果没有token并且不在登录相关页面就强制跳转到登录页
    if (!store.token && !isLoginRoute) return navigate('/login');
  }, [store, isLoginRoute]);

  useEffect(() => {
    // 当 token 变化时，重置检查状态，以便重新检查初始化状态
    hasCheckedInitStatus.current = false;
    hasRedirected.current = false;
  }, [store.token]);

  useEffect(() => {
    // 如果已经检查过初始化状态，则不再重复检查
    if (hasCheckedInitStatus.current) {
      return;
    }

    const loadSystemInitStatus = async () => {
      // 没有 token 时，不需要检查初始化状态
      if (!store.token) {
        setInitLoading(false);
        hasCheckedInitStatus.current = true;
        return;
      }

      setInitLoading(true);
      try {
        const { data } = await getSystemInitStatusAPI();
        const isInitialized = data?.is_system_init ?? false;
        setProjectInitialized(isInitialized);
      } catch (error) {
        console.error(error);
        setProjectInitialized(false);
      } finally {
        setInitLoading(false);
        hasCheckedInitStatus.current = true;
      }
    };

    loadSystemInitStatus();
  }, [store.token, navigate]);

  useEffect(() => {
    // 当初始化状态检查完成且系统已初始化时，跳转到首页
    // 只在首次检查完成时跳转一次
    if (!initLoading && projectInitialized && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/', { replace: true });
    }
  }, [initLoading, projectInitialized, navigate]);

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

  if (initLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!projectInitialized) {
    return (
      <Routes>
        <Route
          path="/initialize"
          element={
            <>
              <PageTitle title="ThriveX - 项目初始化" />
              <SetupInitializePage />
            </>
          }
        />
        <Route path="*" element={<Navigate to="/initialize" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        {routes.map(({ path, title, element }) => (
          <Route
            key={path}
            path={path}
            element={
              <>
                <PageTitle title={`ThriveX - ${title}`} />
                {element}
              </>
            }
          />
        ))}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};
