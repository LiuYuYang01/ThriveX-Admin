import { Form, Input, Select, message } from 'antd';
import type { InitStepFormProps } from '../types';

interface AIFormValues {
  aiProvider: string;
  aiModel: string;
  aiPrompt: string;
}

export default function AIConfigForm({ onSuccess }: InitStepFormProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSave = (_values: AIFormValues) => {
    message.success('AI 设置已保存');
    onSuccess();
  };

  return (
    <Form
      id="init-form-ai"
      layout="vertical"
      requiredMark={false}
      initialValues={{ aiProvider: 'openai', aiModel: '', aiPrompt: '' }}
      onFinish={handleSave}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Form.Item label="AI 服务商" name="aiProvider" rules={[{ required: true, message: '请先选择 AI 服务商' }]}>
          <Select
            options={[
              { label: 'OpenAI', value: 'openai' },
              { label: 'Anthropic', value: 'anthropic' },
              { label: 'DeepSeek', value: 'deepseek' },
            ]}
          />
        </Form.Item>
        <Form.Item label="模型名称" name="aiModel" rules={[{ required: true, message: '请先填写模型名称' }]}>
          <Input placeholder="例如：gpt-4o-mini" />
        </Form.Item>
      </div>
      <Form.Item label="系统提示词" name="aiPrompt" rules={[{ required: true, message: '请先填写系统提示词' }]}>
        <Input.TextArea rows={4} placeholder="请输入默认系统提示词" />
      </Form.Item>
    </Form>
  );
}
