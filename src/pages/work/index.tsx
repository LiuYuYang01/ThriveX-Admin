import { useEffect, useState, useRef, useMemo } from 'react';

import { Spin } from 'antd';
import { BiCommentDetail, BiLink, BiMessageSquareDetail } from 'react-icons/bi';
import { IoCheckmarkDoneOutline } from 'react-icons/io5';

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

      <div className="grid grid-cols-1 gap-3 px-3 sm:grid-cols-3">
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
                group relative flex items-center gap-4 overflow-hidden rounded-2xl border px-5 py-5 text-left transition-all duration-200 cursor-pointer
                ${isActive
                  ? 'border-primary/20 bg-primary/[0.03] ring-1 ring-primary/10 dark:border-primary/30 dark:bg-primary/[0.06]'
                  : 'border-slate-200/70 bg-white hover:border-slate-300 dark:border-strokedark dark:bg-boxdark dark:hover:border-slate-600'
                }
              `}
            >
              <span
                className={`
                  flex size-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-200
                  ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 dark:bg-boxdark-2 dark:text-slate-500 dark:group-hover:text-slate-300'
                  }
                `}
              >
                <Icon size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-3xl font-bold tracking-tight tabular-nums ${isActive ? 'text-primary' : 'text-slate-800 dark:text-slate-100'}`}>
                    {count}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">条</span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {desc}
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
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col px-3">
        <Spin spinning={loading}>
          <div className="flex-1 overflow-y-auto">
            {activeList.length === 0 ? (
              <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white dark:border-strokedark dark:bg-boxdark">
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
      </div>
    </div>
  );
};
