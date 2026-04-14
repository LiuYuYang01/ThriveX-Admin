import { useState, useEffect, useRef } from 'react';
import InfoCard from './components/Info';
import Stats from './components/Stats';
import Skeleton from './Skeleton';
import SystemNotification, { shouldShowLoginNotification } from '@/components/SystemNotification';

export default () => {
  const [showNotification, setShowNotification] = useState(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);

  useEffect(() => {
    // 检查是否需要显示登录通知
    if (shouldShowLoginNotification()) {
      setShowNotification(true);
    }

    // 模拟初始加载，等待子组件加载完成
    if (isFirstLoadRef.current) {
      const timer = setTimeout(() => {
        setInitialLoading(false);
        isFirstLoadRef.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div>
      {initialLoading ? (
        <Skeleton />
      ) : (
        <>
          <InfoCard />
          <Stats />
        </>
      )}

      <SystemNotification open={showNotification} onClose={() => setShowNotification(false)} />
    </div>
  );
};
