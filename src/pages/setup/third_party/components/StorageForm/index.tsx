import { useEffect, useState } from 'react';
import { Alert, Button, Form, Input, Radio, message } from 'antd';

import { updateEnvConfigDataAPI } from '@/api/config';
import { Config, QiniuStorageEnvValue, StorageEnvValue, StorageType } from '@/types/app/config';

interface StorageFormProps {
  row: Config | undefined;
  qiniuRow: Config | undefined;
  onSaved: () => void;
}

type FormValues = StorageEnvValue & QiniuStorageEnvValue & { qiniu_domain: string; qiniu_root_dir: string };

/** 文件存储方式：切换按钮即存储方式，选中项回显已保存的配置，保存后刷新页面仍保持；
 * 本地与七牛共用「域名/根目录」概念，字段名区分开避免相互覆盖 */
export function StorageForm({ row, qiniuRow, onSaved }: StorageFormProps) {
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  // tab 初始值取已保存配置，刷新页面回显当前生效的存储方式
  const [storageType, setStorageType] = useState<StorageType>(
    () => (row?.value as Partial<StorageEnvValue> | undefined)?.type ?? 'qiniu',
  );

  // 当前生效的存储方式来自已保存的配置（row），tab 上的切换保存后才生效
  const savedValue = row?.value as Partial<StorageEnvValue> | undefined;

  useEffect(() => {
    const v = row?.value as Partial<StorageEnvValue> | undefined;
    const q = qiniuRow?.value as Partial<QiniuStorageEnvValue> | undefined;
    setStorageType(v?.type ?? 'qiniu');
    form.setFieldsValue({
      domain: v?.domain ?? '',
      root_dir: v?.root_dir ?? 'static',
      access_key: q?.access_key ?? '',
      secret_key: q?.secret_key ?? '',
      qiniu_domain: q?.domain ?? '',
      bucket_name: q?.bucket_name ?? '',
      end_point: q?.end_point ?? '',
      qiniu_root_dir: q?.root_dir ?? 'static',
    });
  }, [row, qiniuRow, form]);

  // 后端缺少 storage 配置项（多为后端未升级/未重启）时无法保存，直接醒目提示
  if (!row) {
    return (
      <Alert
        className="w-full lg:max-w-[560px] md:ml-10"
        type="warning"
        showIcon
        message="未找到存储配置项（storage）"
        description="请确认后端服务已更新为包含本地存储支持的版本并重启，启动时会自动补齐该配置项；在此之前无法切换或保存存储方式。"
      />
    );
  }

  const onFinish = async (values: FormValues) => {
    if (storageType === 'qiniu' && !qiniuRow) {
      message.error('未找到七牛云配置项，请检查后端 env_config 表');
      return;
    }
    setSaving(true);
    try {
      if (storageType === 'qiniu') {
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
        type: storageType,
        // 当前 tab 未渲染的字段保留已保存值，避免整包覆盖把另一侧参数清空
        domain: values.domain ?? savedValue?.domain ?? '',
        root_dir: values.root_dir ?? savedValue?.root_dir ?? '',
      };
      await updateEnvConfigDataAPI({ ...row, value: storageValue });
      message.success('保存成功，新上传的文件将按当前存储方式处理');
      onSaved();
    } catch (e) {
      console.error(e);
      message.error('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form form={form} layout="vertical" size="large" onFinish={onFinish} className="w-full lg:max-w-[560px] md:ml-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <Radio.Group
          value={storageType}
          onChange={(e) => setStorageType(e.target.value as StorageType)}
        >
          <Radio.Button value="local">本地存储</Radio.Button>
          <Radio.Button value="qiniu">七牛云存储</Radio.Button>
        </Radio.Group>
      </div>

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
            extra="图片链接将以该地址开头，修改后已有链接不受影响"
          >
            <Input placeholder="https://liuyuyang.net" />
          </Form.Item>
          <Form.Item name="root_dir" label="根目录" extra="存放文件的目录前缀，留空则直接放在上传根目录">
            <Input placeholder="static" />
          </Form.Item>
        </>
      )}

      {storageType === 'qiniu' && (
        <>
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

      <Button type="primary" htmlType="submit" loading={saving} className="w-full">
        确定
      </Button>
    </Form>
  );
}
