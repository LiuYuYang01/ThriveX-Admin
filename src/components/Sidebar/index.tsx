import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Skeleton } from 'antd';
import SidebarLinkGroup from './SidebarLinkGroup';

import { BiEditAlt, BiFolderOpen, BiHomeSmile, BiSliderAlt, BiCategoryAlt, BiBug } from 'react-icons/bi';
import { TbBrandAirtable } from 'react-icons/tb';

import logo from '/logo.png';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

// 定义导航项的类型
interface MenuItem {
  to: string;
  path: string;
  icon: React.ReactNode;
  name: string | React.ReactNode;
  subMenu?: SubMenuItem[];
}

interface SubMenuItem {
  to: string;
  path: string;
  name: string;
}

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
    'group relative flex items-center gap-2.5 py-2 px-4 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-[#313D4A] rounded-xs font-medium hover:text-primary! dark:hover:text-primary!';
  const sidebarItemBaseLight =
    'group relative flex items-center gap-2.5 py-2 px-4 duration-300 ease-in-out hover:bg-[rgba(241,241,244,0.9)] dark:hover:bg-[#313D4A] rounded-md hover:backdrop-blur-[15px] hover:text-primary! dark:hover:text-primary!';
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

  // 定义完整的路由列表配置
  const routes: { group: string; list: MenuItem[] }[] = [
    {
      group: '',
      list: [
        {
          to: '/',
          path: 'dashboard',
          icon: <BiHomeSmile className="text-[22px]" />,
          name: '仪表盘',
        },
        {
          to: '#',
          path: 'write',
          icon: <BiEditAlt className="text-[22px]" />,
          name: '创作',
          subMenu: [
            {
              to: '/create',
              path: 'create',
              name: '谱写',
            },
            {
              to: '/create_record',
              path: 'create_record',
              name: '闪念',
            },
            {
              to: '/draft',
              path: 'draft',
              name: '草稿箱',
            },
            {
              to: '/recycle',
              path: 'recycle',
              name: '回收站',
            },
          ],
        },
        {
          to: '#',
          path: 'manage',
          icon: <BiCategoryAlt className="text-[22px]" />,
          name: '管理',
          subMenu: [
            {
              to: '/article',
              path: 'article',
              name: '文章管理',
            },
            {
              to: '/assistant',
              path: 'assistant',
              name: '助手管理',
            },
            {
              to: '/record',
              path: 'record',
              name: '说说管理',
            },
            {
              to: '/tag',
              path: 'tag',
              name: '标签管理',
            },
            {
              to: '/comment',
              path: 'comment',
              name: '评论管理',
            },
            {
              to: '/wall',
              path: 'wall',
              name: '留言管理',
            },
            {
              to: '/cate',
              path: 'cate',
              name: '分类管理',
            },
            {
              to: '/web',
              path: 'web',
              name: '网站管理',
            },
            {
              to: '/swiper',
              path: 'swiper',
              name: '轮播图管理',
            },
            {
              to: '/footprint',
              path: 'footprint',
              name: '足迹管理',
            },
            {
              to: '/config',
              path: 'config',
              name: '项目配置',
            },
          ],
        },
        {
          to: '/setup',
          path: 'setup',
          icon: <BiSliderAlt className="text-[22px]" />,
          name: '系统',
        },
      ],
    },
    {
      group: 'New',
      list: [
        {
          to: '/work',
          path: 'work',
          icon: <TbBrandAirtable className="text-[22px]" />,
          name: '工作台',
        },
        {
          to: '/file',
          path: 'file',
          icon: <BiFolderOpen className="text-[22px]" />,
          name: '文件系统',
        },
        {
          to: '/iter',
          path: 'iter',
          icon: <BiBug className="text-[22px]" />,
          name: (
            <div className="flex items-center w-full justify-between">
              <span>更新日志</span>
              <div className="flex items-center gap-1" />
            </div>
          ),
        },
      ],
    },
  ];

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return (
      <aside ref={sidebar} className={`absolute left-0 top-0 z-999 flex h-screen w-64 flex-col overflow-y-hidden duration-300 ease-linear lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isSideBarTheme === 'dark' ? 'bg-black dark:bg-boxdark' : 'bg-light-gradient dark:bg-dark-gradient border-r border-stroke dark:border-strokedark transition-all backdrop-blur-2xl'}`}>
        {/* Logo 和标题骨架屏 */}
        <div className="flex justify-center items-center gap-2 px-6 py-5 pb-0 lg:pt-6 mb-4">
          <div className="flex items-center">
            <Skeleton.Input active size="default" style={{ width: 100, height: 40 }} />
          </div>
        </div>

        {/* 导航菜单骨架屏 */}
        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          <nav className="pt-2 pb-4 px-4 lg:px-6">
            {/* 第一个路由组 */}
            <div className="mb-6">
              <ul className="flex flex-col gap-1.5">
                {[1, 2, 3].map((item) => (
                  <li key={item}>
                    <div className="flex items-center gap-2.5 py-2 px-4">
                      <Skeleton.Avatar active size={22} shape="square" />
                      <Skeleton.Input active size="small" style={{ width: 80, height: 20 }} />
                    </div>
                  </li>
                ))}

                {/* 带子菜单的项 */}
                <li>
                  <div className="flex items-center gap-2.5 py-2 px-4">
                    <Skeleton.Avatar active size={22} shape="square" />
                    <Skeleton.Input active size="small" style={{ width: 60, height: 20, flex: 1 }} />
                    <Skeleton.Avatar active size={12} shape="circle" />
                  </div>

                  {/* 子菜单骨架屏 */}
                  <div className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                    {[1, 2, 3, 4].map((subItem) => (
                      <div key={subItem} className="ml-6">
                        <Skeleton.Input active size="small" style={{ width: 80, height: 20 }} />
                      </div>
                    ))}
                  </div>
                </li>
              </ul>
            </div>

            {/* 第二个路由组 */}
            <div>
              <Skeleton.Input active size="small" style={{ width: 20, height: 16, marginBottom: 16, marginLeft: 16 }} />
              <ul className="flex flex-col gap-1.5">
                {[1, 2, 3].map((item) => (
                  <li key={item}>
                    <div className="flex items-center gap-2.5 py-2 px-4">
                      <Skeleton.Avatar active size={22} shape="square" />
                      <Skeleton.Input active size="small" style={{ width: 80, height: 20 }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      </aside>
    );
  }

  // 渲染侧边栏组件
  return (
    <aside ref={sidebar} className={`absolute left-0 top-0 z-999 flex h-screen w-64 flex-col overflow-y-hidden duration-300 ease-linear lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isSideBarTheme === 'dark' ? 'bg-black dark:bg-boxdark' : 'bg-light-gradient dark:bg-dark-gradient border-r border-stroke dark:border-strokedark transition-all backdrop-blur-2xl'}`}>
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
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="pt-2 pb-4 px-4 lg:px-6">
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
                        // 默认展开"创作"菜单，或当前路径属于该菜单的子菜单
                        item.path === 'write' || (item.subMenu && item.subMenu.some((subItem) => pathname.includes(subItem.path)))
                      }
                    >
                      {(handleClick, open) => {
                        const isParentActive = item.subMenu!.some(
                          (subItem) => pathname === subItem.to || pathname.startsWith(`${subItem.to}/`),
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
                                {item.subMenu!.map((subItem, subSubIndex) => (
                                  <li key={subSubIndex}>
                                    <NavLink
                                      to={subItem.to}
                                      className={({ isActive }) => {
                                        const base =
                                          'group relative flex items-center gap-2.5 rounded-md px-4 duration-300 ease-in-out dark:hover:text-primary!';
                                        if (isSideBarTheme === 'dark') {
                                          return `${base} ${isActive ? 'text-primary! dark:text-primary! dark:bg-[#313D4A]' : 'text-[#8A99AF] font-medium hover:text-white'}`;
                                        }
                                        return `${base} ${isActive ? 'text-primary! dark:text-primary! dark:bg-[#313D4A]' : 'text-[#666]! dark:text-slate-400! hover:text-primary!'}`;
                                      }}
                                    >
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
    </aside>
  );
};

export default Sidebar;
