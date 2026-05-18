import { Card, Skeleton } from 'antd';

export default function SystemSetupSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Card className="[&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5! mb-2! border-none bg-transparent! shadow-none!">
        <Skeleton.Input active size="large" style={{ width: 150, height: 32 }} />
      </Card>

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-2 lg:grid-cols-12">
        {/* 左侧列表骨架屏 */}
        <Card className="lg:col-span-3 rounded-xl! overflow-hidden border-none shadow-none dark:bg-boxdark" styles={{ body: { padding: 0 } }}>
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-strokedark">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center gap-3 p-4">
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
        <Card className="lg:col-span-9 rounded-xl! flex flex-col border-none shadow-none dark:bg-boxdark" styles={{ body: { padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </div>
    </div>
  );
}
