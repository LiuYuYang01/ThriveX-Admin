import { Form, Space, Switch } from 'antd';
import type { InitDraft, UpdateDraft } from '../types';

interface SecurityConfigFormProps {
  draft: InitDraft;
  setDraft: UpdateDraft;
}

export default function SecurityConfigForm({ draft, setDraft }: SecurityConfigFormProps) {
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
}
