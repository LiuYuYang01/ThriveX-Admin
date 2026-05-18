export default () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-2">
      <div className="px-3 mb-4">
        <div className="skeleton h-8" style={{ width: 200 }} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="shrink-0 px-6 py-3 space-y-4 border-b border-gray-100 bg-gray-50/30 dark:border-strokedark dark:bg-boxdark-2/50">
          <div className="flex gap-4 flex-wrap mb-6">
            <div className="skeleton h-9 rounded-md" style={{ width: 220 }} />
            <div className="skeleton h-9 rounded-md" style={{ width: 260 }} />
          </div>
        </div>

        <div className="min-h-0 flex-1 px-6 py-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex gap-4 mb-4 items-center">
              <div className="skeleton shrink-0 rounded-lg" style={{ width: 56, height: 56 }} />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="skeleton h-4 w-full rounded-sm" />
                <div className="skeleton h-3 rounded-sm" style={{ width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
