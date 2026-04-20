import { useMemo, useState } from 'react';
import { Button, Card, Form, Input, Progress, Select, Space, Steps, Switch, Tag, message } from 'antd';
import { BiCheckCircle } from 'react-icons/bi';

interface InitStep {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  required: boolean;
}

interface InitDraft {
  accountName: string;
  oldPassword: string;
  newPassword: string;
  siteTitle: string;
  siteDesc: string;
  siteLogo: string;
  aiProvider: string;
  aiModel: string;
  aiPrompt: string;
  storageType: string;
  storageBucket: string;
  storageDomain: string;
  securityCaptcha: boolean;
  securityRateLimit: boolean;
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

const INITIAL_DRAFT: InitDraft = {
  accountName: 'admin',
  oldPassword: '',
  newPassword: '',
  siteTitle: '',
  siteDesc: '',
  siteLogo: '',
  aiProvider: 'openai',
  aiModel: '',
  aiPrompt: '',
  storageType: 'qiniu',
  storageBucket: '',
  storageDomain: '',
  securityCaptcha: true,
  securityRateLimit: true,
};

export default function SetupInitializePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [draft, setDraft] = useState<InitDraft>(INITIAL_DRAFT);
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);

  const current = INIT_STEPS[currentStep];
  const progress = useMemo(() => Math.round(((currentStep + 1) / INIT_STEPS.length) * 100), [currentStep]);

  const validateStep = () => {
    switch (current.key) {
      case 'account':
        return Boolean(draft.accountName && draft.newPassword);
      case 'website':
        return Boolean(draft.siteTitle && draft.siteDesc);
      case 'ai':
        return Boolean(draft.aiProvider && draft.aiModel && draft.aiPrompt);
      case 'storage':
        return Boolean(draft.storageType && draft.storageBucket && draft.storageDomain);
      case 'security':
        return Boolean(draft.securityCaptcha || draft.securityRateLimit);
      default:
        return false;
    }
  };

  const markCurrentDone = () => {
    if (!validateStep()) {
      message.warning('请先完善当前步骤的必填配置项');
      return;
    }
    setCompletedKeys((prev) => (prev.includes(current.key) ? prev : [...prev, current.key]));
    message.success(`${current.title}已保存（本地草稿）`);
  };

  const renderFormPanel = () => {
    switch (current.key) {
      case 'account':
        return (
          <Form layout="vertical" requiredMark={false}>
            <Form.Item label="管理员账号" required>
              <Input value={draft.accountName} onChange={(e) => setDraft((s) => ({ ...s, accountName: e.target.value }))} placeholder="请输入管理员账号" />
            </Form.Item>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Form.Item label="旧密码">
                <Input.Password value={draft.oldPassword} onChange={(e) => setDraft((s) => ({ ...s, oldPassword: e.target.value }))} placeholder="请输入旧密码（首次可留空）" />
              </Form.Item>
              <Form.Item label="新密码" required>
                <Input.Password value={draft.newPassword} onChange={(e) => setDraft((s) => ({ ...s, newPassword: e.target.value }))} placeholder="请输入新密码" />
              </Form.Item>
            </div>
          </Form>
        );
      case 'website':
        return (
          <Form layout="vertical" requiredMark={false}>
            <Form.Item label="网站标题" required>
              <Input value={draft.siteTitle} onChange={(e) => setDraft((s) => ({ ...s, siteTitle: e.target.value }))} placeholder="例如：Thrive X Blog" />
            </Form.Item>
            <Form.Item label="网站描述" required>
              <Input.TextArea value={draft.siteDesc} onChange={(e) => setDraft((s) => ({ ...s, siteDesc: e.target.value }))} rows={3} placeholder="请输入站点简介和定位" />
            </Form.Item>
            <Form.Item label="LOGO 地址">
              <Input value={draft.siteLogo} onChange={(e) => setDraft((s) => ({ ...s, siteLogo: e.target.value }))} placeholder="https://..." />
            </Form.Item>
          </Form>
        );
      case 'ai':
        return (
          <Form layout="vertical" requiredMark={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Form.Item label="AI 服务商" required>
                <Select
                  value={draft.aiProvider}
                  onChange={(value) => setDraft((s) => ({ ...s, aiProvider: value }))}
                  options={[
                    { label: 'OpenAI', value: 'openai' },
                    { label: 'Anthropic', value: 'anthropic' },
                    { label: 'DeepSeek', value: 'deepseek' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="模型名称" required>
                <Input value={draft.aiModel} onChange={(e) => setDraft((s) => ({ ...s, aiModel: e.target.value }))} placeholder="例如：gpt-4o-mini" />
              </Form.Item>
            </div>
            <Form.Item label="系统提示词" required>
              <Input.TextArea value={draft.aiPrompt} onChange={(e) => setDraft((s) => ({ ...s, aiPrompt: e.target.value }))} rows={4} placeholder="请输入默认系统提示词" />
            </Form.Item>
          </Form>
        );
      case 'storage':
        return (
          <Form layout="vertical" requiredMark={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Form.Item label="存储类型" required>
                <Select
                  value={draft.storageType}
                  onChange={(value) => setDraft((s) => ({ ...s, storageType: value }))}
                  options={[
                    { label: '七牛云', value: 'qiniu' },
                    { label: '阿里云 OSS', value: 'oss' },
                    { label: '腾讯云 COS', value: 'cos' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="存储桶" required>
                <Input value={draft.storageBucket} onChange={(e) => setDraft((s) => ({ ...s, storageBucket: e.target.value }))} placeholder="请输入 Bucket 名称" />
              </Form.Item>
            </div>
            <Form.Item label="访问域名" required>
              <Input value={draft.storageDomain} onChange={(e) => setDraft((s) => ({ ...s, storageDomain: e.target.value }))} placeholder="https://cdn.your-domain.com" />
            </Form.Item>
          </Form>
        );
      case 'security':
        return (
          <Form layout="vertical" requiredMark={false}>
            <div className="rounded-md border border-stroke dark:border-strokedark px-4 py-3">
              <Space direction="vertical" size={12} className="w-full">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-100">启用验证码防护</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">拦截机器人和异常提交请求</p>
                  </div>
                  <Switch checked={draft.securityCaptcha} onChange={(checked) => setDraft((s) => ({ ...s, securityCaptcha: checked }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-100">启用频率限制</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">降低高频恶意请求造成的资源消耗</p>
                  </div>
                  <Switch checked={draft.securityRateLimit} onChange={(checked) => setDraft((s) => ({ ...s, securityRateLimit: checked }))} />
                </div>
              </Space>
            </div>
          </Form>
        );
      default:
        return null;
    }
  };

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

              <div className="mt-5 rounded-md border border-stroke dark:border-strokedark bg-white/80 dark:bg-[#2f3d4d] px-4 py-4">
                {renderFormPanel()}
              </div>

              <div className="mt-5 flex items-center gap-3 flex-wrap">
                <Button type="primary" onClick={markCurrentDone}>
                  保存当前步骤
                </Button>
                <Button
                  onClick={() => {
                    markCurrentDone();
                    setCurrentStep((prev) => Math.min(prev + 1, INIT_STEPS.length - 1));
                  }}
                >
                  保存并下一步
                </Button>
                <Button onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}>上一步</Button>
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
                      {completedKeys.includes(step.key) ? <BiCheckCircle className="text-primary text-lg" /> : null}
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
