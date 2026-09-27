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

  return (
    <div className="col-span-12 rounded-xl border border-stroke bg-light-gradient dark:bg-dark-gradient px-5 pt-7 pb-5 shadow-default dark:border-transparent sm:px-7 xl:col-span-4">
      <Spin spinning={loading}>
        <div className="mb-2 flex items-center justify-between gap-4">
          <h5 className="text-xl font-semibold text-black dark:text-white">搜索热词</h5>
          <span className="text-xs text-slate-400">近 30 天</span>
        </div>

        {list.length === 0 && !loading ? (
          <Empty />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/60">
            {list.map((item, index) => (
              <li key={item.keyword} className="flex items-center gap-3 py-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                  {index + 1}
                </span>
                <span className="flex-1 truncate text-sm text-black dark:text-white">{item.keyword}</span>
                <span className="shrink-0 text-sm font-medium text-primary">{item.count} 次</span>
              </li>
            ))}
          </ul>
        )}
      </Spin>
    </div>
  );
};
