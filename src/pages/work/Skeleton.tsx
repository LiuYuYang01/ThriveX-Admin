export default function WorkSkeleton() {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-gray-100 bg-white px-6 py-3 shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="skeleton h-8" style={{ width: 150 }} />
      </div>

      <div className="min-h-[calc(100vh-160px)] rounded-xl border border-gray-100 bg-white px-5 py-3 shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="flex w-full flex-col md:flex-row">
          <div className="mb-5 w-full min-w-[200px] border-stroke pr-4 md:mb-0 md:min-h-96 md:w-2/12 md:border-r md:border-b-transparent dark:border-strokedark">
            <ul className="space-y-1">
              {[1, 2, 3].map((item) => (
                <li key={item} className="flex w-full items-center px-4 py-3">
                  <div className="skeleton mr-4 h-8 w-8 rounded-md" />
                  <div className="skeleton h-5 rounded-sm" style={{ width: 64 }} />
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full space-y-6 py-4 md:w-10/12 md:pl-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="border-b border-gray-100 pb-4 dark:border-strokedark">
                <div className="space-y-2">
                  <div className="skeleton h-4 w-full rounded-sm" />
                  <div className="skeleton h-4 rounded-sm" style={{ width: '72%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
