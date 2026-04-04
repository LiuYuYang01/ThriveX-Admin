export default () => {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-gray-100 bg-white px-6 py-3 shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="skeleton h-8" style={{ width: 200 }} />
      </div>

      <div className="rounded-xl border border-gray-100 bg-white px-6 py-3 shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="mb-6 flex flex-wrap justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="skeleton h-9" style={{ width: 220 }} />
            <div className="skeleton h-9" style={{ width: 260 }} />
          </div>
        </div>

        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="mb-4 flex items-center gap-4">
            <div className="skeleton shrink-0 rounded-lg" style={{ width: 56, height: 56 }} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton h-4 w-full rounded-sm" />
              <div className="skeleton h-3 rounded-sm" style={{ width: '60%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
