import { Card, Skeleton } from 'antd';

export default function SystemSetupSkeleton() {
  return (
    <div>
      <Card className="[&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5! mb-2!">
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
