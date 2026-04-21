import { Button, Form, Input, message } from 'antd';
import type { InitStepFormProps } from '../types';

interface WebsiteFormValues {
  siteTitle: string;
  siteDesc: string;
  siteLogo: string;
}

export default function WebsiteConfigForm({ onSuccess, isLastStep }: InitStepFormProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSave = (_values: WebsiteFormValues) => {
    message.success('网站设置已保存');
    onSuccess();
  };

  return (
    <Form layout="vertical" requiredMark={false} initialValues={{ siteTitle: '', siteDesc: '', siteLogo: '' }} onFinish={handleSave}>
      <Form.Item label="网站标题" name="siteTitle" rules={[{ required: true, message: '请先填写网站标题' }]}>
        <Input placeholder="例如：Thrive X Blog" />
      </Form.Item>
      <Form.Item label="网站描述" name="siteDesc" rules={[{ required: true, message: '请先填写网站描述' }]}>
        <Input.TextArea rows={3} placeholder="请输入站点简介和定位" />
      </Form.Item>
      <Form.Item label="LOGO 地址" name="siteLogo">
        <Input placeholder="https://..." />
      </Form.Item>
      <Button type="primary" htmlType="submit">
        {isLastStep ? '保存并完成' : '保存并继续'}
      </Button>
    </Form>
  );
}
