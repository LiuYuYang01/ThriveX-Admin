import { useEffect, useState } from 'react';
import { Button, Form, Input, message } from 'antd';

import { updateEnvConfigDataAPI } from '@/api/config';
import { GaodeCoordinateEnvValue } from '@/types/app/config';

import type { ThirdPartyFormProps } from './types';

export function GaodeCoordinateForm({ row, onSaved }: ThirdPartyFormProps) {
  const [form] = Form.useForm<GaodeCoordinateEnvValue>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const v = row?.value as GaodeCoordinateEnvValue | undefined;
    form.setFieldsValue({ key: v?.key ?? '' });
  }, [row, form]);

  const onFinish = async (values: GaodeCoordinateEnvValue) => {
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
      <Form.Item name="key" label="密钥" rules={[{ required: true, message: '请输入密钥' }]}>
        <Input placeholder="d12345148a9a2521234324c8d62c3244" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={saving} className="w-full">
          确定
        </Button>
      </Form.Item>
    </Form>
  );
}
