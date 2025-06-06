import { useEffect, useState, useCallback, useMemo } from 'react';
import { Spin } from 'antd';
import { ApexOptions } from 'apexcharts';
import ReactApexChart from 'react-apexcharts';
import dayjs from 'dayjs';
import { getEnvVar } from '@/utils/envHelper';

interface Result {
    timeSpan: string[];
    fields: string[];
    items: [
        string[][],
        number[][],
        any[],
        any[]
    ];
}

interface MonthlySums {
    [key: string]: {
        pv: number;
        ip: number;
    };
}

interface ChartOneState {
    series: {
        name: string;
        data: number[];
    }[];
}

export default () => {
    const [loading, setLoading] = useState<boolean>(false);

    const [result, setResult] = useState<Result | null>(null);
    const [scope, setScope] = useState<"day" | "month" | "year">("day");
    const [startDate, setStartDate] = useState(dayjs(new Date()).subtract(7, "day").format("YYYY/MM/DD"));
    const endDate = dayjs(new Date()).format("YYYY/MM/DD");

    // 图表相关配置
    const [options, setOptions] = useState<ApexOptions>({
        legend: {
            show: false,
            position: 'top',
            horizontalAlign: 'left',
        },
        colors: ['#3C50E0', '#80CAEE'],
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
            strokeColors: ['#3056D3', '#80CAEE'],
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

    // 核心数据
    const [state, setState] = useState<ChartOneState>({
        series: [
            {
                name: '访客数量',
                data: [],
            },
            {
                name: 'IP数量',
                data: [],
            },
        ],
    });

    // 获取统计数据
    const getDataList = useCallback(async () => {
        try {
            setLoading(true)

            const siteId = getEnvVar('VITE_BAIDU_TONGJI_SITE_ID');
            const token = getEnvVar('VITE_BAIDU_TONGJI_ACCESS_TOKEN');

            const response = await fetch(`/baidu/rest/2.0/tongji/report/getData?access_token=${token}&site_id=${siteId}&start_date=${startDate}&end_date=${endDate}&metrics=pv_count%2Cip_count&method=overview%2FgetTimeTrendRpt`);
            const data = await response.json();
            const { result } = data;
            setResult(result);

            setLoading(false);
        } catch (error) {
            setLoading(false)
        }
    }, [startDate, endDate]);

    useEffect(() => {
        getDataList();
    }, []);

    // 切换不同范围的数据
    const scopeData = useMemo(() => {
        setLoading(true)

        if (!result?.items?.length) return { categories: [], series: [[], []] };

        let categories = [];
        let pvList = [];
        let ipList = [];

        switch (scope) {
            case "day":
                categories = result.items[0].map((item: string[]) => {
                    const year = new Date().getFullYear() + "/";
                    return item[0].replace(year, "");
                });

                pvList = result.items[1].map((item: number[]) =>
                    typeof item[0] === 'string' ? 0 : item[0],
                );
                ipList = result.items[1].map((item: number[]) =>
                    typeof item[1] === 'string' ? 0 : item[1],
                );
                break;
            case "month":
                const datesArray: string[][] = result.items[0];
                const valuesArray: (string | number)[][] = result.items[1];

                const monthlySums: MonthlySums = {};

                datesArray.forEach((dateArray, index) => {
                    const date: string = dateArray[0];
                    const month = date.split('/')[1];

                    if (!monthlySums[month]) {
                        monthlySums[month] = { pv: 0, ip: 0 };
                    }

                    const pair = valuesArray[index];

                    if (pair.length === 2) {
                        const firstValue = parseFloat(pair[0] as string);
                        const secondValue = parseFloat(pair[1] as string);

                        if (!isNaN(firstValue) && !isNaN(secondValue)) {
                            monthlySums[month].pv += firstValue;
                            monthlySums[month].ip += secondValue;
                        }
                    }
                });

                categories = Object.keys(monthlySums);
                pvList = Object.values(monthlySums).map(item => item.pv);
                ipList = Object.values(monthlySums).map(item => item.ip);
                break;
            case "year":
                const yearlySums: { [year: string]: { pv: number, ip: number } } = {};

                result.items[0].forEach((dateArray: string[], index: number) => {
                    const date: string = dateArray[0];
                    const year = date.split('/')[0];

                    if (!yearlySums[year]) {
                        yearlySums[year] = { pv: 0, ip: 0 };
                    }

                    const pair = result.items[1][index];

                    if (pair.length === 2) {
                        const firstValue = parseFloat(pair[0] + '');
                        const secondValue = parseFloat(pair[1] + '');

                        if (!isNaN(firstValue) && !isNaN(secondValue)) {
                            yearlySums[year].pv += firstValue;
                            yearlySums[year].ip += secondValue;
                        }
                    }
                });

                // 删除没有数据的年份
                Object.keys(yearlySums).forEach(year => {
                    if (yearlySums[year].pv === 0 && yearlySums[year].ip === 0) {
                        delete yearlySums[year];
                    }
                });

                categories = Object.keys(yearlySums);
                pvList = Object.values(yearlySums).map(item => item.pv);
                ipList = Object.values(yearlySums).map(item => item.ip);
                break;
        }

        return { categories, series: [pvList, ipList] };
    }, [result, scope]);

    // 当数据发生变化时，更新图表选项和状态
    useEffect(() => {
        setLoading(true)
        
        setOptions((data) => ({
            ...data,
            xaxis: { ...options.xaxis, categories: scopeData.categories || [] }
        }));

        setState((prevState) => ({
            ...prevState,
            series: [
                {
                    name: '访客数量',
                    data: scopeData.series[0] || 0,
                },
                {
                    name: 'IP数量',
                    data: scopeData.series[1] || 0,
                },
            ],
        }));

        setLoading(false)
    }, [scopeData]);

    // 处理范围变更并相应地更新日期范围
    const handleScopeChange = (newScope: "day" | "month" | "year") => {
        setScope(newScope);
        switch (newScope) {
            case "day":
                setStartDate(dayjs(new Date()).subtract(7, "day").format("YYYY/MM/DD"));
                break;
            case "month":
                const year = new Date().getFullYear() + "";
                setStartDate(year + "/01/01");
                break;
            case "year":
                setStartDate(dayjs(new Date()).subtract(5, "year").format("YYYY/MM/DD"));
                break;
        }
    };

    return (
        <div className="col-span-12 rounded-lg border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
            <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
                <div className="flex w-full flex-wrap gap-3 sm:gap-5">
                    <div className="flex min-w-47.5">
                        <span className="mt-1 mr-2 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-primary">
                            <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-primary"></span>
                        </span>

                        <div className="w-full">
                            <p className="font-semibold text-primary">访客（UV）</p>
                        </div>
                    </div>

                    <div className="flex min-w-47.5">
                        <span className="mt-1 mr-2 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-secondary">
                            <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-secondary"></span>
                        </span>

                        <div className="w-full">
                            <p className="font-semibold text-secondary">IP</p>
                        </div>
                    </div>
                </div>

                <div className="flex w-full max-w-45 justify-end">
                    <div className="inline-flex items-center rounded-md bg-whiter p-1.5 dark:bg-meta-4 space-x-1">
                        <button className={`rounded py-1 px-3 text-xs font-medium text-black hover:bg-white hover:shadow-card dark:bg-meta-4 dark:text-white dark:hover:bg-boxdark ${scope === "day" ? "bg-white dark:!bg-[#4e5969] shadow-card" : ""}`} onClick={() => handleScopeChange("day")}>
                            天
                        </button>

                        <button className={`rounded py-1 px-3 text-xs font-medium text-black hover:bg-white hover:shadow-card dark:bg-meta-4 dark:text-white dark:hover:bg-boxdark ${scope === "month" ? "bg-white dark:!bg-[#4e5969] shadow-card" : ""}`} onClick={() => handleScopeChange("month")}>
                            月
                        </button>

                        <button className={`rounded py-1 px-3 text-xs font-medium text-black hover:bg-white hover:shadow-card dark:bg-meta-4 dark:text-white dark:hover:bg-boxdark ${scope === "year" ? "bg-white dark:!bg-[#4e5969] shadow-card" : ""}`} onClick={() => handleScopeChange("year")}>
                            年
                        </button>
                    </div>
                </div>
            </div>

            <Spin spinning={loading}>
                <div id="chartOne" className="-ml-5">
                    <ReactApexChart
                        options={options}
                        series={state.series}
                        type="area"
                        height={350}
                    />
                </div>
            </Spin>
        </div>
    );
};