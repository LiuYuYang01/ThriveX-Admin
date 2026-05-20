interface SidebarSkeletonProps {
  sidebarOpen?: boolean;
}

/** 一级菜单行：与 sidebarItemBaseLight 的 gap-1 py-2 px-4 一致 */
function NavItemRow({ labelWidth = 48 }: { labelWidth?: number }) {
  return (
    <div className="relative flex items-center gap-1 py-2 px-4">
      <div className="skeleton h-[18px] w-[18px] shrink-0 rounded-sm" />
      <div className="skeleton h-4 rounded-sm" style={{ width: labelWidth }} />
    </div>
  );
}

/** 带子菜单的一级项：右侧箭头与 Arrow 组件位置一致 */
function NavItemRowWithArrow({ labelWidth = 32 }: { labelWidth?: number }) {
  return (
    <div className="relative flex items-center gap-1 py-2 px-4">
      <div className="skeleton h-[18px] w-[18px] shrink-0 rounded-sm" />
      <div className="skeleton h-4 rounded-sm" style={{ width: labelWidth }} />
      <div className="skeleton absolute right-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 shrink-0 rounded-sm" />
    </div>
  );
}

/** 子菜单行：gap-1.5 rounded-md px-4，图标 text-base */
function SubNavItemRow({ labelWidth = 40 }: { labelWidth?: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md px-4">
      <div className="skeleton h-4 w-4 shrink-0 rounded-sm" />
      <div className="skeleton h-4 rounded-sm" style={{ width: labelWidth }} />
    </div>
  );
}

export default function SidebarSkeleton({ sidebarOpen = false }: SidebarSkeletonProps) {
  const asideClassName = [
    'absolute z-999 flex h-[calc(100vh-0.9rem)] xs:h-[calc(100vh-1.6rem)] w-56 xs:mt-2.5 xs:ml-2.5 flex-col overflow-y-hidden rounded-2xl duration-300 ease-linear lg:static lg:translate-x-0',
    sidebarOpen ? 'left-1 top-1.5 xs:left-2 xs:top-2 translate-x-0' : '-left-56 -top-1.5 xs:-left-56 xs:-top-2 -translate-x-full',
    'bg-light-gradient dark:bg-dark-gradient border border-gray-200/50 dark:border-gray-800 transition-all duration-300 backdrop-blur-2xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.06)] dark:shadow-[0px_0px_0px_0px_rgba(0,0,0,0)]',
    'lg:left-auto lg:top-auto lg:translate-x-0',
  ].join(' ');

  return (
    <aside className={asideClassName}>
      {/* Logo 和标题区域 */}
      <div className="flex justify-center items-center gap-2 px-6 py-5 pb-0 lg:pt-6">
        <div className="flex items-center font-medium">
          <div className="skeleton mr-2.5 h-8 w-8 shrink-0 rounded-md" />
          <div className="skeleton h-5 w-[72px] rounded-sm" />
        </div>
      </div>

      {/* 导航菜单区域 */}
      <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="px-2 pt-2 pb-4">
          {/* 第一组：group 为空，仍保留 h3 占位与 mb-4 */}
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-primary" />
            <ul className="mb-6 flex flex-col gap-1.5">
              <li>
                <NavItemRow labelWidth={44} />
              </li>
              {/* 创作：默认展开，4 个子项 */}
              <li>
                <NavItemRowWithArrow labelWidth={32} />
                <div className="translate transform overflow-hidden">
                  <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                    <li>
                      <SubNavItemRow labelWidth={28} />
                    </li>
                    <li>
                      <SubNavItemRow labelWidth={28} />
                    </li>
                    <li>
                      <SubNavItemRow labelWidth={40} />
                    </li>
                    <li>
                      <SubNavItemRow labelWidth={40} />
                    </li>
                  </ul>
                </div>
              </li>
              <li>
                <NavItemRowWithArrow labelWidth={32} />
              </li>
              <li>
                <NavItemRowWithArrow labelWidth={32} />
              </li>
            </ul>
          </div>

          {/* 第二组：New */}
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-primary">
              <span className="skeleton inline-block h-3.5 w-7 rounded-sm align-middle" />
            </h3>
            <ul className="mb-6 flex flex-col gap-1.5">
              <li>
                <NavItemRow labelWidth={44} />
              </li>
              <li>
                <NavItemRow labelWidth={56} />
              </li>
              <li>
                <NavItemRow labelWidth={56} />
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* 底部用户卡片 */}
      <div className="p-2">
        <div className="flex cursor-default items-center gap-3 rounded-xl border border-gray-200/50 bg-white/60 p-3 backdrop-blur-sm dark:border-gray-700/50 dark:bg-[#313D4A]">
          <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="skeleton h-3.5 w-10 rounded-sm" />
            <div className="skeleton h-3 w-16 rounded-sm" />
          </div>
          <div className="p-2">
            <div className="skeleton h-4 w-4 shrink-0 rounded-sm" />
          </div>
        </div>
      </div>
    </aside>
  );
}
