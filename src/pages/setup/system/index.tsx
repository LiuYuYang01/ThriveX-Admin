import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Card, Typography } from 'antd';
import { BiGlobe, BiLayout, BiShieldQuarter, BiUser } from 'react-icons/bi';

import Title from '@/components/Title';
import My from './components/My';
import System from './components/System';
import Theme from './components/Theme';
import Web from './components/Web';
import Other from './components/Other';
import SystemSetupSkeleton from './Skeleton';

interface Setup {
  title: string;
  description: string;
  icon: React.ReactNode;
  key: string;
}

export default () => {
  const [params, setParams] = useSearchParams();
  const tabFromUrl = params.get('tab');
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);

  // 验证 tab 值是否有效，有效配置项的 key 列表
  const validKeys = ['system', 'web', 'theme', 'my', 'other'];
  const initialActive = tabFromUrl && validKeys.includes(tabFromUrl) ? tabFromUrl : 'system';

  const [active, setActive] = useState(initialActive);

  // 模拟加载完成
  useEffect(() => {
    if (isFirstLoadRef.current) {
      const timer = setTimeout(() => {
        setInitialLoading(false);
        isFirstLoadRef.current = false;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  // 监听 URL 参数变化，更新激活的 tab
  useEffect(() => {
    if (tabFromUrl && validKeys.includes(tabFromUrl)) {
      setActive(tabFromUrl);
    }
  }, [tabFromUrl]);

  // 处理配置项点击，同时更新状态和 URL
  const handleTabClick = (key: string) => {
    setActive(key);
    setParams({ tab: key });
  };

  const iconSty = 'w-5 h-8 mr-1';

  const list: Setup[] = [
    {
      title: '账户配置',
      description: '配置管理员账号、密码等',
      icon: <BiShieldQuarter className={iconSty} />,
      key: 'system',
    },
    {
      title: '网站配置',
      description: '配置网站标题、LOGO、描述、SEO等',
      icon: <BiGlobe className={iconSty} />,
      key: 'web',
    },
    {
      title: '主题配置',
      description: '配置网站主题，如 LOGO、背景图、打字机文本等',
      icon: <BiLayout className={iconSty} />,
      key: 'theme',
    },
    {
      title: '个人配置',
      description: '配置个人信息，如头像、昵称、邮箱等',
      icon: <BiUser className={iconSty} />,
      key: 'my',
    },
    // {
    //   title: '其他设置',
    //   description: '杂七八乱的各种配置',
    //   icon: <AiOutlineSetting className={iconSty} />,
    //   key: 'other',
    // },
  ];

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return <SystemSetupSkeleton />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title value="系统配置" />

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-2 lg:grid-cols-12">
        {/* 左侧列表 */}
        <Card className="lg:col-span-3 rounded-xl! overflow-hidden border-none shadow-none dark:bg-boxdark" styles={{ body: { padding: 0 } }}>
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-strokedark">
            {list.map((item) => {
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleTabClick(item.key)}
                  className={`group relative flex items-center gap-3 p-4 text-left transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/5 ${isActive ? 'bg-primary/5 dark:bg-primary/10' : 'bg-transparent'
                    } cursor-pointer`}
                >
                  {/* 激活指示条 */}
                  {isActive && <div className="absolute left-0 top-0 h-full w-1 bg-primary" />}

                  {/* 图标 */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-gray-50 text-gray-400 dark:bg-white/5 dark:text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'
                      }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                  </div>

                  <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex items-center justify-between">
                      <Typography.Text
                        strong
                        className={`text-xl transition-colors ${isActive ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        ellipsis
                      >
                        {item.title}
                      </Typography.Text>
                      {isActive && (
                        <div className="relative flex h-2.5 w-2.5 mr-1">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        </div>
                      )}
                    </div>
                    <Typography.Text
                      type="secondary"
                      className="text-xs mt-1"
                      ellipsis
                    >
                      {item.description}
                    </Typography.Text>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* 右侧内容 */}
        <Card className="lg:col-span-9 rounded-xl! flex flex-col border-none shadow-none dark:bg-boxdark overflow-y-scroll!" styles={{ body: { padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } }}>
          {active === 'system' && <System />}
          {active === 'web' && <Web />}
          {active === 'theme' && <Theme />}
          {active === 'my' && <My />}
          {active === 'other' && <Other />}
        </Card>
      </div>
    </div>
  );
};
