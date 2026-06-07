import TitleSkeleton from '@/components/Title/Skeleton';

export default function WorkSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TitleSkeleton titleWidth={96} action="text" actionWidth={140} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white px-5 py-5 dark:border-strokedark dark:bg-boxdark"
          >
            <div className="skeleton size-12 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <div className="skeleton h-9 w-10 rounded-md" />
                <div className="skeleton h-3 w-4 rounded-sm" />
              </div>
              <div className="skeleton mt-2 h-3 w-24 rounded-sm" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white dark:border-strokedark dark:bg-boxdark"
            >
              <div className="flex gap-4 px-5 py-4">
                <div className="skeleton size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="skeleton h-5 w-20 rounded-sm" />
                        <div className="skeleton h-4 w-16 rounded-md" />
                      </div>
                      <div className="skeleton h-3 w-32 rounded-sm" />
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <div className="skeleton size-8 rounded-lg" />
                      <div className="skeleton size-8 rounded-lg" />
                      <div className="skeleton size-8 rounded-lg" />
                    </div>
                  </div>
                  <div className="skeleton mt-3 h-16 w-full rounded-xl" />
                  <div className="mt-3 flex gap-2">
                    <div className="skeleton h-6 w-20 rounded-md" />
                    <div className="skeleton h-6 w-32 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
