export default function ArticleSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="px-3">
        <div className="skeleton h-8 rounded-lg" style={{ width: 160 }} />
      </div>

      <div className="grid grid-cols-2 gap-3 px-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-strokedark dark:bg-boxdark"
          >
            <div className="skeleton mb-2 h-3 rounded" style={{ width: 72 }} />
            <div className="skeleton h-7 rounded-lg" style={{ width: 48 }} />
          </div>
        ))}
      </div>

      <section className="mx-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <div className="shrink-0 space-y-3 border-b border-slate-100 px-5 py-4 dark:border-strokedark">
          <div className="flex flex-wrap gap-3">
            <div className="skeleton h-9 rounded-lg" style={{ width: 220 }} />
            <div className="skeleton h-9 rounded-lg" style={{ width: 140 }} />
            <div className="skeleton h-9 rounded-lg" style={{ width: 140 }} />
            <div className="skeleton h-9 rounded-lg" style={{ width: 260 }} />
          </div>
          <div className="flex justify-end gap-2">
            <div className="skeleton h-9 rounded-lg" style={{ width: 100 }} />
            <div className="skeleton h-9 rounded-lg" style={{ width: 100 }} />
            <div className="skeleton h-9 rounded-lg" style={{ width: 88 }} />
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
              <div className="skeleton h-6 rounded-full" style={{ width: 64 }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
