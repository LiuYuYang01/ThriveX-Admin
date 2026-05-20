export default function WorkSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 px-3">
        <div className="skeleton h-8 rounded-md" style={{ width: 150 }} />
      </div>

      <div className="mt-2 flex min-h-[calc(100vh-160px)] flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-1 flex-col lg:flex-row">
          <aside className="shrink-0 border-b border-slate-200/80 p-4 lg:w-56 lg:border-r lg:border-b-0 dark:border-strokedark">
            <div className="skeleton mb-3 h-3 w-16 rounded-sm" />
            <ul className="flex gap-2 lg:flex-col lg:gap-1">
              {[1, 2, 3].map((item) => (
                <li key={item} className="flex flex-1 items-center gap-3 rounded-lg px-3 py-3 lg:w-full">
                  <div className="skeleton size-9 shrink-0 rounded-lg" />
                  <div className="skeleton h-4 flex-1 rounded-sm" />
                </li>
              ))}
            </ul>
          </aside>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-3 border-b border-slate-200/80 px-5 py-4 dark:border-strokedark">
              <div className="skeleton size-10 rounded-lg" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-28 rounded-sm" />
                <div className="skeleton h-3 w-40 rounded-sm" />
              </div>
            </div>

            <div className="space-y-3 px-5 py-5">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-strokedark">
                  <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
                    <div className="skeleton size-9 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-24 rounded-sm" />
                      <div className="skeleton h-3 w-40 rounded-sm" />
                    </div>
                    <div className="skeleton h-9 w-24 shrink-0 rounded-lg" />
                  </div>
                  <div className="px-4 py-3.5">
                    <div className="skeleton h-4 w-full rounded-sm" />
                  </div>
                  <div className="space-y-2 border-t border-slate-100 px-4 py-3 dark:border-strokedark">
                    <div className="skeleton h-3 w-4/5 rounded-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
