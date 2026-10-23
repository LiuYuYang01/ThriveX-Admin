import { useEffect, useState } from 'react';
import { Button, Form, Input, message, Switch } from 'antd';

import { updateEnvConfigDataAPI } from '@/api/config';
import { TurnstileEnvValue } from '@/types/app/config';

import type { ThirdPartyFormProps } from '../types';

const Label = ({ title, url }: { title: string; url: string }) => (
  <div className="w-full flex items-center justify-between">
    <span>{title}</span>
    <a href={url} target="_blank" rel="noreferrer" className="hover:text-primary text-xs text-gray-400">
      配置教程
    </a>
  </div>
);

export function TurnstileForm({ row, onSaved }: ThirdPartyFormProps) {
  const [form] = Form.useForm<TurnstileEnvValue>();
  const [saving, setSaving] = useState(false);
  const enabled = Form.useWatch('enabled', form) ?? false;

  useEffect(() => {
    const v = row?.value as TurnstileEnvValue | undefined;
    // 老数据没有 enabled 字段：配置过站点密钥即视为开启，与后端兼容逻辑一致
    form.setFieldsValue({
      enabled: v?.enabled ?? !!v?.key,
      key: v?.key ?? '',
      secret: v?.secret ?? '',
    });
  }, [row, form]);

  const onFinish = async (values: TurnstileEnvValue) => {
    if (!row) {
      message.error('未找到配置项，请检查后端 env_config 表');
      return;
    }
    setSaving(true);
    try {
      await updateEnvConfigDataAPI({ ...row, value: values });
      message.success(values.enabled ? '已开启人机验证' : '已关闭人机验证');
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
          label={<Label title="站点密钥（Site Key，公钥）" url="https://developers.cloudflare.com/turnstile/get-started/" />}
          rules={[{ required: true, message: '请输入站点密钥' }]}
          className="[&_label]:w-full"
        >
          <Input placeholder="0x4AAAAAAA..." autoComplete="off" />
        </Form.Item>
      )}
      {enabled && (
        <Form.Item
          name="secret"
          label={<Label title="服务端密钥（Secret Key，私钥）" url="https://developers.cloudflare.com/turnstile/get-started/" />}
          rules={[{ required: true, message: '请输入服务端密钥' }]}
          extra="用于后端向 Cloudflare 校验 Token，只保存在服务端，不会下发给前端"
          className="[&_label]:w-full"
        >
          <Input.Password placeholder="0x4AAAAAAA..." autoComplete="new-password" />
        </Form.Item>
      )}
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={saving} className="w-full">
          确定
        </Button>
      </Form.Item>
    </Form>
  );
}
