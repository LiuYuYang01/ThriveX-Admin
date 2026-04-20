import { useMemo, useState } from 'react';
import { Button, Card, Progress, Steps, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { BiCheckCircle, BiRightArrowAlt } from 'react-icons/bi';

interface InitStep {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  path: string;
  required: boolean;
}

const INIT_STEPS: InitStep[] = [
  {
    key: 'account',
    title: '账户设置',
    subtitle: '配置管理员账号和安全信息',
    description: '请先完成管理员账号与密码设置，确保后台可安全登录。',
    path: '/setup/system?tab=system',
    required: true,
  },
  {
    key: 'website',
    title: '网站设置',
    subtitle: '配置站点标题、SEO、LOGO 等',
    description: '建议优先完善品牌信息和基础 SEO，保证前台展示完整。',
    path: '/setup/system?tab=web',
    required: true,
  },
  {
    key: 'ai',
    title: 'AI 设置',
    subtitle: '配置 AI 助手能力与提示词',
    description: '初始化 AI 参数，方便后续内容生成和智能运营。',
    path: '/assistant',
    required: true,
  },
  {
    key: 'storage',
    title: '存储设置',
    subtitle: '配置对象存储与资源上传能力',
    description: '建议优先配置存储，避免图片与附件上传受限。',
    path: '/setup/third_party?tab=qiniu_storage',
    required: true,
  },
  {
    key: 'security',
    title: '安全设置',
    subtitle: '启用验证码与反爬保护策略',
    description: '通过人机校验降低恶意访问风险，提升系统稳定性。',
    path: '/setup/third_party?tab=hcaptcha',
    required: false,
  },
];

export default function SetupInitializePage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const current = INIT_STEPS[currentStep];
  const progress = useMemo(() => Math.round(((currentStep + 1) / INIT_STEPS.length) * 100), [currentStep]);

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 md:py-8 bg-[#f5f7fb] dark:bg-[#1A222C]">
      <div className="max-w-6xl mx-auto rounded-xl border border-stroke dark:border-strokedark bg-gradient-to-br from-[#f8fbff] via-white to-[#f5f9ff] dark:from-[#2b394a] dark:via-[#263444] dark:to-[#2c3a4c] shadow-[0_8px_28px_rgba(96,165,250,0.14)]">
        <div className="px-6 md:px-10 pt-8 pb-5 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100">欢迎使用 Thrive X</h1>
              <p className="mt-2 text-sm md:text-base text-slate-500 dark:text-slate-300">
                系统检测到当前项目尚未初始化，请按步骤完成核心配置（后端字段接入后将自动切换）。
              </p>
            </div>
            <Tag color="processing" className="px-3 py-1 text-[13px] rounded-md">
              初始化流程
            </Tag>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500 dark:text-slate-300">流程进度</span>
              <span className="text-sm text-primary font-medium">{progress}%</span>
            </div>
            <Progress percent={progress} showInfo={false} strokeColor={{ '0%': '#93c5fd', '100%': '#60a5fa' }} />
          </div>
        </div>

        <div className="px-6 md:px-10 py-8">
          <Steps
            current={currentStep}
            responsive
            items={INIT_STEPS.map((step) => ({
              title: step.title,
              description: step.subtitle,
            }))}
            onChange={setCurrentStep}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-8">
            <Card className="lg:col-span-2 border-stroke dark:border-strokedark shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-none rounded-lg">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-300">当前步骤</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-800 dark:text-slate-100">{current.title}</h3>
                  <p className="mt-2 text-slate-500 dark:text-slate-300">{current.description}</p>
                </div>
                {current.required ? <Tag color="red">必配</Tag> : <Tag color="default">建议</Tag>}
              </div>

              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <Button type="primary" icon={<BiRightArrowAlt />} onClick={() => navigate(current.path)}>
                  去完成当前配置
                </Button>
                <Button onClick={() => setCurrentStep((prev) => Math.min(prev + 1, INIT_STEPS.length - 1))}>下一步</Button>
              </div>
            </Card>

            <Card className="border-stroke dark:border-strokedark shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-none rounded-lg">
              <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">配置清单</h4>
              <ul className="mt-4 space-y-3">
                {INIT_STEPS.map((step, index) => (
                  <li
                    key={step.key}
                    className={`p-3 rounded-md border transition-all cursor-pointer ${index === currentStep
                      ? 'border-primary bg-[#f3f8ff] dark:bg-[#33485f]'
                      : 'border-stroke dark:border-strokedark hover:border-[#bfdbfe]'
                      }`}
                    onClick={() => setCurrentStep(index)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-100">{step.title}</span>
                      {index < currentStep ? <BiCheckCircle className="text-primary text-lg" /> : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{step.subtitle}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
