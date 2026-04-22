import { Form, Space, Switch, message } from 'antd';
import type { InitStepFormProps } from '../types';

interface SecurityFormValues {
  securityCaptcha: boolean;
  securityRateLimit: boolean;
}

export default function SecurityConfigForm({ onSuccess }: InitStepFormProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSave = (_values: SecurityFormValues) => {
    message.success('安全设置已保存');
    onSuccess();
  };

  return (
    <Form
      id="init-form-security"
      layout="vertical"
      requiredMark={false}
      initialValues={{ securityCaptcha: true, securityRateLimit: true }}
      onFinish={handleSave}
    >
      <div className="rounded-md border border-stroke dark:border-strokedark px-4 py-3">
        <Space direction="vertical" size={12} className="w-full">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-100">启用验证码防护</p>
              <p className="text-xs text-slate-500 dark:text-slate-300">拦截机器人和异常提交请求</p>
            </div>
            <Form.Item name="securityCaptcha" valuePropName="checked" className="mb-0">
              <Switch />
            </Form.Item>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-100">启用频率限制</p>
              <p className="text-xs text-slate-500 dark:text-slate-300">降低高频恶意请求造成的资源消耗</p>
            </div>
            <Form.Item name="securityRateLimit" valuePropName="checked" className="mb-0">
              <Switch />
            </Form.Item>
          </div>
        </Space>
      </div>
    </Form>
  );
}
