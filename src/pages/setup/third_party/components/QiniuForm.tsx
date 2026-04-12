import { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, message } from 'antd';

import { updateEnvConfigDataAPI } from '@/api/config';
import { QiniuStorageEnvValue } from '@/types/app/config';

import type { ThirdPartyFormProps } from './types';

export function QiniuForm({ row, onSaved }: ThirdPartyFormProps) {
  const [form] = Form.useForm<QiniuStorageEnvValue>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const v = row?.value as QiniuStorageEnvValue | undefined;
    form.setFieldsValue({
      domain: v?.domain ?? '',
      zlevel: v?.zlevel ?? 0,
      root_dir: v?.root_dir ?? 'static',
      end_point: v?.end_point ?? '',
      access_key: v?.access_key ?? '',
      secret_key: v?.secret_key ?? '',
      bucket_name: v?.bucket_name ?? '',
    });
  }, [row, form]);

  const onFinish = async (values: QiniuStorageEnvValue) => {
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
    <Form form={form} layout="vertical" size="large" onFinish={onFinish} className="w-full lg:max-w-[560px] md:ml-10">
      <Form.Item name="access_key" label="Access Key" rules={[{ required: true, message: '请输入 Access Key' }]}>
        <Input.Password placeholder="xLzpxTtN94h8Q9Z31885355" autoComplete="off" />
      </Form.Item>
      <Form.Item name="secret_key" label="Secret Key" rules={[{ required: true, message: '请输入 Secret Key' }]}>
        <Input.Password placeholder="nQw7qx3g6fQkYnL096M1gfwegw" autoComplete="new-password" />
      </Form.Item>

      <Form.Item name="domain" label="访问域名" rules={[{ required: true, message: '请输入访问域名' }]}>
        <Input placeholder="https://thrive.s3.cn-east-1.qiniucs.com" />
      </Form.Item>
      <Form.Item name="bucket_name" label="存储桶" rules={[{ required: true, message: '请输入存储桶名称' }]}>
        <Input placeholder="thrive" />
      </Form.Item>
      <Form.Item name="end_point" label="地域" rules={[{ required: true, message: '请输入地域' }]}>
        <Input placeholder="thrive.s3.cn-east-1.qiniucs.com" />
      </Form.Item>
      <Form.Item name="root_dir" label="根目录" rules={[{ required: true, message: '请输入存放文件的根目录' }]}>
        <Input placeholder="static" />
      </Form.Item>
      <Form.Item name="zlevel" label="图片质量" rules={[{ required: true, message: '请输入图片质量（0-10）' }]}>
        <InputNumber className="w-full!" min={0} max={10} placeholder="1" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={saving} className="w-full">
          确定
        </Button>
      </Form.Item>
    </Form>
  );
}
