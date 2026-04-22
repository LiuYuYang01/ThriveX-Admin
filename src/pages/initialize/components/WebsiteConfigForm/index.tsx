import { useEffect, useState } from 'react';
import { Form, Input, message } from 'antd';
import { editWebConfigDataAPI, getWebConfigDataAPI } from '@/api/config';
import type { Web } from '@/types/app/config';
import type { InitStepFormProps } from '../types';

interface WebsiteFormValues {
  siteTitle: string;
  siteDesc: string;
  siteLogo: string;
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
          siteTitle: data.value?.title || '',
          siteDesc: data.value?.description || '',
          siteLogo: data.value?.favicon || '',
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
        title: values.siteTitle,
        description: values.siteDesc,
        favicon: values.siteLogo,
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
      initialValues={{ siteTitle: '', siteDesc: '', siteLogo: '' }}
      onFinish={handleSave}
    >
      <Form.Item label="网站标题" name="siteTitle" rules={[{ required: true, message: '请先填写网站标题' }]}>
        <Input placeholder="例如：Thrive X Blog" />
      </Form.Item>
      <Form.Item label="网站描述" name="siteDesc" rules={[{ required: true, message: '请先填写网站描述' }]}>
        <Input.TextArea rows={3} placeholder="请输入站点简介和定位" />
      </Form.Item>
      <Form.Item label="LOGO 地址" name="siteLogo">
        <Input placeholder="https://..." />
      </Form.Item>
    </Form>
  );
}
