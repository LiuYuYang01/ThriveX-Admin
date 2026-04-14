export default () => {
  return (
    <div className="space-y-2">
      <div className="bg-primary rounded-md p-6 sm:p-10 flex flex-col justify-center h-[170px] relative overflow-hidden">
        <div className="relative z-10 w-full flex flex-col gap-2.5">
          <div className="skeleton h-10 rounded-md" style={{ width: 500, maxWidth: '100%', opacity: 0.8 }} />
          <div className="skeleton h-7 rounded-md" style={{ width: 300, maxWidth: '80%', opacity: 0.75 }} />
          <div className="skeleton h-5 rounded-md" style={{ width: 100, maxWidth: '40%', opacity: 0.7 }} />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-gray-100 dark:border-strokedark bg-white dark:bg-boxdark shadow-xs px-5 py-3"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="skeleton h-4 rounded-sm" style={{ width: 100 }} />
                <div className="skeleton h-8 rounded-sm" style={{ width: 80 }} />
              </div>
              <div className="skeleton size-10 rounded-md shrink-0" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg mt-2 grid grid-cols-12 gap-2">
        <div className="col-span-12 xl:col-span-8 rounded-xl border border-gray-100 dark:border-strokedark bg-white dark:bg-boxdark shadow-xs px-5 py-3">
          <div className="skeleton h-6 rounded-sm mb-4" style={{ width: 150 }} />
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton h-4 rounded-sm w-full" />
            ))}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 rounded-xl border border-gray-100 dark:border-strokedark bg-white dark:bg-boxdark shadow-xs px-5 py-3">
          <div className="skeleton h-6 rounded-sm mb-4" style={{ width: 120 }} />
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton h-4 rounded-sm w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
