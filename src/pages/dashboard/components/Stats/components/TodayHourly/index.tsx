import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import dayjs from 'dayjs';
import Empty from '@/components/Empty';
import { getStatisAPI } from '@/api/statis';

// 今日逐小时 PV 分布，数据取自百度统计概览报表自带的 24 小时明细
export default () => {
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState<number[]>([]);

  const date = dayjs(new Date()).format('YYYY/MM/DD');

  useEffect(() => {
    getStatisAPI('overview', date, date)
      .then(({ data }) => {
        const items = (data as { result?: { items?: unknown[] } } | null | undefined)?.result?.items;
        if (!Array.isArray(items) || items.length < 2) return;
        // items[1] 每行为 [pv, ip]，值可能是 '--'
        setHours((items[1] as unknown[]).map((row) => Number(Array.isArray(row) ? row[0] : row) || 0));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const options: ApexOptions = {
    chart: { fontFamily: 'Satoshi, sans-serif', toolbar: { show: false } },
    colors: ['#10b981'],
    plotOptions: { bar: { columnWidth: '35%' } },
    dataLabels: { enabled: false },
    grid: { strokeDashArray: 4, borderColor: 'rgba(148, 163, 184, 0.25)' },
    xaxis: {
      categories: hours.map((_, i) => `${i}`),
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: 12,
      labels: { style: { colors: '#94a3b8' }, rotate: 0, hideOverlappingLabels: true },
    },
    yaxis: { labels: { style: { colors: '#94a3b8' } }, forceNiceScale: true },
    tooltip: { y: { formatter: (val: number) => `${val} PV` } },
  };

  return (
    <div className="col-span-12 rounded-xl border border-stroke bg-light-gradient dark:bg-dark-gradient px-5 pt-7 pb-5 shadow-default dark:border-transparent">
      <Spin spinning={loading}>
        <div className="mb-2 flex items-center justify-between gap-4">
          <h5 className="text-xl font-semibold text-black dark:text-white">今日时段分布</h5>
          <span className="text-xs text-slate-400">逐小时 PV</span>
        </div>

        {hours.length ? (
          <ReactApexChart options={options} series={[{ name: '浏览量', data: hours }]} type="bar" height={300} />
        ) : (
          <div className="flex h-[300px] flex-col items-center justify-center">
            <Empty />
          </div>
        )}
      </Spin>
    </div>
  );
};
