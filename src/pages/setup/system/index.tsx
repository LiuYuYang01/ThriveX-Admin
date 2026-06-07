import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { BiGlobe, BiLayout, BiShieldQuarter, BiUser } from 'react-icons/bi';

import Title from '@/components/Title';
import My from './components/My';
import System from './components/System';
import Theme from './components/Theme';
import Web from './components/Web';
import Other from './components/Other';
import Skeleton from './Skeleton';

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

  const validKeys = ['system', 'web', 'theme', 'my', 'other'];
  const initialActive = tabFromUrl && validKeys.includes(tabFromUrl) ? tabFromUrl : 'system';

  const [active, setActive] = useState(initialActive);

  useEffect(() => {
    if (isFirstLoadRef.current) {
      const timer = setTimeout(() => {
        setInitialLoading(false);
        isFirstLoadRef.current = false;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (tabFromUrl && validKeys.includes(tabFromUrl)) {
      setActive(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabClick = (key: string) => {
    setActive(key);
    setParams({ tab: key });
  };

  const list: Setup[] = [
    {
      title: '账户配置',
      description: '管理员账号、密码与权限设置',
      icon: <BiShieldQuarter />,
      key: 'system',
    },
    {
      title: '网站配置',
      description: '站点标题、LOGO、描述与 SEO 优化',
      icon: <BiGlobe />,
      key: 'web',
    },
    {
      title: '主题配置',
      description: '背景图、打字机文本与布局风格',
      icon: <BiLayout />,
      key: 'theme',
    },
    {
      title: '个人配置',
      description: '头像、昵称、邮箱与社交信息',
      icon: <BiUser />,
      key: 'my',
    },
  ];

  if (initialLoading) {
    return <Skeleton />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title value="系统配置" />

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-y-2 lg:grid-cols-12">
        <div className="lg:col-span-3 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col p-2 gap-0.5">
              {list.map((item) => {
                const isActive = active === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleTabClick(item.key)}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isActive
                        ? 'bg-primary/8 dark:bg-primary/15'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                    } cursor-pointer`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-primary" />
                    )}

                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-400 dark:bg-white/8 dark:text-gray-500 group-hover:text-gray-600'
                      }`}
                    >
                      <span className="text-[15px]">{item.icon}</span>
                    </div>

                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span
                        className={`truncate text-sm font-medium transition-colors ${
                          isActive ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="truncate text-xs text-gray-400 dark:text-gray-500">{item.description}</span>
                    </div>

                    {isActive && (
                      <div className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-strokedark dark:bg-boxdark lg:mx-2">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-strokedark">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800 dark:text-white">
                {list.find((i) => i.key === active)?.title}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {active === 'system' && <System />}
            {active === 'web' && <Web />}
            {active === 'theme' && <Theme />}
            {active === 'my' && <My />}
            {active === 'other' && <Other />}
          </div>
        </div>
      </div>
    </div>
  );
};
