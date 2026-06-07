export default function ConfigSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="skeleton mb-4 h-8 w-32 rounded" />

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-y-2 lg:grid-cols-12">
        <div className="lg:col-span-3 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-strokedark">
            <div className="skeleton h-5 w-5 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
            <div className="skeleton ml-auto h-5 w-6 rounded-full" />
          </div>

          <div className="flex flex-col p-2 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-3">
                <div className="skeleton h-9 w-9 shrink-0 rounded-lg" />
                <div className="skeleton h-4 w-24 flex-1 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-9 flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-strokedark dark:bg-boxdark lg:mx-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-strokedark">
            <div className="flex items-center gap-3">
              <div className="skeleton h-10 w-10 rounded-lg" />
              <div className="flex flex-col gap-1.5">
                <div className="skeleton h-5 w-32 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="skeleton h-8 w-8 rounded-lg" />
              <div className="skeleton h-8 w-8 rounded-lg" />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col p-4">
            <div className="mb-3 flex items-center gap-2 px-1">
              <div className="skeleton h-3 w-3 rounded" />
              <div className="skeleton h-3 w-16 rounded" />
            </div>
            <div className="skeleton flex-1 min-h-0 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
