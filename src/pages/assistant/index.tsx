import { useState, useCallback } from 'react';
import { Button, Form, Input, Modal } from 'antd';
import { FiPlus, FiCpu, FiLink } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';

import Title from '@/components/Title';
import useAssistant from '@/hooks/useAssistant';
import type { Assistant } from '@/types/app/assistant';

import AssistantPageSkeleton from './Skeleton';
import AssistantCard, { type TestResult } from './components/AssistantCard';
import ModelIcon from './components/ModelIcon';
import { ASSISTANT_PROVIDER_LIST, ASSISTANT_PROVIDER_MAP, getAssistantDisplayLabel, resolveProviderId } from './modelConfig';

const EMPTY_ASSISTANT: Assistant = {} as Assistant;

/** 弹窗里的服务商磁贴选择器（value/onChange 由 Form.Item 注入） */
function ProviderPicker({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {ASSISTANT_PROVIDER_LIST.map((provider) => {
        const active = value === provider.id;
        return (
          <button
            key={provider.id}
            type="button"
            onClick={() => onChange?.(provider.id)}
            className={`flex cursor-pointer items-start gap-2.5 rounded-xl border-2 p-3 text-left ${active
              ? 'border-primary bg-primary/5'
              : 'border-slate-200 hover:border-slate-300 dark:border-strokedark dark:hover:border-slate-600'
              }`}
          >
            <ModelIcon model={provider.id} size="sm" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{provider.label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 line-clamp-2 dark:text-slate-400">
                {provider.desc}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function AssistantPage() {
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant>(EMPTY_ASSISTANT);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

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

  // 选择服务商后自动填入接入地址与模型标识
  const handleValuesChange = useCallback(
    (changed: Partial<{ provider: string }>) => {
      const providerId = changed.provider;
      const provider = providerId ? ASSISTANT_PROVIDER_MAP[providerId] : undefined;
      if (provider) form.setFieldsValue({ model: providerId, url: provider.apiUrl });
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

  const handleTest = useCallback(
    async (record: Assistant) => {
      const ok = await testConnection(record);
      setTestResults((prev) => ({ ...prev, [record.id!]: { ok: !!ok, at: Date.now() } }));
    },
    [testConnection],
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
        <Button type="primary" icon={<FiPlus />} className="cursor-pointer rounded-lg!" onClick={openCreateModal}>
          新增助手
        </Button>
      </Title>

      {list.length === 0 ? (
        <div className="mt-3 flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 px-6 py-16 text-center dark:border-strokedark dark:bg-boxdark/40">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HiOutlineSparkles size={28} />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">还没有接入 AI 助手</h3>
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            选择服务商并填写 API 密钥即可完成接入，之后可在写作、评论回复等场景中使用智能能力。
          </p>
          <Button type="primary" size="large" icon={<FiPlus />} className="cursor-pointer rounded-xl!" onClick={openCreateModal}>
            添加第一个助手
          </Button>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {list.map((item, index) => (
              <div key={item.id} className="rise-in motion-reduce:animate-none" style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
                <AssistantCard
                  item={item}
                  isTesting={!!testingMap[item.id]}
                  testResult={testResults[item.id]}
                  onEdit={openEditModal}
                  onSetDefault={setDefaultAssistant}
                  onDelete={handleDelete}
                  onTest={handleTest}
                />
              </div>
            ))}

            <div className="rise-in motion-reduce:animate-none" style={{ animationDelay: `${Math.min(list.length, 8) * 60}ms` }}>
              <button
                type="button"
                onClick={openCreateModal}
                className="flex min-h-[220px] h-full w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-transparent text-slate-400 hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-strokedark dark:hover:border-primary dark:hover:bg-primary/10"
              >
                <span className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-strokedark dark:bg-boxdark">
                  <FiPlus size={22} />
                </span>
                <span className="text-sm font-medium">添加新助手</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">接入新的模型服务商</span>
              </button>
            </div>
          </div>
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
        width={560}
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
          选择服务商并填写 API 密钥，接入地址会自动配置；保存后可一键测试连通性。
        </p>
        <Form
          form={form}
          layout="vertical"
          size="large"
          requiredMark="optional"
          onValuesChange={handleValuesChange}
        >
          <Form.Item name="provider" label="服务商" rules={[{ required: true, message: '请选择服务商' }]}>
            <ProviderPicker />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.provider !== cur.provider}>
            {({ getFieldValue }) => {
              const providerId = getFieldValue('provider') as string | undefined;
              const provider = providerId ? ASSISTANT_PROVIDER_MAP[providerId] : undefined;
              if (!provider) return null;
              return (
                <div className="-mt-1 mb-4 flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-strokedark dark:bg-boxdark-2/60">
                  <FiLink size={14} className="shrink-0 text-slate-400" />
                  <span className="break-all font-mono text-xs text-slate-500 dark:text-slate-400">{provider.apiUrl}</span>
                </div>
              );
            }}
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
