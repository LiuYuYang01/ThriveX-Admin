import { useEffect, useState } from 'react';
import { Button, Form, Input, message } from 'antd';

import { updateEnvConfigDataAPI } from '@/api/config';
import { HcaptchaEnvValue } from '@/types/app/config';

import type { ThirdPartyFormProps } from '../types';

const Label = ({ title, url }: { title: string; url: string }) => (
  <div className="w-full flex items-center justify-between">
    <span>{title}</span>
    <a href={url} target="_blank" rel="noreferrer" className="hover:text-primary text-xs text-gray-400">
      配置教程
    </a>
  </div>
);

export function HcaptchaForm({ row, onSaved }: ThirdPartyFormProps) {
  const [form] = Form.useForm<HcaptchaEnvValue>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const v = row?.value as HcaptchaEnvValue | undefined;
    form.setFieldsValue({ key: v?.key ?? '' });
  }, [row, form]);

  const onFinish = async (values: HcaptchaEnvValue) => {
    if (!row) {
      message.error('未找到配置项，请检查后端 env_config 表');
      return;
    }
    setSaving(true);
    try {
      await updateEnvConfigDataAPI({ ...row, value: values });
      message.success('保存成功');
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form form={form} layout="vertical" size="large" onFinish={onFinish} className="w-full lg:w-[500px] md:ml-10">
      <Form.Item
        name="key"
        label={<Label title="密钥" url="https://docs.liuyuyang.net/docs/项目部署/API/人机验证.html" />}
        rules={[{ required: true, message: '请输入密钥' }]}
        className="[&_label]:w-full"
      >
        <Input placeholder="bfb82d04-e46a-4da0-9b6e-9adc052672c8" autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={saving} className="w-full">
          确定
        </Button>
      </Form.Item>
    </Form>
  );
}
