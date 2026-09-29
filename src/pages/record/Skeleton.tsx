import TitleSkeleton from '@/components/Title/Skeleton';

/** 与真实工具条一一对应：搜索框、日期范围、3 个快捷 chip、视图切换、重置。 */
const ToolbarSkeleton = () => (
  <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-strokedark dark:bg-boxdark">
    <div className="skeleton h-9 w-full rounded-lg sm:w-52" />
    <div className="skeleton h-9 w-full rounded-lg sm:w-60" />
    <div className="flex shrink-0 items-center gap-1.5">
      <div className="skeleton h-7 w-12 rounded-full" />
      <div className="skeleton h-7 w-12 rounded-full" />
      <div className="skeleton h-7 w-14 rounded-full" />
    </div>
    <div className="ml-auto flex shrink-0 items-center gap-2">
      <div className="skeleton hidden h-3 w-16 rounded-sm sm:block" />
      <div className="skeleton h-8 w-16 rounded-lg" />
      <div className="skeleton size-8 rounded-lg" />
    </div>
  </div>
);

/** 日分组标题 */
const DayHeaderSkeleton = ({ wide = false }: { wide?: boolean }) => (
  <div className="flex items-center gap-2.5 py-2.5">
    <div className="skeleton size-2 rounded-full" />
    <div className={`skeleton h-4 rounded-md ${wide ? 'w-12' : 'w-16'}`} />
    <div className="skeleton h-3 w-8 rounded-sm" />
    <div className="h-px flex-1" />
    <div className="skeleton h-3 w-10 rounded-sm" />
  </div>
);

/** 闪念卡片：正文两行 + 附件条 + meta 分割线 */
const CardSkeleton = ({ withMedia = false }: { withMedia?: boolean }) => (
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
      <div className="skeleton h-3 w-8 rounded-sm" />
      <div className="skeleton h-5 w-16 rounded-full" />
      <div className="skeleton h-3 w-32 rounded-sm" />
      <div className="ml-auto flex items-center gap-2.5">
        <div className="skeleton h-3 w-20 rounded-sm" />
        <div className="skeleton h-3 w-7 rounded-sm" />
        <div className="skeleton size-8 rounded-lg" />
        <div className="skeleton size-8 rounded-lg" />
      </div>
    </div>
  </div>
);

export default function RecordSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <TitleSkeleton titleWidth={96} action="button" actionWidth={96} />

      <ToolbarSkeleton />

      <div className="min-h-0 flex-1 overflow-hidden">
        <DayHeaderSkeleton wide />
        <div className="mb-3 space-y-2.5">
          <CardSkeleton withMedia />
          <CardSkeleton />
          <CardSkeleton withMedia />
          <CardSkeleton />
        </div>

        <DayHeaderSkeleton />
        <div className="space-y-2.5">
          <CardSkeleton withMedia />
          <CardSkeleton />
          <CardSkeleton />
        </div>

        <div className="flex justify-center py-3">
          <div className="skeleton h-8 w-56 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
