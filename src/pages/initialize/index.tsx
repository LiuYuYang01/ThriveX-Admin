import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Popconfirm, Progress, Steps, Tooltip, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import AccountConfigForm from './components/AccountConfigForm';
import EmailConfigForm from './components/EmailConfigForm';
import Completed from './components/Completed';
import SecurityConfigForm from './components/SecurityConfigForm';
import StorageConfigForm from './components/StorageConfigForm';
import WebsiteConfigForm from './components/WebsiteConfigForm';
import { completeSystemInitAPI } from '@/api/initialize';
import { useUserStore } from '@/stores';

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
const INIT_CACHE_KEY = 'thrivex_system_initialized';

export default function SetupInitializePage() {
  const [currentStep, setCurrentStep] = useState(() => {
    const cachedStep = Number(localStorage.getItem(INIT_STEP_STORAGE_KEY));
    if (Number.isNaN(cachedStep)) {
      return 0;
    }
    return Math.min(Math.max(cachedStep, 0), INIT_STEPS.length - 1);
  });
  const [completing, setCompleting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [shouldCompleteInit, setShouldCompleteInit] = useState(false);
  const navigate = useNavigate();
  const store = useUserStore();

  const current = INIT_STEPS[currentStep];
  const progress = useMemo(() => Math.round(((currentStep + 1) / INIT_STEPS.length) * 100), [currentStep]);
  const isLastStep = currentStep === INIT_STEPS.length - 1;
  const currentFormId = `init-form-${current.key}`;

  useEffect(() => {
    localStorage.setItem(INIT_STEP_STORAGE_KEY, String(currentStep));
  }, [currentStep]);

  const handleSkipInit = async () => {
    setSkipping(true);
    try {
      await completeSystemInitAPI();
      sessionStorage.setItem(INIT_CACHE_KEY, '1');
      localStorage.removeItem(INIT_STEP_STORAGE_KEY);
      message.success('已跳过初始化');
      window.location.href = '/';
    } catch {
      message.error('跳过失败，请重试');
    } finally {
      setSkipping(false);
    }
  };

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
        <div className="absolute inset-0 dark:hidden opacity-[0.45] bg-[radial-gradient(rgba(148,163,184,0.35)_1px,transparent_1px)] bg-size-[22px_22px]" />
        <div className="absolute inset-0 hidden dark:block opacity-[0.25] bg-[radial-gradient(rgba(148,163,184,0.25)_1px,transparent_1px)] bg-size-[26px_26px]" />
        <div className="absolute -top-24 -right-28 h-[340px] w-[340px] rounded-full blur-3xl opacity-40 bg-linear-to-br from-sky-300 via-blue-200 to-transparent dark:from-sky-500/30 dark:via-indigo-500/20 dark:to-transparent" />
        <div className="absolute -bottom-28 -left-36 h-[420px] w-[420px] rounded-full blur-3xl opacity-35 bg-linear-to-tr from-violet-300 via-fuchsia-200 to-transparent dark:from-violet-500/25 dark:via-fuchsia-500/15 dark:to-transparent" />
      </div>

      <div className="relative w-full lg:max-w-6xl mx-auto rounded-xl bg-white/75 dark:bg-[#243244]/45 backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-black/5 dark:ring-white/5 shadow-[0_10px_38px_rgba(15,23,42,0.12)]">
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <Popconfirm
            title="警告"
            description="跳过初始化后仍可以在设置中完成配置"
            onConfirm={handleSkipInit}
            okText="确定跳过"
            cancelText="取消"
          >
            <Button loading={skipping}>跳过</Button>
          </Popconfirm>
          <Tooltip title="退出登录">
            <Popconfirm
              title="确定要退出登录吗？"
              onConfirm={() => store.quitLogin()}
              okText="确定"
              cancelText="取消"
            >
              <Button icon={
                <svg className="fill-current" width="16" height="16" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5375 0.618744H11.6531C10.7594 0.618744 10.0031 1.37499 10.0031 2.26874V4.64062C10.0031 5.05312 10.3469 5.39687 10.7594 5.39687C11.1719 5.39687 11.55 5.05312 11.55 4.64062V2.23437C11.55 2.16562 11.5844 2.13124 11.6531 2.13124H15.5375C16.3625 2.13124 17.0156 2.78437 17.0156 3.60937V18.3562C17.0156 19.1812 16.3625 19.8344 15.5375 19.8344H11.6531C11.5844 19.8344 11.55 19.8 11.55 19.7312V17.3594C11.55 16.9469 11.2062 16.6031 10.7594 16.6031C10.3125 16.6031 10.0031 16.9469 10.0031 17.3594V19.7312C10.0031 20.625 10.7594 21.3812 11.6531 21.3812H15.5375C17.2219 21.3812 18.5625 20.0062 18.5625 18.3562V3.64374C18.5625 1.95937 17.1875 0.618744 15.5375 0.618744Z" fill="" />
                  <path d="M6.05001 11.7563H12.2031C12.6156 11.7563 12.9594 11.4125 12.9594 11C12.9594 10.5875 12.6156 10.2438 12.2031 10.2438H6.08439L8.21564 8.07813C8.52501 7.76875 8.52501 7.2875 8.21564 6.97812C7.90626 6.66875 7.42501 6.66875 7.11564 6.97812L3.67814 10.4844C3.36876 10.7938 3.36876 11.275 3.67814 11.5844L7.11564 15.0906C7.25314 15.2281 7.45939 15.3312 7.66564 15.3312C7.87189 15.3312 8.04376 15.2625 8.21564 15.125C8.52501 14.8156 8.52501 14.3344 8.21564 14.025L6.05001 11.7563Z" fill="" />
                </svg>
              } />
            </Popconfirm>
          </Tooltip>
        </div>
        <div className="px-6 md:px-10 pt-8 pb-5 border-b border-stroke dark:border-strokedark">
          <div className="pr-28 md:pr-36">
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100">欢迎使用 ThriveX</h1>
            <p className="mt-2 text-sm md:text-base text-slate-500 dark:text-slate-300">
              接下来将引导您完成 ThriveX 的必要配置，帮助你快速上手
            </p>
          </div>

          <div className="mt-6 w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500 dark:text-slate-300">当前进度</span>
              <span className="sm:hidden text-xl text-primary font-bold tabular-nums">{progress}%</span>
            </div>
            <div className="flex w-full items-center gap-4 sm:gap-5">
              <div className="flex-1 min-w-0 w-full">
                <Progress className="w-full" percent={progress} showInfo={false} strokeColor={{ '0%': '#93c5fd', '100%': '#60a5fa' }} />
              </div>
              <span className="hidden sm:block shrink-0 text-5xl lg:text-6xl leading-none text-primary font-bold tabular-nums pointer-events-none select-none">
                {progress}%
              </span>
            </div>
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
