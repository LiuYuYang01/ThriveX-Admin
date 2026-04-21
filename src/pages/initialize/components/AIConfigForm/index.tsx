import { Form, Input, Select } from 'antd';
import type { InitDraft, UpdateDraft } from '../types';

interface AIConfigFormProps {
  draft: InitDraft;
  setDraft: UpdateDraft;
}

export default function AIConfigForm({ draft, setDraft }: AIConfigFormProps) {
  return (
    <Form layout="vertical" requiredMark={false}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Form.Item label="AI 服务商" required>
          <Select
            value={draft.aiProvider}
            onChange={(value) => setDraft((s) => ({ ...s, aiProvider: value }))}
            options={[
              { label: 'OpenAI', value: 'openai' },
              { label: 'Anthropic', value: 'anthropic' },
              { label: 'DeepSeek', value: 'deepseek' },
            ]}
          />
        </Form.Item>
        <Form.Item label="模型名称" required>
          <Input value={draft.aiModel} onChange={(e) => setDraft((s) => ({ ...s, aiModel: e.target.value }))} placeholder="例如：gpt-4o-mini" />
        </Form.Item>
      </div>
      <Form.Item label="系统提示词" required>
        <Input.TextArea value={draft.aiPrompt} onChange={(e) => setDraft((s) => ({ ...s, aiPrompt: e.target.value }))} rows={4} placeholder="请输入默认系统提示词" />
      </Form.Item>
    </Form>
  );
}
