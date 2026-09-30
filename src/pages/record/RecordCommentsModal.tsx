import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button, message, Modal, Pagination, Popconfirm, Spin } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { FiCornerUpRight, FiInbox, FiMessageSquare, FiTrash2, FiUser } from 'react-icons/fi';

import { addRecordCommentDataAPI, delRecordCommentDataAPI, getRecordCommentListAPI } from '@/api/recordComment';
import { CommentAvatar } from '@/pages/comment/shared';
import { buildCommentTree } from '@/pages/comment/commentTree';
import { useUserStore, useWebStore } from '@/stores';
import type { Record } from '@/types/app/record';
import type { RecordComment } from '@/types/app/recordComment';

import { formatRecordTime } from './recordMeta';

// 一次拉全量保证父子评论不被分页拆散，渲染层再按一级评论分页控制 DOM 规模
const THREAD_PAGE_SIZE = 10;

function CommentItem({
  comment,
  isReply = false,
  onReply,
  onDelete,
}: {
  comment: RecordComment;
  isReply?: boolean;
  onReply: (comment: RecordComment) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <li
      className={
        isReply
          ? 'mt-2.5 border-l-2 border-slate-100 pl-3.5 dark:border-strokedark'
          : undefined
      }
    >
      <div className="group/cmt flex items-start gap-2.5">
        <CommentAvatar avatar={comment.avatar} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {comment.name || '匿名'}
            </span>
            {comment.replyName ? (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                回复 {comment.replyName}
              </span>
            ) : null}
            <time className="text-xs tabular-nums text-slate-400 dark:text-slate-500">
              {formatRecordTime(comment.createTime)}
            </time>

            <span className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover/cmt:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                onClick={() => onReply(comment)}
                aria-label={`回复 ${comment.name || '匿名'}`}
                className="flex size-6 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-primary dark:hover:bg-white/5 dark:hover:text-primary"
              >
                <FiCornerUpRight size={13} />
              </button>
              <Popconfirm
                title="删除评论"
                description={`确定删除「${comment.name || '该用户'}」的这条评论吗？`}
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                onConfirm={() => onDelete(comment.id!)}
              >
                <button
                  type="button"
                  aria-label="删除评论"
                  className="flex size-6 cursor-pointer items-center justify-center rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                >
                  <FiTrash2 size={13} />
                </button>
              </Popconfirm>
            </span>
          </div>
          <p className="mt-0.5 text-sm leading-relaxed break-words whitespace-pre-line text-slate-700 dark:text-slate-200">
            {comment.content}
          </p>

          {comment.children?.length ? (
            <ul>
              {comment.children.map((child) => (
                <CommentItem key={child.id} comment={child} isReply onReply={onReply} onDelete={onDelete} />
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
  const [pageNum, setPageNum] = useState(1);

  const [replyTarget, setReplyTarget] = useState<RecordComment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySending, setReplySending] = useState(false);

  const user = useUserStore((state) => state.user);
  const web = useWebStore((state) => state.web);

  const fetchComments = useCallback(
    (withLoading = true) => {
      if (!record?.id) return;
      if (withLoading) setLoading(true);

      getRecordCommentListAPI({ recordId: record.id, status: 1, pageNum: 1, pageSize: 9999 })
        .then(({ data }) => {
          setTree(buildCommentTree(data.result ?? []));
        })
        .catch((error) => {
          console.error('获取闪念评论失败：', error);
        })
        .finally(() => {
          if (withLoading) setLoading(false);
        });
    },
    [record],
  );

  useEffect(() => {
    setPageNum(1);
    fetchComments();
  }, [fetchComments]);

  const total = useMemo(() => {
    const count = (items: RecordComment[]): number =>
      items.reduce((sum, item) => sum + 1 + count(item.children ?? []), 0);
    return count(tree);
  }, [tree]);

  const pageCount = Math.max(1, Math.ceil(tree.length / THREAD_PAGE_SIZE));
  const current = Math.min(pageNum, pageCount);
  const threads = tree.slice((current - 1) * THREAD_PAGE_SIZE, current * THREAD_PAGE_SIZE);

  const delComment = useCallback(
    async (id: number) => {
      try {
        await delRecordCommentDataAPI(id);
        message.success('评论已删除');
        fetchComments(false);
      } catch (error) {
        console.error('删除闪念评论失败：', error);
      }
    },
    [fetchComments],
  );

  const sendReply = async () => {
    if (!replyTarget?.id) return;
    if (!replyContent.trim()) {
      message.warning('请输入回复内容');
      return;
    }

    try {
      setReplySending(true);
      await addRecordCommentDataAPI({
        avatar: user.avatar,
        url: web.url,
        content: replyContent,
        commentId: replyTarget.id,
        status: 1,
        email: user.email,
        name: user.name,
        recordId: replyTarget.recordId,
        createTime: Date.now(),
      });

      message.success('回复成功');
      setReplyTarget(null);
      setReplyContent('');
      fetchComments(false);
    } catch (error) {
      console.error('回复闪念评论失败：', error);
    } finally {
      setReplySending(false);
    }
  };

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
            {threads.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={setReplyTarget}
                onDelete={delComment}
              />
            ))}
          </ul>
        )}
      </div>

      {pageCount > 1 && !loading ? (
        <div className="mt-3 flex justify-end">
          <Pagination
            current={current}
            pageSize={THREAD_PAGE_SIZE}
            total={tree.length}
            size="small"
            showSizeChanger={false}
            showTotal={(t) => `${t} 组对话`}
            onChange={setPageNum}
          />
        </div>
      ) : null}

      {record?.id ? (
        <div className="mt-4 flex justify-end border-t border-slate-100 pt-3 dark:border-strokedark">
          <Link
            to={`/comment?tab=record&recordId=${record.id}`}
            className="inline-flex cursor-pointer items-center gap-1 text-xs text-primary hover:underline"
          >
            <FiCornerUpRight size={13} />
            在评论管理中查看全部
          </Link>
        </div>
      ) : null}

      <Modal
        title={
          <span className="inline-flex items-center gap-2">
            <FiCornerUpRight className="text-primary" />
            回复评论
          </span>
        }
        open={Boolean(replyTarget)}
        footer={null}
        onCancel={() => setReplyTarget(null)}
        destroyOnClose
        classNames={{ body: 'pt-2!' }}
      >
        {replyTarget && (
          <div className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-3 dark:border-strokedark dark:bg-boxdark-2/60">
            <div className="mb-1.5 flex items-center gap-2">
              <FiUser size={14} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {replyTarget.name || '匿名'}
              </span>
            </div>
            <p className="line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {replyTarget.content}
            </p>
          </div>
        )}

        <TextArea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="写下你的回复，将作为子评论展示在原文下方…"
          autoSize={{ minRows: 4, maxRows: 8 }}
          className="rounded-lg!"
        />

        <div className="mt-4 flex gap-3">
          <Button className="h-10! flex-1" onClick={() => setReplyTarget(null)}>
            取消
          </Button>
          <Button
            type="primary"
            loading={replySending}
            onClick={sendReply}
            icon={<FiCornerUpRight />}
            className="h-10! flex-1"
          >
            发送回复
          </Button>
        </div>
      </Modal>
    </Modal>
  );
}
