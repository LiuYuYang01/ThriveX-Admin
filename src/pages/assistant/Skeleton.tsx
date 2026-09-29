import TitleSkeleton from '@/components/Title/Skeleton';

/** 助手管理首屏骨架 */
export default function AssistantPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TitleSkeleton titleWidth={96} action="button" actionWidth={96} />

      {/* 助手卡片阵容 */}
      <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl border-2 border-slate-200/80 bg-white p-5 dark:border-strokedark dark:bg-boxdark"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="skeleton size-12 shrink-0 rounded-xl" />
                <div className="space-y-2">
                  <div className="skeleton h-4 rounded-md" style={{ width: 112 }} />
                  <div className="skeleton h-3 rounded-md" style={{ width: 82 }} />
                </div>
              </div>
              <div className="skeleton size-8 rounded-lg" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 rounded-md" style={{ width: 64 }} />
              <div className="skeleton h-4 w-full rounded-md" />
              <div className="skeleton h-4 rounded-md" style={{ width: '70%' }} />
            </div>

            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4 dark:border-strokedark">
              <div className="skeleton h-9 flex-1 rounded-xl" />
              <div className="skeleton h-9 flex-1 rounded-xl" />
            </div>
          </div>
        ))}

        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-strokedark">
          <div className="skeleton size-11 rounded-xl" />
          <div className="skeleton h-4 rounded-md" style={{ width: 96 }} />
        </div>
      </div>
    </div>
  );
}
