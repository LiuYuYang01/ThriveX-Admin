import { useEffect, useState } from 'react';
import { Alert, Button, Form, Input, Radio, message } from 'antd';

import { updateEnvConfigDataAPI } from '@/api/config';
import { Config, QiniuStorageEnvValue, StorageEnvValue, StorageType } from '@/types/app/config';

interface StorageFormProps {
  row: Config | undefined;
  qiniuRow: Config | undefined;
  onSaved: () => void;
}

/** 文件存储方式：切换本地 / 七牛云，七牛的连接参数也在本表单内维护，保存时一并写入 */
export function StorageForm({ row, qiniuRow, onSaved }: StorageFormProps) {
  const [form] = Form.useForm<StorageEnvValue & QiniuStorageEnvValue & { qiniu_domain: string; qiniu_root_dir: string }>();
  const [saving, setSaving] = useState(false);
  const storageType = Form.useWatch('type', form) as StorageType | undefined;

  useEffect(() => {
    const v = row?.value as Partial<StorageEnvValue> | undefined;
    const q = qiniuRow?.value as Partial<QiniuStorageEnvValue> | undefined;
    form.setFieldsValue({
      type: v?.type ?? 'qiniu',
      domain: v?.domain ?? '',
      root_dir: v?.root_dir ?? '',
      access_key: q?.access_key ?? '',
      secret_key: q?.secret_key ?? '',
      qiniu_domain: q?.domain ?? '',
      bucket_name: q?.bucket_name ?? '',
      end_point: q?.end_point ?? '',
      qiniu_root_dir: q?.root_dir ?? 'static',
    });
  }, [row, qiniuRow, form]);

  const onFinish = async (values: StorageEnvValue & QiniuStorageEnvValue & { qiniu_domain: string; qiniu_root_dir: string }) => {
    if (!row) {
      message.error('未找到存储配置项，请检查后端 env_config 表');
      return;
    }
    if (values.type === 'qiniu' && !qiniuRow) {
      message.error('未找到七牛云配置项，请检查后端 env_config 表');
      return;
    }
    setSaving(true);
    try {
      if (values.type === 'qiniu') {
        // 脱敏字段（******）提交后由后端还原为库中原值
        const qiniuValue: QiniuStorageEnvValue = {
          domain: values.qiniu_domain,
          root_dir: values.qiniu_root_dir,
          end_point: values.end_point,
          access_key: values.access_key,
          secret_key: values.secret_key,
          bucket_name: values.bucket_name,
        };
        await updateEnvConfigDataAPI({ ...qiniuRow!, value: qiniuValue });
      }
      const storageValue: StorageEnvValue = {
        type: values.type,
        domain: values.domain,
        root_dir: values.root_dir,
      };
      await updateEnvConfigDataAPI({ ...row, value: storageValue });
      message.success('保存成功，新上传的文件将按当前存储方式处理');
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form form={form} layout="vertical" size="large" onFinish={onFinish} className="w-full lg:max-w-[560px] md:ml-10">
      <Form.Item name="type" label="存储方式" initialValue="qiniu">
        <Radio.Group>
          <Radio.Button value="local">本地存储</Radio.Button>
          <Radio.Button value="qiniu">七牛云存储</Radio.Button>
        </Radio.Group>
      </Form.Item>

      {/* 本地存储与七牛共用「域名/根目录」概念，字段名区分开避免相互覆盖 */}
      {storageType === 'local' && (
        <>
          <Alert
            className="mb-5!"
            type="info"
            showIcon
            message="图片等静态资源将保存到服务器本地磁盘，通过 server 的 /static/upload/ 路径访问；图片瘦身仅在七牛云存储下可用"
          />
          <Form.Item
            name="domain"
            label="访问域名"
            rules={[{ required: true, message: '请输入 server 后端的访问域名' }]}
            extra="server 后端的公网地址，图片链接将以该地址开头，修改后已有链接不受影响"
          >
            <Input placeholder="https://api.example.com（本机调试可用 http://localhost:9003）" />
          </Form.Item>
          <Form.Item name="root_dir" label="根目录" extra="存放文件的目录前缀，留空则直接放在上传根目录">
            <Input placeholder="static" />
          </Form.Item>
        </>
      )}

      {storageType === 'qiniu' && (
        <>
          <Alert
            className="mb-5!"
            type="info"
            showIcon
            message="仅当存储方式为七牛云时，上传才会走七牛，图片瘦身也仅在七牛云存储下可用"
          />
          <Form.Item name="access_key" label="Access Key" rules={[{ required: true, message: '请输入 Access Key' }]}>
            <Input.Password placeholder="xLzpxTtN94h8Q9Z31885355" autoComplete="off" />
          </Form.Item>
          <Form.Item name="secret_key" label="Secret Key" rules={[{ required: true, message: '请输入 Secret Key' }]}>
            <Input.Password placeholder="nQw7qx3g6fQkYnL096M1gfwegw" autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="qiniu_domain" label="访问域名" rules={[{ required: true, message: '请输入访问域名' }]}>
            <Input placeholder="https://thrive.s3.cn-east-1.qiniucs.com" />
          </Form.Item>
          <Form.Item name="bucket_name" label="存储桶" rules={[{ required: true, message: '请输入存储桶名称' }]}>
            <Input placeholder="thrive" />
          </Form.Item>
          <Form.Item name="end_point" label="地域" rules={[{ required: true, message: '请输入地域' }]}>
            <Input placeholder="thrive.s3.cn-east-1.qiniucs.com" />
          </Form.Item>
          <Form.Item name="qiniu_root_dir" label="根目录" rules={[{ required: true, message: '请输入存放文件的根目录' }]}>
            <Input placeholder="static" />
          </Form.Item>
        </>
      )}

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={saving} className="w-full">
          确定
        </Button>
      </Form.Item>
    </Form>
  );
}
