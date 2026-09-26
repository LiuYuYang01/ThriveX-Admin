import { useEffect, useState } from 'react';
import { Spin, Tabs } from 'antd';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import dayjs from 'dayjs';
import Empty from '@/components/Empty';
import { getStatisAPI } from '@/api/statis';

type ProfileKey = 'region' | 'source' | 'client';

interface ProfileItem {
  name: string;
  value: number;
}

const COLORS = ['#60a5fa', '#91C8EA', '#3b82f6', '#93c5fd', '#1d4ed8', '#bfdbfe', '#2563eb', '#7dd3fc'];

// 百度维度报表的 items 结构：items[0] 为维度名行，items[1] 为指标值行
const parseBaiduItems = (payload: unknown): ProfileItem[] => {
  const result = (payload as { result?: { items?: unknown[] } } | null | undefined)?.result;
  const items = result?.items;
  if (!Array.isArray(items) || items.length < 2) return [];

  const [nameRows, valueRows] = items as unknown[][];
  return nameRows
    .map((row, index) => {
      const name = Array.isArray(row) ? String(row[0]) : String(row);
      const valueRow = valueRows[index];
      const value = Number(Array.isArray(valueRow) ? valueRow[0] : valueRow) || 0;
      return { name, value };
    })
    .filter((item) => item.name && item.name !== '--' && item.value > 0)
    .sort((a, b) => b.value - a.value);
};

const tooltipStyle = {
  labels: { style: { colors: '#94a3b8' } },
  axisBorder: { show: false },
  axisTicks: { show: false },
} as const;

export default () => {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<Record<ProfileKey, ProfileItem[]>>({
    region: [],
    source: [],
    client: [],
  });

  const date = dayjs(new Date()).format('YYYY/MM/DD');

  useEffect(() => {
    const fetchOne = async (type: ProfileKey) => {
      try {
        const { data } = await getStatisAPI(type, date, date);
        return parseBaiduItems(data);
      } catch (error) {
        console.error(error);
        return [];
      }
    };

    Promise.all([fetchOne('region'), fetchOne('source'), fetchOne('client')])
      .then(([region, source, client]) => setState({ region, source, client }))
      .finally(() => setLoading(false));
  }, []);

  const isAllEmpty = !state.region.length && !state.source.length && !state.client.length;

  const renderRegion = () => {
    const top = state.region.slice(0, 10);
    if (!top.length) return <Empty />;

    const options: ApexOptions = {
      chart: { fontFamily: 'Satoshi, sans-serif', toolbar: { show: false } },
      colors: ['#60a5fa'],
      plotOptions: { bar: { horizontal: true, barHeight: '60%' } },
      dataLabels: { enabled: false },
      grid: { strokeDashArray: 4, borderColor: 'rgba(148, 163, 184, 0.25)' },
      xaxis: { categories: top.map((item) => item.name), ...tooltipStyle },
      yaxis: { labels: { style: { colors: '#94a3b8' } } },
    };

    return (
      <ReactApexChart
        options={options}
        series={[{ name: '浏览量', data: top.map((item) => item.value) }]}
        type="bar"
        height={300}
      />
    );
  };

  const renderDonut = (data: ProfileItem[]) => {
    if (!data.length) return <Empty />;

    const options: ApexOptions = {
      chart: { fontFamily: 'Satoshi, sans-serif' },
      colors: COLORS,
      labels: data.map((item) => item.name),
      legend: { position: 'bottom' },
      plotOptions: { pie: { donut: { size: '65%', background: 'transparent' } } },
      dataLabels: { enabled: false },
      stroke: { colors: ['transparent'] },
    };

    return (
      <ReactApexChart
        options={options}
        series={data.map((item) => item.value)}
        type="donut"
        height={300}
      />
    );
  };

  return (
    <div className="col-span-12 rounded-xl border border-stroke bg-light-gradient dark:bg-dark-gradient px-5 pt-7 pb-5 shadow-default dark:border-transparent sm:px-7 xl:col-span-4">
      <Spin spinning={loading}>
        <div className="mb-2 flex items-center justify-between gap-4">
          <h5 className="text-xl font-semibold text-black dark:text-white">访客画像</h5>
          <span className="text-xs text-slate-400">今日</span>
        </div>

        {isAllEmpty && !loading ? (
          <div className="flex h-[300px] flex-col items-center justify-center">
            <Empty />
          </div>
        ) : (
          <Tabs
            size="small"
            items={[
              { key: 'region', label: '地域', children: renderRegion() },
              { key: 'source', label: '来源', children: renderDonut(state.source) },
              { key: 'client', label: '设备', children: renderDonut(state.client) },
            ]}
          />
        )}
      </Spin>
    </div>
  );
};
