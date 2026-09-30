import TitleSkeleton from '@/components/Title/Skeleton';

/** 与真实工具条一一对应：搜索框、日期范围、视图切换、重置。 */
const ToolbarSkeleton = () => (
  <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-strokedark dark:bg-boxdark">
    <div className="skeleton h-9 w-full rounded-lg sm:w-52" />
    <div className="skeleton h-9 w-full rounded-lg sm:w-60" />
    <div className="ml-auto flex shrink-0 items-center gap-2">
      <div className="skeleton hidden h-3 w-16 rounded-sm sm:block" />
      <div className="skeleton h-8 w-16 rounded-lg" />
      <div className="skeleton size-8 rounded-lg" />
    </div>
  </div>
);

/** 日分组标题 */
const DayHeaderSkeleton = ({ wide = false }: { wide?: boolean }) => (
  <div className="flex items-center gap-2.5 pt-2.5 pb-1.5">
    <div className="skeleton size-2.5 rounded-full" />
    <div className={`skeleton h-5 rounded-md ${wide ? 'w-14' : 'w-18'}`} />
    <div className="skeleton h-3 w-8 rounded-sm" />
    <div className="h-px flex-1" />
    <div className="skeleton h-3 w-10 rounded-sm" />
  </div>
);

/** 轨道上的闪念：左侧心情站点圆 + 右侧挂着的卡片 */
const RailCardSkeleton = ({ withMedia = false }: { withMedia?: boolean }) => (
  <li className="relative pb-2.5 pl-6 last:pb-0">
    <div className="skeleton absolute -left-[18px] top-3 size-9 rounded-full" />

    <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
      <div className="p-4">
        <div className="skeleton h-4 w-full rounded" />
        <div className="mt-2.5 skeleton h-4 w-[78%] rounded" />
        {withMedia ? (
          <div className="mt-3 flex gap-1.5">
            <div className="skeleton size-12 rounded-lg sm:size-14" />
            <div className="skeleton size-12 rounded-lg sm:size-14" />
            <div className="skeleton size-12 rounded-lg sm:size-14" />
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-2 dark:border-strokedark">
        <div className="skeleton h-3 w-32 rounded-sm" />
        <div className="ml-auto flex items-center gap-2.5">
          <div className="skeleton h-3 w-20 rounded-sm" />
          <div className="skeleton h-3 w-7 rounded-sm" />
          <div className="skeleton size-8 rounded-lg" />
          <div className="skeleton size-8 rounded-lg" />
          <div className="skeleton size-8 rounded-lg" />
        </div>
      </div>
    </div>
  </li>
);

export default function RecordSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <TitleSkeleton titleWidth={96} action="button" actionWidth={96} />

      <ToolbarSkeleton />

      <div className="min-h-0 flex-1 overflow-hidden">
        <DayHeaderSkeleton wide />
        <ol className="mb-4 ml-[18px] border-l border-slate-300/70 dark:border-strokedark">
          <RailCardSkeleton withMedia />
          <RailCardSkeleton />
          <RailCardSkeleton withMedia />
          <RailCardSkeleton />
        </ol>

        <DayHeaderSkeleton />
        <ol className="mb-4 ml-[18px] border-l border-slate-300/70 dark:border-strokedark">
          <RailCardSkeleton withMedia />
          <RailCardSkeleton />
          <RailCardSkeleton />
        </ol>

        <div className="flex justify-end py-3">
          <div className="skeleton h-8 w-56 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
