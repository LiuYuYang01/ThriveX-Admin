import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Skeleton } from 'antd';
import { BiBarChart, BiCloud, BiCrosshair, BiEnvelope, BiMap } from 'react-icons/bi';

import Title from '@/components/Title';
import { getEnvConfigListAPI } from '@/api/config';
import { Config, THIRD_PARTY_ENV_NAMES, ThirdPartyEnvName } from '@/types/app/config';

import { BaiduForm, EmailForm, GaodeCoordinateForm, GaodeMapForm, QiniuForm } from './components';

const TAB_KEYS = THIRD_PARTY_ENV_NAMES;

const TAB_LABELS: Record<ThirdPartyEnvName, string> = {
  baidu_statis: '百度统计',
  email: '邮件发送',
  gaode_map: '高德地图',
  gaode_coordinate: '高德坐标',
  qiniu_storage: '七牛云存储',
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
    description: '站点 ID、Access Token 等统计接入',
    icon: <BiBarChart className={iconSty} />,
  },
  {
    key: 'email',
    title: '邮件发送',
    description: 'SMTP 主机、端口与发件账号',
    icon: <BiEnvelope className={iconSty} />,
  },
  {
    key: 'gaode_map',
    title: '高德地图',
    description: 'Web 端 Key 与安全密钥',
    icon: <BiMap className={iconSty} />,
  },
  {
    key: 'gaode_coordinate',
    title: '高德坐标',
    description: '逆地理、坐标等接口 Key',
    icon: <BiCrosshair className={iconSty} />,
  },
  {
    key: 'qiniu_storage',
    title: '七牛云存储',
    description: '域名、Bucket、密钥与 Endpoint',
    icon: <BiCloud className={iconSty} />,
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
    return (
      <div>
        <Card className="[&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5! mb-2">
          <Skeleton.Input active size="large" style={{ width: 150, height: 32 }} />
        </Card>

        <Card className="border-stroke mt-2 min-h-[calc(100vh-160px)] [&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5!">
          <div className="flex flex-col md:flex-row">
            <ul className="w-full md:w-[20%] md:mr-5 mb-10 md:mb-0 border-b-0 md:border-r border-stroke dark:border-strokedark divide-y divide-solid divide-[#F6F6F6] dark:divide-strokedark">
              {[1, 2, 3, 4, 5].map((item) => (
                <li key={item} className="p-3 pl-5">
                  <div className="flex items-center mb-2">
                    <Skeleton.Avatar active size={20} shape="square" style={{ marginRight: 8 }} />
                    <Skeleton.Input active size="small" style={{ width: 100, height: 20 }} />
                  </div>
                  <Skeleton.Input active size="small" style={{ width: 120, height: 16 }} />
                </li>
              ))}
            </ul>

            <div className="w-full md:w-[80%] px-0 md:px-8 mt-4">
              <Skeleton active paragraph={{ rows: 8 }} />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Title value="第三方配置" />

      <Card className="border-stroke mt-2 min-h-[calc(100vh-160px)]">
        <div className="flex flex-col md:flex-row">
          <ul className="w-full md:w-[20%] md:mr-5 mb-10 md:mb-0 border-b-0 md:border-r border-stroke dark:border-strokedark divide-y divide-solid divide-[#F6F6F6] dark:divide-strokedark">
            {MENU_LIST.map((item) => (
              <li
                key={item.key}
                className={`relative p-3 pl-5 before:content-[''] before:absolute before:top-1/2 before:left-0 before:-translate-y-1/2 before:w-[3.5px] before:h-[0%] before:bg-primary cursor-pointer transition-all ${activeKey === item.key ? 'bg-[#f7f7f8] dark:bg-[#3c5370] before:h-full' : ''}`}
                onClick={() => handleMenuClick(item.key)}
              >
                <h3 className="flex items-center text-base dark:text-white">
                  {item.icon}
                  {item.title}
                </h3>

                <p className="text-[13px] text-gray-500 mt-1">{item.description}</p>
              </li>
            ))}
          </ul>

          <div className="w-full md:w-[80%] px-0 md:px-8">
            <h2 className="text-xl pb-4 dark:text-white">{TAB_LABELS[activeKey]}</h2>
            {activeKey === 'baidu_statis' && <BaiduForm row={byName[activeKey]} onSaved={reload} />}
            {activeKey === 'email' && <EmailForm row={byName[activeKey]} onSaved={reload} />}
            {activeKey === 'gaode_map' && <GaodeMapForm row={byName[activeKey]} onSaved={reload} />}
            {activeKey === 'gaode_coordinate' && <GaodeCoordinateForm row={byName[activeKey]} onSaved={reload} />}
            {activeKey === 'qiniu_storage' && <QiniuForm row={byName[activeKey]} onSaved={reload} />}
          </div>
        </div>
      </Card>
    </div>
  );
}
