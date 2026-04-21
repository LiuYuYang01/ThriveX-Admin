import { Form, Input } from 'antd';
import type { InitDraft, UpdateDraft } from '../types';

interface AccountConfigFormProps {
  draft: InitDraft;
  setDraft: UpdateDraft;
}

export default function AccountConfigForm({ draft, setDraft }: AccountConfigFormProps) {
  return (
    <Form layout="vertical" requiredMark={false}>
      <Form.Item label="管理员账号" required>
        <Input value={draft.accountName} onChange={(e) => setDraft((s) => ({ ...s, accountName: e.target.value }))} placeholder="请输入管理员账号" />
      </Form.Item>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Form.Item label="旧密码">
          <Input.Password value={draft.oldPassword} onChange={(e) => setDraft((s) => ({ ...s, oldPassword: e.target.value }))} placeholder="请输入旧密码（首次可留空）" />
        </Form.Item>
        <Form.Item label="新密码" required>
          <Input.Password value={draft.newPassword} onChange={(e) => setDraft((s) => ({ ...s, newPassword: e.target.value }))} placeholder="请输入新密码" />
        </Form.Item>
      </div>
    </Form>
  );
}
