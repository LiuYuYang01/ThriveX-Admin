export default () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-2">
      <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark">
        <div className="skeleton h-8" style={{ width: 150 }} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row gap-2">
        <div className="w-full md:w-[40%]">
          <div className="px-5 py-2 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark">
            <div className="skeleton h-8 w-full rounded-md" />
          </div>
        </div>

        <div className="w-full md:w-[59%]">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xs dark:border-strokedark dark:bg-boxdark">
            <div className="min-h-0 flex-1 px-4 py-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex gap-4 mb-2 items-center py-2 border-b border-gray-100">
                  <div className="skeleton shrink-0 rounded-md" style={{ width: 60, height: 20 }} />
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="skeleton h-5 w-full rounded-sm" />
                  </div>
                  <div className="skeleton shrink-0 rounded-md" style={{ width: 100, height: 20 }} />
                  <div className="skeleton shrink-0 rounded-md" style={{ width: 80, height: 20 }} />
                  <div className="skeleton shrink-0 rounded-md" style={{ width: 110, height: 20 }} />
                </div>
              ))}
            </div>

            <div className="flex justify-center py-4">
              <div className="skeleton h-8 rounded-md" style={{ width: 300 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
