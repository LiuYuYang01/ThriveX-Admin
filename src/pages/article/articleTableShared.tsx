import { Popover } from 'antd';

import type { Article } from '@/types/app/article';

const TAG_PILL_CLASSES = [
  'bg-slate-100 text-slate-600 dark:bg-boxdark-2 dark:text-slate-300',
  'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
] as const;

export const VISIBLE_TAG_COUNT = 1;

function TagPill({ name, index }: { name: string; index: number }) {
  return (
    <span
      className={`inline-flex max-w-[120px] items-center truncate rounded-md px-2 py-0.5 text-xs font-medium ${TAG_PILL_CLASSES[index % TAG_PILL_CLASSES.length]}`}
    >
      {name}
    </span>
  );
}

export function renderCollapsibleTags<T extends { id?: number; name: string }>(
  list: T[],
  keyPrefix: string,
) {
  if (list.length === 0) {
    return <span className="text-xs text-slate-400 dark:text-slate-500">—</span>;
  }

  const visible = list.slice(0, VISIBLE_TAG_COUNT);
  const restCount = list.length - VISIBLE_TAG_COUNT;
  const popoverContent = (
    <div className="flex max-w-[280px] flex-wrap gap-1.5">
      {list.map((item, index) => (
        <TagPill key={item.id ?? index} name={item.name} index={index} />
      ))}
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((item, index) => (
        <TagPill key={`${keyPrefix}-${item.id ?? index}`} name={item.name} index={index} />
      ))}
      {restCount > 0 && (
        <Popover content={popoverContent} trigger="hover" placement="topLeft">
          <button
            type="button"
            className="inline-flex h-6 min-w-7 items-center justify-center rounded-md bg-slate-100 px-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-200 dark:bg-boxdark-2 dark:text-slate-400 dark:hover:bg-white/10 cursor-pointer"
          >
            +{restCount}
          </button>
        </Popover>
      )}
    </div>
  );
}

export const sortArticleByView = (a: Article, b: Article) => (a.view ?? 0) - (b.view ?? 0);

export const sortArticleByComment = (a: Article, b: Article) =>
  (a.comment ?? 0) - (b.comment ?? 0);

export const sortArticleByCreateTime = (a: Article, b: Article) =>
  Number(a.createTime ?? 0) - Number(b.createTime ?? 0);
