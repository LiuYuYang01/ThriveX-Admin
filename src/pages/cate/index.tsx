import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Form,
  Input,
  Button,
  Modal,
  Spin,
  Popconfirm,
  message,
  Select,
  Tooltip,
} from 'antd';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiFolder,
  FiLink,
  FiFile,
  FiLayers,
  FiEyeOff,
  FiEye,
  FiHash,
  FiList,
  FiSearch,
  FiChevronsDown,
  FiChevronsUp,
} from 'react-icons/fi';

import { Cate } from '@/types/app/cate';
import {
  addCateDataAPI,
  delCateDataAPI,
  editCateDataAPI,
  getCateDataAPI,
  getCateListAPI,
  sortCateDataAPI,
} from '@/api/cate';
import Title from '@/components/Title';
import CateTree, { type CateDropPayload } from './CateTree';
import Skeleton from './Skeleton';
import {
  applyCateDrop,
  buildCateSelectOptions,
  collectKeys,
  filterCates,
  sortCateTree,
} from './treeUtils';

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
  const [sortSaving, setSortSaving] = useState(false);
  const [highlightKey, setHighlightKey] = useState<number | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [form] = Form.useForm();

  const isEditing = isMethod === 'edit';
  const hasSearch = Boolean(search.trim());
  const canDragTree = !hasSearch && list.length > 1;
  const isHideValue = Form.useWatch('isHide', form);
  const typeValue = Form.useWatch('type', form) ?? 'cate';

  const filteredList = useMemo(() => filterCates(list, search), [list, search]);

  const getCateList = useCallback(async () => {
    try {
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getCateListAPI();
      setList(sortCateTree(data.result ?? []));
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

  useEffect(
    () => () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    },
    [],
  );

  const flashHighlight = useCallback((id: number) => {
    setHighlightKey(id);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightKey(null), 2000);
  }, []);

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

  const persistSort = useCallback(
    async (parentLevel: number, ids: number[], nextList: Cate[], movedId: number) => {
      setList(nextList);
      setSortSaving(true);
      try {
        await sortCateDataAPI({ level: parentLevel, ids });
        flashHighlight(movedId);
      } catch (error) {
        console.error(error);
        message.error('排序保存失败，已恢复');
        await getCateList();
      } finally {
        setSortSaving(false);
      }
    },
    [flashHighlight, getCateList],
  );

  const persistMove = useCallback(
    async (payload: {
      dragItem: Cate;
      newLevel: number;
      oldParentLevel: number;
      oldSiblingIds: number[];
      newParentLevel: number;
      newSiblingIds: number[];
      nextList: Cate[];
      expandParentId?: number;
    }) => {
      const sorted = sortCateTree(payload.nextList);
      setList(sorted);
      setSortSaving(true);
      try {
        await editCateDataAPI({ ...payload.dragItem, level: payload.newLevel });
        if (payload.oldSiblingIds.length) {
          await sortCateDataAPI({
            level: payload.oldParentLevel,
            ids: payload.oldSiblingIds,
          });
        }
        await sortCateDataAPI({
          level: payload.newParentLevel,
          ids: payload.newSiblingIds,
        });
        if (payload.expandParentId) {
          setExpandedKeys((keys) => [...new Set([...keys, payload.expandParentId!])]);
        }
        if (payload.dragItem.id) flashHighlight(payload.dragItem.id);
        message.success('分类已移动');
      } catch (error) {
        console.error(error);
        message.error('移动失败，已恢复');
        await getCateList();
      } finally {
        setSortSaving(false);
      }
    },
    [flashHighlight, getCateList],
  );

  const handleCateDrop = useCallback(
    ({ dragId, targetId, zone }: CateDropPayload) => {
      if (hasSearch || sortSaving) return;

      const result = applyCateDrop(list, dragId, targetId, zone);
      if (!result) {
        message.warning('不能移动到该位置');
        return;
      }

      if (result.kind === 'sort') {
        void persistSort(result.parentLevel, result.ids, result.nextList, result.movedId);
        return;
      }

      void persistMove({
        dragItem: result.dragItem,
        newLevel: result.newLevel,
        oldParentLevel: result.oldParentLevel,
        oldSiblingIds: result.oldSiblingIds,
        newParentLevel: result.newParentLevel,
        newSiblingIds: result.newSiblingIds,
        nextList: result.nextList,
        expandParentId: result.expandParentId,
      });
    },
    [hasSearch, list, persistMove, persistSort, sortSaving],
  );

  const renderTreeActions = useCallback(
    (item: Cate) => (
      <>
        <Tooltip title="添加子分类">
          <button
            type="button"
            onClick={() => addCateData(item.id!)}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-white/10 dark:hover:text-primary"
            aria-label={`在 ${item.name} 下新增子分类`}
          >
            <FiPlus size={15} />
          </button>
        </Tooltip>
        <Tooltip title="编辑">
          <button
            type="button"
            onClick={() => void editCateData(item.id!)}
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
              className="flex size-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 cursor-pointer"
              aria-label={`删除 ${item.name}`}
            >
              <FiTrash2 size={15} />
            </button>
          </Tooltip>
        </Popconfirm>
      </>
    ),
    [addCateData, delCateData, editCateData],
  );

  const renderTreeExtra = useCallback(
    (item: Cate) =>
      item.isHide ? (
        <FiEyeOff
          size={12}
          className="shrink-0 text-rose-400/80 dark:text-rose-400/70"
          aria-label="前台隐藏"
        />
      ) : null,
    [],
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

  const cascaderOptions = useMemo(
    () => buildCateSelectOptions(list, true, isEditing ? selectedTreeId : undefined),
    [list, isEditing, selectedTreeId],
  );

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

      <div className="flex min-h-0 flex-1 flex-col">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <header className="flex shrink-0 flex-col gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-strokedark sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <div className="hidden items-center gap-3 text-[11px] text-slate-400 sm:flex dark:text-slate-500 sm:ml-2">
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-sm bg-primary/40" />
                  分类
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-sm bg-sky-400/60" />
                  页面
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

          <Spin
            spinning={loading}
            className="flex min-h-0 flex-1 flex-col [&_.ant-spin-container]:flex [&_.ant-spin-container]:min-h-0 [&_.ant-spin-container]:flex-1 [&_.ant-spin-container]:flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {hasSearch && list.length > 0 ? (
                <p className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
                  搜索模式下仅可浏览，清空搜索后可拖拽排序与移动层级
                </p>
              ) : null}
              {list.length > 0 ? (
                filteredList.length > 0 ? (
                  <CateTree
                    items={filteredList}
                    expandedKeys={expandedKeys}
                    onExpandedKeysChange={setExpandedKeys}
                    selectedId={selectedTreeId}
                    highlightId={highlightKey}
                    draggable={canDragTree}
                    saving={sortSaving}
                    onDrop={handleCateDrop}
                    renderActions={renderTreeActions}
                    renderExtra={renderTreeExtra}
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
                    分类用于组织文章归档，页面用于站内菜单，导航用于外链跳转
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
                  : '支持多级分类、页面与导航模式，用于组织文章与站点菜单'}
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
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'cate', label: '分类', desc: '归档文章', icon: FiFolder },
                { value: 'page', label: '页面', desc: '站内页面', icon: FiFile },
                { value: 'nav', label: '导航', desc: '外链跳转', icon: FiLink },
              ].map((opt) => {
                const active = typeValue === opt.value;
                const activeClass =
                  opt.value === 'nav'
                    ? 'border-amber-300/80 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                    : opt.value === 'page'
                      ? 'border-sky-300/80 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300'
                      : 'border-primary/30 bg-primary/5 text-primary dark:bg-primary/10';
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => form.setFieldValue('type', opt.value)}
                    className={`flex cursor-pointer flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors ${active
                      ? activeClass
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

          {(typeValue === 'page' || typeValue === 'nav') && (
            <Form.Item
              label={typeValue === 'page' ? '页面路径' : '跳转链接'}
              name="url"
              rules={[
                {
                  required: true,
                  message: typeValue === 'page' ? '页面路径不能为空' : '跳转链接不能为空',
                },
              ]}
              className="mb-4!"
            >
              <Input
                placeholder={typeValue === 'page' ? '/my' : 'https://...'}
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
