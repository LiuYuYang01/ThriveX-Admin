/** 助手管理首屏骨架（与文章模块一致使用 custom.scss 的 .skeleton） */
export default function AssistantPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-2">
      <div className="rounded-xl border border-gray-100 bg-white px-6 py-3 shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-between">
          <div className="skeleton h-8" style={{ width: 160 }} />
          <div className="skeleton h-9 rounded-md" style={{ width: 100 }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs dark:border-strokedark dark:bg-boxdark"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="skeleton shrink-0 rounded-md" style={{ width: 48, height: 48 }} />
                <div className="space-y-2">
                  <div className="skeleton h-4 rounded-sm" style={{ width: 120 }} />
                  <div className="skeleton h-3 rounded-sm" style={{ width: 88 }} />
                </div>
              </div>
              <div className="skeleton h-8 rounded-md" style={{ width: 32 }} />
            </div>
            <div className="mb-4 rounded-md border border-gray-100 bg-gray-50/80 p-3 dark:border-strokedark dark:bg-boxdark-2/50">
              <div className="skeleton mb-2 h-3 rounded-sm" style={{ width: 96 }} />
              <div className="skeleton h-4 w-full rounded-sm" />
              <div className="skeleton mt-1.5 h-4 rounded-sm" style={{ width: '85%' }} />
            </div>
            <div className="border-t border-gray-100 pt-2 dark:border-strokedark">
              <div className="skeleton h-9 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
