import React, { useEffect, useState, useRef } from 'react';
import GitHubCalendar from 'react-github-calendar';
import dayjs from 'dayjs';
import { Select } from 'antd';
import {
  FiLayout,
  FiServer,
  FiGlobe,
  FiCalendar,
  FiLoader,
} from 'react-icons/fi';
import { useConfigStore } from '@/stores';
import Skeleton from './Skeleton';

interface Commit {
  commit: {
    author: { date: string };
    message: string;
  };
}

interface TimelineItem {
  label: string;
  children: React.ReactNode;
}

type TimelineCardIcon = React.ComponentType<{ size?: number; className?: string }>;

// 图一风格：图标背景色与图标色
const CARD_STYLES = [
  { iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
  { iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
  { iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' },
] as const;

// 自定义时间轴（图一：圆角浅灰卡片 + 左侧彩色圆形图标 + 右侧粗体标题）
const ProjectTimelineCard = ({
  title,
  icon: Icon,
  data,
  colorIndex,
}: {
  title: string;
  icon: TimelineCardIcon;
  data: TimelineItem[];
  colorIndex: 0 | 1 | 2;
}) => {
  const { iconBg, iconColor } = CARD_STYLES[colorIndex];
  return (
    <div className="bg-slate-100 dark:bg-boxdark-2 rounded-2xl border border-slate-200/80 dark:border-strokedark shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden group">
      <div className="bg-white dark:bg-boxdark p-4 flex items-center gap-3 border-b border-slate-200/60 dark:border-strokedark">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${iconBg} ${iconColor}`}>
          <Icon size={22} className={iconColor} />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base tracking-tight">{title}</h3>
      </div>

      <div className="p-4 flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-strokedark scrollbar-track-transparent bg-white/60 dark:bg-boxdark/60 rounded-b-2xl">
        {data.length === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">暂无提交记录</div>
        ) : (
          <div className="relative pl-2">
            {/* 贯穿线 */}
            <div className="absolute top-2 left-[6.5px] bottom-0 w-[2px] bg-slate-100 dark:bg-strokedark" />

            {data.map((item, index) => (
              <div key={index} className="relative flex gap-4 mb-6 last:mb-0 group/item">
                {/* 装饰点 */}
                <div className={`
                  relative z-10 w-3.5 h-3.5 ml-[-7px] rounded-full border-2 border-white dark:border-boxdark shadow-xs mt-1.5 shrink-0
                  ${index === 0 ? 'bg-green-500 ring-2 ring-green-100 dark:ring-green-900/50' : 'bg-slate-300 dark:bg-strokedark group-hover/item:bg-indigo-400 dark:group-hover/item:bg-indigo-500'}
                  transition-colors duration-300
                `} />

                {/* 内容 */}
                <div className="flex-1">
                  <time className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1 block font-mono">
                    {item.label}
                  </time>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-all bg-slate-50 dark:bg-boxdark-2 p-3 rounded-lg border border-slate-100 dark:border-strokedark group-hover/item:border-slate-200 dark:group-hover/item:border-strokedark transition-colors">
                    {item.children}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const IterativePage = () => {
  const theme = useConfigStore((state) => state.colorMode);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [yearList, setYearList] = useState<{ value: number; label: string }[]>([]);

  const [blogData, setBlogData] = useState<TimelineItem[]>([]);
  const [adminData, setAdminData] = useState<TimelineItem[]>([]);
  const [serverData, setServerData] = useState<TimelineItem[]>([]);

  const getCommitData = async (project: string) => {
    try {
      if (isFirstLoadRef.current) setInitialLoading(true);
      else setLoading(true);

      const res = await fetch(`https://api.github.com/repos/LiuYuYang01/${project}/commits?per_page=10`);
      const data = await res.json();
      const result = data?.map((item: Commit) => ({
        label: dayjs(item.commit.author.date).format('YYYY-MM-DD HH:mm'), // 优化了日期格式
        children: item.commit.message,
      }));

      switch (project) {
        case 'ThriveX-Blog':
          sessionStorage.setItem('blog_project_iterative', JSON.stringify(result));
          setBlogData(result);
          break;
        case 'ThriveX-Admin':
          sessionStorage.setItem('admin_project_iterative', JSON.stringify(result));
          setAdminData(result);
          break;
        case 'ThriveX-Server':
          sessionStorage.setItem('server_project_iterative', JSON.stringify(result));
          setServerData(result);
          break;
      }
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  type SetTimelineData = React.Dispatch<React.SetStateAction<TimelineItem[]>>;

  const loadData = (key: string, setter: SetTimelineData, project: string) => {
    const cached: TimelineItem[] = JSON.parse(sessionStorage.getItem(key) ?? '[]');
    if (cached.length > 0) {
      setter(cached);
    } else {
      getCommitData(project);
    }
  };

  useEffect(() => {
    const currentYear = dayjs().year();
    const list = Array.from({ length: 5 }, (_, i) => currentYear - i);
    setYearList(list.map((value) => ({ value, label: String(value) })));

    loadData('blog_project_iterative', setBlogData, 'ThriveX-Blog');
    loadData('admin_project_iterative', setAdminData, 'ThriveX-Admin');
    loadData('server_project_iterative', setServerData, 'ThriveX-Server');

    const timer = setTimeout(() => setInitialLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (initialLoading) return <Skeleton />

  return (
    <div className="p-4 font-sans text-slate-600 dark:text-slate-300 transition-colors">
      <div className="mb-4">
        <div className="relative flex flex-col md:flex-row md:items-center justify-center gap-4 bg-white dark:bg-boxdark px-6 py-3 rounded-2xl shadow-xs border border-slate-100 dark:border-strokedark transition-colors">
          <h1 className="flex items-center gap-4 font-extrabold text-slate-800 dark:text-slate-100">
            <img src="/logo.png" alt="" className="w-8 h-8" />
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">不断改善、成为最佳</span>
          </h1>

          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 bg-slate-50 dark:bg-boxdark-2 px-4 py-1 rounded-xl border border-slate-100 dark:border-strokedark transition-colors">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
              <FiCalendar size={16} />
              年份视图:
            </span>

            <Select
              variant="borderless"
              defaultValue={year}
              options={yearList}
              onChange={setYear}
              className="min-w-[100px] font-bold! text-slate-700 dark:text-slate-200 [&_.ant-select-selector]:bg-transparent!"
              dropdownStyle={{ borderRadius: '12px', padding: '8px' }}
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="bg-white dark:bg-boxdark p-6 md:p-8 rounded-2xl shadow-xs border border-slate-100 dark:border-strokedark flex flex-col items-center justify-center relative overflow-hidden group transition-colors">
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 dark:bg-green-900/20 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="relative z-10 w-full overflow-x-auto pb-2 flex justify-center">
            <GitHubCalendar
              username="liuyuyang01"
              year={year}
              fontSize={12}
              blockSize={13}
              blockMargin={4}
              colorScheme={theme}
              theme={{
                light: ['#f0f2f5', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                dark: ['#1e293b', '#166534', '#15803d', '#16a34a', '#22c55e'],
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          {loading && (
            <div className="absolute inset-0 z-20 bg-white/60 dark:bg-boxdark/80 backdrop-blur-[1px] rounded-3xl flex items-center justify-center transition-colors">
              <div className="bg-white dark:bg-boxdark-2 p-4 rounded-full shadow-lg border border-slate-100 dark:border-strokedark">
                <FiLoader className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
              </div>
            </div>
          )}

          <ProjectTimelineCard
            title="ThriveX Blog"
            icon={FiGlobe}
            colorIndex={0}
            data={blogData}
          />

          <ProjectTimelineCard
            title="ThriveX Admin"
            icon={FiLayout}
            colorIndex={1}
            data={adminData}
          />

          <ProjectTimelineCard
            title="ThriveX Server"
            icon={FiServer}
            colorIndex={2}
            data={serverData}
          />
        </div>
      </div>
    </div>
  );
};

export default IterativePage;
