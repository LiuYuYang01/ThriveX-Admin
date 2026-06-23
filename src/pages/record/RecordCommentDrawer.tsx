import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Popconfirm, message } from 'antd';
import dayjs from 'dayjs';
import {
  FiCheck,
  FiClock,
  FiInbox,
  FiMessageCircle,
  FiRefreshCw,
  FiTrash2,
  FiX,
  FiAlertCircle,
} from 'react-icons/fi';

import RandomAvatar from '@/components/RandomAvatar';
import {
  auditRecordCommentDataAPI,
  delRecordCommentDataAPI,
  getRecordCommentListAPI,
} from '@/api/recordComment';
import type { RecordComment } from '@/types/app/recordComment';
import type { Record } from '@/types/app/record';

interface Props {
  open: boolean;
  record: Record | null;
  onClose: () => void;
}

type FilterTab = 'all' | 'pending' | 'approved';

function CommentAvatar({ comment }: { comment: RecordComment }) {
  if (comment.avatar) {
    return (
      <img
        src={comment.avatar}
        alt=""
        className="size-10 shrink-0 rounded-full border border-slate-200/80 object-cover dark:border-strokedark"
      />
    );
  }
  return (
    <RandomAvatar className="size-10 shrink-0 rounded-full border border-slate-200/80 dark:border-strokedark" />
  );
}

function StatusBadge({ status }: { status: number }) {
  if (status === 1) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
        <FiCheck size={12} />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
      <FiClock size={12} />
    </span>
  );
}

