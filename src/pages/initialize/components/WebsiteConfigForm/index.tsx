import { useEffect, useState } from 'react';
import { DatePicker, Form, Input, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { editWebConfigDataAPI, getWebConfigDataAPI } from '@/api/config';
import type { Web } from '@/types/app/config';
import type { InitStepFormProps } from '../types';

interface WebsiteFormValues {
  title: string;
  subhead: string;
  url: string;
  favicon: string;
  description: string;
  keyword: string;
  footer: string;
  icp: string;
  create_time?: Dayjs;
}

export default function WebsiteConfigForm({ onSuccess }: InitStepFormProps) {
  const [form] = Form.useForm<WebsiteFormValues>();
  const [loading, setLoading] = useState(false);
  const [webConfig, setWebConfig] = useState<Web | null>(null);

  useEffect(() => {
    const getWebConfig = async () => {
      setLoading(true);
      try {
        const { data } = await getWebConfigDataAPI('web');
        const values = {
          title: data.value?.title || '',
          subhead: data.value?.subhead || '',
          url: data.value?.url || '',
          favicon: data.value?.favicon || '',
          description: data.value?.description || '',
          keyword: data.value?.keyword || '',
          footer: data.value?.footer || '',
          icp: data.value?.icp || '',
          create_time: data.value?.create_time ? dayjs(Number(data.value.create_time)) : undefined,
        };
        setWebConfig(data.value);
        form.setFieldsValue(values);
      } catch {
        message.error('网站配置加载失败');
      } finally {
        setLoading(false);
      }
    };

    getWebConfig();
  }, [form]);

  const handleSave = async (values: WebsiteFormValues) => {
    setLoading(true);
    try {
      const latestConfig = webConfig || (await getWebConfigDataAPI('web')).data.value;
      const submitData: Web = {
        ...latestConfig,
        title: values.title,
        subhead: values.subhead,
        url: values.url,
        favicon: values.favicon,
        description: values.description,
        keyword: values.keyword,
        footer: values.footer,
        icp: values.icp,
        create_time: values.create_time ? values.create_time.valueOf() : undefined,
      };

      await editWebConfigDataAPI('web', submitData);
      setWebConfig(submitData);
      message.success('网站设置已保存');
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      id="init-form-website"
      form={form}
      layout="vertical"
      disabled={loading}
      requiredMark={false}
      initialValues={{
        title: '',
        subhead: '',
        url: '',
        favicon: '',
        description: '',
        keyword: '',
        footer: '',
        icp: '',
        create_time: undefined,
      }}
      onFinish={handleSave}
    >
      <Form.Item label="网站标题" name="title" rules={[{ required: true, message: '请先填写网站标题' }]}>
        <Input placeholder="例如：ThriveX" />
      </Form.Item>
      <Form.Item label="网站副标题" name="subhead">
        <Input placeholder="例如：现代化博客管理系统" />
      </Form.Item>
      <Form.Item label="网站链接" name="url">
        <Input placeholder="https://liuyuyang.net/" />
      </Form.Item>
      <Form.Item label="LOGO 地址" name="favicon" rules={[{ required: true, message: '请先填写网站 Logo 地址' }]}>
        <Input placeholder="https://..." />
      </Form.Item>
      <Form.Item label="网站描述" name="description">
        <Input.TextArea rows={3} placeholder="请输入站点简介和定位" />
      </Form.Item>
      <Form.Item label="网站关键词" name="keyword">
        <Input placeholder="例如：Java,前端,Python" />
      </Form.Item>
      <Form.Item label="底部信息" name="footer">
        <Input placeholder="例如：诚邀贡献者一起共建 ThriveX" />
      </Form.Item>
      <Form.Item label="ICP 备案号" name="icp">
        <Input placeholder="例如：豫ICP备2020031040号-1" />
      </Form.Item>
      <Form.Item label="网站创建时间" name="create_time">
        <DatePicker className="w-full" />
      </Form.Item>
    </Form>
  );
}
