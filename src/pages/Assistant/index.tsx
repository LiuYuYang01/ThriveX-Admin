import { Button, Card, Form, Input, List, Modal, Popconfirm, Select, Tooltip, Space } from 'antd';
import { DeleteOutlined, FormOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import Title from '@/components/Title';
import useAssistant from '@/hooks/useAssistant';

// 模型信息（图标 + 说明）
const modelInfoMap: Record<string, { icon: string; desc: string; label: string }> = {
  'deepseek-chat': {
    icon: '🔍',
    desc: 'DeepSeek 通用聊天模型',
    label: 'DeepSeek Chat',
  },
  'deepseek-reasoner': {
    icon: '🧠',
    desc: 'DeepSeek 多步推理优化模型',
    label: 'DeepSeek Reasoner',
  },
  'moonshot-v1-128k': {
    icon: '🌙',
    desc: 'Moonshot 长上下文模型，支持128k上下文',
    label: 'Moonshot v1 128k',
  },
  'gpt-4o': {
    icon: '🤖',
    desc: 'OpenAI GPT-4o 多模态大模型',
    label: 'OpenAI GPT-4o',
  },
  'gpt-3.5-turbo': {
    icon: '⚡',
    desc: 'OpenAI GPT-3.5 轻量快速模型',
    label: 'OpenAI GPT-3.5 Turbo',
  },
  'glm-4': {
    icon: '🐼',
    desc: '智谱 GLM-4 中文大模型',
    label: '智谱 GLM-4',
  },
  'qwen-turbo': {
    icon: '🧮',
    desc: '阿里通义 Qwen Turbo 快速对话模型',
    label: '通义千问 Turbo',
  },
  'ernie-bot': {
    icon: '🌰',
    desc: '百度文心一言大模型',
    label: '百度 ERNIE Bot',
  },
  'doubao-chat': {
    icon: '🫘',
    desc: '字节跳动豆包模型',
    label: '豆包 Chat',
  },
  // 你可以继续添加更多模型
};

export default () => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [inputModelValue, setInputModelValue] = useState('');

  const { list, testingMap, saveAssistant, delAssistantData, setDefaultAssistant, testConnection } = useAssistant();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      console.log('values', values);
      // 如果输入的模型不在列表，则直接用输入的文本
      const model = values.model;
      saveAssistant({ ...values, model, id }).then((success) => {
        if (success) {
          setIsModalOpen(false);
          form.resetFields();
          setInputModelValue('');
          setId(null);
        }
      });
    });
  };

  // 生成 Select options
  const selectOptions = Object.entries(modelInfoMap).map(([value, info]) => ({
    label: info.label,
    value,
  }));

  // 如果输入值是新模型，且不在选项里，加入它
  if (inputModelValue && !selectOptions.find((opt) => opt.value === inputModelValue)) {
    selectOptions.push({ label: inputModelValue, value: inputModelValue });
  }

  return (
    <div>
      <Title value="助手管理">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          添加助手
        </Button>
      </Title>

      <Card>
        <List
          dataSource={list}
          renderItem={(item) => {
            const info = modelInfoMap[item.model];
            return (
              <List.Item
                actions={[
                  <Button key="test" type="link" onClick={() => testConnection(item)} loading={testingMap[item.id]}>
                    {testingMap[item.id] ? '测试中...' : '测试连接'}
                  </Button>,
                  <Button
                    key="edit"
                    onClick={() => {
                      form.setFieldsValue(item);
                      setInputModelValue(item.model);
                      setId(item.id);
                      setIsModalOpen(true);
                    }}
                    icon={<FormOutlined />}
                  />,
                  <Popconfirm
                    key="del"
                    title="您确定要删除这个助手吗？"
                    onConfirm={() => delAssistantData(+item.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                  <Button
                    key="default"
                    type={item.isDefault ? 'primary' : 'default'}
                    onClick={() => setDefaultAssistant(+item.id)}
                  >
                    {item.isDefault ? '默认助手' : '设为默认'}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{item.name}</span>
                      {info && <span>{info.icon}</span>}
                    </Space>
                  }
                  description={
                    <span>
                      模型: {info ? info.label : item.model}
                      {info && (
                        <Tooltip title={info.desc}>
                          <InfoCircleOutlined style={{ marginLeft: 8 }} />
                        </Tooltip>
                      )}
                    </span>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>

      <Modal
        title={id ? '编辑助手' : '添加助手'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setInputModelValue('');
          setId(null);
        }}
      >
        <Form form={form} layout="vertical" size="large">
          <Form.Item name="name" label="助手名称" rules={[{ required: true, message: '请输入助手名称' }]}>
            <Input placeholder="例如：DeepSeek、OpenAI 等" />
          </Form.Item>

          <Form.Item
            name="url"
            label="API 地址"
            tooltip="填写完整的 API 接口地址，如 https://api.deepseek.com/v1"
            rules={[{ required: true, message: '请输入 API 地址' }]}
          >
            <Input placeholder="https://api.deepseek.com/v1" />
          </Form.Item>

          <Form.Item name="key" label="API 密钥" rules={[{ required: true, message: '请输入 API 密钥' }]}>
            <Input.Password placeholder="请输入 API 密钥" />
          </Form.Item>

          <Form.Item name="model" label="模型" rules={[{ required: true, message: '请选择或输入模型' }]}>
            <Select
              showSearch
              placeholder="选择或输入模型"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes((input ?? '').toLowerCase())
              }
              onSearch={(val) => setInputModelValue(val)}
              optionLabelProp="label"
              options={selectOptions}
              optionRender={(option) => {
                const info = modelInfoMap[option.value as string];
                if (info) {
                  return (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>
                        {info.icon} {option.label}
                      </span>
                      <Tooltip title={info.desc}>
                        <InfoCircleOutlined />
                      </Tooltip>
                    </div>
                  );
                }
                return <span>{option.label}</span>;
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
