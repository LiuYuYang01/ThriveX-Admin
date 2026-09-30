import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFileText, FiZap } from 'react-icons/fi';
import { IoCheckmarkDoneOutline } from 'react-icons/io5';

import Title from '@/components/Title';
import { getCommentListAPI } from '@/api/comment';
import { getRecordCommentListAPI } from '@/api/recordComment';
import ArticleCommentPanel from './ArticleCommentPanel';
import RecordCommentPanel from './RecordCommentPanel';

type CommentTab = 'article' | 'record';

const TABS: { key: CommentTab; label: string; desc: string; icon: typeof FiFileText }[] = [
  { key: 'article', label: '文章评论', desc: '文章下的读者互动', icon: FiFileText },
  { key: 'record', label: '闪念评论', desc: '闪念下的读者互动', icon: FiZap },
];

export default function CommentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [counts, setCounts] = useState<Record<CommentTab, number>>({ article: 0, record: 0 });

  const activeTab: CommentTab = searchParams.get('tab') === 'record' ? 'record' : 'article';
  const recordIdParam = searchParams.get('recordId');
  const initRecordId = recordIdParam ? Number(recordIdParam) : null;

  const switchTab = (tab: CommentTab) => {
    if (tab === 'record') {
      setSearchParams({ tab: 'record' });
    } else {
      setSearchParams({});
    }
  };

  const clearRecordFilter = () => {
    if (activeTab === 'record') {
      setSearchParams({ tab: 'record' });
    }
  };

  const pendingRecordId = useMemo(() => {
    if (!initRecordId || Number.isNaN(initRecordId)) return null;
    return initRecordId;
  }, [initRecordId]);

  // 两个 Tab 的条数在父级统一预取，未访问过的 Tab 也能显示真实数量
  const getCounts = useCallback(async () => {
    const [{ data: article }, { data: record }] = await Promise.all([
      getCommentListAPI({ pageNum: 1, pageSize: 1 }),
      getRecordCommentListAPI({ status: 1, pageNum: 1, pageSize: 1 }),
    ]);
    setCounts({ article: article.total ?? 0, record: record.total ?? 0 });
  }, []);

  useEffect(() => {
    void getCounts();
  }, [getCounts]);

  // 面板删除/回复后会上报最新条数，保证卡片数字同步
  const onArticleTotalChange = useCallback((total: number) => {
    setCounts((prev) => (prev.article === total ? prev : { ...prev, article: total }));
  }, []);

  const onRecordTotalChange = useCallback((total: number) => {
    setCounts((prev) => (prev.record === total ? prev : { ...prev, record: total }));
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="评论管理" />

      <nav className="mb-3 grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchTab(tab.key)}
              className={`group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border px-5 py-5 text-left ${isActive
                ? 'border-primary/30 bg-primary/10 ring-1 ring-primary/15 dark:border-primary/40 dark:bg-primary/15'
                : 'border-slate-200/70 bg-white hover:border-slate-300 dark:border-strokedark dark:bg-boxdark dark:hover:border-slate-600'
                }`}
            >
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 dark:bg-boxdark-2 dark:text-slate-500 dark:group-hover:text-slate-300'
                  }`}
              >
                <Icon size={24} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-3xl font-bold tracking-tight tabular-nums ${isActive
                      ? 'text-primary'
                      : 'text-slate-800 dark:text-slate-100'
                      }`}
                  >
                    {counts[tab.key]}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">条</span>
                </div>
                <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                  {tab.label} · {tab.desc}
                </p>
              </div>

              {isActive && (
                <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <IoCheckmarkDoneOutline size={12} />
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {activeTab === 'article' ? (
        <ArticleCommentPanel onTotalChange={onArticleTotalChange} />
      ) : (
        <RecordCommentPanel
          initRecordId={pendingRecordId}
          onClearRecordFilter={clearRecordFilter}
          onTotalChange={onRecordTotalChange}
        />
      )}
    </div>
  );
}
