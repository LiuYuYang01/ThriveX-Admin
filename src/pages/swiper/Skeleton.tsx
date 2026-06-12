import TitleSkeleton from '@/components/Title/Skeleton';

/** 轮播图管理首屏骨架 */
export default function Skeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <TitleSkeleton titleWidth={112} />

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-strokedark">
            <div className="flex flex-wrap items-center gap-2">
              <div className="skeleton h-4 rounded-md" style={{ width: 88 }} />
              <div className="skeleton h-5 rounded-full" style={{ width: 28 }} />
            </div>
            <div className="skeleton h-9 w-full max-w-[220px] rounded-lg" />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
            <div className="flex gap-4 border-b border-slate-100 pb-3 dark:border-strokedark">
              {[32, 132, 'flex-1', 120, 72].map((w, i) => (
                <div
                  key={i}
                  className={`skeleton h-3 rounded-sm ${w === 'flex-1' ? 'min-w-0 flex-1' : 'shrink-0'}`}
                  style={typeof w === 'number' ? { width: w } : undefined}
                />
              ))}
            </div>
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-slate-100 py-3.5 last:border-0 dark:border-strokedark"
              >
                <div className="skeleton h-4 rounded-md" style={{ width: 32 }} />
                <div className="skeleton aspect-21/9 shrink-0 rounded-xl" style={{ width: 132 }} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="skeleton h-4 w-full rounded-md" />
                  <div className="skeleton h-3 rounded-md" style={{ width: '55%' }} />
                </div>
                <div className="skeleton hidden h-4 rounded-md sm:block" style={{ width: 120 }} />
                <div className="skeleton h-8 shrink-0 rounded-lg" style={{ width: 72 }} />
              </div>
            ))}
          </div>

          <div className="flex justify-end px-5 py-3">
            <div className="skeleton h-8 rounded-lg" style={{ width: 180 }} />
          </div>
        </section>

        <aside className="w-full shrink-0 lg:w-[360px] xl:w-[380px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
            <header className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-strokedark">
              <div className="skeleton size-10 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-4 rounded-md" style={{ width: 72 }} />
                <div className="skeleton h-3 rounded-md" style={{ width: '90%' }} />
              </div>
            </header>
            <div className="space-y-4 p-5 pt-2">
              <div className="skeleton h-10 w-full rounded-lg" />
              <div className="skeleton h-10 w-full rounded-lg" />
              <div className="skeleton h-10 w-full rounded-lg" />
              <div className="skeleton aspect-21/9 w-full rounded-xl" />
              <div className="skeleton h-11 w-full rounded-xl" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
