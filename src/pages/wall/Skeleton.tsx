import TitleSkeleton from '@/components/Title/Skeleton';

/** 留言管理首屏骨架 */
export default function Skeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <TitleSkeleton titleWidth={96} />

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <header className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <div className="skeleton h-9 w-full rounded-lg sm:w-52" />
                <div className="skeleton h-9 w-full rounded-lg sm:w-28" />
                <div className="skeleton h-9 w-full rounded-lg sm:w-56" />
                <div className="skeleton size-8 shrink-0 rounded-lg" />
              </div>
              <div className="skeleton h-3 shrink-0 rounded-sm" style={{ width: 160 }} />
            </div>
          </header>

          <div className="min-h-0 flex-1 px-4 py-2">
            <div className="flex gap-3 border-b border-slate-100 bg-slate-50/80 px-1 py-3 dark:border-strokedark dark:bg-boxdark-2/50">
              {['flex-1', 88, 120, 72].map((w, i) => (
                <div
                  key={i}
                  className={`skeleton h-3 rounded-sm ${w === 'flex-1' ? 'min-w-0 flex-1' : 'shrink-0'}`}
                  style={w !== 'flex-1' ? { width: w } : undefined}
                />
              ))}
            </div>
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-strokedark"
              >
                <div className="skeleton size-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="skeleton h-4 rounded-md" style={{ width: '70%' }} />
                  <div className="skeleton h-3 rounded-md" style={{ width: '45%' }} />
                </div>
                <div className="skeleton h-8 rounded-lg" style={{ width: 64 }} />
              </div>
            ))}
          </div>

          <div className="flex justify-end px-4 py-3">
            <div className="skeleton h-8 rounded-lg" style={{ width: 220 }} />
          </div>
        </section>

        <aside className="hidden w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white lg:flex lg:min-h-0 lg:w-[320px] lg:flex-col xl:w-[360px] dark:border-strokedark dark:bg-boxdark">
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
            <div className="skeleton mb-3 size-12 rounded-xl" />
            <div className="skeleton mb-2 h-4 rounded-md" style={{ width: 88 }} />
            <div className="skeleton h-3 rounded-md" style={{ width: 200 }} />
          </div>
        </aside>
      </div>
    </div>
  );
}
