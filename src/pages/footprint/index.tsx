import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  notification,
  Popconfirm,
  Spin,
  Table,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  FiAlignLeft,
  FiCrosshair,
  FiEdit2,
  FiMapPin,
  FiNavigation,
  FiPlus,
  FiRotateCcw,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
} from 'react-icons/fi';
import { HiOutlineLocationMarker } from 'react-icons/hi';

import {
  addFootprintDataAPI,
  delFootprintDataAPI,
  editFootprintDataAPI,
  getFootprintDataAPI,
  getFootprintListAPI,
} from '@/api/footprint';
import { getEnvConfigDataAPI } from '@/api/config';
import Material from '@/components/Material';
import Title from '@/components/Title';
import RangePicker from '@/components/RangePicker';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';
import type { Footprint, FootprintFilterQueryParams } from '@/types/app/footprint';

import Skeleton from './Skeleton';

const DEFAULT_PAGE_SIZE = 8;

interface FootprintFilterFormValues {
  address?: string;
  createTime?: [Dayjs, Dayjs];
}

export default function FootprintPage() {
  const [loading, setLoading] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState<number | null>(null);
  const [modalSubmitLoading, setModalSubmitLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailRequestSeqRef = useRef(0);

  const [gaodeApKey, setGaodeApKey] = useState('');
  const [footprintList, setFootprintList] = useState<Footprint[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FootprintFilterQueryParams>({
    pageNum: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  const [form] = Form.useForm<Footprint>();
  const [filterForm] = Form.useForm<FootprintFilterFormValues>();

  const isEditing = modalMode === 'edit' && editingId != null;
  const editingTitle = Form.useWatch('title', form);

  const hasActiveFilters = Boolean(
    filter.address?.trim() || filter.startDate || filter.endDate,
  );

  const getEnvConfigData = useCallback(async () => {
    const { data } = await getEnvConfigDataAPI('gaode_coordinate');
    setGaodeApKey((data.value as { key: string }).key);
  }, []);

  const getFootprintList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getFootprintListAPI(filter);

      if (data.result.length === 0 && (filter.pageNum ?? 1) > 1) {
        setFilter((prev) => ({ ...prev, pageNum: (prev.pageNum ?? 1) - 1 }));
        return;
      }

      setFootprintList(data.result);
      setTotal(data.total);
    } catch (error) {
      console.error('获取足迹列表失败：', error);
    } finally {
      setSkeletonLoading(false);
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void getEnvConfigData();
  }, [getEnvConfigData]);

  useEffect(() => {
    void getFootprintList();
  }, [getFootprintList]);

  const closeModal = useCallback(() => {
    detailRequestSeqRef.current += 1;
    setIsModalOpen(false);
    setModalMode('create');
    setEditingId(null);
    setDetailLoading(false);
    form.resetFields();
  }, [form]);

  const openCreate = useCallback(() => {
    detailRequestSeqRef.current += 1;
    setModalMode('create');
    setEditingId(null);
    setIsModalOpen(true);
    setDetailLoading(false);
    form.resetFields();
  }, [form]);

  const openEdit = useCallback(
    (id: number) => {
      detailRequestSeqRef.current += 1;
      setModalMode('edit');
      setEditingId(id);
      setIsModalOpen(true);
      setDetailLoading(true);
      form.resetFields();
    },
    [form],
  );

  useEffect(() => {
    const run = async () => {
      if (!isModalOpen || modalMode !== 'edit' || !editingId) return;
      const reqSeq = (detailRequestSeqRef.current += 1);
      try {
        setDetailLoading(true);
        const { data } = await getFootprintDataAPI(editingId);
        if (reqSeq !== detailRequestSeqRef.current) return;

        const normalized: Partial<Footprint> = {
          ...data,
          images: Array.isArray(data.images)
            ? (data.images as string[]).join('\n')
            : (data.images as string),
          createTime: data.createTime ? dayjs(+data.createTime) : undefined,
        };

        form.setFieldsValue(normalized);
      } catch (error) {
        console.error(error);
      } finally {
        if (reqSeq === detailRequestSeqRef.current) setDetailLoading(false);
      }
    };

    void run();
  }, [editingId, form, isModalOpen, modalMode]);

  const { onValuesChange: onFilterValuesChange } = useDebouncedChange<FootprintFilterFormValues>({
    debouncedKeys: ['address'],
    debounceMs: 400,
    getValues: () => filterForm.getFieldsValue(),
    onApply: (values) => {
      setFilter((prev) => ({
        ...prev,
        pageNum: 1,
        address: values.address,
        startDate: values.createTime?.[0]?.valueOf(),
        endDate: values.createTime?.[1]?.valueOf(),
      }));
    },
  });

  const resetFilters = () => {
    filterForm.resetFields();
    setFilter((prev) => ({
      pageNum: 1,
      pageSize: prev.pageSize ?? DEFAULT_PAGE_SIZE,
    }));
  };

  const delFootprintData = useCallback(
    async (id: number) => {
      try {
        setBtnLoading(id);
        await delFootprintDataAPI(id);
        notification.success({ message: '删除成功' });
        if (editingId === id) closeModal();
        await getFootprintList();
      } catch (error) {
        console.error('删除足迹失败：', error);
      } finally {
        setBtnLoading(null);
      }
    },
    [closeModal, editingId, getFootprintList],
  );

  const onSubmit = useCallback(async () => {
    try {
      setModalSubmitLoading(true);
      const values = (await form.validateFields()) as Footprint;

      const payload: Footprint = {
        ...(values as Footprint),
        createTime: (values.createTime as Dayjs | undefined)?.valueOf?.() ?? values.createTime,
        images: values.images
          ? (values.images as string).split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      if (modalMode === 'edit') {
        if (!editingId) throw new Error('缺少 editingId');
        await editFootprintDataAPI({ ...payload, id: editingId } as Footprint);
        message.success('修改足迹成功');
      } else {
        await addFootprintDataAPI(payload);
        message.success('新增足迹成功');
      }

      await getFootprintList();
      closeModal();
    } catch (error) {
      console.error(error);
    } finally {
      setModalSubmitLoading(false);
    }
  }, [closeModal, editingId, form, getFootprintList, modalMode]);

  const getGeocode = useCallback(async () => {
    try {
      const address = form.getFieldValue('address');
      if (!address) {
        message.warning('请先输入地址');
        return;
      }

      setSearchLoading(true);
      const { data } = await axios.get('https://restapi.amap.com/v3/geocode/geo', {
        params: {
          address,
          key: gaodeApKey,
        },
      });

      if (data?.infocode === '10001') {
        message.error('请确保高德 API 密钥正确');
        return;
      }

      if (data.geocodes.length > 0) {
        const location = data.geocodes[0].location;
        form.setFieldValue('position', location);
        void form.validateFields(['position']);
        message.success('已自动填入坐标');
        return location;
      }

      message.warning('未找到该地址的经纬度');
    } catch (error) {
      console.error(error);
    } finally {
      setSearchLoading(false);
    }
  }, [form, gaodeApKey]);

  const columns: ColumnsType<Footprint> = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        align: 'center',
        width: 80,
        render: (id: number) => (
          <span className="font-mono text-xs text-slate-400 dark:text-slate-500">#{id}</span>
        ),
      },
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        width: 180,
        render: (text: string) =>
          text ? (
            <Tooltip title={text} placement="topLeft">
              <span className="block max-w-[180px] truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {text}
              </span>
            </Tooltip>
          ) : (
            <span className="text-sm italic text-slate-400 dark:text-slate-500">暂无标题</span>
          ),
      },
      {
        title: '地址',
        dataIndex: 'address',
        key: 'address',
        width: 220,
        ellipsis: true,
        render: (text: string) =>
          text ? (
            <Tooltip title={text}>
              <span className="block max-w-[220px] truncate text-sm text-slate-700 dark:text-slate-200">
                {text}
              </span>
            </Tooltip>
          ) : (
            <span className="text-sm italic text-slate-400 dark:text-slate-500">暂无地址</span>
          ),
      },
      {
        title: '内容',
        dataIndex: 'content',
        key: 'content',
        width: 320,
        render: (text: string) =>
          text ? (
            <Tooltip title={text}>
              <span className="block max-w-[320px] truncate text-sm text-slate-700 dark:text-slate-200">
                {text}
              </span>
            </Tooltip>
          ) : (
            <span className="text-sm italic text-slate-400 dark:text-slate-500">暂无内容</span>
          ),
      },
      {
        title: '坐标',
        dataIndex: 'position',
        key: 'position',
        align: 'center',
        width: 160,
        render: (value: string) =>
          value ? (
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-50 px-2 py-1 font-mono text-[11px] tabular-nums text-slate-600 dark:border-strokedark dark:bg-boxdark-2 dark:text-slate-300">
              <FiCrosshair size={12} className="shrink-0 text-slate-400" />
              {value}
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        title: '发布时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 140,
        render: (text: number | string) => {
          const ms = typeof text === 'number' ? text : Number(text);
          if (!ms || Number.isNaN(ms)) {
            return <span className="text-slate-400">—</span>;
          }
          return (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {dayjs(ms).format('YYYY-MM-DD')}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {dayjs(ms).format('HH:mm:ss')}
              </span>
            </div>
          );
        },
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        align: 'center',
        width: 100,
        render: (_: unknown, record: Footprint) => (
          <div className="flex items-center justify-center gap-0.5">
            <Tooltip title="编辑">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(record.id!);
                }}
                className={`flex size-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${editingId === record.id
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-primary dark:hover:bg-white/5 dark:hover:text-primary'
                  }`}
                aria-label="编辑足迹"
              >
                <FiEdit2 size={16} />
              </button>
            </Tooltip>
            <Popconfirm
              title="删除足迹"
              description="删除后无法恢复，确定继续吗？"
              okText="删除"
              okButtonProps={{ danger: true }}
              cancelText="取消"
              onConfirm={() => delFootprintData(record.id!)}
            >
              <Tooltip title="删除">
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  disabled={btnLoading === record.id}
                  className="flex size-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 cursor-pointer"
                  aria-label="删除足迹"
                >
                  {btnLoading === record.id ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-red-500" />
                  ) : (
                    <FiTrash2 size={16} />
                  )}
                </button>
              </Tooltip>
            </Popconfirm>
          </div>
        ),
      },
    ],
    [btnLoading, delFootprintData, editingId, openEdit],
  );

  if (skeletonLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="足迹管理">
        <Button
          type="primary"
          icon={<FiPlus />}
          onClick={openCreate}
          className="inline-flex items-center gap-1"
        >
          新增足迹
        </Button>
      </Title>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <header className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
          <Form form={filterForm} onValuesChange={onFilterValuesChange}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <Form.Item name="address" className="mb-0! w-full sm:w-52">
                  <Input
                    allowClear
                    placeholder="搜索地点地址…"
                    prefix={<FiSearch className="text-slate-400" size={15} />}
                  />
                </Form.Item>
                <Form.Item name="createTime" className="mb-0! w-full sm:w-auto">
                  <RangePicker
                    className="w-full sm:w-56!"
                    placeholder={['开始日期', '结束日期']}
                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                  />
                </Form.Item>
                <Tooltip title="重置筛选">
                  <Button
                    type="text"
                    icon={<FiRotateCcw size={15} />}
                    onClick={resetFilters}
                    disabled={!hasActiveFilters}
                    className="shrink-0 text-slate-400 hover:text-slate-600 disabled:opacity-40 dark:hover:text-slate-200"
                  />
                </Tooltip>
              </div>
            </div>
          </Form>
        </header>

        <div className="min-h-0 flex-1">
          <Table
            rowKey="id"
            dataSource={footprintList}
            columns={columns}
            loading={loading}
            scroll={{ x: 'max-content' }}
            pagination={{
              position: ['bottomRight'],
              current: filter.pageNum,
              pageSize: filter.pageSize,
              total,
              showTotal: (totalCount) => {
                const pageSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;
                const pageNum = filter.pageNum ?? 1;
                const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
                return (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    第 {pageNum} / {totalPages} 页 · 共 {totalCount} 条
                  </span>
                );
              },
              onChange: (page, size) =>
                setFilter((prev) => ({
                  ...prev,
                  pageNum: page,
                  pageSize: size ?? prev.pageSize ?? DEFAULT_PAGE_SIZE,
                })),
              onShowSizeChange: (_, size) =>
                setFilter((prev) => ({
                  ...prev,
                  pageNum: 1,
                  pageSize: size ?? prev.pageSize ?? DEFAULT_PAGE_SIZE,
                })),
              className: 'px-5! py-3!',
            }}
            className="min-h-0 flex-1 [&_.ant-table-thead>tr>th]:bg-slate-50! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-slate-500! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! dark:[&_.ant-table-thead>tr>th]:text-slate-400!"
            locale={{
              emptyText: (
                <div className="py-14 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2 dark:text-slate-500">
                    <FiMapPin size={22} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {hasActiveFilters
                      ? '没有匹配的足迹，试试调整地址关键词或日期范围'
                      : '还没有足迹，点击右上角「新增足迹」记录第一条旅行'}
                  </p>
                </div>
              ),
            }}
          />
        </div>
      </section>

      <Modal
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        width={560}
        destroyOnClose
        className="[&_.ant-modal-content]:rounded-2xl! [&_.ant-modal-header]:mb-0! [&_.ant-modal-body]:pt-4!"
        title={
          <div className="flex items-start gap-3 pr-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/15">
              <FiMapPin size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                {isEditing ? '编辑足迹' : '新增足迹'}
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {isEditing
                  ? '修改后保存，列表与前台足迹地图同步更新'
                  : '记录你去过的城市与坐标，支持高德地址解析'}
              </p>
            </div>
          </div>
        }
      >
        <Spin spinning={detailLoading || searchLoading}>
          {isEditing && editingTitle && (
            <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 dark:border-primary/25 dark:bg-primary/10">
              <span className="truncate text-sm font-medium text-primary">
                {editingTitle}
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
            className="[&_.ant-input]:rounded-xl! [&_.ant-picker]:w-full! [&_.ant-picker]:rounded-xl!"
          >
            <p className="mb-3 text-[11px] font-medium tracking-wide text-slate-400 uppercase">
              基本信息
            </p>

            <Form.Item
              label="标题"
              name="title"
              rules={[{ required: true, message: '标题不能为空' }]}
              className="mb-4!"
            >
              <Input
                placeholder="例如：杭州 · 西湖"
                allowClear
                prefix={<FiAlignLeft className="text-slate-400" />}
              />
            </Form.Item>

            <Form.Item
              label="地址"
              name="address"
              rules={[{ required: true, message: '地址不能为空' }]}
              className="mb-4!"
            >
              <Input
                placeholder="详细地址，用于地图展示与坐标解析"
                allowClear
                prefix={<HiOutlineLocationMarker className="text-slate-400" />}
              />
            </Form.Item>

            <p className="mb-3 text-[11px] font-medium tracking-wide text-slate-400 uppercase">
              位置坐标
            </p>

            <Form.Item
              label="经纬度"
              name="position"
              rules={[{ required: true, message: '坐标不能为空' }]}
              className="mb-4!"
              extra={
                <span className="text-xs text-slate-400">
                  格式：经度,纬度 · 可点击右侧按钮根据地址自动解析
                </span>
              }
            >
              <Input
                placeholder="116.397428,39.90923"
                allowClear
                prefix={<FiMapPin className="text-slate-400" />}
                addonAfter={
                  <button
                    type="button"
                    onClick={() => void getGeocode()}
                    disabled={searchLoading}
                    className="inline-flex cursor-pointer items-center justify-center px-3 py-2 text-slate-500 transition-colors hover:text-primary disabled:opacity-50"
                    aria-label="根据地址解析坐标"
                  >
                    <FiNavigation size={16} className={searchLoading ? 'animate-pulse' : ''} />
                  </button>
                }
                className="customizeAntdInputAddonAfter"
              />
            </Form.Item>

            <p className="mb-3 text-[11px] font-medium tracking-wide text-slate-400 uppercase">
              图文内容
            </p>

            <Form.Item label="图片" name="images" className="mb-3!">
              <Input.TextArea
                autoSize={{ minRows: 2, maxRows: 6 }}
                placeholder="每行一条图片链接，或从素材库批量选择"
              />
            </Form.Item>

            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsMaterialModalOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200/80 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-primary/40 hover:text-primary dark:border-strokedark dark:text-slate-300 dark:hover:text-primary"
              >
                <FiUploadCloud size={14} />
                从素材库选择
              </button>
            </div>

            <Form.Item label="描述" name="content" className="mb-4!">
              <Input.TextArea
                autoSize={{ minRows: 4, maxRows: 8 }}
                placeholder="写下这段旅程的故事与感受…"
              />
            </Form.Item>

            <p className="mb-3 text-[11px] font-medium tracking-wide text-slate-400 uppercase">
              发布时间
            </p>

            <Form.Item
              label="时间"
              name="createTime"
              rules={[{ required: true, message: '时间不能为空' }]}
              className="mb-4!"
            >
              <DatePicker
                showTime
                placeholder="选择足迹发布时间"
                className="w-full"
                disabledDate={(current) =>
                  Boolean(current && current.isAfter(dayjs().endOf('day')))
                }
                disabledTime={(current) => {
                  if (!current) return {};
                  const now = dayjs();
                  if (!current.isSame(now, 'day')) return {};
                  return {
                    disabledHours: () =>
                      Array.from({ length: 24 }, (_, i) => i).filter((h) => h > now.hour()),
                    disabledMinutes: (selectedHour) =>
                      selectedHour === now.hour()
                        ? Array.from({ length: 60 }, (_, i) => i).filter((m) => m > now.minute())
                        : [],
                    disabledSeconds: (selectedHour, selectedMinute) =>
                      selectedHour === now.hour() && selectedMinute === now.minute()
                        ? Array.from({ length: 60 }, (_, i) => i).filter((s) => s > now.second())
                        : [],
                  };
                }}
              />
            </Form.Item>

            <div className="flex gap-3 pt-1">
              <Button className="h-10! flex-1" onClick={closeModal}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={modalSubmitLoading}
                icon={isEditing ? <FiEdit2 /> : <FiPlus />}
                className="h-10! flex-1"
              >
                {isEditing ? '保存修改' : '发布足迹'}
              </Button>
            </div>
          </Form>
        </Spin>
      </Modal>

      <Material
        multiple
        open={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSelect={(url) => {
          form.setFieldValue('images', url.join('\n'));
          void form.validateFields(['images']);
        }}
      />
    </div>
  );
}
