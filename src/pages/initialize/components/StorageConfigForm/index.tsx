import { Form, Input, Select, message } from 'antd';
import type { InitStepFormProps } from '../types';

interface StorageFormValues {
  storageType: string;
  storageBucket: string;
  storageDomain: string;
}

export default function StorageConfigForm({ onSuccess }: InitStepFormProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSave = (_values: StorageFormValues) => {
    message.success('存储设置已保存');
    onSuccess();
  };

  return (
    <Form
      id="init-form-storage"
      layout="vertical"
      requiredMark={false}
      initialValues={{ storageType: 'qiniu', storageBucket: '', storageDomain: '' }}
      onFinish={handleSave}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Form.Item label="存储类型" name="storageType" rules={[{ required: true, message: '请先选择存储类型' }]}>
          <Select
            options={[
              { label: '七牛云', value: 'qiniu' },
              { label: '阿里云 OSS', value: 'oss' },
              { label: '腾讯云 COS', value: 'cos' },
            ]}
          />
        </Form.Item>
        <Form.Item label="存储桶" name="storageBucket" rules={[{ required: true, message: '请先填写存储桶' }]}>
          <Input placeholder="请输入 Bucket 名称" />
        </Form.Item>
      </div>
      <Form.Item label="访问域名" name="storageDomain" rules={[{ required: true, message: '请先填写访问域名' }]}>
        <Input placeholder="https://cdn.your-domain.com" />
      </Form.Item>
    </Form>
  );
}
