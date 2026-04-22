import { useMemo, useState } from 'react';
import { Button, Card, Progress, Steps, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import AccountConfigForm from './components/AccountConfigForm';
import AIConfigForm from './components/AIConfigForm';
import SecurityConfigForm from './components/SecurityConfigForm';
import StorageConfigForm from './components/StorageConfigForm';
import WebsiteConfigForm from './components/WebsiteConfigForm';
import { completeSystemInitAPI } from '@/api/initialize';

interface InitStep {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  required: boolean;
}

const INIT_STEPS: InitStep[] = [
  {
    key: 'account',
    title: '账户设置',
    subtitle: '配置管理员账号和安全信息',
    description: '请先完成管理员账号与密码设置，确保后台可安全登录。',
    required: true,
  },
  {
    key: 'website',
    title: '网站设置',
    subtitle: '配置站点标题、SEO、LOGO 等',
    description: '建议优先完善品牌信息和基础 SEO，保证前台展示完整。',
    required: true,
  },
  {
    key: 'ai',
    title: 'AI 设置',
    subtitle: '配置 AI 助手能力与提示词',
    description: '初始化 AI 参数，方便后续内容生成和智能运营。',
    required: true,
  },
  {
    key: 'storage',
    title: '存储设置',
    subtitle: '配置对象存储与资源上传能力',
    description: '建议优先配置存储，避免图片与附件上传受限。',
    required: true,
  },
  {
    key: 'security',
    title: '安全设置',
    subtitle: '启用验证码与反爬保护策略',
    description: '通过人机校验降低恶意访问风险，提升系统稳定性。',
    required: false,
  },
];

export default function SetupInitializePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [shouldCompleteInit, setShouldCompleteInit] = useState(false);
  const navigate = useNavigate();

  const current = INIT_STEPS[currentStep];
  const progress = useMemo(() => Math.round(((currentStep + 1) / INIT_STEPS.length) * 100), [currentStep]);
  const isLastStep = currentStep === INIT_STEPS.length - 1;
  const currentFormId = `init-form-${current.key}`;

  const handleStepSuccess = async () => {
    if (isLastStep && shouldCompleteInit) {
      setCompleting(true);
      try {
        await completeSystemInitAPI();
        message.success('初始化配置已完成');
        navigate('/', { replace: true });
      } finally {
        setCompleting(false);
        setShouldCompleteInit(false);
      }
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, INIT_STEPS.length - 1));
  };

  const renderFormPanel = () => {
    switch (current.key) {
      case 'account':
        return <AccountConfigForm onSuccess={handleStepSuccess} />;
      case 'website':
        return <WebsiteConfigForm onSuccess={handleStepSuccess} />;
      case 'ai':
        return <AIConfigForm onSuccess={handleStepSuccess} />;
      case 'storage':
        return <StorageConfigForm onSuccess={handleStepSuccess} />;
      case 'security':
        return <SecurityConfigForm onSuccess={handleStepSuccess} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 md:px-6 md:py-8 bg-[#f5f7fb] dark:bg-[#1A222C]">
      <div className="max-w-6xl mx-auto rounded-xl border border-stroke dark:border-strokedark bg-linear-to-br from-[#f8fbff] via-white to-[#f5f9ff] dark:from-[#2b394a] dark:via-boxdark-2 dark:to-[#2c3a4c] shadow-[0_8px_28px_rgba(96,165,250,0.14)]">
        <div className="px-6 md:px-10 pt-8 pb-5 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100">欢迎使用 ThriveX</h1>
              <p className="mt-2 text-sm md:text-base text-slate-500 dark:text-slate-300">
                接下来将引导您完成 ThriveX 的必要配置，帮助你快速上手
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500 dark:text-slate-300">当前进度</span>
              <span className="text-2xl text-primary font-medium">{progress}%</span>
            </div>
            <Progress percent={progress} showInfo={false} strokeColor={{ '0%': '#93c5fd', '100%': '#60a5fa' }} />
          </div>
        </div>

        <div className="px-6 md:px-10 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="rounded-lg h-fit bg-transparent! border-none! shadow-none!">
              <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">初始化步骤</h4>
              <div className="mt-4">
                <Steps
                  direction="vertical"
                  size="small"
                  current={currentStep}
                  items={INIT_STEPS.map((step, stepIndex) => ({
                    title: step.title,
                    description: step.subtitle,
                    disabled: stepIndex > currentStep,
                  }))}
                  onChange={(targetStep) => {
                    if (targetStep <= currentStep) {
                      setCurrentStep(targetStep);
                    }
                  }}
                />
              </div>
            </Card>

            <Card className="lg:col-span-2 rounded-lg bg-transparent! border-none! shadow-none!">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="mt-1 text-xl font-semibold text-slate-800 dark:text-slate-100">{current.title}</h3>
                  <p className="mt-2 text-slate-500 dark:text-slate-300">{current.description}</p>
                </div>
              </div>

              <div className="mt-5 rounded-md border border-stroke dark:border-strokedark bg-white/80 dark:bg-[#2f3d4d] px-4 py-4">
                {renderFormPanel()}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                <Button onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))} disabled={currentStep === 0}>上一步</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  form={currentFormId}
                  loading={isLastStep && completing}
                  onClick={() => {
                    if (isLastStep) {
                      setShouldCompleteInit(true);
                    }
                  }}
                >
                  {isLastStep ? '完成' : '下一步'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
