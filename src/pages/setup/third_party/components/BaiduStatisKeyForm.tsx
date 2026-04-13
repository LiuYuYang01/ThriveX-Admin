import { useEffect, useState } from 'react';
import { Button, Form, Input, message } from 'antd';

import { updateEnvConfigDataAPI } from '@/api/config';
import { BaiduStatisKeyEnvValue } from '@/types/app/config';

import type { ThirdPartyFormProps } from './types';

const Label = ({ title, url }: { title: string; url: string }) => (
  <div className="w-full flex items-center justify-between">
    <span>{title}</span>
    <a href={url} target="_blank" rel="noreferrer" className="hover:text-primary text-xs text-gray-400">
      配置教程
    </a>
  </div>
);

export function BaiduStatisKeyForm({ row, onSaved }: ThirdPartyFormProps) {
  const [form] = Form.useForm<BaiduStatisKeyEnvValue>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const v = row?.value as BaiduStatisKeyEnvValue | undefined;
    form.setFieldsValue({ key: v?.key ?? '' });
  }, [row, form]);

  const onFinish = async (values: BaiduStatisKeyEnvValue) => {
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
        label={
          <Label title="Key" url="https://docs.liuyuyang.net/docs/项目部署/API/百度统计.html" />
        }
        rules={[{ required: true, message: '请输入 Key' }]}
        className="[&_label]:w-full"
      >
        <Input placeholder="e5bf799a3e49312141c8b677b7bec1c2" autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={saving} className="w-full">
          确定
        </Button>
      </Form.Item>
    </Form>
  );
}
