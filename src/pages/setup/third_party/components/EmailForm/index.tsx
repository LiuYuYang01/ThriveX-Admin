import { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, message } from 'antd';

import { updateEnvConfigDataAPI } from '@/api/config';
import { EmailEnvValue } from '@/types/app/config';

import type { ThirdPartyFormProps } from '../types';

export function EmailForm({ row, onSaved }: ThirdPartyFormProps) {
  const [form] = Form.useForm<EmailEnvValue>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const v = row?.value as EmailEnvValue | undefined;
    form.setFieldsValue({
      host: v?.host ?? 'smtp.qq.com',
      port: v?.port ?? 465,
      username: v?.username ?? '',
      password: v?.password ?? '',
    });
  }, [row, form]);

  const onFinish = async (values: EmailEnvValue) => {
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
      <Form.Item name="host" label="SMTP 主机" rules={[{ required: true, message: '请输入 SMTP 主机' }]}>
        <Input placeholder="smtp.qq.com" />
      </Form.Item>
      <Form.Item name="port" label="端口号" rules={[{ required: true, message: '请输入端口号' }]}>
        <InputNumber className="w-full!" min={1} max={65535} placeholder="465" />
      </Form.Item>
      <Form.Item name="username" label="发件邮箱账号" rules={[{ required: true, message: '请输入发件邮箱账号' }]}>
        <Input placeholder="liuyuyang1024@yeah.net" />
      </Form.Item>
      <Form.Item name="password" label="授权码 / 密码" rules={[{ required: true, message: '请输入授权码 / 密码' }]}>
        <Input.Password placeholder="fagweg3wfqwtrtgwg" autoComplete="new-password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={saving} className="w-full">
          确定
        </Button>
      </Form.Item>
    </Form>
  );
}
