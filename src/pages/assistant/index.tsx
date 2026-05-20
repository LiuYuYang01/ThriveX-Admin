import { useState, useMemo, useCallback } from 'react';
import { Button, Form, Input, Modal, Select, Tooltip, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiInfo,
  FiMoreVertical,
  FiLink,
  FiZap,
  FiCheck,
  FiCpu,
  FiLoader,
} from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';
import { ImSwitch } from 'react-icons/im';

import Title from '@/components/Title';
import useAssistant from '@/hooks/useAssistant';
import type { Assistant } from '@/types/app/assistant';

import AssistantPageSkeleton from './Skeleton';
import { ASSISTANT_MODEL_INFO_MAP, getAssistantModelTheme } from './modelConfig';

const EMPTY_ASSISTANT: Assistant = {} as Assistant;

type AssistantCardProps = {
  item: Assistant;
  isTesting: boolean;
  onEdit: (record: Assistant) => void;
  onSetDefault: (id: number) => void;
  onDelete: (record: Assistant) => void;
  onTest: (record: Assistant) => void;
};

function AssistantCard({ item, isTesting, onEdit, onSetDefault, onDelete, onTest }: AssistantCardProps) {
  const info = ASSISTANT_MODEL_INFO_MAP[item.model];
  const theme = getAssistantModelTheme(item.model);
  const isDefault = !!item.isDefault;

  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: '编辑配置',
      icon: <FiEdit2 className="text-base" />,
      onClick: () => onEdit(item),
    },
    {
      key: 'default',
      label: isDefault ? '已设为默认' : '设为默认助手',
      icon: <ImSwitch className="text-base" />,
      disabled: isDefault,
      onClick: () => onSetDefault(+item.id!),
    },
    { type: 'divider' },
    {
      key: 'delete',
      label: '删除助手',
      danger: true,
      icon: <FiTrash2 className="text-base" />,
      onClick: () => onDelete(item),
    },
  ];

  return (
    <article
      className={`group relative flex flex-col rounded-2xl border bg-white p-5 transition-colors duration-200 dark:bg-boxdark ${isDefault
        ? 'border-primary ring-1 ring-primary'
        : 'border-slate-200/80 hover:border-slate-300 dark:border-strokedark dark:hover:border-slate-600'
        }`}
    >
      <header className="mb-4 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-tight ${theme.bgClass} ${theme.textClass}`}
          >
            {theme.icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className='flex items-center gap-4'>
              <h3 className="truncate text-base font-semibold text-slate-800 dark:text-slate-100">{item.name}</h3>

              {isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-primary/20">
                  <FiCheck size={12} />
                  当前使用
                </span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-boxdark-2 dark:text-slate-300">
                {info ? info.label : item.model}
              </span>
              {info && (
                <Tooltip title={info.desc}>
                  <button
                    type="button"
                    className="inline-flex text-slate-400 transition-colors hover:text-primary dark:text-slate-500"
                    aria-label="模型说明"
                  >
                    <FiInfo size={14} />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
          <button
            type="button"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-200 cursor-pointer"
            aria-label="更多操作"
          >
            <FiMoreVertical size={18} />
          </button>
        </Dropdown>
      </header>

      <div className="mb-4 flex-1 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3 dark:border-strokedark dark:bg-boxdark-2/60">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">
          <FiLink size={12} />
          API Endpoint
        </div>
        <p className="m-0 break-all font-mono text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.url}</p>
      </div>

      <footer className="mt-auto border-t border-slate-100 pt-4 dark:border-strokedark">
        <Button
          block
          type={isTesting ? 'default' : 'primary'}
          ghost={!isTesting}
          disabled={isTesting}
          className="h-10! rounded-xl! font-medium"
          icon={isTesting ? <FiLoader className="animate-spin" /> : <FiZap />}
          onClick={() => onTest(item)}
        >
          {isTesting ? '连接测试中…' : '测试连接'}
        </Button>
      </footer>
    </article>
  );
}

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

  const defaultAssistant = useMemo(() => list.find((a) => a.isDefault), [list]);

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

  const handleDelete = useCallback(
    (record: Assistant) => {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除助手「${record.name}」吗？删除后不可恢复。`,
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => delAssistantData(+record.id!),
      });
    },
    [delAssistantData],
  );

  if (listLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <AssistantPageSkeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title value="助手管理">
        <Button type="primary" icon={<FiPlus />} className="rounded-lg!" onClick={openCreateModal}>
          新增助手
        </Button>
      </Title>

      {/* 概览条 */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 dark:border-strokedark dark:bg-boxdark-2/40">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white text-primary dark:bg-boxdark">
            <FiCpu size={16} />
          </span>
          <span>
            已配置 <strong className="text-slate-800 dark:text-white">{list.length}</strong> 个助手
          </span>
        </div>
        <span className="hidden h-4 w-px bg-slate-200 sm:block dark:bg-strokedark" />
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {defaultAssistant ? (
            <>
              当前默认：
              <span className="font-medium text-slate-700 dark:text-slate-200">{defaultAssistant.name}</span>
            </>
          ) : (
            <span className="text-amber-600 dark:text-amber-400">尚未设置默认助手，请在卡片菜单中指定</span>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mx-3 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center dark:border-strokedark dark:bg-boxdark">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HiOutlineSparkles size={28} />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">还没有配置 AI 助手</h3>
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            连接大模型 API 后，可在写作、评论回复等场景中使用智能能力。请先添加至少一个助手并设为默认。
          </p>
          <Button type="primary" size="large" icon={<FiPlus />} className="rounded-xl!" onClick={openCreateModal}>
            添加第一个助手
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mt-3">
          {list.map((item) => (
            <AssistantCard
              key={item.id}
              item={item}
              isTesting={!!testingMap[item.id]}
              onEdit={openEditModal}
              onSetDefault={setDefaultAssistant}
              onDelete={handleDelete}
              onTest={testConnection}
            />
          ))}

          <button
            type="button"
            onClick={openCreateModal}
            className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-transparent text-slate-400 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-strokedark dark:hover:border-primary dark:hover:bg-primary/10 cursor-pointer"
          >
            <span className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-strokedark dark:bg-boxdark">
              <FiPlus size={22} />
            </span>
            <span className="text-sm font-medium">添加新助手</span>
          </button>
        </div>
      )}

      <Modal
        title={
          <span className="inline-flex items-center gap-2">
            <FiCpu className="text-primary" />
            {editingAssistant.id ? '编辑助手' : '添加助手'}
          </span>
        }
        open={modalOpen}
        confirmLoading={saveLoading}
        okText={editingAssistant.id ? '保存' : '确定'}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false);
          resetModalState();
        }}
        destroyOnHidden
        classNames={{ body: 'pt-2!' }}
      >
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          填写模型服务商提供的 API 地址与密钥，保存后可一键测试连通性。
        </p>
        <Form form={form} layout="vertical" size="large" requiredMark="optional">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入助手名称' }]}>
            <Input placeholder="例如：DeepSeek、OpenAI 等" />
          </Form.Item>

          <Form.Item
            name="url"
            label="API 地址"
            tooltip="填写完整的 API 接口地址，如 https://api.deepseek.com/v1"
            rules={[
              { required: true, message: '请输入 API 地址' },
              { pattern: /^https?:\/\//, message: '请输入正确的 API 地址' },
            ]}
          >
            <Input placeholder="https://api.deepseek.com/v1" autoComplete="off" prefix={<FiLink className="text-slate-400" />} />
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
                    <div className="flex items-center justify-between gap-2">
                      <span>{option.label}</span>
                      <Tooltip title={meta.desc}>
                        <FiInfo className="shrink-0 text-slate-300" />
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
