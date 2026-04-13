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
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { CloudUploadOutlined, DeleteOutlined, FormOutlined, SearchOutlined } from '@ant-design/icons';
import { GiPositionMarker } from 'react-icons/gi';
import { IoSearch } from 'react-icons/io5';

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
import Skeleton from './Skeleton';
import type { Footprint, FootprintFilterQueryParams } from '@/types/app/footprint';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';

const DEFAULT_PAGE_SIZE = 8;

export default () => {
  const [loading, setLoading] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
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
  const [filterForm] = Form.useForm<FootprintFilterQueryParams>();

  const getEnvConfigData = useCallback(async () => {
    const { data } = await getEnvConfigDataAPI('gaode_coordinate');
    setGaodeApKey((data.value as { key: string }).key);
  }, []);

  const getFootprintList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getFootprintListAPI(filter);
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
    getEnvConfigData();
  }, [getEnvConfigData]);

  useEffect(() => {
    getFootprintList();
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
          images: Array.isArray(data.images) ? (data.images as string[]).join('\n') : (data.images as string),
          createTime: data.createTime ? dayjs(+data.createTime) : undefined,
        };

        form.setFieldsValue(normalized);
      } catch (error) {
        console.error(error);
      } finally {
        if (reqSeq === detailRequestSeqRef.current) setDetailLoading(false);
      }
    };

    run();
  }, [editingId, form, isModalOpen, modalMode]);

  const { onValuesChange: onFilterValuesChange } =
    useDebouncedChange({
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

  const delFootprintData = useCallback(
    async (id: number) => {
      try {
        setDeleteLoading(true);
        await delFootprintDataAPI(id);
        notification.success({ message: '删除成功' });
        await getFootprintList();
      } catch (error) {
        console.error('删除足迹失败：', error);
      } finally {
        setDeleteLoading(false);
      }
    },
    [getFootprintList],
  );

  const onSubmit = useCallback(async () => {
    try {
      setModalSubmitLoading(true);
      const values = (await form.validateFields()) as Footprint;

      const payload: Footprint = {
        ...(values as Footprint),
        createTime: (values.createTime as Dayjs | undefined)?.valueOf?.() ?? values.createTime,
        images: values.images ? (values.images as string).split('\n').map((s) => s.trim()).filter(Boolean) : [],
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
        message.error('请确保高德API密钥正确');
        return;
      }

      if (data.geocodes.length > 0) {
        const location = data.geocodes[0].location;
        form.setFieldValue('position', location);
        form.validateFields(['position']);
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
        render: (text: number) => <span className="text-gray-400 dark:text-gray-500 font-mono">#{text}</span>,
      },
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        width: 180,
        render: (text: string) => (
          <>
            {text ? (
              <Tooltip title={text} placement="topLeft">
                <span className="max-w-[180px] truncate block text-gray-700 dark:text-gray-200 font-medium">{text}</span>
              </Tooltip>
            ) : (
              <span className="text-gray-300 dark:text-gray-500 italic">暂无标题</span>
            )}
          </>
        ),
      },
      {
        title: '地址',
        dataIndex: 'address',
        key: 'address',
        width: 220,
        ellipsis: true,
        render: (text: string) => (
          <>
            {text ? (
              <Tooltip title={text}>
                <div className="max-w-[220px] truncate text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary cursor-pointer">
                  {text}
                </div>
              </Tooltip>
            ) : (
              <span className="text-gray-300 dark:text-gray-500 italic">暂无地址</span>
            )}
          </>
        ),
      },
      {
        title: '内容',
        dataIndex: 'content',
        key: 'content',
        width: 320,
        render: (value: string) => (
          <>
            {value ? (
              <Tooltip title={value}>
                <div className="max-w-[320px] truncate text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary cursor-pointer">
                  {value}
                </div>
              </Tooltip>
            ) : (
              <span className="text-gray-300 dark:text-gray-500 italic">暂无内容</span>
            )}
          </>
        ),
      },
      {
        title: '坐标',
        dataIndex: 'position',
        key: 'position',
        align: 'center',
        width: 160,
        render: (value: string) => <Tag className="m-0! border-0!">{value || '-'}</Tag>,
      },
      {
        title: '发布时间',
        dataIndex: 'createTime',
        key: 'createTime',
        render: (text: number | string) => {
          const ms = typeof text === 'number' ? text : Number(text);
          if (!ms || Number.isNaN(ms)) {
            return <span className="text-gray-400 dark:text-gray-500">-</span>;
          }
          return (
            <div className="flex flex-col">
              <span className="text-gray-700 dark:text-gray-200 font-medium">{dayjs(ms).format('YYYY-MM-DD')}</span>
              <span className="text-gray-400 dark:text-gray-500 text-xs">{dayjs(ms).format('HH:mm:ss')}</span>
            </div>
          );
        },
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        align: 'center',
        width: 130,
        render: (_: unknown, record: Footprint) => (
          <div className="flex items-center justify-center gap-0">
            <Tooltip title="编辑">
              <Button
                type="text"
                onClick={() => openEdit(record.id!)}
                icon={<FormOutlined className="text-blue-500" />}
                className="text-blue-500 dark:text-gray-300 dark:hover:text-blue-500! hover:bg-blue-50 dark:hover:bg-blue-900/20"
              />
            </Tooltip>

            <Tooltip title="删除">
              <Popconfirm
                title="删除确认"
                description="确定要删除这条足迹吗？"
                okText="删除"
                okButtonProps={{ danger: true }}
                cancelText="取消"
                onConfirm={() => delFootprintData(record.id!)}
              >
                <Button
                  type="text"
                  danger
                  loading={deleteLoading}
                  icon={<DeleteOutlined />}
                  className="hover:bg-red-50 dark:hover:bg-red-900/20"
                />
              </Popconfirm>
            </Tooltip>
          </div>
        ),
      },
    ],
    [deleteLoading, delFootprintData, openEdit],
  );

  if (skeletonLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title value="足迹管理">
        <Button type="primary" onClick={openCreate}>
          新增足迹
        </Button>
      </Title>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="shrink-0 space-y-4 border-b border-gray-100 bg-gray-50/30 p-5 dark:border-strokedark dark:bg-boxdark-2/50">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Form
              form={filterForm}
              layout="inline"
              onValuesChange={onFilterValuesChange}
              className="flex! flex-1 flex-wrap! items-center! gap-y-2.5!"
            >
              <Form.Item name="address" className="mb-0!">
                <Input
                  prefix={<SearchOutlined className="text-gray-400 dark:text-gray-500" />}
                  placeholder="搜索地址..."
                  className="w-[220px]!"
                  allowClear
                />
              </Form.Item>

              <Form.Item name="createTime" className="mb-0!">
                <RangePicker className="w-[260px]!" />
              </Form.Item>
            </Form>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <Table
            rowKey="id"
            dataSource={footprintList}
            columns={columns}
            loading={loading}
            scroll={{ x: 1220 }}
            pagination={{
              position: ['bottomRight'],
              current: filter.pageNum,
              pageSize: filter.pageSize,
              total,
              showTotal: (totalCount) => (
                <div className="mt-[9px] text-xs text-gray-500 dark:text-gray-400">
                  当前第 {filter.pageNum ?? 1} / {Math.max(1, Math.ceil(totalCount / (filter.pageSize ?? DEFAULT_PAGE_SIZE)))} 页 | 共{' '}
                  {totalCount} 条数据
                </div>
              ),
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
              className: 'px-6!',
            }}
            className="[&_.ant-table-thead>tr>th]:bg-gray-50! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-gray-500! dark:[&_.ant-table-thead>tr>th]:text-gray-400!"
          />
        </div>
      </div>

      <Modal
        title={modalMode === 'edit' ? '编辑足迹' : '新增足迹'}
        open={isModalOpen}
        onCancel={closeModal}
        destroyOnClose
        footer={null}
      >
        <Spin spinning={detailLoading || searchLoading}>
          <Form form={form} layout="vertical" size="large" preserve={false} className="mt-6">
            <Form.Item label="标题" name="title" rules={[{ required: true, message: '标题不能为空' }]}>
              <Input placeholder="请输入标题" />
            </Form.Item>

            <Form.Item label="地址" name="address" rules={[{ required: true, message: '地址不能为空' }]}>
              <Input placeholder="请输入地址" />
            </Form.Item>

            <Form.Item label="坐标纬度" name="position" rules={[{ required: true, message: '坐标纬度不能为空' }]}>
              <Input
                placeholder="请输入坐标纬度"
                prefix={<GiPositionMarker />}
                addonAfter={<IoSearch onClick={getGeocode} className="cursor-pointer" />}
              />
            </Form.Item>

            <div className="relative">
              <Form.Item label="图片" name="images">
                <Input.TextArea autoSize={{ minRows: 2, maxRows: 10 }} placeholder="请输入图片链接" />
              </Form.Item>

              <button
                type="button"
                onClick={() => setIsMaterialModalOpen(true)}
                className="absolute bottom-2 right-2 rounded-full border border-stroke bg-white p-0 cursor-pointer dark:bg-boxdark"
              >
                <CloudUploadOutlined className="p-2 text-xl transition-colors hover:text-primary" />
              </button>
            </div>

            <Form.Item label="内容" name="content">
              <Input.TextArea autoSize={{ minRows: 5, maxRows: 10 }} placeholder="请输入内容" />
            </Form.Item>

            <Form.Item label="时间" name="createTime" rules={[{ required: true, message: '时间不能为空' }]} className="mb-4!">
              <DatePicker showTime placeholder="请选择时间" className="w-full" />
            </Form.Item>

            <Form.Item className="mb-0! w-full">
              <Button type="primary" onClick={onSubmit} loading={modalSubmitLoading} className="w-full">
                确定
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Material
        multiple
        open={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSelect={(url) => {
          form.setFieldValue('images', url.join('\n'));
          form.validateFields(['images']);
        }}
      />
    </div>
  );
};
