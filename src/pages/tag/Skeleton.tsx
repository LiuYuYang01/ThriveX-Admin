import TitleSkeleton from '@/components/Title/Skeleton';

/** 标签管理首屏骨架 */
export default function Skeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <TitleSkeleton titleWidth={96} />

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-strokedark">
            <div className="flex items-center gap-2">
              <div className="skeleton h-4 rounded-md" style={{ width: 64 }} />
              <div className="skeleton h-5 rounded-full" style={{ width: 28 }} />
            </div>
            <div className="skeleton h-9 w-full max-w-[220px] rounded-lg" />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
            <div className="flex gap-4 border-b border-slate-100 pb-3 dark:border-strokedark">
              {[36, 'flex-1', 56, 72].map((w, i) => (
                <div
                  key={i}
                  className={`skeleton h-3 rounded-sm ${w === 'flex-1' ? 'min-w-0 flex-1' : 'shrink-0'}`}
                  style={typeof w === 'number' ? { width: w } : undefined}
                />
              ))}
            </div>
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-slate-100 py-3 last:border-0 dark:border-strokedark"
              >
                <div className="skeleton h-4 rounded-md" style={{ width: 36 }} />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="skeleton size-7 shrink-0 rounded-lg" />
                  <div className="skeleton h-4 min-w-0 flex-1 rounded-md" />
                </div>
                <div className="skeleton h-6 rounded-full" style={{ width: 56 }} />
                <div className="skeleton h-8 rounded-lg" style={{ width: 72 }} />
              </div>
            ))}
          </div>

          <div className="flex justify-end px-5 py-3">
            <div className="skeleton h-8 rounded-lg" style={{ width: 200 }} />
          </div>
        </section>

        <aside className="w-full shrink-0 lg:w-[340px] xl:w-[360px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
            <header className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-strokedark">
              <div className="skeleton size-10 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-4 rounded-md" style={{ width: 72 }} />
                <div className="skeleton h-3 rounded-md" style={{ width: '90%' }} />
              </div>
            </header>
            <div className="p-5 pt-2">
              <div className="skeleton mb-4 h-3 w-16 rounded-md" />
              <div className="skeleton mb-4 h-10 w-full rounded-lg" />
              <div className="skeleton h-11 w-full rounded-xl" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
