import { useEffect, useState, useRef, useMemo } from 'react';

import { Spin } from 'antd';
import { BiCommentDetail, BiLink, BiMessageSquareDetail } from 'react-icons/bi';
import { HiOutlineInbox } from 'react-icons/hi2';

import { getCommentListAPI } from '@/api/comment';
import { getLinkListAPI } from '@/api/web';
import { getWallListAPI } from '@/api/wall';

import { Wall } from '@/types/app/wall';
import { Web } from '@/types/app/web';
import { Comment as CommentType } from '@/types/app/comment';

import Empty from '@/components/Empty';
import Title from '@/components/Title';
import List from './components/List';
import Skeleton from './Skeleton';

type Menu = 'comment' | 'link' | 'wall';

const NAV_ITEMS: { key: Menu; label: string; desc: string; icon: typeof BiCommentDetail }[] = [
  { key: 'comment', label: '评论', desc: '文章下的读者互动', icon: BiCommentDetail },
  { key: 'link', label: '友链', desc: '站点友链申请', icon: BiLink },
  { key: 'wall', label: '留言', desc: '留言板新消息', icon: BiMessageSquareDetail },
];

export default () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);

  const [active, setActive] = useState<Menu>('comment');
  const [commentList, setCommentList] = useState<CommentType[]>([]);
  const [linkList, setLinkList] = useState<Web[]>([]);
  const [wallList, setWallList] = useState<Wall[]>([]);

  const fetchData = async (type: Menu) => {
    try {
      // 如果是第一次加载，使用 initialLoading
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      if (type === 'comment') {
        const { data } = await getCommentListAPI({ status: 0, pattern: 'list' });
        setCommentList(data.result);
      } else if (type === 'link') {
        const { data } = await getLinkListAPI({ status: 0, pageNum: 1, pageSize: 9999 });
        setLinkList(data.result);
      } else if (type === 'wall') {
        const { data } = await getWallListAPI({ status: 0 });
        setWallList(data.result);
      }

      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(active);
  }, [active]);

  const activeList = useMemo(() => {
    if (active === 'comment') return commentList;
    if (active === 'link') return linkList;
    return wallList;
  }, [active, commentList, linkList, wallList]);

  const activeMeta = NAV_ITEMS.find((item) => item.key === active)!;

  if (initialLoading) {
    return <Skeleton />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title value="工作台">
        <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
          集中处理待审核内容
        </span>
      </Title>

      <div className="flex min-h-[calc(100vh-145px)] flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-1 flex-col lg:flex-row">
          {/* 侧栏导航 */}
          <aside className="shrink-0 border-b border-slate-200/80 p-4 lg:w-56 lg:border-r lg:border-b-0 dark:border-strokedark">
            <p className="mb-3 px-1 text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">
              待办类型
            </p>
            <nav className="flex gap-2 lg:flex-col lg:gap-1">
              {NAV_ITEMS.map(({ key, label, desc, icon: Icon }) => {
                const count =
                  key === 'comment'
                    ? commentList.length
                    : key === 'link'
                      ? linkList.length
                      : wallList.length;
                const isActive = active === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActive(key)}
                    className={`
                      group flex flex-1 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors
                      lg:w-full lg:flex-none lg:px-3 lg:py-3 cursor-pointer
                      ${isActive
                        ? 'border-primary/30 bg-primary/5 text-primary dark:border-primary/40 dark:bg-primary/10'
                        : 'border-transparent text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-boxdark-2'
                      }
                    `}
                  >
                    <span
                      className={`
                        flex size-9 shrink-0 items-center justify-center rounded-lg
                        ${isActive
                          ? 'bg-primary/15 text-primary'
                          : 'bg-slate-100 text-slate-500 dark:bg-boxdark-2 dark:text-slate-400 group-hover:text-primary'
                        }
                      `}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{label}</span>
                        {count > 0 && (
                          <span
                            className={`
                              inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums
                              ${isActive ? 'bg-primary/20 text-primary' : 'bg-slate-200 text-slate-600 dark:bg-strokedark dark:text-slate-300'}
                            `}
                          >
                            {count}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 hidden text-xs text-slate-400 lg:block dark:text-slate-500">
                        {desc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* 主内容区 */}
          <main className="flex min-h-0 flex-1 flex-col">
            <header className="flex items-center justify-between gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-strokedark">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-boxdark-2 dark:text-slate-300">
                  <activeMeta.icon size={20} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    {activeMeta.label}待审核
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {activeMeta.desc}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-1.5 dark:border-strokedark dark:bg-boxdark-2">
                <HiOutlineInbox className="text-slate-400" size={16} />
                <span className="text-sm font-medium text-slate-700 tabular-nums dark:text-slate-200">
                  {activeList.length}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">条</span>
              </div>
            </header>

            <Spin spinning={loading}>
              <div className="flex-1 overflow-y-auto px-5 py-5">
                {activeList.length === 0 ? (
                  <div className="flex min-h-[320px] items-center justify-center">
                    <Empty />
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {activeList.map((item) => (
                      <li key={item.id}>
                        <List
                          item={item}
                          type={active}
                          fetchData={(type) => fetchData(type)}
                          setLoading={setLoading}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Spin>
          </main>
        </div>
      </div>
    </div>
  );
};
