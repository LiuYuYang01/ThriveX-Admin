export default () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 px-3">
        <div className="flex items-center justify-between gap-4">
          <div className="skeleton h-8 rounded-md" style={{ width: 120 }} />
          <div className="flex gap-2">
            <div className="skeleton h-9 rounded-lg" style={{ width: 88 }} />
            <div className="skeleton h-9 rounded-lg" style={{ width: 100 }} />
            <div className="skeleton h-9 rounded-lg" style={{ width: 100 }} />
          </div>
        </div>
      </div>

      <div className="mx-3 flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
          <div className="skeleton size-9 shrink-0 rounded-lg" />
          <div className="skeleton h-8 flex-1 rounded-lg" />
        </div>

        <div className="space-y-4 p-4">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="skeleton h-9 rounded-lg" style={{ width: 200 }} />
            <div className="flex flex-wrap gap-2">
              <div className="skeleton h-9 rounded-lg" style={{ width: 120 }} />
              <div className="skeleton h-9 rounded-lg" style={{ width: 140 }} />
              <div className="skeleton h-9 rounded-lg" style={{ width: 240 }} />
            </div>
          </div>

          <div className="skeleton h-5 w-24 rounded-sm" />

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
      </div>
    </div>
  );
};