export default function RecordCommentDrawer({ open, record, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<RecordComment[]>([]);
  const [btnLoading, setBtnLoading] = useState<number | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 2800);
  };

  const fetchComments = useCallback(async () => {
    if (!record?.id) return;
    try {
      setLoading(true);
      const { data } = await getRecordCommentListAPI({ recordId: record.id, pageNum: 1, pageSize: 100 });
      setList(data.result ?? []);
    } catch (error) {
      console.error('获取说说评论失败：', error);
      showToast('error', '加载评论失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [record?.id]);

  useEffect(() => {
    if (open && record?.id) {
      setFilterTab('all');
      void fetchComments();
    }
  }, [open, record?.id, fetchComments]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const stats = useMemo(() => {
    const pending = list.filter((item) => item.status !== 1).length;
    const approved = list.filter((item) => item.status === 1).length;
    return { total: list.length, pending, approved };
  }, [list]);

  const filteredList = useMemo(() => {
    const sorted = [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status - b.status;
      return +b.createTime - +a.createTime;
    });
    if (filterTab === 'pending') return sorted.filter((item) => item.status !== 1);
    if (filterTab === 'approved') return sorted.filter((item) => item.status === 1);
    return sorted;
  }, [list, filterTab]);

  const handleAudit = async (id: number) => {
    try {
      setBtnLoading(id);
      await auditRecordCommentDataAPI(id);
      showToast('success', '审核通过，评论已在前台展示');
      await fetchComments();
    } catch (error) {
      console.error('审核评论失败：', error);
      showToast('error', '审核失败，请重试');
    } finally {
      setBtnLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setBtnLoading(id);
      await delRecordCommentDataAPI(id);
      message.success('🎉 删除评论成功');
      await fetchComments();
    } catch (error) {
      console.error('删除评论失败：', error);
      showToast('error', '删除失败，请重试');
    } finally {
      setBtnLoading(null);
    }
  };

  if (!open) return null;

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: stats.total },
    { key: 'pending', label: '待审核', count: stats.pending },
    { key: 'approved', label: '已通过', count: stats.approved },
  ];

  return createPortal(
    <>
      <div className="fixed inset-0 z-1000 flex justify-end">
        <button
          type="button"
          aria-label="关闭评论管理"
          className="absolute inset-0 cursor-pointer bg-slate-900/30 backdrop-blur-[1px] transition-opacity"
          onClick={onClose}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="说说评论管理"
          className="relative flex h-full w-full max-w-[520px] flex-col border-l border-slate-200/80 bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark"
        >
          {/* 顶部栏 */}
          <header className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-strokedark">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FiMessageCircle size={16} />
                  </span>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">评论管理</h2>
                </div>
                <p className="mt-1 pl-10 text-xs text-slate-400 dark:text-slate-500">
                  说说 #{record?.id} · {dayjs(+(record?.createTime ?? 0)).format('YYYY-MM-DD HH:mm')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void fetchComments()}
                  disabled={loading}
                  className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5 dark:hover:text-slate-200"
                  aria-label="刷新"
                >
                  <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-200"
                  aria-label="关闭"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>
          </header>

          {/* Toast */}
          {toast && (
            <div
              className={`mx-5 mt-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm ${toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                }`}
            >
              {toast.type === 'success' ? <FiCheck size={15} /> : <FiAlertCircle size={15} />}
              {toast.text}
            </div>
          )}

          {/* 说说预览 */}
          {record?.content && (
            <div className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-strokedark">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">原说说</p>
              <p className="line-clamp-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{record.content}</p>
            </div>
          )}

          {/* 统计 */}
          <div className="shrink-0 grid grid-cols-3 gap-2 border-b border-slate-100 px-5 py-4 dark:border-strokedark">
            {[
              { label: '全部', value: stats.total, color: 'text-slate-700 dark:text-slate-200' },
              { label: '待审核', value: stats.pending, color: 'text-amber-600 dark:text-amber-400' },
              { label: '已通过', value: stats.approved, color: 'text-emerald-600 dark:text-emerald-400' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-center dark:border-strokedark dark:bg-boxdark-2/50"
              >
                <div className={`text-lg font-semibold tabular-nums ${item.color}`}>{item.value}</div>
                <div className="mt-0.5 text-xs text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>

          {/* 筛选 */}
          <div className="shrink-0 flex gap-1 border-b border-slate-100 px-5 py-3 dark:border-strokedark">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterTab(tab.key)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filterTab === tab.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
                  }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1.5 tabular-nums opacity-70">({tab.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* 评论列表 */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-2xl border border-slate-100 p-4 dark:border-strokedark">
                    <div className="flex gap-3">
                      <div className="size-10 rounded-full bg-slate-100 dark:bg-boxdark-2" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-24 rounded bg-slate-100 dark:bg-boxdark-2" />
                        <div className="h-3 w-full rounded bg-slate-100 dark:bg-boxdark-2" />
                        <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-boxdark-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2">
                  <FiInbox size={22} />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {filterTab === 'pending' ? '暂无待审核评论' : filterTab === 'approved' ? '暂无已通过评论' : '还没有评论'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {filterTab === 'pending' ? '新提交的评论会出现在这里' : '用户在前台发表的评论将显示于此'}
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredList.map((comment) => {
                  const isPending = comment.status !== 1;
                  const isBusy = btnLoading === comment.id;

                  return (
                    <li
                      key={comment.id}
                      className={`rounded-2xl border p-4 transition-shadow ${isPending
                        ? 'border-amber-200/80 bg-amber-50/30 dark:border-amber-500/20 dark:bg-amber-500/5'
                        : 'border-slate-100 bg-white dark:border-strokedark dark:bg-boxdark-2/30'
                        }`}
                    >
                      <div className="flex gap-3">
                        <CommentAvatar comment={comment} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                  {comment.name}
                                </span>
                                {comment.replyName && (
                                  <span className="text-xs text-slate-400">
                                    回复 <span className="text-primary">@{comment.replyName}</span>
                                  </span>
                                )}
                              </div>
                              {comment.email && (
                                <p className="mt-0.5 truncate text-xs text-slate-400">{comment.email}</p>
                              )}
                            </div>
                            <StatusBadge status={comment.status} />
                          </div>

                          <p className="mt-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                            {comment.content}
                          </p>

                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100/80 pt-3 dark:border-strokedark">
                            <time className="text-xs text-slate-400" dateTime={String(comment.createTime)}>
                              {dayjs(+comment.createTime).format('YYYY-MM-DD HH:mm')}
                            </time>
                            <div className="flex items-center gap-1.5">
                              {isPending && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleAudit(comment.id!)}
                                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <FiCheck size={13} />
                                </button>
                              )}
                              <Popconfirm
                                title="删除评论"
                                description={`确定删除「${comment.name || '该用户'}」的这条评论吗？`}
                                okText="删除"
                                cancelText="取消"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => handleDelete(comment.id!)}
                              >
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  className="inline-flex cursor-pointer items-center gap-1  px-3 py-1.5 text-xs font-medium text-red-500 transition-colors"
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              </Popconfirm>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* 底部提示 */}
          {stats.pending > 0 && (
            <footer className="shrink-0 border-t border-amber-100 bg-amber-50/50 px-5 py-3 dark:border-amber-500/20 dark:bg-amber-500/5">
              <p className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                <FiAlertCircle size={14} className="shrink-0" />
                还有 {stats.pending} 条评论待审核，通过后将在前台闪念页展示
              </p>
            </footer>
          )}
        </aside>
      </div>
    </>,
    document.body,
  );
}
