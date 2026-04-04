import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, DatePicker, Divider, Form, Input, message, Modal, notification, Popconfirm, Space, Spin, Table, Tag, Tooltip } from 'antd';
import type { ColumnType } from 'antd/es/table';
import axios from 'axios';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { ClearOutlined, CloudUploadOutlined, DeleteOutlined, FormOutlined, SearchOutlined } from '@ant-design/icons';
import { GiPositionMarker } from 'react-icons/gi';
import { IoSearch } from 'react-icons/io5';

import { addFootprintDataAPI, delFootprintDataAPI, editFootprintDataAPI, getFootprintDataAPI, getFootprintListAPI } from '@/api/footprint';
import { getEnvConfigDataAPI } from '@/api/config';
import Material from '@/components/Material';
import Title from '@/components/Title';
import type { FilterForm, Footprint } from '@/types/app/footprint';

type ListQuery = { key?: string; startDate?: string; endDate?: string };

export default () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const isFirstLoadRef = useRef(true);
  const detailRequestSeqRef = useRef(0);

  const [gaodeApKey, setGaodeApKey] = useState('');
  const [footprintList, setFootprintList] = useState<Footprint[]>([]);

  const [isModelOpen, setIsModelOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [listQuery, setListQuery] = useState<ListQuery>({});

  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();

  const { RangePicker } = DatePicker;

  const getEnvConfigData = useCallback(async () => {
    const { data } = await getEnvConfigDataAPI('gaode_coordinate');
    setGaodeApKey((data.value as { key: string }).key);
  }, []);

  const getFootprintList = useCallback(
    async (query?: ListQuery) => {
      const finalQuery = query ?? listQuery;
      try {
        if (isFirstLoadRef.current) setInitialLoading(true);
        else setLoading(true);

        const { data } = await getFootprintListAPI({ query: finalQuery });
        setFootprintList(data as Footprint[]);
        isFirstLoadRef.current = false;
      } catch (error) {
        console.error(error);
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    },
    [listQuery],
  );

  useEffect(() => {
    getEnvConfigData();
    getFootprintList({});
  }, [getEnvConfigData, getFootprintList]);

  const closeModal = useCallback(() => {
    detailRequestSeqRef.current += 1; // 使未完成的编辑请求失效，避免回填
    setIsModelOpen(false);
    setModalMode('create');
    setEditingId(null);
    setDetailLoading(false);
    form.resetFields();
  }, [form]);

  const openCreate = useCallback(() => {
    detailRequestSeqRef.current += 1; // 使未完成的编辑请求失效，避免回填
    setModalMode('create');
    setEditingId(null);
    setIsModelOpen(true);
    setDetailLoading(false);
    form.resetFields();
  }, [form]);

  const openEdit = useCallback(
    (id: number) => {
      setModalMode('edit');
      setEditingId(id);
      setIsModelOpen(true);
      setDetailLoading(true);
      form.resetFields(); // 先清空，避免看到旧值闪一下
    },
    [form],
  );

  useEffect(() => {
    const run = async () => {
      if (!isModelOpen || modalMode !== 'edit' || !editingId) return;
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
  }, [editingId, form, isModelOpen, modalMode]);

  const onFilterReset = useCallback(() => {
    filterForm.resetFields();
    setListQuery({});
    getFootprintList({});
  }, [filterForm, getFootprintList]);

  const onFilterSubmit = useCallback(
    async (values: FilterForm) => {
      const query: ListQuery = {
        key: values.address,
        startDate: values.createTime?.[0]?.valueOf()?.toString(),
        endDate: values.createTime?.[1]?.valueOf()?.toString(),
      };
      setListQuery(query);
      await getFootprintList(query);
    },
    [getFootprintList],
  );

  const delFootprintData = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        await delFootprintDataAPI(id);
        notification.success({ message: '🎉 删除足迹成功' });
        await getFootprintList();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [getFootprintList],
  );

  const onSubmit = useCallback(async () => {
    try {
      setBtnLoading(true);
      const values = (await form.validateFields()) as Footprint;

      const payload: Footprint = {
        ...(values as Footprint),
        createTime: (values.createTime as Dayjs | undefined)?.valueOf?.() ?? values.createTime,
        images: values.images ? (values.images as string).split('\n').map((s) => s.trim()).filter(Boolean) : [],
      };

      if (modalMode === 'edit') {
        if (!editingId) throw new Error('缺少 editingId');
        await editFootprintDataAPI({ ...payload, id: editingId } as Footprint);
        message.success('🎉 修改足迹成功');
      } else {
        await addFootprintDataAPI(payload);
        message.success('🎉 新增足迹成功');
      }

      await getFootprintList();
      closeModal();
    } catch (error) {
      console.error(error);
    } finally {
      setBtnLoading(false);
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

  const columns: ColumnType<Footprint>[] = useMemo(
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
        render: (text: string) => <span className="text-gray-700 dark:text-gray-200 font-medium">{text || '-'}</span>,
      },
      {
        title: '地址',
        dataIndex: 'address',
        key: 'address',
        width: 220,
        ellipsis: true,
        render: (text: string) => (
          <div>
            {text ? (
              <Tooltip title={text}>
                <div className="max-w-[220px] truncate text-gray-700 dark:text-gray-200 hover:text-primary cursor-pointer">{text}</div>
              </Tooltip>
            ) : (
              <span className="text-gray-300 dark:text-gray-500 italic">暂无地址</span>
            )}
          </div>
        ),
      },
      {
        title: '内容',
        dataIndex: 'content',
        key: 'content',
        width: 320,
        render: (value: string) => (
          <div>
            {value ? (
              <Tooltip title={value}>
                <div className="max-w-[320px] truncate text-gray-700 dark:text-gray-200 hover:text-primary cursor-pointer">{value}</div>
              </Tooltip>
            ) : (
              <span className="text-gray-300 dark:text-gray-500 italic">暂无内容</span>
            )}
          </div>
        ),
      },
      {
        title: '坐标',
        dataIndex: 'position',
        key: 'position',
        align: 'center',
        width: 160,
        render: (value: string) => <Tag className="m-0!">{value || '-'}</Tag>,
      },
      {
        title: '发布时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 140,
        render: (text: string) => (
          <div className="flex flex-col">
            <span className="text-gray-700 dark:text-gray-200 font-medium">{dayjs(+text).format('YYYY-MM-DD')}</span>
            <span className="text-gray-400 dark:text-gray-500 text-xs">{dayjs(+text).format('HH:mm:ss')}</span>
          </div>
        ),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        align: 'center',
        width: 130,
        render: (_: string, record: Footprint) => (
          <Space split={<Divider type="vertical" />}>
            <Tooltip title="编辑">
              <Button type="text" onClick={() => openEdit(record.id!)} icon={<FormOutlined className="text-primary" />} />
            </Tooltip>

            <Tooltip title="删除">
              <Popconfirm title="警告" description="你确定要删除吗" okText="确定" cancelText="取消" onConfirm={() => delFootprintData(record.id!)}>
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          </Space>
        ),
      },
    ],
    [delFootprintData, openEdit],
  );

  // 初始加载时显示骨架屏（与 article 一致）
  if (initialLoading) {
    return (
      <div className="space-y-2">
        <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark">
          <div className="skeleton h-8" style={{ width: 200 }} />
        </div>

        <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark">
          <div className="flex justify-between mb-6">
            <div className="flex gap-4 flex-wrap">
              <div className="skeleton h-9" style={{ width: 200 }} />
              <div className="skeleton h-9" style={{ width: 280 }} />
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-9 rounded-md" style={{ width: 80 }} />
              <div className="skeleton h-9 rounded-md" style={{ width: 80 }} />
            </div>
          </div>

          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex gap-4 mb-4 items-center">
              <div className="skeleton shrink-0 rounded-lg" style={{ width: 56, height: 56 }} />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="skeleton h-4 w-full rounded-sm" />
                <div className="skeleton h-3 rounded-sm" style={{ width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Title value="足迹管理">
        <Button type="primary" onClick={openCreate}>
          新增足迹
        </Button>
      </Title>

      <div className="bg-white dark:bg-boxdark rounded-2xl shadow-xs border border-gray-100 dark:border-strokedark overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-strokedark bg-gray-50/30 dark:bg-boxdark-2/50 space-y-4">
          <Form form={filterForm} layout="inline" onFinish={onFilterSubmit} className="flex! flex-wrap! items-center! gap-y-2.5!">
            <Form.Item name="address" className="mb-0!">
              <Input
                prefix={<SearchOutlined className="text-gray-400 dark:text-gray-500" />}
                placeholder="搜索地址..."
                className="w-[220px]!"
                allowClear
              />
            </Form.Item>
            <Form.Item name="createTime" className="mb-0!">
              <RangePicker
                className="w-[260px]!"
                placeholder={['开始日期', '结束日期']}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>

            <div className="flex gap-2">
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button icon={<ClearOutlined />} onClick={onFilterReset}>
                重置
              </Button>
            </div>
          </Form>
        </div>

        <Table
          rowKey="id"
          dataSource={footprintList}
          columns={columns}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            position: ['bottomRight'],
            pageSize: 8,
            showTotal: (totalCount) => (
              <div className="mt-[9px] text-xs text-gray-500 dark:text-gray-400">
                共 {totalCount} 条数据
              </div>
            ),
            className: 'px-6! py-4!',
          }}
          className="[&_.ant-table-thead>tr>th]:bg-gray-50! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-gray-500! dark:[&_.ant-table-thead>tr>th]:text-gray-400!"
        />
      </div>

      <Modal title={modalMode === 'edit' ? '编辑足迹' : '新增足迹'} open={isModelOpen} onCancel={closeModal} destroyOnClose footer={null}>
        <Spin spinning={detailLoading || searchLoading}>
          <Form form={form} layout="vertical" size="large" preserve={false} className="mt-6">
            <Form.Item label="标题" name="title" rules={[{ required: true, message: '标题不能为空' }]}>
              <Input placeholder="请输入标题" />
            </Form.Item>

            <Form.Item label="地址" name="address" rules={[{ required: true, message: '地址不能为空' }]}>
              <Input placeholder="请输入地址" />
            </Form.Item>

            <Form.Item label="坐标纬度" name="position" rules={[{ required: true, message: '坐标纬度不能为空' }]}>
              <Input placeholder="请输入坐标纬度" prefix={<GiPositionMarker />} addonAfter={<IoSearch onClick={getGeocode} className="cursor-pointer" />} />
            </Form.Item>

            <div className="relative">
              <Form.Item label="图片" name="images">
                <Input.TextArea autoSize={{ minRows: 2, maxRows: 10 }} placeholder="请输入图片链接" />
              </Form.Item>

              <div onClick={() => setIsMaterialModalOpen(true)} className="absolute bottom-2 right-2 bg-white rounded-full border border-stroke cursor-pointer">
                <CloudUploadOutlined className="text-xl hover:text-primary transition-colors p-2" />
              </div>
            </div>

            <Form.Item label="内容" name="content">
              <Input.TextArea autoSize={{ minRows: 5, maxRows: 10 }} placeholder="请输入内容" />
            </Form.Item>

            <Form.Item label="时间" name="createTime" rules={[{ required: true, message: '时间不能为空' }]} className="mb-4!">
              <DatePicker showTime placeholder="请选择时间" className="w-full" />
            </Form.Item>

            <Form.Item className="mb-0! w-full">
              <Button type="primary" onClick={onSubmit} loading={btnLoading} className="w-full">
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
