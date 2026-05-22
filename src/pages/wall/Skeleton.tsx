/** 留言管理首屏骨架 — 卡片流布局 */
export default function Skeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="px-3">
        <div className="skeleton h-8 rounded-md" style={{ width: 140 }} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-3">
        <div className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-strokedark dark:bg-boxdark sm:gap-3 sm:px-4 sm:py-3"
            >
              <div className="skeleton size-9 shrink-0 rounded-xl sm:size-10" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 rounded-md" style={{ width: '55%' }} />
                <div className="skeleton h-6 rounded-md" style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex shrink-0 flex-wrap gap-2 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
            <div className="skeleton h-9 min-w-[160px] flex-1 rounded-lg" />
            <div className="skeleton h-9 w-28 rounded-lg" />
            <div className="skeleton h-9 w-48 rounded-lg" />
          </div>
          <div className="grid flex-1 gap-3 p-4 sm:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="flex flex-col rounded-2xl border border-slate-200/80 p-4 dark:border-strokedark"
              >
                <div className="mb-3 flex gap-3">
                  <div className="skeleton size-10 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 rounded-md" style={{ width: '50%' }} />
                    <div className="skeleton h-3 rounded-md" style={{ width: '70%' }} />
                  </div>
                </div>
                <div className="mb-4 space-y-2">
                  <div className="skeleton h-3 w-full rounded-md" />
                  <div className="skeleton h-3 w-full rounded-md" />
                  <div className="skeleton h-3 rounded-md" style={{ width: '80%' }} />
                </div>
                <div className="mt-auto flex gap-2 border-t border-slate-100 pt-3 dark:border-strokedark">
                  <div className="skeleton h-8 flex-1 rounded-lg" />
                  <div className="skeleton h-8 flex-1 rounded-lg" />
                  <div className="skeleton h-8 flex-1 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
