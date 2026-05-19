import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import SidebarLinkGroup from './SidebarLinkGroup';
import Skeleton from './Skeleton';
import UserCard from './UserCard';
import { sidebarRoutes, type MenuItemConfig, type SubMenuConfig } from '@/config/routes.tsx';

import logo from '/logo.png';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

type SidebarSubMenuItem = SubMenuConfig & { to: string };
type MenuItem = MenuItemConfig & { to: string; subMenu?: SidebarSubMenuItem[] };

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const { pathname } = location;
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // 创建 ref 用于触发器和侧边栏元素
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLDivElement>(null);

  // 从 localStorage 获取侧边栏展开状态
  const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
  const [sidebarExpanded, setSidebarExpanded] = useState(storedSidebarExpanded === null ? false : storedSidebarExpanded === 'true');

  // 点击事件处理：点击侧边栏外部时关闭侧边栏
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target as Node) || trigger.current.contains(target as Node)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // 键盘事件处理：按 ESC 键关闭侧边栏
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  // 侧边栏展开状态持久化处理
  useEffect(() => {
    localStorage.setItem('sidebar-expanded', sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector('body')?.classList.add('sidebar-expanded');
    } else {
      document.querySelector('body')?.classList.remove('sidebar-expanded');
    }
  }, [sidebarExpanded]);

  // 版本数据加载完成后，取消初始加载状态
  useEffect(() => {
    setInitialLoading(false);
  }, []);

  const [isSideBarTheme] = useState<'dark' | 'light'>('light');

  // 导航项样式：默认色与激活色不能叠在同一条上（均带 ! 时编译顺序会导致 dark 下激活色被盖住）
  const sidebarItemBaseDark =
    'group relative flex items-center gap-1 py-2 px-4 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-[#313D4A] rounded-xs font-medium hover:text-primary! dark:hover:text-primary!';
  const sidebarItemBaseLight =
    'group relative flex items-center gap-1 py-2 px-4 duration-300 ease-in-out hover:bg-[rgba(241,241,244,0.9)] dark:hover:bg-[#313D4A] rounded-md hover:backdrop-blur-[15px] hover:text-primary! dark:hover:text-primary!';
  const sidebarTextIdleDark = 'text-[#DEE4EE]!';
  const sidebarTextIdleLight = 'text-[#444]! dark:text-slate-200!';
  const sidebarTextActive = 'text-primary! dark:text-primary! dark:bg-[#313D4A]';
  const sidebarItemClass = (active: boolean) =>
    (isSideBarTheme === 'dark' ? sidebarItemBaseDark : sidebarItemBaseLight) +
    ' ' +
    (active ? sidebarTextActive : isSideBarTheme === 'dark' ? sidebarTextIdleDark : sidebarTextIdleLight);

  /** 无子菜单的一级项：用真实路由匹配。仪表盘 to 为 /，不能用 path「dashboard」做 includes。 */
  const isTopLevelNavActive = (item: MenuItem) => {
    if (item.to && item.to !== '#') {
      if (item.to === '/') {
        return pathname === '/' || pathname === '';
      }
      return pathname === item.to || pathname.startsWith(`${item.to}/`);
    }
    return pathname.includes(item.path);
  };

  // 箭头图标组件：用于显示子菜单的展开/收起状态
  const Arrow = ({ open }: { open: boolean }) => {
    return (
      <svg className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${open && 'rotate-180'}`} width="17" height="17" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z" fill="#ccc" />
      </svg>
    );
  };

  // 将统一路由配置转换为侧边栏所需格式
  const routes: { group: string; list: MenuItem[] }[] = sidebarRoutes.map((group) => ({
    ...group,
    list: group.list.map((item) => ({
      ...item,
      to: item.subMenu ? '#' : item.path,
      subMenu: item.subMenu?.map((sub) => ({ ...sub, to: sub.path })),
    })),
  }));

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return <Skeleton />;
  }

  // 渲染侧边栏组件
  return (
    <aside ref={sidebar} className={`absolute z-999 flex h-[calc(100vh-0.9rem)] xs:h-[calc(100vh-1.6rem)] w-56 xs:mt-2.5 xs:ml-2.5 flex-col overflow-y-hidden rounded-2xl duration-300 ease-linear lg:static lg:translate-x-0 ${sidebarOpen ? 'left-1 top-1.5 xs:left-2 xs:top-2 translate-x-0' : '-left-56 -top-1.5 xs:-left-56 xs:-top-2 -translate-x-full'} ${isSideBarTheme === 'dark' ? 'bg-black dark:bg-boxdark' : 'bg-light-gradient dark:bg-dark-gradient border border-gray-200/50 dark:border-gray-800 transition-all duration-300 backdrop-blur-2xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.06)] dark:shadow-[0px_0px_0px_0px_rgba(0,0,0,0)]'}`}>
      {/* Logo 和标题区域 */}
      <div className="flex justify-center items-center gap-2 px-6 py-5 pb-0 lg:pt-6">
        <NavLink to="/" className={`flex items-center ${isSideBarTheme === 'dark' ? 'font-bold text-white' : 'font-medium text-[#555]! dark:text-white!'}`}>
          <img src={logo} alt="logo" className="w-8 mr-2.5" />
          <div>Thrive X</div>
        </NavLink>

        {/* 移动端侧边栏触发器按钮 */}
        <button ref={trigger} onClick={() => setSidebarOpen(!sidebarOpen)} aria-controls="sidebar" aria-expanded={sidebarOpen} className="block lg:hidden" />
      </div>

      {/* 导航菜单区域 */}
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear flex-1">
        <nav className="pt-2 pb-4 px-2">
          {/* 遍历路由组并渲染 */}
          {routes.map((group, index) => (
            <div key={index}>
              {/* 路由组标题 */}
              <h3 className="mb-4 ml-4 text-sm font-semibold text-primary">{group.group}</h3>

              {/* 路由列表 */}
              <ul className="mb-6 flex flex-col gap-1.5">
                {group.list.map((item, subIndex) =>
                  // 根据是否有子菜单渲染不同的导航项
                  item.subMenu ? (
                    // 带子菜单的导航项组件
                    <SidebarLinkGroup
                      key={subIndex}
                      activeCondition={
                        // 默认展开「创作」；其余分组在子路由匹配时展开
                        item.path === 'write' ||
                        (item.subMenu && item.subMenu.some((subItem: SidebarSubMenuItem) => pathname === subItem.to || pathname.startsWith(`${subItem.to}/`)))
                      }
                    >
                      {(handleClick, open) => {
                        const isParentActive = item.subMenu!.some(
                          (subItem: SidebarSubMenuItem) => pathname === subItem.to || pathname.startsWith(`${subItem.to}/`),
                        );
                        return (
                          <React.Fragment>
                            {/* 父级菜单项：子路由匹配时高亮（与 NavLink isActive 无关，因父级 to 为 #） */}
                            <NavLink
                              to={item.to}
                              className={sidebarItemClass(isParentActive)}
                              onClick={(e) => {
                                e.preventDefault();

                                if (sidebarExpanded) {
                                  handleClick();
                                } else {
                                  setSidebarExpanded(true);
                                }
                              }}
                            >
                              {item.icon}
                              {item.name}
                              <Arrow open={open} />
                            </NavLink>

                            {/* 子菜单列表 */}
                            <div className={`translate transform overflow-hidden ${!open && 'hidden'}`}>
                              <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                                {item.subMenu!.map((subItem: SidebarSubMenuItem, subSubIndex) => (
                                  <li key={subSubIndex}>
                                    <NavLink
                                      to={subItem.to}
                                      className={({ isActive }) => {
                                        const base =
                                          'group relative flex items-center gap-1.5 rounded-md px-4 duration-300 ease-in-out dark:hover:text-primary!';
                                        if (isSideBarTheme === 'dark') {
                                          return `${base} ${isActive ? 'text-primary! dark:text-primary! dark:bg-[#313D4A]' : 'text-[#8A99AF] font-medium hover:text-white'}`;
                                        }
                                        return `${base} ${isActive ? 'text-primary! dark:text-primary! dark:bg-[#313D4A]' : 'text-[#666]! dark:text-slate-400! hover:text-primary!'}`;
                                      }}
                                    >
                                      {subItem.icon}
                                      {subItem.name}
                                    </NavLink>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </React.Fragment>
                        );
                      }}
                    </SidebarLinkGroup>
                  ) : (
                    // 普通导航项
                    <li key={subIndex}>
                      <NavLink to={item.to} className={sidebarItemClass(isTopLevelNavActive(item))}>
                        {item.icon}
                        {item.name}
                      </NavLink>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <UserCard isSideBarTheme={isSideBarTheme} />
    </aside>
  );
};

export default Sidebar;
