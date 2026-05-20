export default function HeaderSkeleton() {
  return (
    <header className="sticky top-0 lg:top-2.5 z-99 flex w-full lg:w-[98%] bg-light-gradient backdrop-blur-xl dark:bg-dark-gradient dark:backdrop-blur-xl lg:ml-[16px] lg:mb-2 lg:rounded-2xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.06)] dark:shadow-[0px_30px_30px_-3px_rgba(59,130,246,0.22)] border border-gray-200/50 dark:border-transparent">
      <div className="flex grow items-center justify-between py-3 shadow-2 px-3 overflow-scroll">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-4 lg:hidden shrink-0">
            <div className="skeleton shrink-0 rounded-xs" style={{ width: 32, height: 32 }} />
            <div className="skeleton shrink-0 rounded-sm" style={{ width: 32, height: 32 }} />
          </div>

          <div className="flex-1 min-w-0 w-2/6 overflow-x-auto">
            <div className="relative hidden xs:flex items-center">
              <div className="flex items-center h-6 gap-x-3 px-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                  <div key={item} className="skeleton shrink-0 rounded-sm" style={{ width: 88, height: 40 }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7 shrink-0 ml-4">
          <ul className="flex items-center gap-2 2xsm:gap-4 sm:mr-4">
            <li className="ml-4">
              <div className="skeleton shrink-0 rounded-full" style={{ width: 56, height: 28 }} />
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
