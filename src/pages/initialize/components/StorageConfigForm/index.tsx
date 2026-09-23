import { useEffect, useState } from 'react';
import { Alert, Form, Input, Radio, message } from 'antd';
import { getEnvConfigDataAPI, updateEnvConfigDataAPI } from '@/api/config';
import type { Config, QiniuStorageEnvValue, StorageEnvValue, StorageType } from '@/types/app/config';
import type { InitStepFormProps } from '../types';

interface StorageFormValues extends StorageEnvValue {
  access_key: string;
  secret_key: string;
  bucket_name: string;
  end_point: string;
  qiniu_domain: string;
  qiniu_root_dir: string;
}

export default function StorageConfigForm({ onSuccess }: InitStepFormProps) {
  const [form] = Form.useForm<StorageFormValues>();
  const [loading, setLoading] = useState(false);
  const [storageType, setStorageType] = useState<StorageType>('local');
  const [storageRow, setStorageRow] = useState<Config | null>(null);
  const [qiniuConfigRow, setQiniuConfigRow] = useState<Config | null>(null);

  useEffect(() => {
    const fetchConfigs = async () => {
      setLoading(true);
      try {
        const [storageRes, qiniuRes] = await Promise.all([
          getEnvConfigDataAPI('storage'),
          getEnvConfigDataAPI('qiniu_storage'),
        ]);

        const sv = storageRes.data.value as Partial<StorageEnvValue> | undefined;
        setStorageRow(storageRes.data);
        setStorageType(sv?.type ?? 'local');

        const qv = qiniuRes.data.value as Partial<QiniuStorageEnvValue> | undefined;
        setQiniuConfigRow(qiniuRes.data);
        form.setFieldsValue({
          type: sv?.type ?? 'local',
          domain: sv?.domain ?? '',
          access_key: qv?.access_key ?? '',
          secret_key: qv?.secret_key ?? '',
          qiniu_domain: qv?.domain ?? '',
          bucket_name: qv?.bucket_name ?? '',
          end_point: qv?.end_point ?? '',
          qiniu_root_dir: qv?.root_dir ?? 'static',
        });
      } catch (error) {
        console.error(error);
        message.error('存储配置加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, [form]);

  const handleSave = async (values: StorageFormValues) => {
    if (!storageRow) {
      message.error('未找到存储配置项，请检查后端 env_config 表');
      return;
    }
    if (values.type === 'qiniu' && !qiniuConfigRow) {
      message.error('未找到七牛云配置项，请检查后端 env_config 表');
      return;
    }

    setLoading(true);
    try {
      if (values.type === 'qiniu') {
        const qiniuValue: QiniuStorageEnvValue = {
          domain: values.qiniu_domain,
          root_dir: values.qiniu_root_dir,
          end_point: values.end_point,
          access_key: values.access_key,
          secret_key: values.secret_key,
          bucket_name: values.bucket_name,
        };
        await updateEnvConfigDataAPI({ ...qiniuConfigRow!, value: qiniuValue });
      }
      const storageValue: StorageEnvValue = {
        type: values.type,
        domain: values.domain,
      };
      await updateEnvConfigDataAPI({ ...storageRow, value: storageValue });
      setStorageRow((prev) => (prev ? { ...prev, value: storageValue } : prev));
      setStorageType(values.type);
      message.success('存储设置已保存');
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
        type: 'local',
        domain: '',
        access_key: '',
        secret_key: '',
        qiniu_domain: '',
        bucket_name: '',
        end_point: '',
        qiniu_root_dir: 'static',
      }}
      onFinish={handleSave}
    >
      <Form.Item label="存储方式" name="type">
        <Radio.Group
          onChange={(e) => setStorageType(e.target.value as StorageType)}
          disabled={loading}
        >
          <Radio.Button value="local">本地存储</Radio.Button>
          <Radio.Button value="qiniu">七牛云存储</Radio.Button>
        </Radio.Group>
      </Form.Item>

      {/* 七牛的域名/根目录字段以 qiniu_ 前缀命名，与本地存储的同名字段区分开 */}
      {storageType === 'local' && (
        <>
          <Alert
            className="mb-5!"
            type="info"
            showIcon
            message="图片等静态资源将保存到服务器本地磁盘，通过 server 的 /static/upload/ 路径访问；后续可在「第三方配置 - 文件存储」中切换为七牛云"
          />
          <Form.Item
            label="访问域名"
            name="domain"
            rules={[{ required: true, message: '请输入 server 后端的访问域名' }]}
            extra="server 后端的公网地址，图片链接将以该地址开头"
          >
            <Input placeholder="https://api.example.com（本机调试可用 http://localhost:9003）" />
          </Form.Item>
        </>
      )}

      {storageType === 'qiniu' && (
        <>
          <Form.Item label="Access Key" name="access_key" rules={[{ required: true, message: '请输入 Access Key' }]}>
            <Input.Password placeholder="xLzpxTtN94h8Q9Z31885355" autoComplete="off" />
          </Form.Item>
          <Form.Item label="Secret Key" name="secret_key" rules={[{ required: true, message: '请输入 Secret Key' }]}>
            <Input.Password placeholder="nQw7qx3g6fQkYnL096M1gfwegw" autoComplete="new-password" />
          </Form.Item>
          <Form.Item label="访问域名" name="qiniu_domain" rules={[{ required: true, message: '请输入访问域名' }]}>
            <Input placeholder="https://thrive.s3.cn-east-1.qiniucs.com" />
          </Form.Item>
          <Form.Item label="存储桶" name="bucket_name" rules={[{ required: true, message: '请输入存储桶名称' }]}>
            <Input placeholder="thrive" />
          </Form.Item>
          <Form.Item label="地域" name="end_point" rules={[{ required: true, message: '请输入地域' }]}>
            <Input placeholder="thrive.s3.cn-east-1.qiniucs.com" />
          </Form.Item>
          <Form.Item label="根目录" name="qiniu_root_dir" rules={[{ required: true, message: '请输入存放文件的根目录' }]}>
            <Input placeholder="static" />
          </Form.Item>
        </>
      )}
    </Form>
  );
}
