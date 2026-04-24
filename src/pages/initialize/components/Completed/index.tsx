import { CheckCircleOutlined } from '@ant-design/icons';
import { Form, Typography } from 'antd';
import type { InitStepFormProps } from '../types';

const { Paragraph, Text, Title } = Typography;

const NEXT_ACTIONS = [
  '前往仪表盘，确认站点基础信息是否已正确展示',
  '发布第一篇内容，验证上传、存储与展示流程是否正常',
  '在“系统设置”中继续完善导航、页脚、关于页、联系方式等基础内容',
];

export default function NextActionsGuide({ onSuccess }: InitStepFormProps) {
  return (
    <Form id="init-form-follow_up" layout="vertical" onFinish={onSuccess}>
      <div className="rounded-xl border border-emerald-100 bg-linear-to-br from-emerald-50/80 via-white to-emerald-50/40 px-5 py-6 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:via-transparent dark:to-emerald-950/15">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
            <CheckCircleOutlined className="text-[34px] text-emerald-500!" />
          </div>
          <div className="pt-1">
            <Title level={4} className="mb-1! mt-2! text-slate-800! dark:text-slate-100!">
              初始化配置已全部完成
            </Title>
            <Paragraph className="mb-0! max-w-2xl text-slate-600! dark:text-slate-300!">
              你已完成 ThriveX 的核心初始化步骤，点击下方“完成”即可进入系统开始使用。
            </Paragraph>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-stroke bg-white/90 px-5 py-5 shadow-[0_8px_24px_rgba(2,132,199,0.06)] dark:border-strokedark dark:bg-[#2f3d4d] dark:shadow-none">
        <Title level={5} className="mb-1! text-slate-800! dark:text-slate-100!">
          建议你接下来这样做
        </Title>

        <ul className="mt-4 m-0 space-y-3 p-0">
          {NEXT_ACTIONS.map((item, index) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-lg border border-slate-200/80 bg-slate-50/60 px-3 py-2.5 text-sm leading-6 text-slate-600 dark:border-slate-700/80 dark:bg-slate-800/30 dark:text-slate-300"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Text className="mt-4 block border-t border-dashed border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          如果后续需要修改初始化内容，也可以在系统设置中随时调整。
        </Text>
      </div>
    </Form>
  );
}