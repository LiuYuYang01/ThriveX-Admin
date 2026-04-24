import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, message } from 'antd';

import { getEnvConfigDataAPI, updateEnvConfigDataAPI } from '@/api/config';
import type { Config, EmailEnvValue } from '@/types/app/config';
import type { InitStepFormProps } from '../types';

export default function EmailConfigForm({ onSuccess }: InitStepFormProps) {
  const [form] = Form.useForm<EmailEnvValue>();
  const [loading, setLoading] = useState(false);
  const [emailConfigRow, setEmailConfigRow] = useState<Config | null>(null);

  useEffect(() => {
    const fetchEmailConfig = async () => {
      setLoading(true);
      try {
        const { data } = await getEnvConfigDataAPI('email');
        const value = data.value as EmailEnvValue | undefined;
        setEmailConfigRow(data);
        form.setFieldsValue({
          host: value?.host ?? 'smtp.qq.com',
          port: value?.port ?? 465,
          username: value?.username ?? '',
          password: value?.password ?? '',
        });
      } catch (error) {
        console.error(error);
        message.error('邮箱配置加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchEmailConfig();
  }, [form]);

  const handleSave = async (values: EmailEnvValue) => {
    if (!emailConfigRow) {
      message.error('未找到邮箱配置项，请检查后端 env_config 表');
      return;
    }

    setLoading(true);
    try {
      await updateEnvConfigDataAPI({ ...emailConfigRow, value: values });
      setEmailConfigRow((prev) => (prev ? { ...prev, value: values } : prev));
      message.success('邮箱配置已保存');
      onSuccess();
    } catch (error) {
      console.error(error);
      message.error('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      id="init-form-email"
      form={form}
      layout="vertical"
      disabled={loading}
      requiredMark={false}
      onFinish={handleSave}
      className="w-full"
    >
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
    </Form>
  );
}
