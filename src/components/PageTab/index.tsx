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
  const tabRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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

  // 滚动到指定的tab
  const scrollToTab = (path: string) => {
    const container = tabsContainerRef.current;
    const tabElement = tabRefs.current.get(path);

    if (!container || !tabElement) {
      console.log('scrollToTab: container or tabElement not found', {
        hasContainer: !!container,
        hasTabElement: !!tabElement,
        path,
        tabRefsKeys: Array.from(tabRefs.current.keys())
      });
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const tabRect = tabElement.getBoundingClientRect();

    // 计算tab相对于容器的位置
    const tabLeft = tabRect.left - containerRect.left + container.scrollLeft;
    const tabRight = tabLeft + tabRect.width;

    // 检查tab是否在可视区域内
    const containerLeft = container.scrollLeft;
    const containerRight = containerLeft + containerRect.width;

    console.log('scrollToTab debug:', {
      path,
      containerScrollLeft: container.scrollLeft,
      containerWidth: containerRect.width,
      containerLeft,
      containerRight,
      tabLeft,
      tabRight,
      tabWidth: tabRect.width,
      isTabVisible: tabLeft >= containerLeft && tabRight <= containerRight
    });

    // 添加一些边距
    const padding = 20;

    if (tabLeft < containerLeft + padding) {
      // tab在左侧被隐藏，滚动到tab
      console.log('scrolling to left:', tabLeft - padding);
      container.scrollTo({
        left: tabLeft - padding,
        behavior: 'smooth',
      });
    } else if (tabRight > containerRight - padding) {
      // tab在右侧被隐藏，滚动到tab
      console.log('scrolling to right:', tabRight - containerRect.width + padding);
      container.scrollTo({
        left: tabRight - containerRect.width + padding,
        behavior: 'smooth',
      });
    } else {
      console.log('tab is already visible');
    }
  };

  // 当activeTab变化时，滚动到对应的tab
  useEffect(() => {
    if (activeTab) {
      // 使用setTimeout确保DOM已经更新
      setTimeout(() => {
        scrollToTab(activeTab);
      }, 0);
    }
  }, [activeTab]);

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
    <div className="relative hidden xs:flex items-center">
      {/* 标签容器 */}
      <div ref={tabsContainerRef} className="flex-1 flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex items-center h-10">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.path;
            const icon = getTabIcon(tab.path);

            return (
              <Dropdown key={tab.path} trigger={['contextMenu']} menu={getContextMenuProps(tab)}>
                <div
                  ref={(el) => {
                    if (el) {
                      tabRefs.current.set(tab.path, el);
                    } else {
                      tabRefs.current.delete(tab.path);
                    }
                  }}
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
                    <button onClick={(e) => handleCloseTab(e, tab)} className="ml-1 shrink-0 w-4 h-4 flex items-center justify-center rounded-sm text-gray-300 hover:text-white hover:bg-red-500 dark:hover:bg-red-500 transition-colors cursor-pointer" onMouseDown={(e) => e.stopPropagation()}>
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
