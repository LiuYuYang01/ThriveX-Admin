import { Tag, Popover } from 'antd';

import type { Article } from '@/types/app/article';

export const TAG_COLORS = [
  'default',
  'processing',
  'success',
  'warning',
  'cyan',
] as const;

export const VISIBLE_TAG_COUNT = 1;

export function renderCollapsibleTags<T extends { id?: number; name: string }>(
  list: T[],
  keyPrefix: string,
) {
  if (list.length === 0) return null;
  const visible = list.slice(0, VISIBLE_TAG_COUNT);
  const restCount = list.length - VISIBLE_TAG_COUNT;
  const items = (
    <div className="flex flex-wrap gap-1.5 max-w-[280px]">
      {list.map((item, index) => (
        <Tag
          key={item.id ?? index}
          color={TAG_COLORS[index % TAG_COLORS.length]}
          className="m-0! border-0!"
        >
          {item.name}
        </Tag>
      ))}
    </div>
  );
  return (
    <div className="flex flex-wrap items-center gap-1.5 justify-start">
      {visible.map((item, index) => (
        <Tag
          key={`${keyPrefix}-${item.id ?? index}`}
          color={TAG_COLORS[index % TAG_COLORS.length]}
          className="m-0! border-0!"
        >
          {item.name}
        </Tag>
      ))}

      {restCount > 0 && (
        <Popover
          content={items}
          trigger="hover"
          placement="topLeft"
          classNames={{ root: 'article-tags-popover' }}
        >
          <span
            className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-boxdark-2 dark:text-gray-400 dark:hover:bg-strokedark/80 border-0 cursor-pointer"
            role="button"
            tabIndex={0}
          >
            +{restCount}
          </span>
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
