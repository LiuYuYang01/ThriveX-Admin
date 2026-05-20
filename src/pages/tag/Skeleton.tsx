/** 标签管理首屏骨架 */
export default function Skeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="px-3">
        <div className="skeleton h-8 rounded-md" style={{ width: 140 }} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 lg:flex-row">
        <div className="w-full shrink-0 lg:w-[340px] xl:w-[360px]">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-strokedark dark:bg-boxdark">
            <div className="mb-5 flex items-center gap-3">
              <div className="skeleton size-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 rounded-md" style={{ width: 100 }} />
                <div className="skeleton h-3 rounded-md" style={{ width: '80%' }} />
              </div>
            </div>
            <div className="skeleton mb-4 h-10 w-full rounded-lg" />
            <div className="skeleton h-11 w-full rounded-xl" />
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-strokedark">
            <div className="skeleton h-5 rounded-md" style={{ width: 88 }} />
            <div className="skeleton h-9 max-w-[220px] flex-1 rounded-lg" />
          </div>

          <div className="min-h-0 flex-1 px-5 py-2">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-slate-100 py-3 last:border-0 dark:border-strokedark"
              >
                <div className="skeleton h-4 rounded-md" style={{ width: 36 }} />
                <div className="flex flex-1 items-center gap-2">
                  <div className="skeleton size-7 shrink-0 rounded-lg" />
                  <div className="skeleton h-4 flex-1 rounded-md" />
                </div>
                <div className="skeleton h-6 rounded-full" style={{ width: 56 }} />
                <div className="skeleton h-8 rounded-lg" style={{ width: 72 }} />
              </div>
            ))}
          </div>

          <div className="flex justify-end px-5 py-3">
            <div className="skeleton h-8 rounded-lg" style={{ width: 200 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
