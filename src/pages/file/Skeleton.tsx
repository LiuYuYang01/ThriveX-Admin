export default () => {
  return (
    <div className="space-y-2">
      <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark">
        <div className="flex items-center justify-between gap-4">
          <div className="skeleton h-8" style={{ width: 180 }} />
          <div className="flex gap-2">
            <div className="skeleton h-9 rounded-md" style={{ width: 90 }} />
            <div className="skeleton h-9 rounded-md" style={{ width: 100 }} />
            <div className="skeleton h-9 rounded-md" style={{ width: 100 }} />
          </div>
        </div>
      </div>

      <div className="px-6 py-5 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark space-y-4">
        <div className="flex items-center gap-3">
          <div className="skeleton h-8 w-8 rounded-md shrink-0" />
          <div className="skeleton h-8 flex-1 rounded-md" />
        </div>

        <div className="flex justify-between gap-4 flex-wrap">
          <div className="skeleton h-9 rounded-md" style={{ width: 220 }} />
          <div className="flex gap-2 flex-wrap">
            <div className="skeleton h-9 rounded-md" style={{ width: 140 }} />
            <div className="skeleton h-9 rounded-md" style={{ width: 160 }} />
            <div className="skeleton h-9 rounded-md" style={{ width: 120 }} />
            <div className="skeleton h-9 rounded-md" style={{ width: 260 }} />
          </div>
        </div>

        <div className="grid gap-[18px] grid-cols-[repeat(auto-fill,minmax(232px,1fr))]">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-gray-100 dark:border-strokedark bg-white dark:bg-boxdark-2/50"
            >
              <div className="skeleton aspect-4/3 w-full" />
              <div className="p-3 space-y-2">
                <div className="skeleton h-4 w-[78%] rounded-sm" />
                <div className="skeleton h-3 w-[45%] rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
