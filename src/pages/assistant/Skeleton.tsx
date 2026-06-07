import TitleSkeleton from '@/components/Title/Skeleton';

/** 助手管理首屏骨架 */
export default function AssistantPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TitleSkeleton titleWidth={96} action="button" actionWidth={96} />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 dark:border-strokedark dark:bg-boxdark-2/40">
        <div className="flex items-center gap-2">
          <div className="skeleton size-8 shrink-0 rounded-lg" />
          <div className="skeleton h-4 rounded-md" style={{ width: 140 }} />
        </div>
        <div className="hidden h-4 w-px bg-slate-200 sm:block dark:bg-strokedark" />
        <div className="skeleton h-4 rounded-md" style={{ width: 180 }} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-strokedark dark:bg-boxdark"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="skeleton size-12 shrink-0 rounded-xl" />
                <div className="space-y-2">
                  <div className="skeleton h-4 rounded-md" style={{ width: 120 }} />
                  <div className="skeleton h-5 rounded-full" style={{ width: 88 }} />
                </div>
              </div>
              <div className="skeleton size-8 rounded-lg" />
            </div>
            <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-strokedark dark:bg-boxdark-2/50">
              <div className="skeleton mb-2 h-3 rounded-md" style={{ width: 96 }} />
              <div className="skeleton h-4 w-full rounded-md" />
              <div className="skeleton mt-1.5 h-4 rounded-md" style={{ width: '85%' }} />
            </div>
            <div className="skeleton mt-auto h-10 w-full rounded-xl" />
          </div>
        ))}

        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 p-5 dark:border-strokedark">
          <div className="skeleton size-10 rounded-xl" />
          <div className="skeleton h-4 rounded-md" style={{ width: 96 }} />
        </div>
      </div>
    </div>
  );
}
