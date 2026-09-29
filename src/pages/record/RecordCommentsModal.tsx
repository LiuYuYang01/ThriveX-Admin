import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Modal, Spin } from 'antd';
import { FiCornerUpRight, FiInbox, FiMessageSquare } from 'react-icons/fi';

import { getRecordCommentListAPI } from '@/api/recordComment';
import { CommentAvatar } from '@/pages/comment/shared';
import { buildCommentTree } from '@/pages/comment/commentTree';
import type { Record } from '@/types/app/record';
import type { RecordComment } from '@/types/app/recordComment';

import { formatRecordTime } from './recordMeta';

function CommentItem({ comment, isReply = false }: { comment: RecordComment; isReply?: boolean }) {
  return (
    <li
      className={
        isReply
          ? 'mt-2.5 border-l-2 border-slate-100 pl-3.5 dark:border-strokedark'
          : undefined
      }
    >
      <div className="flex items-start gap-2.5">
        <CommentAvatar avatar={comment.avatar} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {comment.name || '匿名'}
            </span>
            <time className="text-xs tabular-nums text-slate-400 dark:text-slate-500">
              {formatRecordTime(comment.createTime)}
            </time>
          </div>
          <p className="mt-0.5 text-sm leading-relaxed break-words whitespace-pre-line text-slate-700 dark:text-slate-200">
            {comment.content}
          </p>

          {comment.children?.length ? (
            <ul>
              {comment.children.map((child) => (
                <CommentItem key={child.id} comment={child} isReply />
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function RecordCommentsModal({
  record,
  onClose,
}: {
  record: Record | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [tree, setTree] = useState<RecordComment[]>([]);

  useEffect(() => {
    if (!record?.id) return;
    let stale = false;
    setLoading(true);
    getRecordCommentListAPI({ recordId: record.id, status: 1, pageNum: 1, pageSize: 9999 })
      .then(({ data }) => {
        if (!stale) setTree(buildCommentTree(data.result ?? []));
      })
      .catch((error) => {
        console.error('获取闪念评论失败：', error);
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [record]);

  const total = useMemo(() => {
    const count = (items: RecordComment[]): number =>
      items.reduce((sum, item) => sum + 1 + count(item.children ?? []), 0);
    return count(tree);
  }, [tree]);

  return (
    <Modal
      title={
        <span className="inline-flex items-center gap-2">
          <FiMessageSquare className="text-primary" />
          闪念评论
          <span className="text-xs font-normal tabular-nums text-slate-400 dark:text-slate-500">
            共 {total} 条
          </span>
        </span>
      }
      open={Boolean(record)}
      footer={null}
      onCancel={onClose}
      destroyOnClose
      width={620}
    >
      {record?.content ? (
        <div className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-3 dark:border-strokedark dark:bg-boxdark-2/60">
          <p className="line-clamp-2 text-sm leading-relaxed whitespace-pre-line text-slate-500 dark:text-slate-400">
            {record.content}
          </p>
        </div>
      ) : null}

      <div className="max-h-[52vh] min-h-24 overflow-y-auto">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Spin />
          </div>
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2 dark:text-slate-500">
              <FiInbox size={22} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              这条闪念还没有评论
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {tree.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </ul>
        )}
      </div>

      {record?.id ? (
        <div className="mt-4 flex justify-end border-t border-slate-100 pt-3 dark:border-strokedark">
          <Link
            to={`/comment?tab=record&recordId=${record.id}`}
            className="inline-flex items-center gap-1 text-xs text-primary transition-colors hover:underline cursor-pointer"
          >
            <FiCornerUpRight size={13} />
            前往评论管理回复或删除
          </Link>
        </div>
      ) : null}
    </Modal>
  );
}
