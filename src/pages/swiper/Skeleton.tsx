/** 轮播图管理首屏骨架 */
export default function Skeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="px-3">
        <div className="skeleton h-8 rounded-md" style={{ width: 160 }} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 lg:flex-row">
        <div className="w-full shrink-0 lg:w-[360px] xl:w-[380px]">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
            <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-strokedark">
              <div className="skeleton size-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 rounded-md" style={{ width: 100 }} />
                <div className="skeleton h-3 rounded-md" style={{ width: '85%' }} />
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="skeleton h-10 w-full rounded-lg" />
              <div className="skeleton h-10 w-full rounded-lg" />
              <div className="skeleton h-10 w-full rounded-lg" />
              <div className="skeleton h-10 w-full rounded-lg" />
              <div className="skeleton aspect-21/9 w-full rounded-xl" />
              <div className="skeleton h-11 w-full rounded-xl" />
            </div>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-strokedark">
            <div className="flex items-center gap-2">
              <div className="skeleton h-5 rounded-md" style={{ width: 72 }} />
              <div className="skeleton h-5 rounded-full" style={{ width: 28 }} />
            </div>
            <div className="skeleton h-9 max-w-[220px] flex-1 rounded-lg" />
          </div>

          <div className="min-h-0 flex-1 px-5 py-2">
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
        </div>
      </div>
    </div>
  );
}
