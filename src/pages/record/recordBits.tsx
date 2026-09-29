import { Link } from 'react-router-dom';
import { Popconfirm, Tooltip } from 'antd';
import { FiEdit2, FiHeart, FiMessageSquare, FiTrash2 } from 'react-icons/fi';

import { getMoodLabel } from './recordMeta';
import type { Record } from '@/types/app/record';

const actionLink =
  'flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-400! transition-colors hover:bg-slate-100! hover:text-primary! dark:hover:bg-white/5! dark:hover:text-primary!';

const dangerButton =
  'flex size-8 cursor-pointer items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300';

/** 点赞数：0 的时候保持安静，避免整屏都是实心红心。 */
export function RecordLikeCount({ count }: { count?: number }) {
  const value = count ?? 0;

  if (value > 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-medium tabular-nums text-rose-500 dark:text-rose-400"
        title={`${value} 个赞`}
      >
        <FiHeart size={13} className="fill-current" />
        {value}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs tabular-nums text-slate-500 dark:text-slate-400"
      title="还没有人点赞"
    >
      <FiHeart size={13} />
      {value}
    </span>
  );
}

/** 心情：emoji 后面补上 MOOD_OPTIONS 里登记的中文标签，纯 emoji 扫不出区别。 */
export function RecordMoodTag({ mood }: { mood?: string }) {
  if (!mood) return null;

  const label = getMoodLabel(mood);

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
      title={label ? `心情：${label}` : '心情'}
    >
      <span className="text-[13px] leading-none">{mood}</span>
      {label ? <span className="font-medium">{label}</span> : null}
    </span>
  );
}

/** 行内操作：弹框查看评论、改发布页、删除。各视图共用同一组，行为一致。 */
export function RecordActions({
  record,
  onDelete,
  deleting,
  onComments,
}: {
  record: Record;
  onDelete: (id: number) => void;
  deleting: boolean;
  onComments: (record: Record) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Tooltip title="查看评论">
        <button
          type="button"
          onClick={() => onComments(record)}
          className={actionLink}
          aria-label="查看这条闪念的评论"
        >
          <FiMessageSquare size={15} />
        </button>
      </Tooltip>

      <Tooltip title="编辑闪念">
        <Link to={`/create_record?id=${record.id}`} className={actionLink} aria-label="编辑闪念">
          <FiEdit2 size={15} />
        </Link>
      </Tooltip>

      <Popconfirm
        title="删除闪念"
        description="你确定要删除吗？"
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        onConfirm={() => onDelete(record.id!)}
      >
        <Tooltip title="删除闪念">
          <button type="button" disabled={deleting} className={dangerButton} aria-label="删除闪念">
            {deleting ? (
              <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-red-500" />
            ) : (
              <FiTrash2 size={15} />
            )}
          </button>
        </Tooltip>
      </Popconfirm>
    </div>
  );
}
