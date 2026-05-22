import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Form,
  Image,
  Input,
  Popconfirm,
  Spin,
  Table,
  Tooltip,
  message,
} from 'antd';
import { HolderOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  FiAlignLeft,
  FiChevronDown,
  FiChevronUp,
  FiEdit2,
  FiExternalLink,
  FiHash,
  FiImage,
  FiLayers,
  FiLink,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from 'react-icons/fi';

import {
  addSwiperDataAPI,
  delSwiperDataAPI,
  editSwiperDataAPI,
  getSwiperDataAPI,
  getSwiperListAPI,
  sortSwiperDataAPI,
} from '@/api/swiper';
import Material from '@/components/Material';
import Title from '@/components/Title';
import type { Swiper } from '@/types/app/swiper';

import Skeleton from './Skeleton';

const EMPTY_SWIPER: Swiper = {
  title: '',
  description: '',
  url: '',
  image: '',
};

const imageCellClass =
  '[&_.ant-image]:block! [&_.ant-image]:size-full! [&_.ant-image-img]:size-full! [&_.ant-image-img]:object-cover! [&_.ant-image-mask]:size-full!';

type DropPosition = 'before' | 'after';

type DropIndicator = { index: number; position: DropPosition };

function getDropPositionFromPoint(clientY: number, rowEl: HTMLElement): DropPosition {
  const { top, height } = rowEl.getBoundingClientRect();
  return clientY < top + height / 2 ? 'before' : 'after';
}

function getInsertIndex(from: number, overIndex: number, position: DropPosition): number {
  let insertAt = position === 'before' ? overIndex : overIndex + 1;
  if (from < insertAt) insertAt -= 1;
  return insertAt;
}

const sortBtnClass =
  'flex size-5 cursor-pointer items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white/5';

export default function SwiperPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const isFirstLoadRef = useRef(true);

  const [form] = Form.useForm();
  const [swiper, setSwiper] = useState<Swiper>(EMPTY_SWIPER);
  const [swiperList, setSwiperList] = useState<Swiper[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 8 });
  const [sortSaving, setSortSaving] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [draggingRecord, setDraggingRecord] = useState<Swiper | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const dragRowIndexRef = useRef<number | null>(null);
  const dropIndicatorRef = useRef<DropIndicator | null>(null);
  const pointerCleanupRef = useRef<(() => void) | null>(null);
  const tableWrapRef = useRef<HTMLDivElement>(null);

  const isEditing = Boolean(swiper.id);
  const imagePreview = Form.useWatch('image', form) as string | undefined;
  const canDragSort = !search.trim();

  const filteredList = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return swiperList;
    return swiperList.filter(
      (item) =>
        item.title?.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword),
    );
  }, [swiperList, search]);

  const fetchSwiperList = useCallback(async () => {
    try {
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }
      const { data } = await getSwiperListAPI();
      const rows = [...(data.result ?? [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0) || (b.id ?? 0) - (a.id ?? 0),
      );
      setSwiperList(rows);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSwiperList();
  }, [fetchSwiperList]);

  const resetFormState = useCallback(() => {
    form.resetFields();
    setSwiper(EMPTY_SWIPER);
  }, [form]);

  const editSwiperData = useCallback(
    async (record: Swiper) => {
      try {
        setEditLoading(true);
        const { data } = await getSwiperDataAPI(record.id!);
        const normalized: Swiper = { ...EMPTY_SWIPER, ...data };
        setSwiper(normalized);
        form.setFieldsValue(normalized);
      } catch (error) {
        console.error(error);
      } finally {
        setEditLoading(false);
      }
    },
    [form],
  );

  const reorderList = useCallback((list: Swiper[], from: number, to: number) => {
    const next = [...list];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    return next;
  }, []);

  const clearDragState = useCallback(() => {
    pointerCleanupRef.current?.();
    pointerCleanupRef.current = null;
    dragRowIndexRef.current = null;
    dropIndicatorRef.current = null;
    setDraggingIndex(null);
    setDraggingRecord(null);
    setPointerPos(null);
    setDropIndicator(null);
  }, []);

  useEffect(() => {
    dropIndicatorRef.current = dropIndicator;
  }, [dropIndicator]);

  useEffect(() => {
    if (draggingIndex == null) return;
    document.body.classList.add('cursor-grabbing');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearDragState();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('cursor-grabbing');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [clearDragState, draggingIndex]);

  useEffect(() => () => pointerCleanupRef.current?.(), []);

  const persistSort = useCallback(
    async (ordered: Swiper[]) => {
      const ids = ordered.map((item) => item.id!);
      setSortSaving(true);
      try {
        await sortSwiperDataAPI(ids);
        message.success('排序已保存');
      } catch (error) {
        console.error(error);
        await fetchSwiperList();
      } finally {
        setSortSaving(false);
        clearDragState();
      }
    },
    [clearDragState, fetchSwiperList],
  );

  const handleRowDrop = useCallback(
    (overIndex: number, position: DropPosition) => {
      const from = dragRowIndexRef.current;
      if (from == null || !canDragSort) return;
      const to = getInsertIndex(from, overIndex, position);
      if (to === from) {
        clearDragState();
        return;
      }
      const next = reorderList(swiperList, from, to);
      setSwiperList(next);
      void persistSort(next);
    },
    [canDragSort, clearDragState, persistSort, reorderList, swiperList],
  );

  const moveStep = useCallback(
    (index: number, delta: -1 | 1) => {
      if (!canDragSort || sortSaving) return;
      const to = index + delta;
      if (to < 0 || to >= swiperList.length) return;
      const next = reorderList(swiperList, index, to);
      setSwiperList(next);
      void persistSort(next);
    },
    [canDragSort, persistSort, reorderList, sortSaving, swiperList],
  );

  const updateDropTarget = useCallback((clientX: number, clientY: number) => {
    setPointerPos({ x: clientX, y: clientY });
    const el = document.elementFromPoint(clientX, clientY);
    const row = el?.closest('tr[data-row-index]') as HTMLElement | null;
    if (!row || !tableWrapRef.current?.contains(row)) {
      setDropIndicator(null);
      return;
    }
    const overIndex = Number(row.dataset.rowIndex);
    if (Number.isNaN(overIndex) || overIndex === dragRowIndexRef.current) {
      setDropIndicator(null);
      return;
    }
    const position = getDropPositionFromPoint(clientY, row);
    setDropIndicator((prev) =>
      prev?.index === overIndex && prev.position === position
        ? prev
        : { index: overIndex, position },
    );
  }, []);

  const startPointerDrag = useCallback(
    (e: React.PointerEvent, index: number, record: Swiper) => {
      if (!canDragSort || sortSaving || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const handle = e.currentTarget as HTMLElement;
      handle.setPointerCapture(e.pointerId);

      dragRowIndexRef.current = index;
      setDraggingIndex(index);
      setDraggingRecord(record);
      setDropIndicator(null);
      setPointerPos({ x: e.clientX, y: e.clientY });

      const onPointerMove = (ev: PointerEvent) => {
        if (ev.pointerId !== e.pointerId) return;
        updateDropTarget(ev.clientX, ev.clientY);
      };

      const finish = (ev: PointerEvent) => {
        if (ev.pointerId !== e.pointerId) return;
        cleanup();
        try {
          handle.releasePointerCapture(ev.pointerId);
        } catch {
          /* already released */
        }
        const indicator = dropIndicatorRef.current;
        const from = dragRowIndexRef.current;
        if (indicator != null && from != null) {
          const to = getInsertIndex(from, indicator.index, indicator.position);
          if (to !== from) {
            setDraggingIndex(null);
            setDraggingRecord(null);
            setPointerPos(null);
            setDropIndicator(null);
            handleRowDrop(indicator.index, indicator.position);
            return;
          }
        }
        clearDragState();
      };

      const cleanup = () => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', finish);
        document.removeEventListener('pointercancel', finish);
        pointerCleanupRef.current = null;
      };

      pointerCleanupRef.current = cleanup;
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', finish);
      document.addEventListener('pointercancel', finish);
    },
    [canDragSort, clearDragState, handleRowDrop, sortSaving, updateDropTarget],
  );

  const getRowDragClassName = useCallback(
    (index: number) => {
      const classes: string[] = [];
      if (draggingIndex === index) {
        classes.push(
          'opacity-40 [&>td]:border-2! [&>td]:border-dashed! [&>td]:border-primary/35! [&>td]:bg-slate-50/50! dark:[&>td]:bg-boxdark-2/50!',
        );
      }
      if (
        dropIndicator?.index === index &&
        draggingIndex !== index &&
        dragRowIndexRef.current !== index
      ) {
        if (dropIndicator.position === 'before') {
          classes.push('[&>td]:border-t-2! [&>td]:border-primary! [&>td]:pt-[calc(0.5rem-1px)]!');
        } else {
          classes.push('[&>td]:border-b-2! [&>td]:border-primary! [&>td]:pb-[calc(0.5rem-1px)]!');
        }
      }
      return classes.length ? classes.join(' ') : undefined;
    },
    [draggingIndex, dropIndicator],
  );

  const deleteSwiperItem = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        await delSwiperDataAPI(id);
        if (swiper.id === id) resetFormState();
        await fetchSwiperList();
        message.success('🎉 删除轮播图成功');
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    },
    [fetchSwiperList, resetFormState, swiper.id],
  );

  const onSubmit = async () => {
    try {
      setSubmitLoading(true);
      const values = await form.validateFields();
      if (swiper.id) {
        await editSwiperDataAPI({ ...swiper, ...values });
        message.success('🎉 编辑轮播图成功');
      } else {
        await addSwiperDataAPI(values);
        message.success('🎉 新增轮播图成功');
      }
      await fetchSwiperList();
      resetFormState();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns: ColumnsType<Swiper> = useMemo(
    () => [
      {
        title: '#',
        key: 'sort',
        width: 72,
        align: 'center',
        render: (_: unknown, record: Swiper, index: number) =>
          canDragSort ? (
            <div className="flex items-center justify-center gap-0.5">
              <div className="flex flex-col gap-px">
                <button
                  type="button"
                  disabled={index === 0 || sortSaving}
                  onClick={() => moveStep(index, -1)}
                  className={sortBtnClass}
                  aria-label={`上移 ${record.title || '轮播'}`}
                >
                  <FiChevronUp size={14} />
                </button>
                <button
                  type="button"
                  disabled={index === swiperList.length - 1 || sortSaving}
                  onClick={() => moveStep(index, 1)}
                  className={sortBtnClass}
                  aria-label={`下移 ${record.title || '轮播'}`}
                >
                  <FiChevronDown size={14} />
                </button>
              </div>
              <button
                type="button"
                onPointerDown={(e) => startPointerDrag(e, index, record)}
                className={`inline-flex cursor-grab touch-none items-center justify-center rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary active:cursor-grabbing dark:hover:bg-white/5 ${draggingIndex === index ? 'cursor-grabbing text-primary' : ''
                  }`}
                aria-label="拖拽排序"
              >
                <HolderOutlined />
              </button>
            </div>
          ) : (
            <span className="font-mono text-xs text-slate-400">{index + 1}</span>
          ),
      },
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 72,
        align: 'center',
        render: (id: number) => (
          <span className="inline-flex items-center gap-0.5 font-mono text-xs text-slate-400 dark:text-slate-500">
            <FiHash size={11} />
            {id}
          </span>
        ),
      },
      {
        title: '封面',
        dataIndex: 'image',
        key: 'image',
        width: 148,
        render: (url: string) =>
          url ? (
            <div
              className={`group/cover relative aspect-21/9 w-[132px] shrink-0 overflow-hidden rounded-xl border border-slate-200/80 dark:border-strokedark ${imageCellClass}`}
            >
              <Image
                src={url}
                alt=""
                className="object-cover transition-transform duration-200 group-hover/cover:scale-[1.02]"
                preview={{ mask: '预览' }}
              />
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <FiImage size={13} />
              无封面
            </span>
          ),
      },
      {
        title: '文案',
        key: 'copy',
        ellipsis: true,
        render: (_: unknown, row: Swiper) => (
          <div className="max-w-md py-0.5">
            <Tooltip title={row.title} placement="topLeft">
              <p className="line-clamp-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                {row.title || '—'}
              </p>
            </Tooltip>
            {row.description ? (
              <Tooltip title={row.description} placement="topLeft">
                <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                  {row.description}
                </p>
              </Tooltip>
            ) : (
              <p className="mt-0.5 text-xs italic text-slate-400 dark:text-slate-500">暂无副标题</p>
            )}
          </div>
        ),
      },
      {
        title: '跳转链接',
        dataIndex: 'url',
        key: 'url',
        width: 200,
        ellipsis: true,
        render: (url: string) =>
          url?.trim() ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 text-sm text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <FiLink size={13} className="shrink-0" />
              <span className="truncate">{url}</span>
              <FiExternalLink size={12} className="shrink-0 opacity-60" />
            </a>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500">未设置</span>
          ),
      },
      {
        title: '操作',
        key: 'action',
        align: 'center',
        fixed: 'right',
        width: 100,
        render: (_: unknown, record: Swiper) => (
          <div className="flex items-center justify-center gap-0.5">
            <Tooltip title="编辑">
              <button
                type="button"
                onClick={() => editSwiperData(record)}
                className="flex size-8 items-center justify-center rounded-lg text-slate-400! transition-colors hover:bg-slate-100! hover:text-primary! dark:hover:bg-white/5! dark:hover:text-primary! cursor-pointer"
                aria-label={`编辑 ${record.title}`}
              >
                <FiEdit2 size={16} />
              </button>
            </Tooltip>
            <Popconfirm
              title="删除轮播图"
              description={`确定删除「${record.title || '未命名'}」吗？前台首页将不再展示该条目。`}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => deleteSwiperItem(record.id!)}
            >
              <Tooltip title="删除">
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 cursor-pointer"
                  aria-label={`删除 ${record.title}`}
                >
                  <FiTrash2 size={16} />
                </button>
              </Tooltip>
            </Popconfirm>
          </div>
        ),
      },
    ],
    [
      canDragSort,
      deleteSwiperItem,
      draggingIndex,
      editSwiperData,
      moveStep,
      sortSaving,
      startPointerDrag,
      swiperList.length,
    ],
  );

  if (initialLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="轮播图管理" />

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        {/* 列表区 */}
        <section className="flex min-w-0 flex-1 flex-col rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-strokedark">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">全部轮播图</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-boxdark-2 dark:text-slate-300">
                {filteredList.length}
              </span>
              {canDragSort && swiperList.length > 1 && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {sortSaving
                    ? '正在保存排序…'
                    : draggingIndex != null
                      ? '松手放置 · Esc 取消'
                      : '拖动手柄或使用箭头调整展示顺序'}
                </span>
              )}
            </div>
            <Input
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标题或描述…"
              prefix={<FiSearch className="text-slate-400" />}
              className="w-full max-w-[220px]!"
            />
          </header>

          <div
            ref={tableWrapRef}
            className={`relative min-h-0 flex-1 ${draggingIndex != null ? 'select-none' : ''}`}
          >
            {draggingRecord && pointerPos ? (
              <div
                className="pointer-events-none fixed z-1000 flex max-w-[min(280px,calc(100vw-32px))] items-center gap-2.5 rounded-xl border border-primary/25 bg-white/95 px-3 py-2 shadow-lg shadow-primary/10 backdrop-blur-sm dark:border-primary/30 dark:bg-boxdark/95"
                style={{
                  left: Math.min(pointerPos.x + 14, window.innerWidth - 300),
                  top: pointerPos.y - 28,
                }}
              >
                {draggingRecord.image ? (
                  <img
                    src={draggingRecord.image}
                    alt=""
                    className="size-11 shrink-0 rounded-lg border border-slate-200/80 object-cover dark:border-strokedark"
                    draggable={false}
                  />
                ) : (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-boxdark-2">
                    <FiImage size={18} />
                  </span>
                )}
                <span className="line-clamp-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {draggingRecord.title || '未命名轮播'}
                </span>
              </div>
            ) : null}
            <Table
              rowKey="id"
              dataSource={canDragSort ? swiperList : filteredList}
              columns={columns}
              loading={loading}
              scroll={{ x: 'max-content' }}
              onRow={(_, index) =>
                index == null
                  ? {}
                  : {
                    'data-row-index': index,
                    className: getRowDragClassName(index),
                  }
              }
              pagination={
                canDragSort
                  ? false
                  : {
                    position: ['bottomRight'],
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: filteredList.length,
                    showSizeChanger: false,
                    className: 'px-5! py-3!',
                    showTotal: (totalCount) => {
                      const pageSize = pagination.pageSize;
                      const pageNum = pagination.current;
                      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
                      return (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          第 {pageNum} / {totalPages} 页 · 共 {totalCount} 条
                        </span>
                      );
                    },
                    onChange: (page, pageSize) =>
                      setPagination({ current: page, pageSize: pageSize ?? 8 }),
                  }
              }
              className={`min-h-0 flex-1 [&_.ant-table-tbody>tr]:transition-[opacity,box-shadow] [&_.ant-table-tbody>tr]:duration-150 [&_.ant-table-thead>tr>th]:bg-slate-50! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-slate-500! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! dark:[&_.ant-table-thead>tr>th]:text-slate-400! ${sortSaving ? '[&_.ant-table-tbody]:pointer-events-none [&_.ant-table-tbody]:opacity-60' : ''
                }`}
              locale={{
                emptyText: (
                  <div className="py-14 text-center">
                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2 dark:text-slate-500">
                      <FiLayers size={22} />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {search.trim()
                        ? '没有匹配的轮播，试试其他关键词'
                        : '还没有轮播图，在左侧创建第一条首页展示内容吧'}
                    </p>
                  </div>
                ),
              }}
            />
          </div>
        </section>

        {/* 表单区 */}
        <aside className="w-full shrink-0 lg:w-[360px] xl:w-[380px]">
          <Spin spinning={editLoading}>
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
              <header className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-strokedark">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                  <FiLayers size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    {isEditing ? '编辑轮播' : '新建轮播'}
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {isEditing
                      ? '修改后保存，右侧列表与前台首页轮播同步更新'
                      : '配置首页轮播的封面、文案与点击跳转地址'}
                  </p>
                </div>
              </header>

              {isEditing && (
                <div className="mx-5 mt-4 flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 dark:border-primary/30 dark:bg-primary/10">
                  <span className="truncate text-sm font-medium text-primary">
                    {swiper.title || '未命名轮播'}
                  </span>
                  <button
                    type="button"
                    onClick={resetFormState}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-700 dark:hover:bg-boxdark dark:hover:text-slate-200"
                  >
                    <FiX size={14} />
                    取消
                  </button>
                </div>
              )}

              <div className="p-5 pt-2">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onSubmit}
                  size="large"
                  requiredMark="optional"
                  preserve={false}
                >
                  <Form.Item
                    label="主标题"
                    name="title"
                    rules={[{ required: true, message: '轮播图标题不能为空' }]}
                    className="mb-4!"
                  >
                    <Input
                      placeholder="例如：欢迎来到我的博客"
                      allowClear
                      prefix={<FiAlignLeft className="text-slate-400" />}
                    />
                  </Form.Item>

                  <Form.Item label="副标题 / 描述" name="description" className="mb-4!">
                    <Input placeholder="一句话补充说明，可留空" allowClear />
                  </Form.Item>

                  <Form.Item label="跳转链接" name="url" className="mb-4!">
                    <Input
                      placeholder="https://example.com/article/1"
                      allowClear
                      prefix={<FiLink className="text-slate-400" />}
                    />
                  </Form.Item>

                  <Form.Item
                    label="封面图"
                    name="image"
                    rules={[{ required: true, message: '轮播图地址不能为空' }]}
                    className="mb-3!"
                  >
                    <Input
                      placeholder="图片 URL 或从素材库选择"
                      allowClear
                      prefix={<FiImage className="text-slate-400" />}
                      addonAfter={
                        <button
                          type="button"
                          onClick={() => setIsMaterialModalOpen(true)}
                          className="inline-flex cursor-pointer items-center justify-center px-3 py-2 text-slate-500 transition-colors hover:text-primary"
                          aria-label="从素材库选择"
                        >
                          <FiUploadCloud size={18} />
                        </button>
                      }
                      className="customizeAntdInputAddonAfter"
                    />
                  </Form.Item>

                  {imagePreview?.trim() ? (
                    <div className="mb-4 overflow-hidden rounded-xl border border-slate-200/80 dark:border-strokedark">
                      <div className="border-b border-slate-100 px-3 py-1.5 text-xs text-slate-500 dark:border-strokedark dark:text-slate-400">
                        封面预览 · 建议 21:9
                      </div>
                      <div className={`aspect-21/9 w-full bg-slate-50 dark:bg-boxdark-2 ${imageCellClass}`}>
                        <Image
                          src={imagePreview}
                          alt="封面预览"
                          className="object-cover"
                          fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='171' viewBox='0 0 400 171'%3E%3Crect fill='%23f1f5f9' width='400' height='171'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='14' font-family='system-ui'%3E加载失败%3C/text%3E%3C/svg%3E"
                        />
                      </div>
                    </div>
                  ) : null}

                  <Form.Item className="mb-0!">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitLoading}
                      block
                      icon={isEditing ? <FiEdit2 /> : <FiPlus />}
                      className="h-11!"
                    >
                      {isEditing ? '保存修改' : '新增轮播图'}
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            </section>
          </Spin>
        </aside>
      </div>

      <Material
        open={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSelect={(url) => {
          form.setFieldValue('image', url.join('\n'));
          void form.validateFields(['image']);
        }}
      />
    </div>
  );
}
