import { useEffect, useState } from 'react';
import { Form, Input, message } from 'antd';

import { getEnvConfigDataAPI, updateEnvConfigDataAPI } from '@/api/config';
import { Config, HcaptchaEnvValue } from '@/types/app/config';
import type { InitStepFormProps } from '../types';

export default function SecurityConfigForm({ onSuccess }: InitStepFormProps) {
  const [form] = Form.useForm<HcaptchaEnvValue>();
  const [row, setRow] = useState<Config>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadHcaptchaConfig = async () => {
      setLoading(true);
      try {
        const { data } = await getEnvConfigDataAPI('hcaptcha');
        setRow(data);
        const value = data?.value as HcaptchaEnvValue | undefined;
        form.setFieldsValue({ key: value?.key ?? '' });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadHcaptchaConfig();
  }, [form]);

  const handleSave = async (values: HcaptchaEnvValue) => {
    if (!row) {
      message.error('未找到人机验证配置项，请检查后端 env_config 表');
      return;
    }

    setSaving(true);
    try {
      await updateEnvConfigDataAPI({ ...row, value: values });
      message.success('人机验证配置已保存');
      onSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form
      form={form}
      id="init-form-security"
      layout="vertical"
      requiredMark={false}
      onFinish={handleSave}
      className="w-full"
      disabled={loading || saving}
    >
      <Form.Item
        name="key"
        label={
          <div className="w-full flex items-center justify-between">
            <span>人机验证密钥</span>
            <a
              href="https://docs.liuyuyang.net/docs/项目部署/API/人机验证.html"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary text-xs text-gray-400"
            >
              配置教程
            </a>
          </div>
        }
        rules={[{ required: true, message: '请输入密钥' }]}
        className="[&_label]:w-full"
      >
        <Input placeholder="bfb82d04-e46a-4da0-9b6e-9adc052672c8" autoComplete="off" disabled={loading || saving} />
      </Form.Item>
    </Form>
  );
}
