import { useState, useMemo, useCallback } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Tooltip,
  Space,
  Avatar,
  Tag,
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  DeleteOutlined,
  FormOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  MoreOutlined,
  ApiOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { ImSwitch } from 'react-icons/im';

import Title from '@/components/Title';
import useAssistant from '@/hooks/useAssistant';
import type { Assistant } from '@/types/app/assistant';

import AssistantPageSkeleton from './Skeleton';
import { ASSISTANT_MODEL_INFO_MAP, getAssistantModelTheme } from './modelConfig';

const EMPTY_ASSISTANT: Assistant = {} as Assistant;

export default function AssistantPage() {
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant>(EMPTY_ASSISTANT);
  const [inputModelValue, setInputModelValue] = useState('');

  const {
    list,
    listLoading,
    loading: saveLoading,
    testingMap,
    saveAssistant,
    delAssistantData,
    setDefaultAssistant,
    testConnection,
  } = useAssistant();

  const modelSelectOptions = useMemo(() => {
    const base = Object.entries(ASSISTANT_MODEL_INFO_MAP).map(([value, info]) => ({
      label: info.label,
      value,
    }));
    if (inputModelValue && !base.some((opt) => opt.value === inputModelValue)) {
      return [...base, { label: inputModelValue, value: inputModelValue }];
    }
    return base;
  }, [inputModelValue]);

  const resetModalState = useCallback(() => {
    form.resetFields();
    setInputModelValue('');
    setEditingAssistant(EMPTY_ASSISTANT);
  }, [form]);

  const handleSubmit = useCallback(() => {
    form.validateFields().then((values) => {
      const model = values.model as string;
      saveAssistant({ ...editingAssistant, ...values, model }).then((success) => {
        if (success) {
          setModalOpen(false);
          resetModalState();
        }
      });
    });
  }, [form, editingAssistant, saveAssistant, resetModalState]);

  const openCreateModal = useCallback(() => {
    setEditingAssistant(EMPTY_ASSISTANT);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback(
    (record: Assistant) => {
      form.setFieldsValue(record);
      setInputModelValue(record.model);
      setEditingAssistant(record);
      setModalOpen(true);
    },
    [form],
  );

  if (listLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <AssistantPageSkeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-2">
      <Title value="助手管理">
        <Button type="primary" onClick={openCreateModal}>
          添加助手
        </Button>
      </Title>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((item) => {
          const info = ASSISTANT_MODEL_INFO_MAP[item.model];
          const theme = getAssistantModelTheme(item.model);
          const isTesting = testingMap[item.id];
          const isDefault = !!item.isDefault;

          const menuItems: MenuProps['items'] = [
            {
              key: 'edit',
              label: '编辑配置',
              icon: <FormOutlined />,
              onClick: () => openEditModal(item),
            },
            {
              key: 'default',
              label: isDefault ? '已开启' : '开启助手',
              icon: <ImSwitch />,
              disabled: isDefault,
              onClick: () => setDefaultAssistant(+item.id!),
            },
            { type: 'divider' },
            {
              key: 'delete',
              label: '删除助手',
              danger: true,
              icon: <DeleteOutlined />,
              onClick: () => {
                Modal.confirm({
                  title: '确认删除',
                  content: `你确定要删除该助手 "${item.name}" 吗？`,
                  okText: '删除',
                  okType: 'danger',
                  cancelText: '取消',
                  onOk: () => delAssistantData(+item.id!),
                });
              },
            },
          ];

          return (
            <Card
              key={item.id}
              className={`relative overflow-hidden rounded-xl p-5 shadow-xs transition-shadow duration-300 hover:shadow-md ${item.isDefault
                  ? 'border-2! border-primary! bg-linear-to-br from-blue-50 via-white to-blue-50 dark:from-blue-900/30 dark:via-boxdark dark:to-blue-900/30 dark:border-primary!'
                  : 'border border-gray-200 bg-linear-to-br from-gray-50 via-white to-slate-50 dark:from-boxdark/80 dark:via-boxdark dark:to-boxdark-2/80 dark:border-strokedark'
                }`}
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'transparent' } }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    shape="square"
                    size={48}
                    style={{ backgroundColor: theme.color, verticalAlign: 'middle' }}
                    className="text-lg font-bold shadow-md"
                  >
                    {theme.icon}
                  </Avatar>

                  <div>
                    <div className="mb-1 ml-[5px] max-w-[160px] truncate text-lg leading-tight font-bold text-gray-800 dark:text-white">
                      {item.name}
                    </div>

                    <Space size={4}>
                      <Tag
                        bordered={false}
                        className="mr-0 bg-gray-100 text-xs text-gray-500 dark:bg-boxdark-2 dark:text-gray-300"
                      >
                        {info ? info.label : item.model}
                      </Tag>

                      {info && (
                        <Tooltip title={info.desc}>
                          <InfoCircleOutlined className="cursor-pointer text-gray-400! hover:text-primary dark:text-gray-500 dark:hover:text-primary" />
                        </Tooltip>
                      )}
                    </Space>
                  </div>
                </div>

                <Dropdown
                  menu={{ items: menuItems }}
                  placement="bottomRight"
                  arrow
                  className="bg-gray-50 dark:bg-boxdark-2/50 dark:hover:bg-boxdark-2/30"
                >
                  <Button type="text" icon={<MoreOutlined className="text-xl text-gray-400 dark:text-gray-500" />} />
                </Dropdown>
              </div>

              <div className="mb-2 flex-1 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 dark:border-strokedark dark:bg-boxdark-2">
                <div className="mb-1 flex items-center text-xs font-bold text-gray-400 uppercase dark:text-gray-500">
                  <ApiOutlined className="mr-1" /> API Endpoint
                </div>
                <div className="m-0 break-all font-mono text-sm text-gray-600 dark:text-gray-300">{item.url}</div>
              </div>

              <div className="mt-auto flex justify-end border-t border-gray-100 pt-2 dark:border-strokedark">
                <Button
                  type={isTesting ? 'default' : 'dashed'}
                  className={`w-full ${isTesting
                      ? ''
                      : 'border-primary bg-blue-50/50 text-primary dark:border-primary dark:bg-blue-900/20 dark:text-primary'
                    }`}
                  icon={isTesting ? <ThunderboltFilled spin /> : <ThunderboltFilled />}
                  loading={isTesting}
                  onClick={() => testConnection(item)}
                >
                  {isTesting ? '连接测试中...' : '测试连接'}
                </Button>
              </div>
            </Card>
          );
        })}

        <Button
          type="dashed"
          className="flex h-auto min-h-[230px] flex-col items-center justify-center gap-2 rounded-lg border-2 bg-transparent text-gray-400 hover:border-primary hover:text-primary dark:border-strokedark dark:bg-boxdark! dark:text-gray-500 dark:hover:border-primary dark:hover:text-primary"
          onClick={openCreateModal}
        >
          <PlusOutlined style={{ fontSize: 24 }} />
          <span className="font-medium">添加新助手</span>
        </Button>
      </div>

      <Modal
        title={editingAssistant.id ? '编辑助手' : '添加助手'}
        open={modalOpen}
        confirmLoading={saveLoading}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false);
          resetModalState();
        }}
      >
        <Form form={form} layout="vertical" size="large">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入助手名称' }]}>
            <Input placeholder="例如：DeepSeek、OpenAI 等" />
          </Form.Item>

          <Form.Item
            name="url"
            label="API 地址"
            tooltip="填写完整的 API 接口地址，如 https://api.deepseek.com/v1"
            rules={[
              { required: true, message: '请输入 API 地址' },
              {
                pattern: /^https?:\/\//,
                message: '请输入正确的 API 地址',
              },
            ]}
          >
            <Input placeholder="https://api.deepseek.com/v1" autoComplete="off" />
          </Form.Item>

          <Form.Item name="key" label="API 密钥" rules={[{ required: true, message: '请输入 API 密钥' }]}>
            <Input.Password placeholder="请输入 API 密钥" autoComplete="new-password" />
          </Form.Item>

          <Form.Item name="model" label="模型" rules={[{ required: true, message: '请选择或输入模型' }]}>
            <Select
              showSearch
              placeholder="选择或输入模型"
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes((input ?? '').toLowerCase())
              }
              onSearch={(val) => setInputModelValue(val)}
              optionLabelProp="label"
              options={modelSelectOptions}
              optionRender={(option) => {
                const meta = ASSISTANT_MODEL_INFO_MAP[option.value as string];
                if (meta) {
                  return (
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      <Tooltip title={meta.desc}>
                        <InfoCircleOutlined className="text-slate-300" />
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
}
