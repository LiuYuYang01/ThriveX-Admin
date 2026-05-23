const ProjectCardSkeleton = () => (
  <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-strokedark">
      <div className="skeleton size-10 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 rounded-md" style={{ width: 120 }} />
        <div className="skeleton h-3 rounded-md" style={{ width: 90 }} />
      </div>
      <div className="skeleton h-5 rounded-full" style={{ width: 44 }} />
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
      <div className="mb-4 px-3">
        <div className="flex items-center justify-between">
          <div className="skeleton h-7 rounded-md" style={{ width: 100 }} />
          <div className="skeleton h-9 rounded-xl" style={{ width: 120 }} />
        </div>
      </div>

      <div className="mb-4 px-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 dark:border-strokedark dark:bg-boxdark">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3">
              <div className="skeleton size-9 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 rounded-md" style={{ width: 180 }} />
                <div className="skeleton h-3.5 w-full max-w-md rounded-md" />
              </div>
            </div>
            <div className="skeleton h-14 rounded-xl" style={{ width: 120 }} />
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 px-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-strokedark dark:bg-boxdark"
          >
            <div className="skeleton size-9 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 rounded-md" style={{ width: 80 }} />
              <div className="skeleton h-6 rounded-md" style={{ width: 64 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 px-3">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-slate-100 px-5 py-3.5 dark:border-strokedark">
            <div className="skeleton mb-2 h-4 rounded-md" style={{ width: 140 }} />
            <div className="skeleton h-3 rounded-md" style={{ width: 100 }} />
          </div>
          <div className="flex justify-center px-4 py-6">
            <div className="flex w-full max-w-[860px] flex-wrap gap-1">
              {Array.from({ length: 53 * 7 }).map((_, i) => (
                <div key={i} className="skeleton size-3 rounded-sm" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 pb-3">
        <div className="skeleton mb-3 h-4 rounded-md" style={{ width: 120 }} />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      </div>
    </div>
  );
}
