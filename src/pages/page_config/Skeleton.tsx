export default function ConfigSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* 头部骨架 */}
      <div className="shrink-0 flex items-center justify-between rounded-xl border border-gray-100 bg-white px-6 py-4 dark:border-strokedark dark:bg-boxdark">
        <div className="skeleton h-8 w-32" />
        <div className="flex gap-2">
          <div className="skeleton h-10 w-24 rounded-lg" />
          <div className="skeleton h-10 w-24 rounded-lg" />
        </div>
      </div>

      <div className="grid rounded-xl! flex-1 min-h-0 grid-cols-1 gap-4 lg:grid-cols-12">
        {/* 左侧列表骨架 */}
        <div className="lg:col-span-3 rounded-xl border border-gray-100 bg-white dark:border-strokedark dark:bg-boxdark overflow-hidden">
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-strokedark">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="skeleton h-5 w-24 rounded" />
                  <div className="skeleton h-2 w-2 rounded-full" />
                </div>
                <div className="skeleton h-3 w-32 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* 右侧预览骨架 */}
        <div className="lg:col-span-9 rounded-xl! flex flex-col rounded-xl border border-gray-100 bg-white p-6 dark:border-strokedark dark:bg-boxdark">
          <div className="flex flex-1 min-h-0 flex-col space-y-6">
            <div className="shrink-0 border-b border-gray-100 pb-4 dark:border-strokedark">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="skeleton h-6 w-48 rounded" />
                  <div className="skeleton h-5 w-16 rounded-md" />
                </div>
                <div className="skeleton h-4 w-64 rounded" />
              </div>
            </div>

            <div className="flex flex-1 min-h-0 flex-col space-y-3">
              <div className="shrink-0 flex justify-between items-center">
                <div className="skeleton h-5 w-32 rounded" />
                <div className="skeleton h-8 w-8 rounded" />
              </div>
              <div className="skeleton flex-1 min-h-0 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

