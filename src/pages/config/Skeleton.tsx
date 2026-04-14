export default function ConfigSkeleton() {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-gray-100 bg-white px-6 py-3 shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="skeleton h-8" style={{ width: 150 }} />
      </div>

      <div className="border-stroke mt-2 min-h-[calc(100vh-160px)] rounded-xl border bg-white px-5 py-3 shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-[20%] md:mr-5 mb-10 md:mb-0 border-b-0 md:border-r border-stroke dark:border-strokedark divide-y divide-solid divide-[#F6F6F6] dark:divide-strokedark">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-3 pl-5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="skeleton h-5 w-[120px] rounded-sm" />
                  <div className="skeleton h-5 w-[64px] rounded-sm" />
                </div>
                <div className="space-y-2">
                  <div className="skeleton h-4 w-full rounded-sm" />
                  <div className="skeleton h-4 w-3/4 rounded-sm" />
                </div>
              </div>
            ))}
          </div>

          <div className="w-full md:w-[80%] px-0 md:px-8">
            <div className="mb-4 flex items-center justify-between border-b border-stroke pb-3 dark:border-strokedark">
              <div className="skeleton h-7 w-[220px] rounded-sm" />
              <div className="skeleton h-10 w-[120px] rounded-md" />
            </div>

            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton h-4 w-full rounded-sm" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
