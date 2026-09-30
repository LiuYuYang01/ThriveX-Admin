import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown, FiMapPin } from 'react-icons/fi';

import { RecordActions, RecordLikeCount } from './recordBits';
import { RecordMediaStrip } from './recordTableShared';
import { formatRecordTime, getMoodLabel, groupRecordsByDay } from './recordMeta';
import type { Record } from '@/types/app/record';

/** 卡片正文：超过 6 行折叠，展开/收起入口只在确实被折叠过的内容上出现。 */
function ExpandableContent({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const [toggleable, setToggleable] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  // 只有折叠态量得出 scrollHeight 差；展开后不再重置标记，避免「收起」入口消失
  useLayoutEffect(() => {
    const el = ref.current;
    if (!expanded && el && el.scrollHeight > el.clientHeight + 1) {
      setToggleable(true);
    }
  }, [content, expanded]);

  return (
    <div>
      <p
        ref={ref}
        className={`whitespace-pre-line text-sm leading-relaxed text-slate-800 dark:text-slate-100 ${
          expanded ? '' : 'line-clamp-6'
        }`}
      >
        {content}
      </p>
      {toggleable ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 inline-flex cursor-pointer items-center gap-0.5 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? '收起' : '展开全文'}
          <FiChevronDown size={12} className={expanded ? 'rotate-180' : ''} />
        </button>
      ) : null}
    </div>
  );
}

/**
 * 时间轨布局：每个日期分段一条轨道，心情 emoji 是轨道上的站点，卡片挂在站点右侧。
 * 没写心情的闪念退化为空心小圆点，保证轨道始终连续。
 */
function MoodNode({ mood }: { mood?: string }) {
  if (!mood) {
    return (
      <span
        aria-hidden
        className="absolute top-[21px] -left-[5px] size-2.5 rounded-full border-2 border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-boxdark"
      />
    );
  }

  const label = getMoodLabel(mood);

  return (
    <span
      title={label ? `心情：${label}` : '心情'}
      className="absolute -left-[18px] top-3 flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm leading-none dark:border-strokedark dark:bg-boxdark"
    >
      {mood}
    </span>
  );
}

export function RecordFeed({
  list,
  onDelete,
  deletingIds,
  onComments,
}: {
  list: Record[];
  onDelete: (id: number) => void;
  deletingIds: number[];
  onComments: (record: Record) => void;
}) {
  const groups = useMemo(() => groupRecordsByDay(list), [list]);

  return (
    <div>
      {groups.map((group) => (
        <section key={group.key}>
          <div className="sticky top-0 z-10 flex items-center gap-2.5 bg-slate-100/85 pt-2.5 pb-1.5 pr-1 backdrop-blur-sm dark:bg-[#0b0f14]/85">
            <span
              className={`size-2.5 shrink-0 rounded-full ${group.isToday ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600'}`}
            />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {group.main}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{group.sub}</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-strokedark" />
            <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {group.items.length} 条
            </span>
          </div>

          <ol className="mb-4 ml-[18px] border-l border-slate-300/70 dark:border-strokedark">
            {group.items.map((row) => (
              <li key={row.id} className="relative pb-2.5 pl-6 last:pb-0">
                <MoodNode mood={row.mood} />

                <article className="group/rec rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60 focus-within:border-primary/40 dark:border-strokedark dark:bg-boxdark dark:hover:border-slate-600 dark:hover:bg-white/[0.03]">
                  {/* 宽屏时附件走右侧一栏：正文拿到 68ch 的阅读宽度，卡片也矮一截 */}
                  <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:gap-5">
                    <div className="min-w-0 flex-1 lg:max-w-[68ch]">
                      {row.content ? (
                        <ExpandableContent content={row.content} />
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
                        deleting={deletingIds.includes(row.id!)}
                        onComments={onComments}
                      />
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
