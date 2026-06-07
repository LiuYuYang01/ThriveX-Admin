import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { BiBarChart, BiCloud, BiCrosshair, BiEnvelope, BiLineChart, BiMap, BiShield } from 'react-icons/bi';

import Title from '@/components/Title';
import { getEnvConfigListAPI } from '@/api/config';
import { Config, THIRD_PARTY_ENV_NAMES, ThirdPartyEnvName } from '@/types/app/config';
import ThirdPartySkeleton from './Skeleton';

import {
  BaiduForm,
  BaiduStatisKeyForm,
  EmailForm,
  GaodeCoordinateForm,
  GaodeMapForm,
  HcaptchaForm,
  QiniuForm,
} from './components';

const TAB_KEYS = THIRD_PARTY_ENV_NAMES;

interface MenuItem {
  key: ThirdPartyEnvName;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const MENU_LIST: MenuItem[] = [
  {
    key: 'baidu_statis',
    title: '百度统计',
    description: '网站访问量与用户行为分析',
    icon: <BiBarChart />,
  },
  {
    key: 'baidu_statis_key',
    title: '百度统计 Key',
    description: '前端页面嵌入统计脚本',
    icon: <BiLineChart />,
  },
  {
    key: 'email',
    title: '邮件发送',
    description: '留言、友链、评论的邮件通知',
    icon: <BiEnvelope />,
  },
  {
    key: 'gaode_map',
    title: '高德地图',
    description: '足迹页面地图展示',
    icon: <BiMap />,
  },
  {
    key: 'gaode_coordinate',
    title: '高德坐标',
    description: '地理信息转坐标服务',
    icon: <BiCrosshair />,
  },
  {
    key: 'qiniu_storage',
    title: '七牛云存储',
    description: '静态资源文件托管与 CDN',
    icon: <BiCloud />,
  },
  {
    key: 'hcaptcha',
    title: 'hCaptcha',
    description: '拦截机器人与恶意请求验证',
    icon: <BiShield />,
  },
];

function useThirdPartyConfigs() {
  const [byName, setByName] = useState<Partial<Record<ThirdPartyEnvName, Config>>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: list } = await getEnvConfigListAPI();
      const next: Partial<Record<ThirdPartyEnvName, Config>> = {};
      for (const row of list) {
        if (TAB_KEYS.includes(row.name as ThirdPartyEnvName)) {
          next[row.name as ThirdPartyEnvName] = row;
        }
      }
      setByName(next);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { byName, loading, reload: load };
}

export default function ThirdPartyConfigPage() {
  const [params, setParams] = useSearchParams();
  const tabFromUrl = params.get('tab') as ThirdPartyEnvName | null;
  const activeKey = tabFromUrl && TAB_KEYS.includes(tabFromUrl) ? tabFromUrl : 'baidu_statis';

  const { byName, loading, reload } = useThirdPartyConfigs();

  const handleMenuClick = (key: ThirdPartyEnvName) => {
    setParams({ tab: key });
  };

  useEffect(() => {
    if (!tabFromUrl || !TAB_KEYS.includes(tabFromUrl as ThirdPartyEnvName)) {
      setParams({ tab: activeKey }, { replace: true });
    }
  }, [tabFromUrl, activeKey, setParams]);

  if (loading) {
    return <ThirdPartySkeleton />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title value="第三方配置" />

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-y-2 lg:grid-cols-12">
        <div className="lg:col-span-3 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col p-2 gap-0.5">
              {MENU_LIST.map((item) => {
                const isActive = activeKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleMenuClick(item.key)}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${isActive
                        ? 'bg-primary/8 dark:bg-primary/15'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                      } cursor-pointer`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-primary" />
                    )}

                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${isActive
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-400 dark:bg-white/8 dark:text-gray-500 group-hover:text-gray-600'
                        }`}
                    >
                      <span className="text-[15px]">{item.icon}</span>
                    </div>

                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span
                        className={`truncate text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        {item.title}
                      </span>
                      <span className="truncate text-xs text-gray-400 dark:text-gray-500">{item.description}</span>
                    </div>

                    {isActive && (
                      <div className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-strokedark dark:bg-boxdark lg:mx-2">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-strokedark">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800 dark:text-white">
                {MENU_LIST.find((i) => i.key === activeKey)?.title}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {activeKey === 'baidu_statis' && <BaiduForm row={byName[activeKey]} onSaved={reload} />}
            {activeKey === 'baidu_statis_key' && <BaiduStatisKeyForm row={byName[activeKey]} onSaved={reload} />}
            {activeKey === 'email' && <EmailForm row={byName[activeKey]} onSaved={reload} />}
            {activeKey === 'gaode_map' && <GaodeMapForm row={byName[activeKey]} onSaved={reload} />}
            {activeKey === 'gaode_coordinate' && <GaodeCoordinateForm row={byName[activeKey]} onSaved={reload} />}
            {activeKey === 'qiniu_storage' && <QiniuForm row={byName[activeKey]} onSaved={reload} />}
            {activeKey === 'hcaptcha' && <HcaptchaForm row={byName[activeKey]} onSaved={reload} />}
          </div>
        </div>
      </div>
    </div>
  );
}
