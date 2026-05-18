import { Skeleton } from 'antd';

export default function SidebarSkeleton() {
  return (
    <aside className="absolute left-4 top-4 z-999 flex h-[calc(100vh-2rem)] w-64 flex-col overflow-y-hidden rounded-3xl duration-300 ease-linear lg:static lg:translate-x-0 bg-light-gradient dark:bg-dark-gradient border border-gray-200/50 dark:border-strokedark transition-all backdrop-blur-2xl shadow-lg shadow-gray-300/30 dark:shadow-none">
      {/* Logo 和标题骨架屏 */}
      <div className="flex justify-center items-center gap-2 px-6 py-5 pb-0 lg:pt-6 mb-4">
        <div className="flex items-center">
          <Skeleton.Input active size="default" style={{ width: 100, height: 40 }} />
        </div>
      </div>

      {/* 导航菜单骨架屏 */}
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="pt-2 pb-4 px-2">
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
                <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                  {[1, 2, 3, 4].map((subItem) => (
                    <li key={subItem}>
                      <div className="flex items-center gap-2.5 rounded-md px-4">
                        <Skeleton.Input active size="small" style={{ width: 80, height: 20 }} />
                      </div>
                    </li>
                  ))}
                </ul>
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
