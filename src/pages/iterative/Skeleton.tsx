const ProjectCardSkeleton = () => (
  <div className="bg-white dark:bg-boxdark rounded-2xl border border-gray-100 dark:border-strokedark shadow-xs h-full overflow-hidden">
    <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-strokedark">
      <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
      <div className="skeleton h-5 rounded-sm" style={{ width: 130 }} />
    </div>
    <div className="p-4 space-y-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="skeleton w-3 h-3 rounded-full mt-1.5 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 rounded-sm" style={{ width: 120 }} />
            <div className="skeleton h-4 rounded-sm w-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default () => {
  return (
    <div className="p-4 space-y-4">
      <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-2xl shadow-xs border border-gray-100 dark:border-strokedark">
        <div className="relative flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className="skeleton w-8 h-8 rounded-md" />
            <div className="skeleton h-8 rounded-sm" style={{ width: 260 }} />
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <div className="skeleton h-8 rounded-md" style={{ width: 80 }} />
            <div className="skeleton h-8 rounded-md" style={{ width: 96 }} />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 bg-white dark:bg-boxdark rounded-2xl shadow-xs border border-gray-100 dark:border-strokedark">
        <div className="flex justify-center">
          <div className="w-full max-w-[860px] flex flex-wrap gap-1">
            {Array.from({ length: 53 * 7 }).map((_, i) => (
              <div key={i} className="skeleton size-3 rounded-sm" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
      </div>
    </div>
  );
};
