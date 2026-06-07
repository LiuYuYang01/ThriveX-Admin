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
import { ASSISTANT_PROVIDER_LIST, ASSISTANT_PROVIDER_MAP, getAssistantDisplayLabel, getAssistantModelInfo, getAssistantModelLogo, getAssistantModelTheme, resolveProviderId } from './modelConfig';

type ModelIconProps = {
  model: string;
  size?: 'sm' | 'md';
};

function ModelIcon({ model, size = 'md' }: ModelIconProps) {
  const theme = getAssistantModelTheme(model);
  const logo = getAssistantModelLogo(model);
  const isSm = size === 'sm';
  const boxClass = isSm ? 'size-6 rounded-md' : 'size-12 rounded-xl';
  const imgClass = isSm ? 'size-4' : 'size-8';
  const isAvatar = theme.logoShape === 'avatar';

  if (logo) {
    return (
      <div className={`flex shrink-0 items-center justify-center ${boxClass}`}>
        <img
          src={logo}
          alt=""
          className={`${imgClass} object-contain ${isAvatar ? 'rounded-full' : ''}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${boxClass} shrink-0 items-center justify-center text-sm font-bold tracking-tight ${theme.bgClass} ${theme.textClass}`}
    >
      {theme.icon}
    </div>
  );
}

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
  const info = getAssistantModelInfo(item.model);
  const displayLabel = getAssistantDisplayLabel(item.model);
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
          <ModelIcon model={item.model} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-800 dark:text-slate-100">{displayLabel}</h3>
              {info && (
                <Tooltip title={info.desc}>
                  <button
                    type="button"
                    className="inline-flex shrink-0 text-slate-400 transition-colors hover:text-primary dark:text-slate-500"
                    aria-label="模型说明"
                  >
                    <FiInfo size={14} />
                  </button>
                </Tooltip>
              )}
              {isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-primary/20">
                  <FiCheck size={12} />
                  当前使用
                </span>
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

  const providerSelectOptions = useMemo(
    () =>
      ASSISTANT_PROVIDER_LIST.map((item) => ({
        label: item.label,
        value: item.id,
      })),
    [],
  );

  const handleProviderChange = useCallback(
    (providerId: string) => {
      const provider = ASSISTANT_PROVIDER_MAP[providerId];
      if (!provider) return;

      form.setFieldsValue({
        model: providerId,
        url: provider.apiUrl,
      });
    },
    [form],
  );

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

  const resetModalState = useCallback(() => {
    form.resetFields();
    setEditingAssistant(EMPTY_ASSISTANT);
  }, [form]);

  const handleSubmit = useCallback(() => {
    form.validateFields().then((values) => {
      const providerId = values.provider as string;
      const provider = ASSISTANT_PROVIDER_MAP[providerId];
      if (!provider) return;

      saveAssistant({
        ...editingAssistant,
        ...values,
        model: providerId,
        url: provider.apiUrl,
      }).then((success) => {
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
      const providerId = resolveProviderId(record.model);
      form.setFieldsValue({
        ...record,
        provider: ASSISTANT_PROVIDER_MAP[providerId] ? providerId : undefined,
      });
      setEditingAssistant(record);
      setModalOpen(true);
    },
    [form],
  );

  const handleDelete = useCallback(
    (record: Assistant) => {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除「${getAssistantDisplayLabel(record.model)}」吗？删除后不可恢复。`,
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
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 dark:border-strokedark dark:bg-boxdark-2/40">
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
              <span className="font-medium text-slate-700 dark:text-slate-200">{getAssistantDisplayLabel(defaultAssistant.model)}</span>
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
          选择服务商并填写 API 密钥即可，接口地址将自动配置。保存后可一键测试连通性。
        </p>
        <Form form={form} layout="vertical" size="large" requiredMark="optional">
          <Form.Item label="服务商" required>
            <Form.Item name="provider" noStyle rules={[{ required: true, message: '请选择服务商' }]}>
              <Select
                placeholder="选择 AI 服务商"
                options={providerSelectOptions}
                onChange={handleProviderChange}
                labelRender={(option) => {
                  const providerId = option.value as string;
                  return (
                    <div className="flex items-center gap-2">
                      <ModelIcon model={providerId} size="sm" />
                      <span>{option.label}</span>
                    </div>
                  );
                }}
                optionRender={(option) => {
                  const providerId = option.value as string;
                  const meta = ASSISTANT_PROVIDER_MAP[providerId];
                  return (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <ModelIcon model={providerId} size="sm" />
                        <span className="truncate">{option.label}</span>
                      </div>
                      {meta && (
                        <Tooltip title={meta.desc}>
                          <FiInfo className="shrink-0 text-slate-300" />
                        </Tooltip>
                      )}
                    </div>
                  );
                }}
              />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.provider !== cur.provider}>
              {({ getFieldValue }) => {
                const providerId = getFieldValue('provider') as string | undefined;
                const provider = providerId ? ASSISTANT_PROVIDER_MAP[providerId] : undefined;
                if (!provider) return null;
                return (
                  <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-strokedark dark:bg-boxdark-2/60">
                    <FiLink size={14} className="shrink-0 text-slate-400" />
                    <span className="break-all font-mono text-xs text-slate-500 dark:text-slate-400">{provider.apiUrl}</span>
                  </div>
                );
              }}
            </Form.Item>
          </Form.Item>

          <Form.Item name="key" label="API 密钥" rules={[{ required: true, message: '请输入 API 密钥' }]}>
            <Input.Password placeholder="请输入 API 密钥" autoComplete="new-password" />
          </Form.Item>

          <Form.Item name="url" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="model" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
