export default function SwiperSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-2">
      <div className="px-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="skeleton h-8" style={{ width: 200 }} />
          <div className="skeleton h-9 rounded-md" style={{ width: 108 }} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="min-h-0 flex-1 px-6 py-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="mb-4 flex items-center gap-4">
              <div className="skeleton shrink-0 rounded-md" style={{ width: 72, height: 16 }} />
              <div className="skeleton shrink-0 rounded-lg" style={{ width: 180, height: 56 }} />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-4 w-full rounded-sm" />
                <div className="skeleton h-3 rounded-sm" style={{ width: '62%' }} />
              </div>
              <div className="skeleton h-8 w-[84px] shrink-0 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
