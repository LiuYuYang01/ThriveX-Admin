const ProjectCardSkeleton = () => (
  <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
    <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-strokedark">
      <div className="skeleton size-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="skeleton h-4 rounded-md" style={{ width: 120 }} />
        <div className="skeleton h-3 rounded-md" style={{ width: 90 }} />
      </div>
      <div className="skeleton h-5 shrink-0 rounded-full" style={{ width: 44 }} />
    </div>
    <div className="space-y-5 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2 border-l-2 border-slate-100 pl-4 dark:border-strokedark">
          <div className="skeleton h-3 rounded-md" style={{ width: 72 }} />
          <div className="skeleton h-4 w-full rounded-md" />
          <div className="skeleton h-4 rounded-md" style={{ width: '80%' }} />
        </div>
      ))}
    </div>
  </div>
);

export default function Skeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-strokedark dark:bg-boxdark">
          <div className="flex min-w-0 flex-1 items-center justify-center gap-3 sm:justify-start">
            <div className="skeleton size-9 shrink-0 rounded-lg" />
            <div className="skeleton h-5 rounded-md" style={{ width: 180 }} />
          </div>
          <div className="skeleton h-9 shrink-0 rounded-xl" style={{ width: 140 }} />
        </div>
      </div>

      <section className="mb-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 dark:border-strokedark">
            <div className="skeleton size-[18px] shrink-0 rounded-sm" />
            <div className="space-y-1.5">
              <div className="skeleton h-4 rounded-md" style={{ width: 140 }} />
              <div className="skeleton h-3 rounded-md" style={{ width: 100 }} />
            </div>
          </div>
          <div className="flex justify-center overflow-x-auto px-4 py-6 sm:px-6">
            <div className="flex w-full max-w-[860px] flex-wrap gap-1">
              {Array.from({ length: 53 * 7 }).map((_, i) => (
                <div key={i} className="skeleton size-3 rounded-sm" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="min-h-0 flex-1 pb-3">
        <div className="mb-3 flex items-center justify-center gap-2">
          <div className="skeleton size-4 rounded-sm" />
          <div className="skeleton h-4 rounded-md" style={{ width: 96 }} />
          <div className="skeleton h-3 rounded-md" style={{ width: 88 }} />
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      </section>
    </div>
  );
}
