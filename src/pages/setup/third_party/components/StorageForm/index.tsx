import { useEffect, useState } from 'react';
import { Alert, Button, Form, Input, Radio, message } from 'antd';

import { updateEnvConfigDataAPI } from '@/api/config';
import { StorageEnvValue, StorageType } from '@/types/app/config';

import type { ThirdPartyFormProps } from '../types';

/** 文件存储方式：切换本地 / 七牛云，只影响新上传，已发布内容中的 URL 不受影响 */
export function StorageForm({ row, onSaved }: ThirdPartyFormProps) {
  const [form] = Form.useForm<StorageEnvValue>();
  const [saving, setSaving] = useState(false);
  const storageType = Form.useWatch('type', form) as StorageType | undefined;

  useEffect(() => {
    const v = row?.value as Partial<StorageEnvValue> | undefined;
    form.setFieldsValue({
      type: v?.type ?? 'qiniu',
      domain: v?.domain ?? '',
      root_dir: v?.root_dir ?? '',
    });
  }, [row, form]);

  const onFinish = async (values: StorageEnvValue) => {
    if (!row) {
      message.error('未找到存储配置项，请检查后端 env_config 表');
      return;
    }
    setSaving(true);
    try {
      await updateEnvConfigDataAPI({ ...row, value: values });
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
        <Alert
          className="mb-5!"
          type="info"
          showIcon
          message="选择七牛云存储后，请在「七牛云存储」标签页完成 Access Key 等配置"
        />
      )}

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={saving} className="w-full">
          确定
        </Button>
      </Form.Item>
    </Form>
  );
}
