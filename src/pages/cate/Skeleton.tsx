export default () => {
  return (
    <div className="space-y-2">
      <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark">
        <div className="flex items-center justify-between gap-4">
          <div className="skeleton h-8" style={{ width: 180 }} />
          <div className="skeleton h-9 rounded-md" style={{ width: 108 }} />
        </div>
      </div>

      <div className="px-6 py-5 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark min-h-[calc(100vh-160px)]">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="skeleton h-4 w-4 rounded-sm" />
                  <div className="skeleton h-6 rounded-sm" style={{ width: 180 }} />
                </div>
                <div className="skeleton h-7 rounded-md" style={{ width: 56 }} />
              </div>

              {item <= 3 && (
                <div className="ml-8 space-y-2.5">
                  {[1, 2].map((child) => (
                    <div key={child} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="skeleton h-3.5 w-3.5 rounded-sm" />
                        <div className="skeleton h-5 rounded-sm" style={{ width: 140 }} />
                      </div>
                      <div className="skeleton h-6 rounded-md" style={{ width: 48 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
