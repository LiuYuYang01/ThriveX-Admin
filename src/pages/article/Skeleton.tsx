export default () => {
  return (
    <div className="space-y-2">
      <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark">
        <div className="skeleton h-8" style={{ width: 200 }} />
      </div>

      <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark">
        <div className="flex justify-between mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="skeleton h-9" style={{ width: 200 }} />
            <div className="skeleton h-9" style={{ width: 180 }} />
            <div className="skeleton h-9" style={{ width: 180 }} />
            <div className="skeleton h-9" style={{ width: 280 }} />
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-9 rounded-md" style={{ width: 80 }} />
            <div className="skeleton h-9 rounded-md" style={{ width: 80 }} />
          </div>
        </div>

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
  )
}