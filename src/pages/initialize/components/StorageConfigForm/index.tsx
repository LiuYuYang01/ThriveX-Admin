import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, message } from 'antd';
import { getEnvConfigDataAPI, updateEnvConfigDataAPI } from '@/api/config';
import type { Config, QiniuStorageEnvValue } from '@/types/app/config';
import type { InitStepFormProps } from '../types';

export default function StorageConfigForm({ onSuccess }: InitStepFormProps) {
  const [form] = Form.useForm<QiniuStorageEnvValue>();
  const [loading, setLoading] = useState(false);
  const [qiniuConfigRow, setQiniuConfigRow] = useState<Config | null>(null);

  useEffect(() => {
    const fetchQiniuConfig = async () => {
      setLoading(true);
      try {
        const { data } = await getEnvConfigDataAPI('qiniu_storage');
        const v = data.value as QiniuStorageEnvValue | undefined;
        setQiniuConfigRow(data);
        form.setFieldsValue({
          domain: v?.domain ?? '',
          zlevel: v?.zlevel ?? 0,
          root_dir: v?.root_dir ?? 'static',
          end_point: v?.end_point ?? '',
          access_key: v?.access_key ?? '',
          secret_key: v?.secret_key ?? '',
          bucket_name: v?.bucket_name ?? '',
        });
      } catch (error) {
        console.error(error);
        message.error('七牛云配置加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchQiniuConfig();
  }, [form]);

  const handleSave = async (values: QiniuStorageEnvValue) => {
    if (!qiniuConfigRow) {
      message.error('未找到七牛云配置项，请检查后端 env_config 表');
      return;
    }

    setLoading(true);
    try {
      await updateEnvConfigDataAPI({ ...qiniuConfigRow, value: values });
      setQiniuConfigRow((prev) => (prev ? { ...prev, value: values } : prev));
      message.success('七牛云存储设置已保存');
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
      id="init-form-storage"
      form={form}
      layout="vertical"
      disabled={loading}
      requiredMark={false}
      initialValues={{
        access_key: '',
        secret_key: '',
        domain: '',
        bucket_name: '',
        end_point: '',
        root_dir: 'static',
        zlevel: 0,
      }}
      onFinish={handleSave}
    >
      <Form.Item label="Access Key" name="access_key" rules={[{ required: true, message: '请输入 Access Key' }]}>
        <Input.Password placeholder="xLzpxTtN94h8Q9Z31885355" autoComplete="off" />
      </Form.Item>
      <Form.Item label="Secret Key" name="secret_key" rules={[{ required: true, message: '请输入 Secret Key' }]}>
        <Input.Password placeholder="nQw7qx3g6fQkYnL096M1gfwegw" autoComplete="new-password" />
      </Form.Item>
      <Form.Item label="访问域名" name="domain" rules={[{ required: true, message: '请输入访问域名' }]}>
        <Input placeholder="https://thrive.s3.cn-east-1.qiniucs.com" />
      </Form.Item>
      <Form.Item label="存储桶" name="bucket_name" rules={[{ required: true, message: '请输入存储桶名称' }]}>
        <Input placeholder="thrive" />
      </Form.Item>
      <Form.Item label="地域" name="end_point" rules={[{ required: true, message: '请输入地域' }]}>
        <Input placeholder="thrive.s3.cn-east-1.qiniucs.com" />
      </Form.Item>
      <Form.Item label="根目录" name="root_dir" rules={[{ required: true, message: '请输入存放文件的根目录' }]}>
        <Input placeholder="static" />
      </Form.Item>
      <Form.Item label="图片质量" name="zlevel" rules={[{ required: true, message: '请输入图片质量（0-10）' }]}>
        <InputNumber className="w-full!" min={0} max={10} placeholder="1" />
      </Form.Item>
    </Form>
  );
}
