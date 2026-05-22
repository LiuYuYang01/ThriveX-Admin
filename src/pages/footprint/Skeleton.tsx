export default function FootprintSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="px-3">
        <div className="flex items-center justify-between gap-4">
          <div className="skeleton h-8 rounded-lg" style={{ width: 160 }} />
          <div className="skeleton h-9 rounded-lg" style={{ width: 108 }} />
        </div>
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <div className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
          <div className="flex flex-wrap gap-2">
            <div className="skeleton h-9 w-full rounded-lg sm:w-52" />
            <div className="skeleton h-9 w-full rounded-lg sm:w-56" />
          </div>
        </div>

        <div className="min-h-0 flex-1 px-5 py-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="mb-5 flex items-start gap-4 last:mb-0">
              <div className="skeleton size-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2 pt-1">
                <div className="skeleton h-4 w-full rounded-sm" />
                <div className="skeleton h-3 rounded-sm" style={{ width: '68%' }} />
                <div className="skeleton h-3 rounded-sm" style={{ width: '42%' }} />
              </div>
              <div className="flex shrink-0 gap-1 pt-1">
                <div className="skeleton size-8 rounded-lg" />
                <div className="skeleton size-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
