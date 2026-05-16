import { ApexOptions } from 'apexcharts';
import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import dayjs from 'dayjs';
import { Spin } from 'antd';
import { getStatisAPI } from '@/api/statis';
import { StatisResponse } from '../VisitorsStatisChat/type';

interface ChartThreeState {
  series: number[];
}

const options: ApexOptions = {
  chart: {
    fontFamily: 'Satoshi, sans-serif',
    type: 'donut',
  },
  colors: ['#91C8EA', '#60a5fa'],
  labels: ['新访客', '老访客'],
  legend: {
    show: false,
    position: 'bottom',
  },
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        background: 'transparent',
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  responsive: [
    {
      breakpoint: 2600,
      options: {
        chart: {
          width: 380,
        },
      },
    },
    {
      breakpoint: 640,
      options: {
        chart: {
          width: 200,
        },
      },
    },
  ],
};

export default () => {
  const [loading, setLoading] = useState(true);

  const [result, setResult] = useState({ newVisitors: 0, oldVisitors: 0 });
  const date = dayjs(new Date()).format('YYYY/MM/DD');

  const [state, setState] = useState<ChartThreeState>({
    series: [0, 0],
  });

  const getDataList = async () => {
    setLoading(true);

    try {
      const { data } = await getStatisAPI('new-visitor', date, date);
      if (!data) return setLoading(false);
      const { result } = data as StatisResponse;

      const newVisitors = result.items[1][0][1] !== '--' ? Number(Number(result.items[1][0][1]).toFixed(2)) : 0;
      const oldVisitors = result.items[1][0][1] !== '--' ? Number((100 - Number(result.items[1][0][1])).toFixed(2)) : 0;

      setState({ series: [newVisitors, oldVisitors] });
      setResult({ newVisitors, oldVisitors });
    } catch (error) {
      console.error(error);
      setLoading(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    getDataList();
  }, []);

  return (
    <div className="sm:px-7 col-span-12 rounded-xl border border-stroke bg-light-gradient dark:bg-dark-gradient px-5 pb-4 pt-7 shadow-default dark:border-transparent xl:col-span-4">
      <Spin spinning={loading}>
        <div className="mb-3 justify-between gap-4 sm:flex">
          <div>
            <h5 className="text-xl font-semibold text-black dark:text-white">新老访客</h5>
          </div>
        </div>

        <div className="mb-2">
          <div id="chartThree" className="mx-auto flex justify-center">
            <ReactApexChart options={options} series={state.series} type="donut" />
          </div>
        </div>

        <div className="-mx-8 mt-8 flex flex-wrap items-center justify-center gap-y-3">
          <div className="sm:w-1/2 w-full px-8">
            <div className="flex w-full items-center">
              <span className="mr-2 block h-3 w-full max-w-3 rounded-full bg-[#91C8EA]"></span>
              <p className="flex w-full justify-between text-sm font-medium text-black dark:text-white">
                <span className="text-black dark:text-strokedark"> 新访客 </span>
                <span> {result.newVisitors.toFixed(2)}% </span>
              </p>
            </div>
          </div>

          <div className="sm:w-1/2 w-full px-8">
            <div className="flex w-full items-center">
              <span className="mr-2 block h-3 w-full max-w-3 rounded-full bg-primary"></span>
              <p className="flex w-full justify-between text-sm font-medium text-black dark:text-white">
                <span className="text-black dark:text-strokedark"> 老访客 </span>
                <span> {result.oldVisitors.toFixed(2)}% </span>
              </p>
            </div>
          </div>
        </div>
      </Spin>
    </div>
  );
};
