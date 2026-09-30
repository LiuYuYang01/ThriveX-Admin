/** 评论管理首屏骨架 */
export default function Skeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex shrink-0 flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-strokedark dark:bg-boxdark">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div className="skeleton h-9 w-full rounded-lg sm:w-52" />
          <div className="skeleton h-9 w-full rounded-lg sm:w-56" />
          <div className="skeleton size-8 shrink-0 rounded-lg" />
        </div>
        <div className="skeleton h-3 shrink-0 rounded-sm" style={{ width: 160 }} />
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/60 bg-white px-5 py-4 dark:border-strokedark dark:bg-boxdark"
          >
            <div className="flex gap-4">
              <div className="skeleton size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="skeleton h-4 w-24 rounded-md" />
                  <div className="skeleton h-3 w-16 rounded-sm" />
                </div>
                <div className="skeleton h-3 w-44 rounded-sm" />
                <div className="skeleton h-14 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
