import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Progress, Steps, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import AccountConfigForm from './components/AccountConfigForm';
import EmailConfigForm from './components/EmailConfigForm';
import Completed from './components/Completed';
import SecurityConfigForm from './components/SecurityConfigForm';
import StorageConfigForm from './components/StorageConfigForm';
import WebsiteConfigForm from './components/WebsiteConfigForm';
import { completeSystemInitAPI } from '@/api/initialize';

interface InitStep {
  key: string;
  title: string;
  subtitle: string;
}

const INIT_STEPS: InitStep[] = [
  {
    key: 'account',
    title: '账户设置',
    subtitle: '配置管理员账号和安全信息',
  },
  {
    key: 'website',
    title: '网站设置',
    subtitle: '配置站点标题、SEO、LOGO 等',
  },
  {
    key: 'storage',
    title: '存储设置',
    subtitle: '配置对象存储与资源上传能力',
  },
  {
    key: 'email',
    title: '邮箱设置',
    subtitle: '配置 SMTP 信息，用于邮件通知与验证码发送',
  },
  {
    key: 'security',
    title: '人机验证',
    subtitle: '配置 hCaptcha 密钥，拦截机器人和恶意请求',
  },
  {
    key: 'follow_up',
    title: '后续步骤',
    subtitle: '后续需要做的事情...',
  }
];

const INIT_STEP_STORAGE_KEY = 'thrivex-init-current-step';

export default function SetupInitializePage() {
  const [currentStep, setCurrentStep] = useState(() => {
    const cachedStep = Number(localStorage.getItem(INIT_STEP_STORAGE_KEY));
    if (Number.isNaN(cachedStep)) {
      return 0;
    }
    return Math.min(Math.max(cachedStep, 0), INIT_STEPS.length - 1);
  });
  const [completing, setCompleting] = useState(false);
  const [shouldCompleteInit, setShouldCompleteInit] = useState(false);
  const navigate = useNavigate();

  const current = INIT_STEPS[currentStep];
  const progress = useMemo(() => Math.round(((currentStep + 1) / INIT_STEPS.length) * 100), [currentStep]);
  const isLastStep = currentStep === INIT_STEPS.length - 1;
  const currentFormId = `init-form-${current.key}`;

  useEffect(() => {
    localStorage.setItem(INIT_STEP_STORAGE_KEY, String(currentStep));
  }, [currentStep]);

  const handleStepSuccess = async () => {
    if (isLastStep && shouldCompleteInit) {
      setCompleting(true);
      try {
        await completeSystemInitAPI();
        localStorage.removeItem(INIT_STEP_STORAGE_KEY);
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
      case 'storage':
        return <StorageConfigForm onSuccess={handleStepSuccess} />;
      case 'email':
        return <EmailConfigForm onSuccess={handleStepSuccess} />;
      case 'security':
        return <SecurityConfigForm onSuccess={handleStepSuccess} />;
      case 'follow_up':
        return <Completed onSuccess={handleStepSuccess} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen flex items-center justify-center px-4 py-6 md:px-6 md:py-8 bg-[#f5f7fb] dark:bg-[#1A222C]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 dark:hidden bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.22),transparent_48%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.18),transparent_52%),radial-gradient(circle_at_50%_92%,rgba(34,197,94,0.14),transparent_50%)]" />
        <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(circle_at_20%_12%,rgba(96,165,250,0.18),transparent_55%),radial-gradient(circle_at_85%_20%,rgba(147,51,234,0.18),transparent_58%),radial-gradient(circle_at_50%_92%,rgba(34,197,94,0.12),transparent_58%)]" />
        <div className="absolute inset-0 dark:hidden opacity-[0.45] bg-[radial-gradient(rgba(148,163,184,0.35)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="absolute inset-0 hidden dark:block opacity-[0.25] bg-[radial-gradient(rgba(148,163,184,0.25)_1px,transparent_1px)] [background-size:26px_26px]" />
        <div className="absolute -top-24 -right-28 h-[340px] w-[340px] rounded-full blur-3xl opacity-40 bg-linear-to-br from-sky-300 via-blue-200 to-transparent dark:from-sky-500/30 dark:via-indigo-500/20 dark:to-transparent" />
        <div className="absolute -bottom-28 -left-36 h-[420px] w-[420px] rounded-full blur-3xl opacity-35 bg-linear-to-tr from-violet-300 via-fuchsia-200 to-transparent dark:from-violet-500/25 dark:via-fuchsia-500/15 dark:to-transparent" />
      </div>

      <div className="w-full lg:max-w-6xl mx-auto rounded-xl bg-white/75 dark:bg-[#243244]/45 backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-black/5 dark:ring-white/5 shadow-[0_10px_38px_rgba(15,23,42,0.12)]">
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
              <span className="hidden sm:block absolute top-[2%] lg:top-[3%] right-12 text-[70px] text-primary font-bold">{progress}%</span>
              <span className="block sm:hidden text-xl text-primary font-bold">{progress}%</span>
            </div>
            <Progress percent={progress} showInfo={false} strokeColor={{ '0%': '#93c5fd', '100%': '#60a5fa' }} />
          </div>
        </div>

        <div className="px-6 md:px-10 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="rounded-lg h-fit bg-transparent! border-none! shadow-none! [&>.ant-card-body]:p-0! sm:[&>.ant-card-body]:p-5!">
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

            <Card className="lg:col-span-2 rounded-lg bg-transparent! border-none! shadow-none! [&>.ant-card-body]:p-0! sm:[&>.ant-card-body]:p-5!">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="mt-1 text-xl font-semibold text-slate-800 dark:text-slate-100">{current.title}</h3>
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
                      location.href = '/';
                    }
                  }}
                >
                  {isLastStep ? '进入系统' : '下一步'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
