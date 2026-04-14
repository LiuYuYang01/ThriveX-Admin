export default function WebSkeleton() {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-gray-100 bg-white px-6 py-3 shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-between">
          <div className="skeleton h-8" style={{ width: 150 }} />
          <div className="skeleton h-9 rounded-md" style={{ width: 108 }} />
        </div>
      </div>

      <div className="WebPage min-h-[calc(100vh-160px)] rounded-xl border border-gray-100 bg-white px-5 py-3 shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="mb-3 flex w-full justify-center">
          <div className="skeleton h-10 rounded-md" style={{ width: 300 }} />
        </div>

        <div className="space-y-10">
          {[1, 2, 3].map((group) => (
            <div key={group} className="space-y-6">
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 dark:border-strokedark dark:bg-boxdark-2/50">
                <div className="skeleton h-5 w-5 rounded-sm" />
                <div className="skeleton h-6 rounded-sm" style={{ width: 150 }} />
              </div>

              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="flex flex-col items-center rounded-3xl border border-gray-100 bg-white p-6 pb-4 shadow-xs dark:border-strokedark dark:bg-boxdark-2/50"
                  >
                    <div className="skeleton mb-4 h-20 w-20 rounded-full" />
                    <div className="skeleton mb-2 h-5 w-full rounded-sm" />
                    <div className="skeleton mb-4 h-4 w-full rounded-sm" />
                    <div className="skeleton h-6 rounded-full" style={{ width: 86 }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
