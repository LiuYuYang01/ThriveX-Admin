import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import Empty from '@/components/Empty';
import { getHotKeywordsAPI } from '@/api/analysis';
import type { HotKeyword } from '@/api/analysis';

export default () => {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<HotKeyword[]>([]);

  useEffect(() => {
    getHotKeywordsAPI(30, 10)
      .then(({ data }) => setList(data || []))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  const max = Math.max(...list.map((item) => item.count), 1);

  return (
    <div className="col-span-12 rounded-xl border border-stroke bg-light-gradient dark:bg-dark-gradient px-5 pt-7 pb-5 shadow-default dark:border-transparent sm:px-7 xl:col-span-4">
      <Spin spinning={loading}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h5 className="text-xl font-semibold text-black dark:text-white">搜索热词</h5>
          <span className="text-xs text-slate-400">近 30 天</span>
        </div>

        {list.length === 0 && !loading ? (
          <Empty />
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((item) => (
              <li key={item.keyword}>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-black dark:text-white">{item.keyword}</span>
                  <span className="shrink-0 text-xs text-slate-400">{item.count} 次</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200/70 dark:bg-slate-700/70">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max((item.count / max) * 100, 4)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Spin>
    </div>
  );
};
