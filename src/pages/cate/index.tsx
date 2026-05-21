import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Form,
  Input,
  Button,
  Tree,
  Modal,
  Spin,
  Popconfirm,
  message,
  Select,
  Tooltip,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiFolder,
  FiLink,
  FiLayers,
  FiEyeOff,
  FiEye,
  FiHash,
  FiList,
  FiChevronDown,
  FiChevronRight,
  FiSearch,
  FiChevronsDown,
  FiChevronsUp,
  FiNavigation,
} from 'react-icons/fi';

import { Cate } from '@/types/app/cate';
import {
  addCateDataAPI,
  delCateDataAPI,
  editCateDataAPI,
  getCateDataAPI,
  getCateListAPI,
} from '@/api/cate';
import Title from '@/components/Title';
import Skeleton from './Skeleton';

function countCates(items: Cate[]): number {
  return items.reduce(
    (sum, item) => sum + 1 + (item.children?.length ? countCates(item.children) : 0),
    0,
  );
}

function countHidden(items: Cate[]): number {
  return items.reduce((sum, item) => {
    const self = item.isHide ? 1 : 0;
    const children = item.children?.length ? countHidden(item.children) : 0;
    return sum + self + children;
  }, 0);
}

function countByType(items: Cate[], type: string): number {
  return items.reduce((sum, item) => {
    const self = item.type === type ? 1 : 0;
    const children = item.children?.length ? countByType(item.children, type) : 0;
    return sum + self + children;
  }, 0);
}

