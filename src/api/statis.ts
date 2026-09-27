import Request from '@/utils/request';

type StatisType = 'overview' | 'new-visitor' | 'basic-overview' | 'region' | 'client';

// overview(概览趋势), new-visitor(新访客趋势), basic-overview(基础概览趋势), region(地域分布), client(设备分布)
// 注：来源分布报表(visit/source/all/a)已被百度开放 API 下线，故移除 source 类型
// 获取 PV量、IP量、跳出率、平均访问时长
export const getStatisAPI = (type: StatisType, startDate: string, endDate: string) => Request('GET', `/statis`, {
  params: {
    startDate,
    endDate,
    type
  },
})