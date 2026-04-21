import { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, message } from 'antd';

import { updateEnvConfigDataAPI } from '@/api/config';
import { BaiduStatisEnvValue } from '@/types/app/config';

import type { ThirdPartyFormProps } from '../types';

export function BaiduForm({ row, onSaved }: ThirdPartyFormProps) {
  const [form] = Form.useForm<BaiduStatisEnvValue>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const v = row?.value as BaiduStatisEnvValue | undefined;
    form.setFieldsValue({
      site_id: v?.site_id ?? 0,
      access_token: v?.access_token ?? '',
    });
  }, [row, form]);

  const onFinish = async (values: BaiduStatisEnvValue) => {
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
      <Form.Item name="site_id" label="站点 ID" rules={[{ required: true, message: '请输入站点 ID' }]}>
        <InputNumber className="w-full!" min={0} placeholder="18374000" />
      </Form.Item>
      <Form.Item name="access_token" label="Access Token" rules={[{ required: true, message: '请输入 Access Token' }]}>
        <Input.Password placeholder="e5bf799a3e49312141c8b677b7bec1c2" autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={saving} className="w-full">
          确定
        </Button>
      </Form.Item>
    </Form>
  );
}
