import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import VisitorsStatisChat from './components/VisitorsStatisChat';
import NewOldVisitors from './components/NewOldVisitors';
import CardDataStats from '@/components/CardDataStats';

import { AiOutlineEye, AiOutlineMeh, AiOutlineStock, AiOutlineFieldTime } from 'react-icons/ai';
import dayjs from 'dayjs';
import { getStatisAPI } from '@/api/statis';
import { StatisResponse } from './components/VisitorsStatisChat/type';

export default () => {
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    pv: 0,
    ip: 0,
    bounce: 0,
    avgTime: '',
  });

  const date = dayjs(new Date()).format('YYYY/MM/DD');

  const formatTime = (seconds: number) => {
    // 四舍五入到最接近的整数
    const roundedSeconds = Math.round(seconds);

    const h = Math.floor(roundedSeconds / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((roundedSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = (roundedSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // 获取统计数据
  const getDataList = async () => {
    try {
      setLoading(true);

      const { data } = await getStatisAPI('overview', date, date);
      if (!data) return setLoading(false);
      const { result } = data as StatisResponse;

      let pv = 0;
      let ip = 0;
      let bounce = 0;
      let avgTime = 0;
      let count = 0;

      result.items[1].forEach((item: (string | number)[]) => {
        if (!Number(item[0])) return;

        // 检查并累加 pv
        if (!isNaN(Number(item[0]))) {
          pv += Number(item[0]);
        }

        // 检查并累加 ip
        if (!isNaN(Number(item[1]))) {
          ip += Number(item[1]);
        }

        // 检查并累加 bounce
        if (!isNaN(Number(item[2]))) {
          bounce += Number(item[2]);
        }

        // 检查并累加 avgTime
        if (!isNaN(Number(item[3]))) {
          avgTime += Number(item[3]);
        }

        // 只有第三个和第四个数据都有值时才增加 count
        if (!isNaN(Number(item[2])) && !isNaN(Number(item[3]))) {
          count++;
        }
      });

      setStats({
        pv,
        ip,
        bounce: count !== 0 ? bounce / count : 0,
        avgTime: count !== 0 ? formatTime(avgTime / count) : '00:00:00',
      });

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getDataList();
  }, []);

  return (
    <Spin spinning={loading}>
      {/* 基本数据 */}
      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        <CardDataStats title="今日浏览量" total={stats.pv + ''}>
          <AiOutlineEye className="fill-primary dark:fill-white text-2xl" />
        </CardDataStats>

        <CardDataStats title="今日访客" total={stats.ip + ''}>
          <AiOutlineMeh className="fill-primary dark:fill-white text-2xl" />
        </CardDataStats>

        <CardDataStats title="跳出率" total={stats.bounce.toFixed(2) + '%'}>
          <AiOutlineStock className="fill-primary dark:fill-white text-2xl" />
        </CardDataStats>

        <CardDataStats title="平均访问时长" total={stats.avgTime || '00:00:00'}>
          <AiOutlineFieldTime className="fill-primary dark:fill-white text-2xl" />
        </CardDataStats>
      </div>

      <div className="rounded-xl mt-2 grid grid-cols-12 gap-2">
        <VisitorsStatisChat />
        <NewOldVisitors />
      </div>
    </Spin>
  );
};
