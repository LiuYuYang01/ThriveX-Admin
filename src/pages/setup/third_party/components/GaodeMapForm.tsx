import { useEffect, useState } from 'react';
import { Button, Form, Input, message } from 'antd';

import { updateEnvConfigDataAPI } from '@/api/config';
import { GaodeMapEnvValue } from '@/types/app/config';

import type { ThirdPartyFormProps } from './types';

export function GaodeMapForm({ row, onSaved }: ThirdPartyFormProps) {
  const [form] = Form.useForm<GaodeMapEnvValue>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const v = row?.value as GaodeMapEnvValue | undefined;
    form.setFieldsValue({
      key_code: v?.key_code ?? '',
      security_code: v?.security_code ?? '',
    });
  }, [row, form]);

  const onFinish = async (values: GaodeMapEnvValue) => {
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
      <Form.Item name="key_code" label="密钥" rules={[{ required: true, message: '请输入 Key' }]}>
        <Input placeholder="gq3t6j358a1d55219a1c42c8d62gf561" />
      </Form.Item>
      <Form.Item name="security_code" label="安全密钥" rules={[{ required: true, message: '请输入安全密钥' }]}>
        <Input.Password placeholder="c1c52309a379d969a8a53411946cdg32s" autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={saving} className="w-full">
          确定
        </Button>
      </Form.Item>
    </Form>
  );
}
