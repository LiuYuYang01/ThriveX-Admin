import TitleSkeleton from '@/components/Title/Skeleton';

export default () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <TitleSkeleton titleWidth={96} action="buttons" buttonCount={3} />

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <header className="shrink-0 border-b border-slate-100 px-3 py-2.5 sm:px-4 sm:py-3 dark:border-strokedark">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="skeleton size-9 shrink-0 rounded-lg" />
            <div className="skeleton h-9 min-w-0 flex-1 rounded-lg" />
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
          <div className="mb-4 flex shrink-0 flex-col gap-2 rounded-xl border border-slate-200/70 bg-slate-50/50 px-3 py-2.5 sm:px-4 lg:flex-row lg:items-center lg:justify-between dark:border-strokedark dark:bg-boxdark-2/40">
            <div className="skeleton h-9 rounded-lg" style={{ width: 96 }} />
            <div className="flex flex-wrap items-center gap-2">
              <div className="skeleton h-9 rounded-lg" style={{ width: 120 }} />
              <div className="skeleton h-9 rounded-lg" style={{ width: 88 }} />
              <div className="skeleton h-9 rounded-lg" style={{ width: 140 }} />
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-strokedark"
              >
                <div className="skeleton aspect-4/3 w-full" />
                <div className="space-y-2 p-3">
                  <div className="skeleton h-4 w-[78%] rounded-sm" />
                  <div className="skeleton h-3 w-[45%] rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
