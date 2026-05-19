import { Skeleton } from 'antd';

export default function HeaderSkeleton() {
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
