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
  Radio,
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
  FiHash,
  FiList,
  FiChevronDown,
  FiChevronRight,
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

const treeClassName = [
  'bg-transparent!',
  '[&_.ant-tree-treenode]:w-full! [&_.ant-tree-treenode]:py-0.5!',
  '[&_.ant-tree-indent-unit]:w-4!',
  '[&_.ant-tree-node-content-wrapper]:flex! [&_.ant-tree-node-content-wrapper]:w-full! [&_.ant-tree-node-content-wrapper]:flex-1! [&_.ant-tree-node-content-wrapper]:bg-transparent!',
  '[&_.ant-tree-title]:block! [&_.ant-tree-title]:w-full! [&_.ant-tree-title]:flex-1!',
  '[&_.ant-tree-switcher]:mt-1.5! [&_.ant-tree-switcher]:shrink-0! [&_.ant-tree-switcher]:text-primary!',
  '[&_.ant-tree-switcher-leaf-line::before]:border-slate-200! dark:[&_.ant-tree-switcher-leaf-line::before]:border-strokedark!',
  '[&_.ant-tree-switcher-leaf-line::after]:border-slate-200! dark:[&_.ant-tree-switcher-leaf-line::after]:border-strokedark!',
].join(' ');

export default function CatePage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const isFirstLoadRef = useRef(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cate, setCate] = useState<Cate>({} as Cate);
  const [list, setList] = useState<Cate[]>([]);
  const [isMethod, setIsMethod] = useState<'create' | 'edit'>('create');
  const [isCateShow, setIsCateShow] = useState(false);
  const [form] = Form.useForm();

  const isEditing = isMethod === 'edit';

  const stats = useMemo(
    () => ({
      total: countCates(list),
      topLevel: list.length,
      hidden: countHidden(list),
    }),
    [list],
  );

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

  const resetFormState = useCallback(() => {
    setIsMethod('create');
    setIsCateShow(false);
    form.resetFields();
    setCate({} as Cate);
  }, [form]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    resetFormState();
  }, [resetFormState]);

  const addCateData = useCallback(
    (parentId: number) => {
      setIsMethod('create');
      setIsCateShow(false);
      form.resetFields();
      const nextCate = { level: parentId, type: 'cate', isHide: false, order: 0 } as Cate;
      setCate(nextCate);
      form.setFieldsValue({ level: parentId, type: 'cate', isHide: false, order: 0 });
      setIsModalOpen(true);
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
        setIsCateShow(data.type === 'nav');
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
    (data: Cate[]): DataNode[] =>
      data.map((item: Cate) => ({
        title: (
          <div className="group flex w-full items-center justify-between gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                  item.type === 'nav'
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                    : 'bg-primary/10 text-primary dark:bg-primary/20'
                }`}
              >
                {item.type === 'nav' ? <FiLink size={15} /> : <FiFolder size={15} />}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                    {item.name}
                  </span>
                  <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                    {item.mark}
                  </span>
                  {item.isHide && (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-boxdark-2 dark:text-slate-400">
                      <FiEyeOff size={10} />
                      隐藏
                    </span>
                  )}
                  {item.type === 'cate' && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-boxdark-2 dark:text-slate-400">
                      {item.count ?? 0} 篇
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
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
                  <FiPlus size={16} />
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
                  <FiEdit2 size={16} />
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
                    <FiTrash2 size={16} />
                  </button>
                </Tooltip>
              </Popconfirm>
            </div>
          </div>
        ),
        key: item.id || 0,
        children: item.children?.length ? toTreeData(item.children) : [],
      })),
    [addCateData, delCateData, editCateData],
  );

  const treeData = useMemo(() => toTreeData(list), [list, toTreeData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toCascaderOptions: any = (data: Cate[], isRoot: boolean = true) => [
    ...(isRoot ? [{ value: 0, label: '一级分类' }] : []),
    ...data.map((item) => ({
      value: item.id!,
      label: item.name,
      children: item.children ? toCascaderOptions(item.children, false) : undefined,
    })),
  ];

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

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3.5 dark:border-strokedark">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">分类结构</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-boxdark-2 dark:text-slate-300">
            共 {stats.total} 项
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            一级 {stats.topLevel} · 隐藏 {stats.hidden}
          </span>
        </header>

        <Spin spinning={loading} className="min-h-0 flex-1">
          <div className="min-h-[calc(100vh-200px)] p-4 sm:p-5">
            {list.length > 0 ? (
              <Tree
                className={treeClassName}
                defaultExpandAll
                treeData={treeData}
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
                  <FiFolder size={22} />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">还没有分类</p>
                <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                  点击右上角「新增分类」创建第一个顶级分类
                </p>
                <Button
                  type="primary"
                  icon={<FiPlus />}
                  className="mt-4"
                  onClick={() => addCateData(0)}
                >
                  新增分类
                </Button>
              </div>
            )}
          </div>
        </Spin>
      </section>

      <Modal
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        width={560}
        destroyOnClose
        loading={editLoading}
        className="[&_.ant-modal-content]:rounded-2xl! [&_.ant-modal-header]:mb-0! [&_.ant-modal-body]:pt-4!"
        title={
          <div className="flex items-start gap-3 pr-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
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
              <Input placeholder="例如：tech" allowClear prefix={<FiHash className="text-slate-400" />} />
            </Form.Item>
          </div>

          <div className="grid gap-x-3 sm:grid-cols-2">
            <Form.Item label="上级分类" name="level" className="mb-4!">
              <Select options={toCascaderOptions(list)} placeholder="选择上级" />
            </Form.Item>
            <Form.Item label="排序权重" name="order" className="mb-4!">
              <Input placeholder="数值越小越靠前" type="number" prefix={<FiList className="text-slate-400" />} />
            </Form.Item>
          </div>

          <Form.Item label="前台可见" name="isHide" className="mb-4!">
            <Radio.Group className="flex! flex-wrap! gap-3!">
              <Radio value={false} className="m-0!">
                显示
              </Radio>
              <Radio value={true} className="m-0!">
                隐藏
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="节点类型" name="type" className="mb-4!">
            <Radio.Group
              className="flex! flex-wrap! gap-3!"
              onChange={(e) => setIsCateShow(e.target.value === 'nav')}
            >
              <Radio value="cate" className="m-0!">
                分类（归档文章）
              </Radio>
              <Radio value="nav" className="m-0!">
                导航（外链跳转）
              </Radio>
            </Radio.Group>
          </Form.Item>

          {isCateShow && (
            <Form.Item label="跳转链接" name="url" className="mb-4!">
              <Input placeholder="https://..." allowClear prefix={<FiLink className="text-slate-400" />} />
            </Form.Item>
          )}

          <Form.Item className="mb-0!">
            <Button
              type="primary"
              htmlType="submit"
              loading={btnLoading}
              block
              icon={isEditing ? <FiEdit2 /> : <FiPlus />}
              className="h-11!"
            >
              {isEditing ? '保存修改' : '新增分类'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
