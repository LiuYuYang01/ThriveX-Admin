import React, { useEffect, useMemo, useRef, useState } from 'react';
import GitHubCalendar from 'react-github-calendar';
import dayjs from 'dayjs';
import { Select, Spin } from 'antd';
import {
  FiCalendar,
  FiGitCommit,
  FiGlobe,
  FiGithub,
  FiLayout,
  FiServer,
} from 'react-icons/fi';
import { useConfigStore } from '@/stores';
import Title from '@/components/Title';
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

type ProjectKey = 'blog' | 'admin' | 'server';

const PROJECTS: {
  key: ProjectKey;
  title: string;
  repo: string;
  cacheKey: string;
  icon: TimelineCardIcon;
  accent: {
    icon: string;
    iconBg: string;
    dot: string;
    line: string;
    badge: string;
  };
}[] = [
    {
      key: 'blog',
      title: 'ThriveX Blog',
      repo: 'ThriveX-Blog',
      cacheKey: 'blog_project_iterative',
      icon: FiGlobe,
      accent: {
        icon: 'text-emerald-600 dark:text-emerald-400',
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        dot: 'bg-emerald-500',
        line: 'border-emerald-200 dark:border-emerald-900/50',
        badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
      },
    },
    {
      key: 'admin',
      title: 'ThriveX Admin',
      repo: 'ThriveX-Admin',
      cacheKey: 'admin_project_iterative',
      icon: FiLayout,
      accent: {
        icon: 'text-amber-600 dark:text-amber-400',
        iconBg: 'bg-amber-50 dark:bg-amber-950/40',
        dot: 'bg-amber-500',
        line: 'border-amber-200 dark:border-amber-900/50',
        badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
      },
    },
    {
      key: 'server',
      title: 'ThriveX Server',
      repo: 'ThriveX-Server',
      cacheKey: 'server_project_iterative',
      icon: FiServer,
      accent: {
        icon: 'text-violet-600 dark:text-violet-400',
        iconBg: 'bg-violet-50 dark:bg-violet-950/40',
        dot: 'bg-violet-500',
        line: 'border-violet-200 dark:border-violet-900/50',
        badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
      },
    },
  ];

const ProjectTimelineCard = ({
  title,
  repo,
  icon: Icon,
  accent,
  data,
}: {
  title: string;
  repo: string;
  icon: TimelineCardIcon;
  accent: (typeof PROJECTS)[number]['accent'];
  data: TimelineItem[];
}) => (
  <article className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
    <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-strokedark">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent.iconBg}`}
      >
        <Icon size={20} className={accent.icon} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </h3>
        <p className="truncate text-xs text-slate-400 dark:text-slate-500">{repo}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${accent.badge}`}
      >
        {data.length} 条
      </span>
    </header>

    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent dark:scrollbar-thumb-strokedark">
      {data.length === 0 ? (
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
          <FiGitCommit size={28} className="opacity-40" />
          <p className="text-sm">暂无最近提交</p>
        </div>
      ) : (
        <ul className="space-y-0">
          {data.map((item, index) => (
            <li
              key={`${item.label}-${index}`}
              className={`relative flex gap-3 border-l-2 pb-5 pl-4 last:pb-0 ${accent.line} ${index === data.length - 1 ? 'border-l-transparent' : ''}`}
            >
              <span
                className={`absolute top-1.5 left-[-5px] size-2 rounded-full ring-2 ring-white dark:ring-boxdark ${index === 0 ? accent.dot : 'bg-slate-300 dark:bg-slate-600'}`}
              />
              <div className="min-w-0 flex-1 -mt-0.5">
                <time className="mb-1 block font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  {item.label}
                </time>
                <p className="text-sm leading-relaxed text-slate-700 break-all dark:text-slate-300">
                  {item.children}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </article>
);

const IterativePage = () => {
  const theme = useConfigStore((state) => state.colorMode);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const isFirstLoadRef = useRef(true);

  const [year, setYear] = useState(new Date().getFullYear());
  const [yearList, setYearList] = useState<{ value: number; label: string }[]>([]);

  const [blogData, setBlogData] = useState<TimelineItem[]>([]);
  const [adminData, setAdminData] = useState<TimelineItem[]>([]);
  const [serverData, setServerData] = useState<TimelineItem[]>([]);

  const dataByKey: Record<ProjectKey, TimelineItem[]> = useMemo(
    () => ({ blog: blogData, admin: adminData, server: serverData }),
    [blogData, adminData, serverData],
  );

  const getCommitData = async (project: string) => {
    try {
      if (isFirstLoadRef.current) setInitialLoading(true);
      else setLoading(true);

      const res = await fetch(
        `https://api.github.com/repos/LiuYuYang01/${project}/commits?per_page=10`,
      );
      const data = await res.json();
      const result = data?.map((item: Commit) => ({
        label: dayjs(item.commit.author.date).format('MM-DD HH:mm'),
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

  if (initialLoading) return <Skeleton />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title value="持续迭代">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-1 dark:border-strokedark dark:bg-boxdark-2">
          <FiCalendar size={15} className="shrink-0 text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">年份</span>
          <Select
            variant="borderless"
            value={year}
            options={yearList}
            onChange={setYear}
            className="min-w-[72px]! font-medium! text-slate-700 dark:text-slate-200 [&_.ant-select-selector]:bg-transparent! [&_.ant-select-selector]:px-0!"
            popupMatchSelectWidth={false}
          />
        </div>
      </Title>

      <div className="mb-2">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 sm:flex-row sm:items-center dark:border-strokedark dark:bg-boxdark">
          <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
            <img src="/logo.png" alt="" className="size-9 shrink-0 rounded-lg" />
            <div className="min-w-0">
              <p className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                不断改善、成为最佳
              </p>
            </div>
          </div>
        </div>
      </div>


      <section className="mb-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 dark:border-strokedark">
            <FiGithub size={18} className="text-slate-500 dark:text-slate-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                GitHub 贡献热力图
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                @liuyuyang01 · {year} 年
              </p>
            </div>
          </div>
          <div className="flex justify-center overflow-x-auto px-4 py-6 sm:px-6">
            <GitHubCalendar
              username="liuyuyang01"
              year={year}
              fontSize={12}
              blockSize={12}
              blockMargin={3}
              colorScheme={theme}
              theme={{
                light: ['#f1f5f9', '#bbf7d0', '#4ade80', '#22c55e', '#15803d'],
                dark: ['#1e293b', '#14532d', '#166534', '#16a34a', '#4ade80'],
              }}
            />
          </div>
        </div>
      </section>

      <section className="min-h-0 flex-1 pb-3">
        <div className="mb-3 flex justify-center items-center gap-2">
          <FiGitCommit size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            仓库最近提交
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            各展示最近 10 条
          </span>
        </div>

        <Spin spinning={loading}>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {PROJECTS.map(({ title, repo, icon, accent, key }) => (
              <ProjectTimelineCard
                key={key}
                title={title}
                repo={repo}
                icon={icon}
                accent={accent}
                data={dataByKey[key]}
              />
            ))}
          </div>
        </Spin>
      </section>
    </div>
  );
};

export default IterativePage;
