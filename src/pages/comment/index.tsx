import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFileText, FiZap } from 'react-icons/fi';

import Title from '@/components/Title';
import ArticleCommentPanel from './ArticleCommentPanel';
import RecordCommentPanel from './RecordCommentPanel';

type CommentTab = 'article' | 'record';

const TABS: { key: CommentTab; label: string; desc: string; icon: typeof FiFileText }[] = [
  { key: 'article', label: '文章评论', desc: '文章下的读者互动', icon: FiFileText },
  { key: 'record', label: '说说评论', desc: '闪念下的读者互动', icon: FiZap },
];

export default function CommentPage() {
  const [searchParams, setSearchParams] = useSearchParams();

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

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="评论管理" />

      <nav className="mb-3 flex shrink-0 gap-2 overflow-x-auto pb-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchTab(tab.key)}
              className={`flex min-w-[140px] flex-1 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors sm:max-w-[220px] ${isActive
                ? 'border-primary/30 bg-primary/5 dark:bg-primary/10'
                : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-strokedark dark:bg-boxdark dark:hover:border-slate-600'
                }`}
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${isActive
                  ? 'bg-primary/15 text-primary'
                  : 'bg-slate-100 text-slate-400 dark:bg-boxdark-2 dark:text-slate-500'
                  }`}
              >
                <Icon size={18} />
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-sm font-semibold ${isActive ? 'text-primary' : 'text-slate-700 dark:text-slate-200'
                    }`}
                >
                  {tab.label}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-400 dark:text-slate-500">
                  {tab.desc}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      {activeTab === 'article' ? (
        <ArticleCommentPanel />
      ) : (
        <RecordCommentPanel
          initRecordId={pendingRecordId}
          onClearRecordFilter={clearRecordFilter}
        />
      )}
    </div>
  );
}
