export default function ArticleSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="px-3">
        <div className="skeleton h-8 rounded-lg" style={{ width: 160 }} />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-3.5 sm:flex-row sm:items-center sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3.5 dark:border-strokedark dark:bg-boxdark"
          >
            <div className="skeleton size-10 shrink-0 rounded-xl" />
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <div className="skeleton h-3 w-14 rounded sm:order-2" />
              <div className="skeleton h-6 w-10 rounded sm:order-1" />
            </div>
          </div>
        ))}
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <div className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-wrap gap-2">
              <div className="skeleton h-9 w-full rounded-lg sm:w-52" />
              <div className="skeleton h-9 w-[calc(50%-4px)] rounded-lg sm:w-32" />
              <div className="skeleton h-9 w-[calc(50%-4px)] rounded-lg sm:w-28" />
              <div className="skeleton h-9 w-full rounded-lg sm:w-56" />
            </div>
            <div className="skeleton h-10 w-64 shrink-0 self-end rounded-xl xl:self-auto" />
          </div>
        </div>

        <div className="min-h-0 flex-1 px-5 py-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="mb-4 flex items-center gap-4">
              <div className="skeleton size-4 shrink-0 rounded" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-4 w-full max-w-md rounded" />
                <div className="skeleton h-3 rounded" style={{ width: '55%' }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
