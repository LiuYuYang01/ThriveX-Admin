import TitleSkeleton from '@/components/Title/Skeleton';

export default function RecordSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <TitleSkeleton titleWidth={96} action="button" actionWidth={96} />

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <header className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <div className="skeleton h-9 w-full rounded-lg sm:w-56" />
              <div className="skeleton h-9 w-full rounded-lg sm:w-56" />
              <div className="skeleton size-8 shrink-0 rounded-lg" />
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1">
          <div className="flex gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-3 dark:border-strokedark dark:bg-boxdark-2/50">
            {[72, 'flex-1', 150, 140, 100].map((w, i) => (
              <div
                key={i}
                className={`skeleton h-3 rounded-sm ${w === 'flex-1' ? 'min-w-0 flex-1' : 'shrink-0'}`}
                style={typeof w === 'number' ? { width: w } : undefined}
              />
            ))}
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0 dark:border-strokedark"
            >
              <div className="skeleton h-4 rounded-md" style={{ width: 36 }} />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-4 w-full max-w-md rounded" />
                <div className="skeleton h-3 rounded" style={{ width: '60%' }} />
              </div>
              <div className="skeleton hidden h-10 rounded-lg sm:block" style={{ width: 80 }} />
              <div className="skeleton hidden h-10 rounded-lg md:block" style={{ width: 100 }} />
              <div className="flex shrink-0 gap-1">
                <div className="skeleton size-8 rounded-lg" />
                <div className="skeleton size-8 rounded-lg" />
              </div>
            </div>
          ))}
          <div className="flex justify-end px-5 py-3">
            <div className="skeleton h-8 rounded-lg" style={{ width: 200 }} />
          </div>
        </div>
      </section>
    </div>
  );
}
