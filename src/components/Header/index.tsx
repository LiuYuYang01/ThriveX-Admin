import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Skeleton } from 'antd';
import DarkModeSwitcher from './DarkModeSwitcher';
import logo from '/logo.png';
import PageTab from '../PageTab';

const Header = (props: { sidebarOpen: string | boolean | undefined; setSidebarOpen: (arg0: boolean) => void }) => {
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return (
      <header className="sticky top-0 z-99 flex w-full bg-light-gradient dark:bg-dark-gradient">
        <div className="flex grow items-center justify-between px-4 py-3 shadow-2 md:px-6 2xl:px-11 overflow-scroll">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* 移动端菜单按钮和 Logo 骨架屏 */}
            <div className="flex items-center gap-4 lg:hidden shrink-0">
              <Skeleton.Button active size="default" style={{ width: 32, height: 32 }} />
              <Skeleton.Avatar active size={32} shape="square" />
            </div>

            {/* PageTab 骨架屏 */}
            <div className="flex-1 min-w-0 w-2/6 overflow-x-auto">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((item) => (
                  <Skeleton.Button key={item} active size="default" style={{ width: 100, height: 32 }} />
                ))}
              </div>
            </div>
          </div>

          {/* 右侧操作栏骨架屏 */}
          <div className="flex items-center gap-3 2xsm:gap-7 shrink-0 ml-4">
            <ul className="flex items-center gap-2 2xsm:gap-4 sm:mr-4">
              <Skeleton.Button active size="default" style={{ width: 32, height: 30 }} />
            </ul>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-99 flex w-full bg-light-gradient backdrop-blur-xl dark:bg-dark-gradient dark:backdrop-blur-xl ml-[16px] rounded-bl-2xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.06)] dark:shadow-[0px_30px_30px_-3px_rgba(59,130,246,0.22)] border border-gray-200/50 dark:border-transparent">
      <div className="flex grow items-center justify-between px-4 py-1.5 shadow-2 md:px-6 2xl:px-11 overflow-scroll">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-4 lg:hidden shrink-0">
            <button
              aria-controls="sidebar"
              onClick={(e) => {
                e.stopPropagation();
                props.setSidebarOpen(!props.sidebarOpen);
              }}
              className="z-99999 block rounded-xs border border-stroke bg-white p-1 shadow-xs dark:border-strokedark dark:bg-boxdark lg:hidden"
            >
              <span className="relative block h-6 w-6 cursor-pointer">
                <span className="du-block absolute right-0 h-full w-full">
                  <span className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-xs bg-black delay-[0] duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && 'w-full! delay-300'}`}></span>
                  <span className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-xs bg-black delay-150 duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && 'delay-400 w-full!'}`}></span>
                  <span className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-xs bg-black delay-200 duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && 'w-full! delay-500'}`}></span>
                </span>
                <span className="absolute right-0 h-full w-full rotate-45">
                  <span className={`absolute left-2.5 top-0 block h-full w-0.5 rounded-xs bg-black delay-300 duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && 'h-0! delay-[0]!'}`}></span>
                  <span className={`delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-xs bg-black duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && 'h-0! delay-200!'}`}></span>
                </span>
              </span>
            </button>

            <Link className="block shrink-0 lg:hidden" to="/">
              <img src={logo} alt="logo" className="w-8" />
            </Link>
          </div>

          <div className="flex-1 min-w-0 w-2/6 overflow-x-auto">
            <PageTab />
          </div>
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7 shrink-0 ml-4">
          <ul className="flex items-center gap-2 2xsm:gap-4 sm:mr-4">
            <DarkModeSwitcher />
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
