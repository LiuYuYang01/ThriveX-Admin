import { useEffect } from 'react';
import DefaultLayout from '@/layout/DefaultLayout';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import Login from '@/pages/login';

import PageTitle from '../PageTitle';

import { useUserStore } from '@/stores';
import NotFound from '../NotFound';
import { routes } from '@/components/RouteList/route';

export default () => {
  const navigate = useNavigate();
  const store = useUserStore();
  const { pathname } = useLocation();
  const isLoginRoute = pathname === '/login' || pathname === '/auth';

  useEffect(() => {
    // 如果没有token并且不在登录相关页面就强制跳转到登录页
    if (!store.token && !isLoginRoute) return navigate('/login');
  }, [store, isLoginRoute]);

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
    </DefaultLayout>
  );
};
