import { useEffect, useState } from 'react';
import { Modal, Spin } from 'antd';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import Empty from '@/components/Empty';
import { getHotArticlesAPI, getArticleViewTrendAPI } from '@/api/analysis';
import type { HotArticle, ViewTrendItem } from '@/api/analysis';

const RANK_COLORS = ['bg-primary', 'bg-[#60a5fa]', 'bg-[#91C8EA]'];

export default () => {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<HotArticle[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeArticle, setActiveArticle] = useState<HotArticle | null>(null);
  const [trend, setTrend] = useState<ViewTrendItem[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    getHotArticlesAPI(30, 10)
      .then(({ data }) => setList(data || []))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  const openTrend = async (article: HotArticle) => {
    setActiveArticle(article);
    setTrend([]);
    setModalOpen(true);
    setTrendLoading(true);

    try {
      const { data } = await getArticleViewTrendAPI(article.id, 30);
      setTrend(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setTrendLoading(false);
    }
  };

  const hasTrendData = trend.some((item) => item.count > 0);

  const chartOptions: ApexOptions = {
    chart: {
      fontFamily: 'Satoshi, sans-serif',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ['#60a5fa'],
    stroke: { curve: 'smooth', width: 2 },
    dataLabels: { enabled: false },
    grid: { strokeDashArray: 4, borderColor: 'rgba(148, 163, 184, 0.25)' },
    xaxis: {
      categories: trend.map((item) => item.date),
      tickAmount: 6,
      labels: { formatter: (value) => (value ? String(value).slice(5) : ''), style: { colors: '#94a3b8' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { formatter: (value) => `${Math.round(value)}`, style: { colors: '#94a3b8' } },
      min: 0,
      forceNiceScale: true,
    },
  };

  return (
    <div className="col-span-12 rounded-xl border border-stroke bg-light-gradient dark:bg-dark-gradient px-5 pt-7 pb-5 shadow-default dark:border-transparent sm:px-7 xl:col-span-4">
      <Spin spinning={loading}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h5 className="text-xl font-semibold text-black dark:text-white">热门文章</h5>
          <span className="text-xs text-slate-400">近 30 天</span>
        </div>

        {list.length === 0 && !loading ? (
          <Empty />
        ) : (
          <ul className="flex flex-col">
            {list.map((article, index) => (
              <li key={article.id}>
                <button
                  type="button"
                  onClick={() => openTrend(article)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-black/5 dark:hover:bg-white/5"
                  title="查看浏览趋势"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                      index < RANK_COLORS.length ? RANK_COLORS[index] : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="flex-1 truncate text-sm text-black dark:text-white">{article.title}</span>
                  <span className="shrink-0 text-xs text-slate-400">{article.recentViews} 次浏览</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Spin>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title={activeArticle?.title}
        width={640}
      >
        <Spin spinning={trendLoading}>
          {hasTrendData ? (
            <ReactApexChart
              options={chartOptions}
              series={[{ name: '浏览量', data: trend.map((item) => item.count) }]}
              type="area"
              height={300}
            />
          ) : (
            <div className="py-10">
              <Empty />
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
};
