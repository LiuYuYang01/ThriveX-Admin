import TitleSkeleton from '@/components/Title/Skeleton';

export default function MilestoneSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <TitleSkeleton titleWidth={120} action="button" actionWidth={96} />

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <header className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <div className="skeleton h-9 w-full rounded-lg sm:w-52" />
              <div className="skeleton h-9 w-full rounded-lg sm:w-40" />
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0 dark:border-strokedark"
            >
              <div className="skeleton h-4 rounded-md" style={{ width: 36 }} />
              <div className="skeleton h-16 w-24 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-4 w-full max-w-md rounded" />
                <div className="skeleton h-3 rounded" style={{ width: '68%' }} />
              </div>
              <div className="flex shrink-0 gap-1">
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
