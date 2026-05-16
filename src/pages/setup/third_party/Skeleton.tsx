import { Card, Skeleton } from 'antd';

import { THIRD_PARTY_ENV_NAMES } from '@/types/app/config';

export default function ThirdPartySkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Card className="[&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5! mb-2! border-none shadow-none">
        <Skeleton.Input active size="large" style={{ width: 150, height: 32 }} />
      </Card>

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-2 lg:grid-cols-12">
        {/* 左侧列表骨架屏 */}
        <Card className="lg:col-span-3 overflow-hidden border-none shadow-none dark:bg-boxdark" styles={{ body: { padding: 0 } }}>
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-strokedark">
            {Array.from({ length: THIRD_PARTY_ENV_NAMES.length }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton.Avatar active size={40} shape="square" className="rounded-xl" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton.Input active size="small" style={{ width: 100, height: 20 }} />
                  <Skeleton.Input active size="small" style={{ width: 120, height: 16 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 右侧内容骨架屏 */}
        <Card className="lg:col-span-9 flex flex-col border-none shadow-none dark:bg-boxdark" styles={{ body: { padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </div>
    </div>
  );
}
