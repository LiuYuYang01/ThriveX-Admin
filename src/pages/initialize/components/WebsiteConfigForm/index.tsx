import { Form, Input } from 'antd';
import type { InitDraft, UpdateDraft } from '../types';

interface WebsiteConfigFormProps {
  draft: InitDraft;
  setDraft: UpdateDraft;
}

export default function WebsiteConfigForm({ draft, setDraft }: WebsiteConfigFormProps) {
  return (
    <Form layout="vertical" requiredMark={false}>
      <Form.Item label="网站标题" required>
        <Input value={draft.siteTitle} onChange={(e) => setDraft((s) => ({ ...s, siteTitle: e.target.value }))} placeholder="例如：Thrive X Blog" />
      </Form.Item>
      <Form.Item label="网站描述" required>
        <Input.TextArea value={draft.siteDesc} onChange={(e) => setDraft((s) => ({ ...s, siteDesc: e.target.value }))} rows={3} placeholder="请输入站点简介和定位" />
      </Form.Item>
      <Form.Item label="LOGO 地址">
        <Input value={draft.siteLogo} onChange={(e) => setDraft((s) => ({ ...s, siteLogo: e.target.value }))} placeholder="https://..." />
      </Form.Item>
    </Form>
  );
}
