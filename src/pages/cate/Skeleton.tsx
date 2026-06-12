import TitleSkeleton from '@/components/Title/Skeleton';

/** 分类管理首屏骨架 */
export default function Skeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <TitleSkeleton titleWidth={96} action="button" actionWidth={108} />

      <div className="flex min-h-0 flex-1 flex-col">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <header className="flex shrink-0 flex-col gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-strokedark sm:flex-row sm:items-center sm:justify-between">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="skeleton h-3 rounded-md" style={{ width: 48 }} />
              <div className="skeleton h-3 rounded-md" style={{ width: 48 }} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="skeleton h-9 w-full rounded-lg sm:w-[200px]" />
              <div className="skeleton size-8 rounded-lg" />
              <div className="skeleton size-8 rounded-lg" />
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="skeleton size-8 rounded-lg" />
                    <div className="skeleton h-5 rounded-md" style={{ width: 160 }} />
                  </div>
                  <div className="skeleton h-8 rounded-lg" style={{ width: 88 }} />
                </div>
                {item <= 2 && (
                  <div className="ml-10 space-y-2">
                    {[1, 2].map((child) => (
                      <div key={child} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="skeleton size-7 rounded-lg" />
                          <div className="skeleton h-4 rounded-md" style={{ width: 120 }} />
                        </div>
                        <div className="skeleton h-7 rounded-lg" style={{ width: 72 }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
