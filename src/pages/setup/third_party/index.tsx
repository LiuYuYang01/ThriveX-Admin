import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Typography } from 'antd';
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

const TAB_LABELS: Record<ThirdPartyEnvName, string> = {
  baidu_statis: '百度统计',
  baidu_statis_key: '百度统计 Key',
  email: '邮件发送',
  gaode_map: '高德地图',
  gaode_coordinate: '高德坐标',
  qiniu_storage: '七牛云存储',
  hcaptcha: 'hCaptcha',
};

const iconSty = 'w-5 h-8 mr-1';

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
    description: '用于统计网站访问量、用户行为等数据',
    icon: <BiBarChart className={iconSty} />,
  },
  {
    key: 'baidu_statis_key',
    title: '百度统计 Key',
    description: '用于在前端页面嵌入统计脚本',
    icon: <BiLineChart className={iconSty} />,
  },
  {
    key: 'email',
    title: '邮件发送',
    description: '用于邮件通知，比如有新的留言、友联、评论',
    icon: <BiEnvelope className={iconSty} />,
  },
  {
    key: 'gaode_map',
    title: '高德地图',
    description: '用于在前端足迹页面显示地图',
    icon: <BiMap className={iconSty} />,
  },
  {
    key: 'gaode_coordinate',
    title: '高德坐标',
    description: '用于根据地理信息获取坐标功能',
    icon: <BiCrosshair className={iconSty} />,
  },
  {
    key: 'qiniu_storage',
    title: '七牛云存储',
    description: '用于存储网站静态资源',
    icon: <BiCloud className={iconSty} />,
  },
  {
    key: 'hcaptcha',
    title: 'hCaptcha',
    description: '用于拦截机器人和恶意用户等非法请求',
    icon: <BiShield className={iconSty} />,
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

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-2 lg:grid-cols-12">
        {/* 左侧列表 */}
        <Card className="lg:col-span-3 rounded-xl! overflow-hidden border-none shadow-none dark:bg-boxdark" styles={{ body: { padding: 0 } }}>
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-strokedark">
            {MENU_LIST.map((item) => {
              const isActive = activeKey === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleMenuClick(item.key)}
                  className={`group relative flex items-center gap-3 p-4 text-left transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/5 ${isActive ? 'bg-primary/5 dark:bg-primary/10' : 'bg-transparent'
                    } cursor-pointer`}
                >
                  {/* 激活指示条 */}
                  {isActive && <div className="absolute left-0 top-0 h-full w-1 bg-primary" />}

                  {/* 图标 */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-gray-50 text-gray-400 dark:bg-white/5 dark:text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'
                      }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                  </div>

                  <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex items-center justify-between">
                      <Typography.Text
                        strong
                        className={`text-xl transition-colors ${isActive ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        ellipsis
                      >
                        {item.title}
                      </Typography.Text>
                      {isActive && (
                        <div className="relative flex h-2.5 w-2.5 mr-1">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        </div>
                      )}
                    </div>
                    <Typography.Text
                      type="secondary"
                      className="text-xs mt-1"
                      ellipsis
                    >
                      {item.description}
                    </Typography.Text>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* 右侧内容 */}
        <Card className="lg:col-span-9 rounded-xl! flex flex-col border-none shadow-none dark:bg-boxdark" styles={{ body: { padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } }}>
          <h2 className="text-xl pb-4 dark:text-white">{TAB_LABELS[activeKey]}</h2>
          {activeKey === 'baidu_statis' && <BaiduForm row={byName[activeKey]} onSaved={reload} />}
          {activeKey === 'baidu_statis_key' && <BaiduStatisKeyForm row={byName[activeKey]} onSaved={reload} />}
          {activeKey === 'email' && <EmailForm row={byName[activeKey]} onSaved={reload} />}
          {activeKey === 'gaode_map' && <GaodeMapForm row={byName[activeKey]} onSaved={reload} />}
          {activeKey === 'gaode_coordinate' && <GaodeCoordinateForm row={byName[activeKey]} onSaved={reload} />}
          {activeKey === 'qiniu_storage' && <QiniuForm row={byName[activeKey]} onSaved={reload} />}
          {activeKey === 'hcaptcha' && <HcaptchaForm row={byName[activeKey]} onSaved={reload} />}
        </Card>
      </div>
    </div>
  );
}
