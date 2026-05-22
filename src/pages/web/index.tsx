import { useCallback, useEffect, useRef, useState } from 'react';

import { Button, Card, Empty, Form, Input, Popconfirm, Select, Spin, Modal, message } from 'antd';
import { HolderOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';

import {
  getLinkListAPI,
  addLinkDataAPI,
  editLinkDataAPI,
  delLinkDataAPI,
  getWebTypeListAPI,
  sortLinkDataAPI,
} from '@/api/web';
import Title from '@/components/Title';
import { WebType, Web, WebFilterQueryParams } from '@/types/app/web';
import { RuleObject } from 'antd/es/form';

import GroupSvg from './assets/svg/group.svg';
import Skeleton from './Skeleton';

function groupLinksByType(rows: Web[]): Record<string, Web[]> {
  const sorted = [...rows].sort((a, b) => {
    const typeOrder = (a.type?.order ?? 0) - (b.type?.order ?? 0);
    if (typeOrder !== 0) return typeOrder;
    return (a.order ?? 0) - (b.order ?? 0);
  });
  return sorted.reduce(
    (acc, item) => {
      const groupName = item.type.name;
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(item);
      return acc;
    },
    {} as Record<string, Web[]>,
  );
}

function reorderGroup(items: Web[], from: number, to: number): Web[] {
  const next = [...items];
  const [removed] = next.splice(from, 1);
  next.splice(to, 0, removed);
  return next;
}

function updateListTempByType(listTemp: Web[], typeId: number, reordered: Web[]): Web[] {
  const withOrder = reordered.map((item, index) => ({ ...item, order: index + 1 }));
  const others = listTemp.filter((item) => item.typeId !== typeId);
  return [...others, ...withOrder];
}

type DropPosition = 'before' | 'after';

type DropIndicator = { groupKey: string; index: number; position: DropPosition };

function getDropPositionFromPoint(
  clientX: number,
  clientY: number,
  cardEl: HTMLElement,
): DropPosition {
  const { left, top, width, height } = cardEl.getBoundingClientRect();
  const rx = (clientX - left) / Math.max(width, 1);
  const ry = (clientY - top) / Math.max(height, 1);
  return rx + ry < 1 ? 'before' : 'after';
}

function getInsertIndex(from: number, overIndex: number, position: DropPosition): number {
  let insertAt = position === 'before' ? overIndex : overIndex + 1;
  if (from < insertAt) insertAt -= 1;
  return insertAt;
}

export default () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const isFirstLoadRef = useRef<boolean>(true);

  const [form] = Form.useForm();

  const [list, setList] = useState<{ [key: string]: Web[] }>({});
  const [listTemp, setListTemp] = useState<Web[]>([]);
  const [typeList, setTypeList] = useState<WebType[]>([]);
  const [search, setSearch] = useState<string>('');
  const [link, setLink] = useState<Web>({} as Web);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [sortSaving, setSortSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [draggingItem, setDraggingItem] = useState<Web | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const dragRowIndexRef = useRef<number | null>(null);
  const dragGroupKeyRef = useRef<string | null>(null);
  const dropIndicatorRef = useRef<DropIndicator | null>(null);
  const pointerCleanupRef = useRef<(() => void) | null>(null);
  const gridWrapRef = useRef<HTMLDivElement>(null);

  // 区分新增或编辑
  const [isMethod, setIsMethod] = useState<'create' | 'edit'>('create');

  const canDragSort = !search.trim();

  const getLinkList = useCallback(async () => {
    try {
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const params: WebFilterQueryParams = { status: 1, pageNum: 1, pageSize: 9999 };
      const { data } = await getLinkListAPI(params);
      const rows = data.result ?? [];
      setListTemp(rows);
      setList(groupLinksByType(rows));
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, []);

  // 获取网站类型列表
  const getWebTypeList = async () => {
    const { data } = await getWebTypeListAPI();
    setTypeList(data);
  };

  useEffect(() => {
    void getLinkList();
    void getWebTypeList();
  }, [getLinkList]);

  useEffect(() => {
    const filteredList = listTemp.filter(
      (item) => item.title.includes(search) || item.description.includes(search),
    );
    setList(groupLinksByType(filteredList));
  }, [search, listTemp]);

  const clearDragState = useCallback(() => {
    pointerCleanupRef.current?.();
    pointerCleanupRef.current = null;
    dragRowIndexRef.current = null;
    dragGroupKeyRef.current = null;
    dropIndicatorRef.current = null;
    setDraggingId(null);
    setDraggingItem(null);
    setPointerPos(null);
    setDropIndicator(null);
  }, []);

  useEffect(() => {
    dropIndicatorRef.current = dropIndicator;
  }, [dropIndicator]);

  useEffect(() => {
    if (draggingId == null) return;
    document.body.classList.add('cursor-grabbing');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearDragState();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('cursor-grabbing');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [clearDragState, draggingId]);

  useEffect(() => () => pointerCleanupRef.current?.(), []);

  const persistSort = useCallback(
    async (typeId: number, reordered: Web[]) => {
      const ids = reordered.map((item) => item.id!);
      setSortSaving(true);
      try {
        await sortLinkDataAPI({ typeId, ids });
        setListTemp((prev) => updateListTempByType(prev, typeId, reordered));
        message.success('排序已保存');
      } catch (error) {
        console.error(error);
        await getLinkList();
      } finally {
        setSortSaving(false);
        clearDragState();
      }
    },
    [clearDragState, getLinkList],
  );

  const handleCardDrop = useCallback(
    (groupKey: string, groupItems: Web[], overIndex: number, position: DropPosition) => {
      const from = dragRowIndexRef.current;
      if (from == null || !canDragSort || dragGroupKeyRef.current !== groupKey) return;
      const to = getInsertIndex(from, overIndex, position);
      if (to === from) {
        clearDragState();
        return;
      }
      const typeId = groupItems[0]?.typeId;
      if (!typeId) return;
      const reordered = reorderGroup(groupItems, from, to);
      setList((prev) => ({ ...prev, [groupKey]: reordered }));
      setListTemp((prev) => updateListTempByType(prev, typeId, reordered));
      void persistSort(typeId, reordered);
    },
    [canDragSort, clearDragState, persistSort],
  );

  const updateDropTarget = useCallback((clientX: number, clientY: number) => {
    setPointerPos({ x: clientX, y: clientY });
    const el = document.elementFromPoint(clientX, clientY);
    const card = el?.closest('[data-web-card]') as HTMLElement | null;
    if (!card || !gridWrapRef.current?.contains(card)) {
      setDropIndicator(null);
      return;
    }
    const groupKey = card.dataset.groupKey;
    const overIndex = Number(card.dataset.cardIndex);
    if (
      !groupKey ||
      Number.isNaN(overIndex) ||
      groupKey !== dragGroupKeyRef.current ||
      overIndex === dragRowIndexRef.current
    ) {
      setDropIndicator(null);
      return;
    }
    const position = getDropPositionFromPoint(clientX, clientY, card);
    const next = { groupKey, index: overIndex, position };
    setDropIndicator((prev) =>
      prev?.groupKey === next.groupKey &&
        prev.index === next.index &&
        prev.position === next.position
        ? prev
        : next,
    );
  }, []);

  const startPointerDrag = useCallback(
    (
      e: React.PointerEvent,
      groupKey: string,
      index: number,
      item: Web,
    ) => {
      if (!canDragSort || sortSaving || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const handle = e.currentTarget as HTMLElement;
      handle.setPointerCapture(e.pointerId);

      dragRowIndexRef.current = index;
      dragGroupKeyRef.current = groupKey;
      setDraggingId(item.id ?? null);
      setDraggingItem(item);
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
        const gKey = dragGroupKeyRef.current;
        if (indicator != null && from != null && gKey) {
          const groupItems = list[gKey] ?? [];
          const to = getInsertIndex(from, indicator.index, indicator.position);
          if (to !== from) {
            setDraggingId(null);
            setDraggingItem(null);
            setPointerPos(null);
            setDropIndicator(null);
            handleCardDrop(gKey, groupItems, indicator.index, indicator.position);
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
    [canDragSort, clearDragState, handleCardDrop, list, sortSaving, updateDropTarget],
  );

  const getCardDragClassName = useCallback(
    (groupKey: string, index: number) => {
      const classes: string[] = [];
      if (draggingId != null && dragRowIndexRef.current === index && dragGroupKeyRef.current === groupKey) {
        classes.push('opacity-40 scale-[0.98] ring-2 ring-dashed ring-primary/40');
      }
      if (
        dropIndicator?.groupKey === groupKey &&
        dropIndicator.index === index &&
        dragRowIndexRef.current !== index
      ) {
        if (dropIndicator.position === 'before') {
          classes.push('-translate-y-1 shadow-[0_-4px_0_0] shadow-primary ring-2 ring-primary/50');
        } else {
          classes.push('translate-y-1 shadow-[0_4px_0_0] shadow-primary ring-2 ring-primary/50');
        }
      }
      return classes.join(' ');
    },
    [draggingId, dropIndicator],
  );

  const deleteLinkData = async (id: number) => {
    try {
      setLoading(true);

      await delLinkDataAPI(id);
      getLinkList();
      message.success('🎉 删除网站成功');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const editLinkData = async (record: Web) => {
    try {
      setEditLoading(true);
      setIsMethod('edit');
      setLink(record);
      form.setFieldsValue(record);
      setModalVisible(true);
      setEditLoading(false);
    } catch (error) {
      console.error(error);
      setEditLoading(false);
    }
  };

  // 做一些初始化的事情
  const reset = () => {
    form.resetFields(); // 重置表单字段
    setLink({} as Web);
    setIsMethod('create');
    setModalVisible(false);
  };

  // 打开新增网站弹框
  const openAddModal = () => {
    reset();
    setIsMethod('create');
    setModalVisible(true);
  };

  // 校验网站链接
  const validateURL = (_: RuleObject, value: string) => {
    return !value || /^(https?:\/\/)/.test(value) ? Promise.resolve() : Promise.reject(new Error('请输入有效的链接'));
  };

  const onSubmit = async () => {
    try {
      setBtnLoading(true);

      form.validateFields().then(async (values: Web) => {
        if (isMethod === 'edit') {
          await editLinkDataAPI({ ...link, ...values });
          message.success('🎉 编辑网站成功');
        } else {
          await addLinkDataAPI({ ...values, createTime: new Date().getTime() });
          message.success('🎉 新增网站成功');
        }

        await getLinkList();
        reset();
      });

      setBtnLoading(false);
    } catch (error) {
      console.error(error);
      setBtnLoading(false);
    }
  };

  const { Option } = Select;

  const toHref = (url: string) => {
    window.open(url, '_blank');
  };


  // 初始加载时显示骨架屏
  if (initialLoading) {
    return <Skeleton />;
  }

  return (
    <div>
      <Title value="网站管理">
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          新增网站
        </Button>
      </Title>

      <Card className="rounded-xl! border-stroke min-h-[calc(100vh-160px)] [&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5!">
        <div className="flex flex-col items-center gap-2 w-full mt-1 mb-2 sm:flex-row sm:justify-center">
          <Input
            placeholder="请输入网站名称或描述信息进行查询"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[300px]"
            allowClear
          />
          {canDragSort && listTemp.length > 1 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {sortSaving
                ? '正在保存排序…'
                : draggingId != null
                  ? '松手放置 · Esc 取消'
                  : '拖动手柄，在同类型内调整顺序'}
            </span>
          )}
        </div>

        <Spin spinning={loading}>
          <div
            ref={gridWrapRef}
            className={`relative space-y-10 ${draggingId != null ? 'select-none' : ''}`}
          >
            {draggingItem && pointerPos ? (
              <div
                className="pointer-events-none fixed z-1000 flex max-w-[min(260px,calc(100vw-32px))] items-center gap-2.5 rounded-xl border border-primary/25 bg-white/95 px-3 py-2 shadow-lg shadow-primary/10 backdrop-blur-sm dark:border-primary/30 dark:bg-boxdark/95"
                style={{
                  left: Math.min(pointerPos.x + 14, window.innerWidth - 280),
                  top: pointerPos.y - 28,
                }}
              >
                <img
                  src={draggingItem.image}
                  alt=""
                  className="size-10 shrink-0 rounded-full border border-slate-200/80 object-cover dark:border-strokedark"
                  draggable={false}
                />
                <span className="line-clamp-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {draggingItem.title}
                </span>
              </div>
            ) : null}
            {Object.keys(list).map((groupKey) => {
              const groupItems = list[groupKey] ?? [];
              return (
                <div key={groupKey} className="space-y-6">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 dark:bg-boxdark/60 backdrop-blur-md border border-white/20 dark:border-strokedark/30 shadow-xs shadow-primary/5">
                    <img src={GroupSvg} alt="分组图标" className="w-5 h-5 opacity-80" />
                    <span className="text-base font-semibold text-gray-800 dark:text-gray-200">{groupKey}</span>
                  </div>

                  {groupItems.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-7">
                      {groupItems.map((item, index2) => (
                        <div
                          key={item.id}
                          data-web-card
                          data-group-key={groupKey}
                          data-card-index={index2}
                          className={`group relative flex flex-col items-center p-6 pb-0 rounded-3xl bg-linear-to-br from-white/80 via-white/70 to-white/60 dark:from-boxdark/80 dark:via-boxdark/70 dark:to-boxdark/60 backdrop-blur-xl border border-white/40 dark:border-strokedark/50 shadow-lg transition-all duration-200 overflow-hidden hover:shadow-2xl hover:shadow-primary/20 ${canDragSort && draggingId == null ? '' : 'hover:-translate-y-2'
                            } ${canDragSort ? '' : 'cursor-pointer'} ${getCardDragClassName(groupKey, index2)}`}
                        >
                          {canDragSort && groupItems.length > 1 && (
                            <button
                              type="button"
                              onPointerDown={(e) => startPointerDrag(e, groupKey, index2, item)}
                              disabled={sortSaving}
                              className={`absolute left-3 top-3 z-20 inline-flex touch-none cursor-grab items-center justify-center rounded-lg bg-white/90 p-1.5 text-slate-500 shadow-sm transition-colors hover:bg-white hover:text-primary active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40 dark:bg-boxdark/90 dark:hover:bg-boxdark ${draggingId === item.id ? 'cursor-grabbing text-primary' : ''
                                }`}
                              aria-label="拖拽排序"
                            >
                              <HolderOutlined />
                            </button>
                          )}
                          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-blue-500/5 dark:from-primary/10 dark:to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                          <div className="absolute top-0 left-0 right-0 h-24 bg-linear-to-br from-primary/30 via-primary/15 to-transparent dark:from-primary/40 dark:via-primary/20 rounded-t-3xl"></div>

                          <div className="absolute top-4 right-4 w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute bottom-4 left-4 w-16 h-16 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                          <div className="relative z-10 flex items-center justify-center w-24 h-24 mt-3 mb-5 rounded-full bg-linear-to-br from-white to-gray-50 dark:from-boxdark-2 dark:to-boxdark shadow-2xl ring-4 ring-white/60 dark:ring-strokedark/40 ring-offset-2 ring-offset-white/50 dark:ring-offset-boxdark/50 transition-transform duration-300 group-hover:scale-110 group-hover:ring-primary/30 group-hover:shadow-primary/30">
                            <div className="absolute inset-0 rounded-full bg-linear-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <img
                              src={item.image}
                              alt={item.title}
                              className="relative z-10 w-[88%] h-[88%] rounded-full object-cover transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
                            />
                            <div className="absolute inset-0 rounded-full border-2 border-primary/0 group-hover:border-primary/30 transition-all duration-300"></div>
                          </div>

                          <h3 className="relative z-10 mb-2 text-lg font-bold text-gray-900 dark:text-white text-center transition-all duration-300 group-hover:text-primary group-hover:scale-105 line-clamp-1">
                            {item.title}
                          </h3>

                          <p className="relative z-10 mb-4 text-sm text-gray-600 dark:text-gray-300 text-center line-clamp-2 leading-relaxed min-h-10 px-2 transition-colors duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-200">
                            {item.description}
                          </p>

                          <div className="relative z-10 mb-4 px-4 py-2 rounded-full bg-linear-to-r from-primary/15 via-primary/10 to-primary/5 dark:from-primary/25 dark:via-primary/20 dark:to-primary/15 text-primary dark:text-primary/90 text-xs font-semibold transition-all duration-300 group-hover:bg-linear-to-r group-hover:from-primary/25 group-hover:via-primary/20 group-hover:to-primary/15 dark:group-hover:from-primary/35 dark:group-hover:via-primary/30 dark:group-hover:to-primary/25 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-primary/20 border border-primary/20 dark:border-primary/30">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                              {item.type.name}
                            </span>
                          </div>

                          <div className="absolute z-50 inset-x-0 bottom-0 flex flex-col gap-3 py-5 px-3 bg-linear-to-t from-white/98 via-white/95 to-white/90 dark:from-boxdark/98 dark:via-boxdark/95 dark:to-boxdark/90 backdrop-blur-xl border-t border-gray-200/60 dark:border-strokedark/60 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_24px_rgba(0,0,0,0.3)] transform translate-y-full group-hover:translate-y-0 transition-all duration-300 ease-out">
                            <div className="absolute top-0 left-6 right-6 h-[2px] bg-linear-to-r from-transparent via-primary/40 to-transparent dark:via-primary/50"></div>

                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  editLinkData(item);
                                }}
                                className="flex-1 px-3 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-emerald-500 via-emerald-500 to-emerald-600 hover:from-emerald-600 hover:via-emerald-600 hover:to-emerald-700 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-emerald-500/40 active:scale-95 transform flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                修改
                              </button>

                              <Popconfirm
                                title="删除确认"
                                description="确定要删除这个网站吗？此操作不可恢复。"
                                okText="确定"
                                cancelText="取消"
                                okButtonProps={{ danger: true }}
                                onConfirm={(e) => {
                                  e?.stopPropagation();
                                  deleteLinkData(item.id!);
                                }}
                              >
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 px-3 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-red-500 via-red-500 to-red-600 hover:from-red-600 hover:via-red-600 hover:to-red-700 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-500/40 active:scale-95 transform flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  删除
                                </button>
                              </Popconfirm>
                            </div>

                            {/* 第二行：前往该网站按钮 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toHref(item.url);
                              }}
                              className="w-full px-4 py-3 text-sm font-semibold text-white bg-linear-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/50 active:scale-95 transform flex items-center justify-center gap-2 group/btn cursor-pointer"
                            >
                              <svg className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                              <span>前往该网站</span>
                              <svg className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="暂无数据" className="my-7" />
                  )}
                </div>
              );
            })}
          </div>
        </Spin>
      </Card>

      <Modal
        title={isMethod === 'edit' ? '编辑网站' : '新增网站'}
        open={modalVisible}
        onCancel={reset}
        width={600}
        footer={null}
      >
        <Spin spinning={editLoading}>
          <Form form={form} layout="vertical" size="large" initialValues={link} onFinish={onSubmit}>
            <Form.Item label="网站标题" name="title" rules={[{ required: true, message: '网站标题不能为空' }]}>
              <Input placeholder="ThriveX" />
            </Form.Item>

            <Form.Item label="网站描述" name="description" rules={[{ required: true, message: '网站描述不能为空' }]}>
              <Input placeholder="记录前端、Python、Java点点滴滴" />
            </Form.Item>

            <Form.Item label="站长邮箱" name="email">
              <Input placeholder="liuyuyang1024@yeah.net" />
            </Form.Item>

            <Form.Item label="网站图标" name="image" rules={[{ required: true, message: '网站图标不能为空' }]}>
              <Input placeholder="https://liuyuyang.net/logo.png" />
            </Form.Item>

            <Form.Item label="网站链接" name="url" rules={[{ required: true, message: '网站链接不能为空' }, { validator: validateURL }]}>
              <Input placeholder="https://liuyuyang.net/" />
            </Form.Item>

            <Form.Item label="订阅地址" name="rss" rules={[{ validator: validateURL }]}>
              <Input placeholder="https://liuyuyang.net/api/rss" />
            </Form.Item>

            <Form.Item name="typeId" label="网站类型" rules={[{ required: true, message: '网站类型不能为空' }]}>
              <Select placeholder="请选择网站类型" allowClear>
                {typeList.map((item) => (
                  <Option key={item.id} value={item.id}>
                    {item.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="顺序" name="order">
              <Input placeholder="请输入网站顺序（值越小越靠前）" />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button type="primary" htmlType="submit" loading={btnLoading} className="w-full">
                确定
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal >
    </div >
  );
};
