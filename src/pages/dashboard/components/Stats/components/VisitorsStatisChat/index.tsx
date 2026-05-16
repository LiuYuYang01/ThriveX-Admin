import { useEffect, useState, useMemo } from 'react';
import { Spin } from 'antd';
import { ApexOptions } from 'apexcharts';
import dayjs from 'dayjs';
import { getStatisAPI } from '@/api/statis';
import ReactECharts from 'echarts-for-react';
import { EChartsParams, Result, StatisResponse } from './type';
import { useConfigStore } from '@/stores';

export default () => {
  const colorMode = useConfigStore((state) => state.colorMode);

  const [loading, setLoading] = useState<boolean>(false);

  const [result, setResult] = useState<Result | null>(null);
  const [scope, setScope] = useState<'day' | 'month' | 'year'>('day');
  const [startDate, setStartDate] = useState(dayjs(new Date()).subtract(7, 'day').format('YYYYMMDD'));
  const endDate = dayjs(new Date()).format('YYYYMMDD');

  // 图表相关配置
  const [options, setOptions] = useState<ApexOptions>({
    legend: {
      show: false,
      position: 'top',
      horizontalAlign: 'left',
    },
    colors: ['#60a5fa', '#80CAEE'],
    chart: {
      fontFamily: 'Satoshi, sans-serif',
      height: 335,
      type: 'area',
      dropShadow: {
        enabled: true,
        color: '#623CEA14',
        top: 10,
        blur: 4,
        left: 0,
        opacity: 0.1,
      },
      toolbar: {
        show: false,
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 300,
          },
        },
      },
      {
        breakpoint: 1366,
        options: {
          chart: {
            height: 350,
          },
        },
      },
    ],
    stroke: {
      width: [2, 2],
      curve: 'straight',
    },
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 4,
      colors: '#fff',
      strokeColors: ['#60a5fa', '#80CAEE'],
      strokeWidth: 3,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      discrete: [],
      hover: {
        size: undefined,
        sizeOffset: 5,
      },
    },
    xaxis: {
      type: 'category',
      categories: [],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        style: {
          fontSize: '0px',
        },
      },
    },
  });

  // 获取统计数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await getStatisAPI('basic-overview', startDate, endDate);
        if (!data) return setLoading(false);
        const { result } = data as StatisResponse;
        setResult(result);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  // 切换不同范围的数据
  const scopeData = useMemo(() => {
    setLoading(true);

    if (!result?.items?.length) return { categories: [], series: [[], []] };

    let categories: string[] = [];
    let pvList: number[] = [];
    let ipList: number[] = [];

    const now = dayjs();
    const currentYear = now.year();
    const currentMonth = now.month() + 1; // month() 从0开始

    switch (scope) {
      case 'day': {
        // 只生成本月1号到今天
        const today = now.date();
        categories = Array.from({ length: today }, (_, i) => `${currentMonth}/${(i + 1).toString().padStart(2, '0')}`);
        // 过滤本月数据
        const dateArr: string[][] = result.items[0];
        const valueArr: (string | number)[][] = result.items[1];
        const dayMap: Record<string, { pv: number; ip: number }> = {};
        dateArr.forEach((dateArray, idx) => {
          const date = dateArray[0]; // 格式: YYYY/MM/DD
          const d = dayjs(date, 'YYYY/MM/DD');
          if (d.year() === currentYear && d.month() + 1 === currentMonth) {
            const key = `${currentMonth}/${d.date().toString().padStart(2, '0')}`;
            const pair = valueArr[idx];
            dayMap[key] = {
              pv: Number(pair[0]) || 0,
              ip: Number(pair[1]) || 0,
            };
          }
        });
        pvList = categories.map((day) => dayMap[day]?.pv || 0);
        ipList = categories.map((day) => dayMap[day]?.ip || 0);
        break;
      }
      case 'month': {
        // 生成1-12月，全部用两位数
        categories = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
        // 过滤本年数据
        const dateArr: string[][] = result.items[0];
        const valueArr: (string | number)[][] = result.items[1];
        const monthMap: Record<string, { pv: number; ip: number }> = {};
        dateArr.forEach((dateArray, idx) => {
          const date = dateArray[0]; // 格式: YYYY/MM/DD
          const d = dayjs(date, 'YYYY/MM/DD');
          if (d.year() === currentYear) {
            const m = (d.month() + 1).toString().padStart(2, '0');
            if (!monthMap[m]) monthMap[m] = { pv: 0, ip: 0 };
            const pair = valueArr[idx];
            monthMap[m].pv += Number(pair[0]) || 0;
            monthMap[m].ip += Number(pair[1]) || 0;
          }
        });
        pvList = categories.map((m) => monthMap[m]?.pv || 0);
        ipList = categories.map((m) => monthMap[m]?.ip || 0);
        break;
      }
      case 'year': {
        // 统计所有年
        const dateArr: string[][] = result.items[0];
        const valueArr: (string | number)[][] = result.items[1];
        const yearMap: Record<string, { pv: number; ip: number }> = {};
        dateArr.forEach((dateArray, idx) => {
          const date = dateArray[0]; // 格式: YYYY/MM/DD
          const d = dayjs(date, 'YYYY/MM/DD');
          const y = d.year().toString();
          if (!yearMap[y]) yearMap[y] = { pv: 0, ip: 0 };
          const pair = valueArr[idx];
          yearMap[y].pv += Number(pair[0]) || 0;
          yearMap[y].ip += Number(pair[1]) || 0;
        });
        categories = Object.keys(yearMap).sort();
        pvList = categories.map((y) => yearMap[y]?.pv || 0);
        ipList = categories.map((y) => yearMap[y]?.ip || 0);
        break;
      }
    }

    return { categories, series: [pvList, ipList] };
  }, [result, scope]);

  // 当数据发生变化时，更新图表选项和状态
  useEffect(() => {
    setLoading(true);

    setOptions((data) => ({
      ...data,
      xaxis: { ...options.xaxis, categories: scopeData.categories || [] },
    }));

    setLoading(false);
  }, [scopeData]);

  // 处理范围变更并相应地更新日期范围
  const handleScopeChange = (newScope: 'day' | 'month' | 'year') => {
    setScope(newScope);
    const now = dayjs();
    switch (newScope) {
      case 'day': {
        // 本月1号到本月最后一天
        setStartDate(now.startOf('month').format('YYYY/MM/DD'));
        break;
      }
      case 'month': {
        // 本年1月1日到12月31日
        setStartDate(now.startOf('year').format('YYYY/MM/DD'));
        break;
      }
      case 'year': {
        // 近五年（含今年），起始时间为五年前的1月1日
        const startYear = now.year() - 4;
        setStartDate(dayjs(`${startYear}-01-01`).format('YYYY/MM/DD'));
        break;
      }
    }
  };

  return (
    <div className="col-span-12 rounded-xl border border-stroke px-5 pt-7 pb-5 shadow-default dark:border-transparent bg-light-gradient dark:bg-dark-gradient sm:px-7 xl:col-span-8">
      <div className="flex w-full justify-between items-center mb-2">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">访客统计</h3>

        <div className="inline-flex items-center rounded-md bg-whiter p-1.5 space-x-1">
          <button className={`rounded-sm py-1 px-3 text-xs font-medium text-black hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark ${scope === 'day' ? 'bg-white dark:bg-[#4e5969]! shadow-card' : ''}`} onClick={() => handleScopeChange('day')}>
            天
          </button>

          <button className={`rounded-sm py-1 px-3 text-xs font-medium text-black hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark ${scope === 'month' ? 'bg-white dark:bg-[#4e5969]! shadow-card' : ''}`} onClick={() => handleScopeChange('month')}>
            月
          </button>

          <button className={`rounded-sm py-1 px-3 text-xs font-medium text-black hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark ${scope === 'year' ? 'bg-white dark:bg-[#4e5969]! shadow-card' : ''}`} onClick={() => handleScopeChange('year')}>
            年
          </button>
        </div>
      </div>

      <Spin spinning={loading}>
        <div id="chartOne" className="-ml-5">
          <ReactECharts
            option={{
              tooltip: {
                trigger: 'axis',
                backgroundColor: colorMode === 'dark' ? '#334459' : '#fff',
                borderColor: colorMode === 'dark' ? '#475f7d' : '#e5eaf3',
                borderWidth: 1,
                textStyle: {
                  color: colorMode === 'dark' ? '#e0e0e0' : '#1a2757',
                  fontSize: 14,
                },
                padding: 16,
                extraCssText: colorMode === 'dark' ? 'box-shadow: 0 4px 24px rgba(0,0,0,0.3); border-radius: 10px;' : 'box-shadow: 0 4px 24px rgba(0,0,0,0.08); border-radius: 10px;',
                formatter: function (params: EChartsParams[]) {
                  let str = `<div style="font-weight:700;margin-bottom:8px;">${params[0].axisValue}${scope === 'month' ? '月' : scope === 'year' ? '年' : ''}</div>`;
                  params.forEach((item: EChartsParams) => {
                    let color;
                    if (item.seriesName === '访客') {
                      color = '#6a8eff';
                    } else if (item.seriesName === 'IP') {
                      color = '#4fc3ff';
                    }
                    str += `\n          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">\n            <span style="display:inline-flex;align-items:center;">\n              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;"></span>\n              ${item.seriesName}：\n            </span>\n            <span style="font-weight:700;margin-left:16px;">${item.data}</span>\n          </div>\n        `;
                  });
                  return str;
                },
              },
              legend: {
                data: [
                  { name: '访客', icon: 'circle', itemStyle: { color: '#6a8eff' } },
                  { name: 'IP', icon: 'circle', itemStyle: { color: '#4fc3ff' } },
                ],
                bottom: 0,
                left: 'center',
                itemWidth: 18,
                itemHeight: 18,
                itemGap: 32,
                textStyle: {
                  fontSize: 14,
                  color: colorMode === 'dark' ? '#e0e0e0' : '#1a2757',
                  margin: 30,
                },
              },
              grid: {
                left: 50,
                right: 20,
                top: 20,
                bottom: 60,
              },
              xAxis: {
                type: 'category',
                boundaryGap: false,
                data: scopeData.categories,
                axisLine: { show: false }, // 隐藏x轴轴线
                axisTick: { show: false }, // 隐藏x轴刻度线
                axisLabel: {
                  fontSize: 12,
                  color: colorMode === 'dark' ? '#475f7d' : '#1a2757',
                },
              },
              yAxis: {
                type: 'value',
                min: 0,
                splitNumber: 5,
                axisLine: { show: false },
                axisLabel: {
                  fontSize: 12,
                  color: colorMode === 'dark' ? '#475f7d' : '#1a2757',
                },
                splitLine: {
                  lineStyle: {
                    type: 'dashed',
                    color: colorMode === 'dark' ? '#475f7d' : '#f0f4fa',
                  },
                },
              },
              series: [
                {
                  name: '访客',
                  type: 'line',
                  smooth: false,
                  symbol: 'circle',
                  symbolSize: 8,
                  itemStyle: {
                    color: '#fff',
                    borderColor: '#6a8eff',
                    borderWidth: 3,
                  },
                  emphasis: {
                    itemStyle: {
                      borderColor: '#6a8eff',
                      borderWidth: 5,
                    },
                  },
                  lineStyle: {
                    width: 3,
                    color: '#6a8eff', // 纯色
                  },
                  areaStyle: {
                    color: {
                      type: 'linear',
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: 'rgba(106,142,255,0.25)' },
                        { offset: 1, color: 'rgba(106,142,255,0)' },
                      ],
                    },
                  },
                  data: scopeData.series[0],
                },
                {
                  name: 'IP',
                  type: 'line',
                  smooth: false,
                  symbol: 'circle',
                  symbolSize: 8,
                  itemStyle: {
                    color: '#fff',
                    borderColor: '#4fc3ff',
                    borderWidth: 3,
                  },
                  emphasis: {
                    itemStyle: {
                      borderColor: '#4fc3ff',
                      borderWidth: 5,
                    },
                  },
                  lineStyle: {
                    width: 3,
                    color: '#4fc3ff', // 纯色
                  },
                  areaStyle: {
                    color: {
                      type: 'linear',
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: 'rgba(79,195,255,0.18)' },
                        { offset: 1, color: 'rgba(79,195,255,0)' },
                      ],
                    },
                  },
                  data: scopeData.series[1],
                },
              ],
            }}
            style={{ height: 400, width: '100%' }}
          />
        </div>
      </Spin>
    </div>
  );
};
