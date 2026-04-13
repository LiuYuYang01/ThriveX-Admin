import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { AiOutlineClose } from 'react-icons/ai';
import useTabsStore, { TabItem } from '@/stores/modules/tabs';
import { getRouteConfig } from '@/components/RouteList/route';

export default () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tabs, activeTab, addTab, removeTab, setActiveTab, closeOtherTabs, closeAllTabs } = useTabsStore();
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // 监听路由变化，自动添加标签
  useEffect(() => {
    const pathname = location.pathname;
    const routeConfig = getRouteConfig(pathname);

    if (routeConfig) {
      addTab({
        path: pathname,
        title: routeConfig.title,
      });
      setActiveTab(pathname);
    }
  }, [location.pathname, addTab, setActiveTab]);

  // 检查滚动状态
  const checkScroll = () => {
    if (!tabsContainerRef.current) return;
  };

  useEffect(() => {
    checkScroll();
    const container = tabsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [tabs]);

  // 切换到指定标签
  const handleTabClick = (tab: TabItem) => {
    setActiveTab(tab.path);
    navigate(tab.path);
  };

  const performCloseTab = useCallback(
    (tab: TabItem) => {
      if (tabs.length <= 1) {
        return;
      }

      const currentIndex = tabs.findIndex((t) => t.path === tab.path);
      const isActiveTab = activeTab === tab.path;

      if (isActiveTab) {
        let newActivePath = '/';

        if (currentIndex > 0) {
          newActivePath = tabs[currentIndex - 1].path;
        } else if (tabs.length > 1) {
          newActivePath = tabs[1].path;
        }

        navigate(newActivePath);
      }

      removeTab(tab.path);
    },
    [tabs, activeTab, navigate, removeTab],
  );

  const handleCloseTab = (e: React.MouseEvent, tab: TabItem) => {
    e.stopPropagation();
    performCloseTab(tab);
  };

  const getContextMenuProps = (tab: TabItem): MenuProps => ({
    items: [
      { key: 'close', label: '关闭当前', disabled: tabs.length <= 1 },
      { key: 'closeOthers', label: '关闭其他', disabled: tabs.length <= 1 },
      { key: 'closeAll', label: '关闭所有' },
    ],
    onClick: ({ key, domEvent }) => {
      domEvent?.stopPropagation();
      if (key === 'close') {
        performCloseTab(tab);
      } else if (key === 'closeOthers') {
        if (tabs.length <= 1) return;
        closeOtherTabs(tab.path);
        navigate(tab.path);
      } else if (key === 'closeAll') {
        closeAllTabs();
        navigate('/');
      }
    },
  });

  // 获取标签图标
  const getTabIcon = (path: string) => {
    const routeConfig = getRouteConfig(path);
    return routeConfig?.icon || null;
  };

  return (
    <div className="relative flex items-center">
      {/* 标签容器 */}
      <div ref={tabsContainerRef} className="flex-1 flex items-center" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex items-center h-10">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.path;
            const icon = getTabIcon(tab.path);

            return (
              <Dropdown key={tab.path} trigger={['contextMenu']} menu={getContextMenuProps(tab)}>
                <div
                  onClick={() => handleTabClick(tab)}
                  className={`
                  relative flex items-center gap-2 px-4 h-10 cursor-pointer
                  transition-all duration-200  hover:text-primary!
                  ${isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}
                `}
                >
                  {icon && <span className="shrink-0">{icon}</span>}
                  <span className="whitespace-nowrap text-sm">{tab.title}</span>
                  {tabs.length > 1 && (
                    <button onClick={(e) => handleCloseTab(e, tab)} className="ml-1 shrink-0 w-4 h-4 flex items-center justify-center rounded-sm text-gray-300 hover:text-white hover:bg-red-500 dark:hover:bg-red-500 transition-colors" onMouseDown={(e) => e.stopPropagation()}>
                      <AiOutlineClose className="text-xs" />
                    </button>
                  )}
                </div>
              </Dropdown>
            );
          })}
        </div>
      </div>
    </div>
  );
};
