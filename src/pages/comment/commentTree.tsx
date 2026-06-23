import type { ExpandableConfig } from 'antd/es/table/interface';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

type TreeItem = {
  id?: number;
  commentId?: number;
  createTime: number;
  children?: TreeItem[];
};

export function normalizeCommentTree<T extends { children?: T[] }>(items: T[]): T[] {
  return items.map((item) => {
    const children = item.children?.length ? normalizeCommentTree(item.children) : undefined;
    return { ...item, children };
  });
}

export function buildCommentTree<T extends TreeItem>(items: T[], parentId = 0): T[] {
  return items
    .filter((item) => (item.commentId ?? 0) === parentId)
    .map((item) => {
      const children = buildCommentTree(items, item.id!);
      return {
        ...item,
        children: children.length > 0 ? children : undefined,
      };
    })
    .sort((a, b) => {
      if (parentId === 0) return +b.createTime - +a.createTime;
      return +a.createTime - +b.createTime;
    });
}

export function findInCommentTree<T extends { id?: number; children?: T[] }>(
  items: T[],
  id: number,
): T | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children?.length) {
      const found = findInCommentTree(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

export const commentExpandColumn = {
  title: '',
  key: 'expand',
  width: 44,
  className: 'comment-tree-expand-col',
  render: () => null,
};

export const commentTableExpandable: ExpandableConfig<unknown> = {
  expandIconColumnIndex: 0,
  columnWidth: 44,
  expandIcon: ({ expanded, onExpand, record }) => {
    const children = (record as TreeItem).children;
    if (!children?.length) {
      return <span className="inline-block w-6" aria-hidden />;
    }
    return (
      <button
        type="button"
        aria-label={expanded ? '收起回复' : '展开回复'}
        onClick={(e) => onExpand(record, e)}
        className="ml-2 flex size-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-300 cursor-pointer"
      >
        {expanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
      </button>
    );
  },
};

export const commentTableTreeClassName =
  'min-h-0 flex-1 [&_.ant-table-thead>tr>th]:bg-slate-50! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-slate-500! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! dark:[&_.ant-table-thead>tr>th]:text-slate-400! [&_.comment-tree-expand-col]:px-0! [&_.comment-tree-expand-col]:text-center!';
