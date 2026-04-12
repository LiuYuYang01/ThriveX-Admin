import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Card, Skeleton } from 'antd';
import { AiOutlineSetting } from 'react-icons/ai';
import { BiGlobe, BiLayout, BiShieldQuarter, BiUser } from 'react-icons/bi';

import Title from '@/components/Title';
import My from './components/My';
import System from './components/System';
import Theme from './components/Theme';
import Web from './components/Web';
import Other from './components/Other';

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
      description: '配置网站主题风格',
      icon: <BiLayout className={iconSty} />,
      key: 'theme',
    },
    {
      title: '个人配置',
      description: '配置个人信息等',
      icon: <BiUser className={iconSty} />,
      key: 'my',
    },
    {
      title: '其他设置',
      description: '杂七八乱的各种配置',
      icon: <AiOutlineSetting className={iconSty} />,
      key: 'other',
    },
  ];

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return (
      <div>
        {/* Title 骨架屏 */}
        <Card className="[&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5! mb-2">
          <Skeleton.Input active size="large" style={{ width: 150, height: 32 }} />
        </Card>

        <Card className="border-stroke mt-2 min-h-[calc(100vh-160px)] [&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5!">
          <div className="flex flex-col md:flex-row">
            {/* 左侧菜单骨架屏 */}
            <ul className="w-full md:w-[20%] md:mr-5 mb-10 md:mb-0 border-b-0 md:border-r border-stroke dark:border-strokedark divide-y divide-solid divide-[#F6F6F6] dark:divide-strokedark">
              {[1, 2, 3, 4, 5].map((item) => (
                <li key={item} className="p-3 pl-5">
                  <div className="flex items-center mb-2">
                    <Skeleton.Avatar active size={20} shape="square" style={{ marginRight: 8 }} />
                    <Skeleton.Input active size="small" style={{ width: 100, height: 20 }} />
                  </div>
                  <Skeleton.Input active size="small" style={{ width: 120, height: 16 }} />
                </li>
              ))}
            </ul>

            {/* 右侧内容骨架屏 */}
            <div className="w-full md:w-[80%] px-0 md:px-8 mt-4">
              <Skeleton active paragraph={{ rows: 8 }} />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Title value="系统配置" />

      <Card className="border-stroke mt-2 min-h-[calc(100vh-160px)]">
        <div className="flex flex-col md:flex-row">
          <ul className="w-full md:w-[20%] md:mr-5 mb-10 md:mb-0 border-b-0 md:border-r border-stroke dark:border-strokedark divide-y divide-solid divide-[#F6F6F6] dark:divide-strokedark">
            {list.map((item) => (
              <li key={item.key} className={`relative p-3 pl-5 before:content-[''] before:absolute before:top-1/2 before:left-0 before:-translate-y-1/2 before:w-[3.5px] before:h-[0%] before:bg-primary cursor-pointer transition-all ${active === item.key ? 'bg-[#f7f7f8] dark:bg-[#3c5370] before:h-full' : ''}`} onClick={() => handleTabClick(item.key)}>
                <h3 className="flex items-center text-base dark:text-white">
                  {item.icon} {item.title}
                </h3>

                <p className="text-[13px] text-gray-500 mt-1">{item.description}</p>
              </li>
            ))}
          </ul>

          <div className="w-full md:w-[80%] px-0 md:px-8">
            {active === 'system' && <System />}
            {active === 'web' && <Web />}
            {active === 'theme' && <Theme />}
            {active === 'my' && <My />}
            {active === 'other' && <Other />}
          </div>
        </div>
      </Card>
    </div>
  );
};
