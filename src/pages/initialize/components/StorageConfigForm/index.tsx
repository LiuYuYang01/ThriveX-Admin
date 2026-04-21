import { Form, Input, Select } from 'antd';
import type { InitDraft, UpdateDraft } from '../types';

interface StorageConfigFormProps {
  draft: InitDraft;
  setDraft: UpdateDraft;
}

export default function StorageConfigForm({ draft, setDraft }: StorageConfigFormProps) {
  return (
    <Form layout="vertical" requiredMark={false}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Form.Item label="存储类型" required>
          <Select
            value={draft.storageType}
            onChange={(value) => setDraft((s) => ({ ...s, storageType: value }))}
            options={[
              { label: '七牛云', value: 'qiniu' },
              { label: '阿里云 OSS', value: 'oss' },
              { label: '腾讯云 COS', value: 'cos' },
            ]}
          />
        </Form.Item>
        <Form.Item label="存储桶" required>
          <Input value={draft.storageBucket} onChange={(e) => setDraft((s) => ({ ...s, storageBucket: e.target.value }))} placeholder="请输入 Bucket 名称" />
        </Form.Item>
      </div>
      <Form.Item label="访问域名" required>
        <Input value={draft.storageDomain} onChange={(e) => setDraft((s) => ({ ...s, storageDomain: e.target.value }))} placeholder="https://cdn.your-domain.com" />
      </Form.Item>
    </Form>
  );
}
