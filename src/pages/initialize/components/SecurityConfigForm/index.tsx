import { useEffect, useState } from 'react';
import { Form, Input, message, Switch } from 'antd';

import { getEnvConfigDataAPI, updateEnvConfigDataAPI } from '@/api/config';
import { Config, TurnstileEnvValue } from '@/types/app/config';
import type { InitStepFormProps } from '../types';

export default function SecurityConfigForm({ onSuccess }: InitStepFormProps) {
  const [form] = Form.useForm<TurnstileEnvValue>();
  const [row, setRow] = useState<Config>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const enabled = Form.useWatch('enabled', form) ?? false;

  useEffect(() => {
    const loadTurnstileConfig = async () => {
      setLoading(true);
      try {
        const { data } = await getEnvConfigDataAPI('turnstile_key');
        setRow(data);
        const value = data?.value as TurnstileEnvValue | undefined;
        // 老数据没有 enabled 字段：配置过站点密钥即视为开启，与后端兼容逻辑一致
        form.setFieldsValue({
          enabled: value?.enabled ?? !!value?.key,
          key: value?.key ?? '',
          secret: value?.secret ?? '',
        });
      } catch (e) {
        console.error(e);
        message.error('人机验证配置加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadTurnstileConfig();
  }, [form]);

  const handleSave = async (values: TurnstileEnvValue) => {
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
      disabled={loading || saving || !row}
    >
      <Form.Item
        name="enabled"
        label={<span className="w-full">启用人机验证</span>}
        valuePropName="checked"
        extra="开启后登录、评论、留言、友链申请等接口将强制 Cloudflare Turnstile 校验，博客前端同步显示验证码；关闭则完全停用"
      >
        <Switch />
      </Form.Item>
      {enabled && (
        <Form.Item
          name="key"
          label={
            <div className="w-full flex items-center justify-between">
              <span>站点密钥（Site Key，公钥）</span>
              <a
                href="https://developers.cloudflare.com/turnstile/get-started/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary text-xs text-gray-400"
              >
                配置教程
              </a>
            </div>
          }
          rules={[{ required: true, message: '请输入站点密钥' }]}
          className="[&_label]:w-full"
        >
          <Input placeholder="0x4AAAAAAA..." autoComplete="off" />
        </Form.Item>
      )}
      {enabled && (
        <Form.Item
          name="secret"
          label={<span className="w-full">服务端密钥（Secret Key，私钥）</span>}
          rules={[{ required: true, message: '请输入服务端密钥' }]}
          extra="用于后端向 Cloudflare 校验 Token，只保存在服务端，不会下发给前端"
          className="[&_label]:w-full"
        >
          <Input.Password placeholder="0x4AAAAAAA..." autoComplete="new-password" />
        </Form.Item>
      )}
    </Form>
  );
}
