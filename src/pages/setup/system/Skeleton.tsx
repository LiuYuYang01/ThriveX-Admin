export default function SystemSetupSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="skeleton mb-4 h-8 w-32 rounded" />

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-3 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex flex-col p-2 gap-0.5">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                <div className="skeleton h-8 w-8 shrink-0 rounded-lg" />
                <div className="flex flex-1 flex-col gap-1">
                  <div className="skeleton h-4 w-20 rounded" />
                  <div className="skeleton h-3 w-32 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-9 flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3 dark:border-strokedark">
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton h-4 w-12 rounded" />
          </div>
          <div className="flex-1 p-6 space-y-4">
            <div className="skeleton h-5 w-48 rounded" />
            <div className="skeleton h-10 w-full rounded-lg" />
            <div className="skeleton h-10 w-full rounded-lg" />
            <div className="skeleton h-10 w-full rounded-lg" />
            <div className="skeleton h-10 w-2/3 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
