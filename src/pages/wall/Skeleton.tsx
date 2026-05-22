/** 留言管理首屏骨架 */
export default function Skeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="px-3">
        <div className="skeleton h-8 rounded-md" style={{ width: 140 }} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex shrink-0 flex-wrap gap-2 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
            <div className="skeleton h-9 flex-1 min-w-[140px] rounded-lg" />
            <div className="skeleton h-9 w-28 rounded-lg" />
            <div className="skeleton h-9 w-56 rounded-lg" />
          </div>
          <div className="min-h-0 flex-1 px-4 py-2">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-strokedark"
              >
                <div className="skeleton size-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 rounded-md" style={{ width: '70%' }} />
                  <div className="skeleton h-3 rounded-md" style={{ width: '45%' }} />
                </div>
                <div className="skeleton h-8 rounded-lg" style={{ width: 64 }} />
              </div>
            ))}
          </div>
        </div>

        <div className="hidden w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white lg:flex lg:w-[320px] xl:w-[360px] dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-strokedark">
            <div className="skeleton h-4 rounded-md" style={{ width: 72 }} />
          </div>
          <div className="flex-1 space-y-3 p-4">
            <div className="skeleton h-16 w-full rounded-xl" />
            <div className="skeleton h-20 w-full rounded-xl" />
          </div>
          <div className="mt-auto border-t border-slate-100 p-4 dark:border-strokedark">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="skeleton h-14 rounded-lg" />
              <div className="skeleton h-14 rounded-lg" />
            </div>
            <div className="skeleton mb-2 h-9 w-full rounded-lg" />
            <div className="flex gap-2">
              <div className="skeleton h-9 flex-1 rounded-lg" />
              <div className="skeleton h-9 w-16 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
