export default function WallSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-2">
      <div className="px-3 mb-4">
        <div className="skeleton h-8" style={{ width: 200 }} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="shrink-0 px-6 py-3 space-y-4 border-b border-gray-100 bg-gray-50/30 dark:border-strokedark dark:bg-boxdark-2/50">
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="skeleton h-9 rounded-md" style={{ width: 220 }} />
            <div className="skeleton h-9 rounded-md" style={{ width: 160 }} />
            <div className="skeleton h-9 rounded-md" style={{ width: 260 }} />
          </div>
        </div>

        <div className="min-h-0 flex-1 px-6 py-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="mb-4 flex items-center gap-4">
              <div className="skeleton h-4 w-[72px] shrink-0 rounded-sm" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-4 w-full rounded-sm" />
                <div className="skeleton h-3 rounded-sm" style={{ width: '65%' }} />
              </div>
              <div className="skeleton h-8 w-[96px] shrink-0 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
