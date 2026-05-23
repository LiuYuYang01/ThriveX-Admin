export default function WorkSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 px-3">
        <div className="skeleton h-8 rounded-md" style={{ width: 150 }} />
      </div>

      <div className="grid grid-cols-1 gap-3 px-3 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white px-5 py-5 dark:border-strokedark dark:bg-boxdark"
          >
            <div className="skeleton size-12 shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-2.5">
              <div className="skeleton h-8 w-14 rounded-md" />
              <div className="skeleton h-3 w-20 rounded-sm" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col px-3">
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-6 py-4 dark:border-strokedark">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100/60 p-1 dark:bg-boxdark-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="skeleton h-9 w-20 rounded-lg" />
              ))}
            </div>
            <div className="skeleton h-4 w-20 rounded-sm" />
          </div>

          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="flex gap-4 rounded-2xl border border-slate-200/60 px-5 py-4 dark:border-strokedark"
              >
                <div className="skeleton size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="skeleton h-5 w-20 rounded-sm" />
                      <div className="skeleton h-4 w-16 rounded-md" />
                    </div>
                    <div className="flex gap-0.5">
                      <div className="skeleton size-8 rounded-lg" />
                      <div className="skeleton size-8 rounded-lg" />
                      <div className="skeleton size-8 rounded-lg" />
                    </div>
                  </div>
                  <div className="skeleton h-16 w-full rounded-xl" />
                  <div className="flex gap-2">
                    <div className="skeleton h-6 w-20 rounded-md" />
                    <div className="skeleton h-6 w-32 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
