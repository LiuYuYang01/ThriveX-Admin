import { ApexOptions } from 'apexcharts';
import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import dayjs from 'dayjs';
import { Spin } from 'antd';
import { getEnvVar } from '@/utils/envHelper';

interface ChartThreeState {
  series: number[];
}

const options: ApexOptions = {
  chart: {
    fontFamily: 'Satoshi, sans-serif',
    type: 'donut',
  },
  colors: ['#91C8EA', '#727cf5'],
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
  const [loading, setLoading] = useState(true)

  const [result, setResult] = useState({ newVisitors: 0, oldVisitors: 0 })
  const [date, setDate] = useState(dayjs(new Date()).format("YYYY/MM/DD"));

  const [state, setState] = useState<ChartThreeState>({
    series: [0, 0],
  });

  const getDataList = async () => {
    setLoading(true)

    try {
      const siteId = getEnvVar('VITE_BAIDU_TONGJI_SITE_ID');
      const token = getEnvVar('VITE_BAIDU_TONGJI_ACCESS_TOKEN');

      const response = await fetch(`/baidu/rest/2.0/tongji/report/getData?access_token=${token}&site_id=${siteId}&start_date=${date}&end_date=${date}&metrics=new_visitor_count%2Cnew_visitor_ratio&method=trend%2Ftime%2Fa&gran=day&area=`);
      const data = await response.json();
      const { result } = data;

      const newVisitors = result.items[1][0][1] !== "--" ? result.items[1][0][1] : 0
      const oldVisitors = result.items[1][0][1] !== "--" ? 100 - result.items[1][0][1] : 0

      setState({ series: [newVisitors, oldVisitors] })
      setResult({ newVisitors, oldVisitors })
    } catch (error) {
      setLoading(false)
    }

    setLoading(false)
  }

  useEffect(() => {
    getDataList()
  }, [])

  return (
    <div className="sm:px-7.5 col-span-12 rounded-lg border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <Spin spinning={loading}>
        <div className="mb-3 justify-between gap-4 sm:flex">
          <div>
            <h5 className="text-xl font-semibold text-black dark:text-white">
              新老访客
            </h5>
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
                <span> 新访客 </span>
                <span> {result.newVisitors.toFixed(2)}% </span>
              </p>
            </div>
          </div>

          <div className="sm:w-1/2 w-full px-8">
            <div className="flex w-full items-center">
              <span className="mr-2 block h-3 w-full max-w-3 rounded-full bg-[#727cf5]"></span>
              <p className="flex w-full justify-between text-sm font-medium text-black dark:text-white">
                <span> 老访客 </span>
                <span> {result.oldVisitors.toFixed(2)}% </span>
              </p>
            </div>
          </div>
        </div>
      </Spin>
    </div>
  );
};