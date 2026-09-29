import { Fragment, useMemo } from 'react';
import { FiMapPin } from 'react-icons/fi';

import { RecordActions, RecordLikeCount, RecordMoodTag } from './recordBits';
import { RecordMediaStrip } from './recordTableShared';
import { formatRecordTime, groupRecordsByDay } from './recordMeta';
import type { Record } from '@/types/app/record';

export function RecordFeed({
  list,
  onDelete,
  deletingId,
  onComments,
}: {
  list: Record[];
  onDelete: (id: number) => void;
  deletingId: number | null;
  onComments: (record: Record) => void;
}) {
  const groups = useMemo(() => groupRecordsByDay(list), [list]);

  return (
    <div className="space-y-1">
      {groups.map((group) => (
        <Fragment key={group.key}>
          <div className="sticky top-0 z-10 flex items-center gap-2.5 bg-slate-100/85 py-2.5 pr-1 backdrop-blur-sm dark:bg-[#0b0f14]/85">
            <span
              className={`size-2 shrink-0 rounded-full ${group.isToday ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600'}`}
            />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{group.main}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{group.sub}</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-strokedark" />
            <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {group.items.length} 条
            </span>
          </div>

          <ul className="mb-3 space-y-2.5">
            {group.items.map((row, index) => (
              <li
                key={row.id}
                className="rise-in motion-reduce:animate-none"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <article className="group/rec rounded-2xl border border-slate-200/80 bg-white transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50/60 focus-within:border-primary/40 dark:border-strokedark dark:bg-boxdark dark:hover:border-slate-600 dark:hover:bg-white/[0.03]">
                  {/* 宽屏时附件走右侧一栏：正文拿到 68ch 的阅读宽度，卡片也矮一截 */}
                  <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:gap-5">
                    <div className="min-w-0 flex-1 lg:max-w-[68ch]">
                      {row.content ? (
                        <p className="line-clamp-6 whitespace-pre-line text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                          {row.content}
                        </p>
                      ) : (
                        <p className="text-sm italic text-slate-500 dark:text-slate-400">
                          这条闪念没有文字，只有附件
                        </p>
                      )}
                    </div>

                    <RecordMediaStrip
                      imagesRaw={row.images}
                      video={row.video}
                      className="lg:ml-auto lg:justify-end"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 px-4 py-2 dark:border-strokedark">
                    <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                      #{row.id}
                    </span>

                    <RecordMoodTag mood={row.mood} />

                    {row.location ? (
                      <span className="flex min-w-0 max-w-52 items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <FiMapPin size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
                        <span className="truncate" title={row.location}>
                          {row.location}
                        </span>
                      </span>
                    ) : null}

                    <div className="ml-auto flex shrink-0 items-center gap-2.5">
                      <time className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {formatRecordTime(row.createTime)}
                      </time>

                      <RecordLikeCount count={row.likeCount} />

                      <RecordActions
                        record={row}
                        onDelete={onDelete}
                        deleting={deletingId === row.id}
                        onComments={onComments}
                      />
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </div>
  );
}