function collectKeys(items: Cate[]): number[] {
  return items.flatMap((item) => [
    item.id || 0,
    ...(item.children?.length ? collectKeys(item.children) : []),
  ]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCascaderOptions(data: Cate[], isRoot = true): any[] {
  return [
    ...(isRoot ? [{ value: 0, label: '一级分类' }] : []),
    ...data.map((item) => ({
      value: item.id!,
      label: item.name,
      children: item.children?.length ? buildCascaderOptions(item.children, false) : undefined,
    })),
  ];
}

function filterCates(items: Cate[], keyword: string): Cate[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return items;

  return items.reduce<Cate[]>((acc, item) => {
    const filteredChildren = item.children?.length ? filterCates(item.children, kw) : [];
    const match =
      item.name?.toLowerCase().includes(kw) || item.mark?.toLowerCase().includes(kw);

    if (!match && !filteredChildren.length) return acc;

    const next: Cate = { ...item };
    if (filteredChildren.length) {
      next.children = filteredChildren;
    } else if (!match) {
      next.children = [];
    }
    acc.push(next);
    return acc;
  }, []);
}

const treeClassName = [
  'bg-transparent!',
  '[&_.ant-tree-treenode]:w-full! [&_.ant-tree-treenode]:py-px!',
  '[&_.ant-tree-indent-unit]:w-3!',
  '[&_.ant-tree-node-content-wrapper]:flex! [&_.ant-tree-node-content-wrapper]:w-full! [&_.ant-tree-node-content-wrapper]:flex-1! [&_.ant-tree-node-content-wrapper]:rounded-lg! [&_.ant-tree-node-content-wrapper]:bg-transparent! [&_.ant-tree-node-content-wrapper]:min-h-0! [&_.ant-tree-node-content-wrapper]:py-0!',
  '[&_.ant-tree-node-content-wrapper:hover]:bg-transparent!',
  '[&_.ant-tree-node-selected]:bg-primary/5! dark:[&_.ant-tree-node-selected]:bg-primary/10!',
  '[&_.ant-tree-title]:block! [&_.ant-tree-title]:w-full! [&_.ant-tree-title]:flex-1!',
  '[&_.ant-tree-switcher]:mt-1.5! [&_.ant-tree-switcher]:shrink-0! [&_.ant-tree-switcher]:w-5!',
  '[&_.ant-tree-switcher-noop]:w-5!',
  '[&_.ant-tree-switcher-leaf-line::before]:border-slate-200! dark:[&_.ant-tree-switcher-leaf-line::before]:border-strokedark!',
  '[&_.ant-tree-switcher-leaf-line::after]:border-slate-200! dark:[&_.ant-tree-switcher-leaf-line::after]:border-strokedark!',
].join(' ');

function CateTreeNodeDot({ type }: { type: string }) {
  const isNav = type === 'nav';
  return (
    <span
      className={`mt-0.5 size-2 shrink-0 rounded-full ${isNav ? 'bg-amber-400/70' : 'bg-primary/45'}`}
      aria-hidden
    />
  );
}

type StatItem = {
  key: string;
  label: string;
  value: number;
  icon: typeof FiLayers;
  tone: 'slate' | 'primary' | 'amber' | 'rose';
};

const statToneClass: Record<StatItem['tone'], string> = {
  slate: 'bg-slate-100 text-slate-600 dark:bg-boxdark-2 dark:text-slate-300',
  primary: 'bg-primary/10 text-primary dark:bg-primary/15',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
};

export default function CatePage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<number[]>([]);
  const isFirstLoadRef = useRef(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTreeId, setSelectedTreeId] = useState<number | undefined>();
  const [cate, setCate] = useState<Cate>({} as Cate);
  const [list, setList] = useState<Cate[]>([]);
  const [isMethod, setIsMethod] = useState<'create' | 'edit'>('create');
  const [form] = Form.useForm();

  const isEditing = isMethod === 'edit';
  const hasSearch = Boolean(search.trim());
  const isHideValue = Form.useWatch('isHide', form);
  const typeValue = Form.useWatch('type', form) ?? 'cate';

  const stats = useMemo(
    () => ({
      total: countCates(list),
      topLevel: list.length,
      hidden: countHidden(list),
      nav: countByType(list, 'nav'),
    }),
    [list],
  );

  const statItems: StatItem[] = useMemo(
    () => [
      { key: 'total', label: '全部节点', value: stats.total, icon: FiLayers, tone: 'slate' },
      { key: 'top', label: '一级分类', value: stats.topLevel, icon: FiFolder, tone: 'primary' },
      { key: 'nav', label: '导航链接', value: stats.nav, icon: FiNavigation, tone: 'amber' },
      { key: 'hidden', label: '前台隐藏', value: stats.hidden, icon: FiEyeOff, tone: 'rose' },
    ],
    [stats],
  );

  const filteredList = useMemo(() => filterCates(list, search), [list, search]);

  const getCateList = useCallback(async () => {
    try {
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getCateListAPI();
      data.result.sort((a: Cate, b: Cate) => a.order - b.order);
      setList(data.result);
      setExpandedKeys(collectKeys(data.result));
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void getCateList();
  }, [getCateList]);

  useEffect(() => {
    if (hasSearch) {
      setExpandedKeys(collectKeys(filteredList));
    }
  }, [hasSearch, filteredList]);

  const resetFormState = useCallback(() => {
    setIsMethod('create');
    form.resetFields();
    setCate({} as Cate);
    setSelectedTreeId(undefined);
  }, [form]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    resetFormState();
  }, [resetFormState]);

  const addCateData = useCallback(
    (parentId: number) => {
      setIsMethod('create');
      setCate({} as Cate);
      setIsModalOpen(true);
      form.setFieldsValue({ level: parentId, type: 'cate', isHide: false, order: 0 });
    },
    [form],
  );

  const editCateData = useCallback(
    async (id: number) => {
      try {
        setEditLoading(true);
        setIsMethod('edit');
        setIsModalOpen(true);

        const { data } = await getCateDataAPI(id);
        setSelectedTreeId(id);
        setCate(data);
        form.setFieldsValue(data);
      } catch (error) {
        console.error(error);
        setIsModalOpen(false);
      } finally {
        setEditLoading(false);
      }
    },
    [form],
  );

  const delCateData = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        await delCateDataAPI(id);
        if (cate.id === id) closeModal();
        await getCateList();
        message.success('🎉 删除分类成功');
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    },
    [cate.id, closeModal, getCateList],
  );

  const onSubmit = async () => {
    try {
      setBtnLoading(true);
      const values = await form.validateFields();
      const normalizedValues = {
        ...values,
        url: values.type === 'cate' ? '/' : values.url,
      };

      if (isMethod === 'edit') {
        await editCateDataAPI({ ...cate, ...normalizedValues });
        message.success('🎉 修改分类成功');
      } else {
        await addCateDataAPI({ ...cate, ...normalizedValues });
        message.success('🎉 新增分类成功');
      }

      await getCateList();
      closeModal();
    } catch (error) {
      console.error(error);
    } finally {
      setBtnLoading(false);
    }
  };

  const toTreeData = useCallback(
    (data: Cate[], depth = 0): DataNode[] =>
      data.map((item: Cate) => ({
        title: (
          <div
            className={`group flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-1.5 transition-colors hover:border-slate-200/80 hover:bg-slate-50/80 dark:hover:border-strokedark dark:hover:bg-white/5 ${depth > 0 ? 'py-1' : 'py-1.5'} ${selectedTreeId === item.id ? 'border-primary/25 bg-primary/5 dark:border-primary/30 dark:bg-primary/10' : ''
              }`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <CateTreeNodeDot type={item.type} />

              <div className="flex min-w-0 flex-1 items-baseline gap-2">
                <span
                  className={`min-w-0 truncate ${depth > 0 ? 'text-[13px]' : 'text-sm'} font-medium text-slate-700 dark:text-slate-200`}
                >
                  {item.name}
                  {item.type === 'cate' && item.count != null && (
                    <span className="truncate text-xs font-medium text-slate-400 dark:text-slate-200">
                      （{item.count}）
                    </span>
                  )}
                </span>
              </div>

              {item.isHide && (
                <FiEyeOff
                  size={12}
                  className="shrink-0 text-rose-400/80 dark:text-rose-400/70"
                  aria-label="前台隐藏"
                />
              )}
            </div>

            <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
              <Tooltip title="添加子分类">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addCateData(item.id!);
                  }}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-white/10 dark:hover:text-primary"
                  aria-label={`在 ${item.name} 下新增子分类`}
                >
                  <FiPlus size={15} />
                </button>
              </Tooltip>
              <Tooltip title="编辑">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void editCateData(item.id!);
                  }}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-white/10 dark:hover:text-primary"
                  aria-label={`编辑 ${item.name}`}
                >
                  <FiEdit2 size={15} />
                </button>
              </Tooltip>
              <Popconfirm
                title="删除分类"
                description={`确定要删除「${item.name}」吗？子分类将一并移除。`}
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                onConfirm={() => delCateData(item.id!)}
              >
                <Tooltip title="删除">
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    aria-label={`删除 ${item.name}`}
                  >
                    <FiTrash2 size={15} />
                  </button>
                </Tooltip>
              </Popconfirm>
            </div>
          </div>
        ),
        key: item.id || 0,
        children: item.children?.length ? toTreeData(item.children, depth + 1) : [],
      })),
    [addCateData, selectedTreeId, delCateData, editCateData],
  );

  const treeData = useMemo(() => toTreeData(filteredList), [filteredList, toTreeData]);

  const cascaderOptions = useMemo(() => buildCascaderOptions(list), [list]);

  const handleExpandAll = () => setExpandedKeys(collectKeys(list));
  const handleCollapseAll = () => setExpandedKeys([]);

  if (initialLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="分类管理">
        <Button type="primary" icon={<FiPlus />} onClick={() => addCateData(0)}>
          新增分类
        </Button>
      </Title>

      <div className="flex min-h-0 flex-1 flex-col px-3">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <header className="flex shrink-0 flex-col gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-strokedark sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden items-center gap-3 text-[11px] text-slate-400 sm:flex dark:text-slate-500 ml-4">
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-sm bg-primary/40" />
                  分类
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-sm bg-amber-400/60" />
                  导航
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Input
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索名称或标识…"
                prefix={<FiSearch className="text-slate-400" />}
                className="w-full min-w-0 sm:w-[200px]!"
              />
              <div className="flex items-center gap-1">
                <Tooltip title="全部展开">
                  <button
                    type="button"
                    onClick={handleExpandAll}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200/80 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-primary dark:border-strokedark dark:hover:bg-white/5 dark:hover:text-primary"
                    aria-label="全部展开"
                  >
                    <FiChevronsDown size={16} />
                  </button>
                </Tooltip>
                <Tooltip title="全部收起">
                  <button
                    type="button"
                    onClick={handleCollapseAll}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200/80 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-primary dark:border-strokedark dark:hover:bg-white/5 dark:hover:text-primary"
                    aria-label="全部收起"
                  >
                    <FiChevronsUp size={16} />
                  </button>
                </Tooltip>
              </div>
            </div>
          </header>

          <Spin spinning={loading} className="min-h-0 flex-1">
            <div className="min-h-[320px] p-4 sm:p-5">
              {list.length > 0 ? (
                treeData.length > 0 ? (
                  <Tree
                    className={treeClassName}
                    treeData={treeData}
                    expandedKeys={expandedKeys}
                    onExpand={(keys) => setExpandedKeys(keys as number[])}
                    selectedKeys={selectedTreeId ? [selectedTreeId] : []}
                    showLine={{ showLeafIcon: false }}
                    blockNode
                    switcherIcon={({ expanded }) =>
                      expanded ? (
                        <FiChevronDown className="text-primary" size={14} />
                      ) : (
                        <FiChevronRight className="text-slate-400" size={14} />
                      )
                    }
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2 dark:text-slate-500">
                      <FiSearch size={22} />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      没有匹配的分类
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      试试其他关键词，或清空搜索框
                    </p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2 dark:text-slate-500">
                    <FiFolder size={22} />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">还没有分类</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                    分类用于组织文章归档，导航用于站点菜单外链跳转
                  </p>
                  <Button
                    type="primary"
                    icon={<FiPlus />}
                    className="mt-4"
                    onClick={() => addCateData(0)}
                  >
                    创建第一个分类
                  </Button>
                </div>
              )}
            </div>
          </Spin>
        </section>
      </div>

      <Modal
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        width={560}
        loading={editLoading}
        className="[&_.ant-modal-content]:rounded-2xl! [&_.ant-modal-header]:mb-0! [&_.ant-modal-body]:pt-4!"
        title={
          <div className="flex items-start gap-3 pr-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/15">
              <FiLayers size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                {isEditing ? '编辑分类' : '新建分类'}
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {isEditing
                  ? '修改后保存，分类树将同步更新'
                  : '支持多级分类与导航模式，用于组织文章与站点菜单'}
              </p>
            </div>
          </div>
        }
      >
        {isEditing && cate.name && (
          <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 dark:border-primary/25 dark:bg-primary/10">
            <span className="truncate text-sm font-medium text-primary">{cate.name}</span>
            <span className="shrink-0 font-mono text-xs text-slate-400 dark:text-slate-500">
              /{cate.mark}
            </span>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          size="large"
          requiredMark="optional"
          preserve={false}
          className="[&_.ant-input]:rounded-xl! [&_.ant-select-selector]:rounded-xl!"
        >
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Form.Item
              label="分类名称"
              name="name"
              rules={[{ required: true, message: '分类名称不能为空' }]}
              className="mb-4!"
            >
              <Input placeholder="例如：技术随笔" allowClear />
            </Form.Item>
            <Form.Item
              label="分类标识"
              name="mark"
              rules={[{ required: true, message: '分类标识不能为空' }]}
              className="mb-4!"
            >
              <Input
                placeholder="例如：tech"
                allowClear
                prefix={<FiHash className="text-slate-400" />}
              />
            </Form.Item>
          </div>

          <div className="grid gap-x-3 sm:grid-cols-2">
            <Form.Item label="上级分类" name="level" className="mb-4!">
              <Select options={cascaderOptions} placeholder="选择上级" />
            </Form.Item>
            <Form.Item label="排序权重" name="order" className="mb-4!">
              <Input
                placeholder="越小越靠前"
                type="number"
                prefix={<FiList className="text-slate-400" />}
              />
            </Form.Item>
          </div>

          <Form.Item name="isHide" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="前台可见" className="mb-4!">
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: false, label: '显示', icon: FiEye },
                { value: true, label: '隐藏', icon: FiEyeOff },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => form.setFieldValue('isHide', opt.value)}
                  className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${isHideValue === opt.value
                    ? 'border-primary bg-primary/5 text-primary dark:bg-primary/10'
                    : 'border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-strokedark dark:text-slate-300 dark:hover:bg-white/5'
                    }`}
                >
                  <opt.icon size={15} />
                  {opt.label}
                </button>
              ))}
            </div>
          </Form.Item>

          <Form.Item name="type" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="节点类型" className="mb-4!">
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'cate', label: '分类', desc: '归档文章', icon: FiFolder },
                { value: 'nav', label: '导航', desc: '外链跳转', icon: FiLink },
              ].map((opt) => {
                const active = typeValue === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => form.setFieldValue('type', opt.value)}
                    className={`flex cursor-pointer flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors ${active
                      ? opt.value === 'nav'
                        ? 'border-amber-300/80 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                        : 'border-primary/30 bg-primary/5 text-primary dark:bg-primary/10'
                      : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 dark:border-strokedark dark:hover:bg-white/5'
                      }`}
                  >
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                      <opt.icon size={15} />
                      {opt.label}
                    </span>
                    <span className="text-[11px] opacity-70">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </Form.Item>

          {typeValue === 'nav' && (
            <Form.Item label="跳转链接" name="url" className="mb-4!">
              <Input
                placeholder="https://..."
                allowClear
                prefix={<FiLink className="text-slate-400" />}
              />
            </Form.Item>
          )}

          <Form.Item className="mb-0!">
            <div className="flex gap-2">
              <Button onClick={closeModal} className="h-11! flex-1">
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={btnLoading}
                icon={isEditing ? <FiEdit2 /> : <FiPlus />}
                className="h-11! flex-1"
              >
                {isEditing ? '保存修改' : '新增分类'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
