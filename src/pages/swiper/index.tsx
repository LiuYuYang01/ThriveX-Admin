import { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, Button, Image, Form, Input, Popconfirm, message, Modal, Tooltip, Spin } from 'antd';
import { getSwiperListAPI, addSwiperDataAPI, editSwiperDataAPI, delSwiperDataAPI, getSwiperDataAPI } from '@/api/swiper';
import type { Swiper } from '@/types/app/swiper';
import Title from '@/components/Title';
import type { ColumnsType } from 'antd/es/table';
import { CloudUploadOutlined, DeleteOutlined, FormOutlined, PictureOutlined } from '@ant-design/icons';
import Material from '@/components/Material';
import Skeleton from './Skeleton';

const EMPTY_SWIPER: Swiper = {
  title: '',
  description: '',
  url: '',
  image: '',
};

export default function SwiperPage() {
  const [loading, setLoading] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingSwiper, setEditingSwiper] = useState<Swiper>(EMPTY_SWIPER);
  const [swiperList, setSwiperList] = useState<Swiper[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 8 });
  const total = swiperList.length;

  const [form] = Form.useForm();

  const fetchSwiperList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getSwiperListAPI();
      setSwiperList(data.result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setSkeletonLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSwiperList();
  }, [fetchSwiperList]);

  const openCreateModal = useCallback(() => {
    setEditingSwiper(EMPTY_SWIPER);
    form.resetFields();
    setIsFormModalOpen(true);
  }, [form]);

  const openEditModal = useCallback(async (record: Swiper) => {
    try {
      setEditLoading(true);
      setIsFormModalOpen(true);
      const { data } = await getSwiperDataAPI(record.id);
      const normalizedData: Swiper = { ...EMPTY_SWIPER, ...data };
      setEditingSwiper(normalizedData);
      form.setFieldsValue(normalizedData);
    } catch (error) {
      console.error(error);
    } finally {
      setEditLoading(false);
    }
  }, [form]);

  const closeFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setEditingSwiper(EMPTY_SWIPER);
    form.resetFields();
  }, [form]);

  const deleteSwiperItem = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await delSwiperDataAPI(id);
      await fetchSwiperList();
      message.success('🎉 删除轮播图成功');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [fetchSwiperList]);

  const handleSubmit = useCallback(async () => {
    try {
      setSubmitLoading(true);
      const values = await form.validateFields();
      if (editingSwiper.id) {
        await editSwiperDataAPI({ ...editingSwiper, ...values });
        message.success('🎉 编辑轮播图成功');
      } else {
        await addSwiperDataAPI({ ...values });
        message.success('🎉 新增轮播图成功');
      }

      await fetchSwiperList();
      closeFormModal();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitLoading(false);
    }
  }, [closeFormModal, editingSwiper, fetchSwiperList, form]);

  const UploadButton = () => (
    <CloudUploadOutlined className="cursor-pointer text-xl" onClick={() => setIsMaterialModalOpen(true)} />
  );

  const columns: ColumnsType<Swiper> = useMemo(() => [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'center',
      width: 80,
      render: (text: number) => <span className="text-gray-400 dark:text-gray-500 font-mono">#{text}</span>,
    },
    {
      title: '图片',
      dataIndex: 'image',
      key: 'image',
      width: 200,
      align: 'center',
      render: (url: string) => <Image width={180} src={url} className="w-full cursor-pointer rounded-sm" alt="" />,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (text: string) => (
        <Tooltip title={text}>
          <span className="line-clamp-1 cursor-pointer font-medium text-gray-700 hover:text-primary dark:text-gray-200">{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <>
          {text ? (
            <Tooltip title={text}>
              <span className="line-clamp-1 text-gray-600 dark:text-gray-300 hover:text-primary cursor-pointer">{text}</span>
            </Tooltip>
          ) : (
            <span className="text-gray-300 dark:text-gray-500 italic">暂无描述</span>
          )}
        </>
      ),
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      fixed: 'right',
      width: 110,
      render: (_: string, record: Swiper) => (
        <>
          <Tooltip title="编辑">
            <Button type="text" onClick={() => openEditModal(record)} icon={<FormOutlined className="text-blue-500" />} />
          </Tooltip>

          <Tooltip title="删除">
            <Popconfirm title="警告" description="你确定要删除该轮播图吗?" okText="确定" cancelText="取消" onConfirm={() => deleteSwiperItem(record.id!)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </>
      ),
    },
  ], [deleteSwiperItem, openEditModal]);

  if (skeletonLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title value="轮播图管理">
        <Button type="primary" onClick={openCreateModal}>
          新增轮播图
        </Button>
      </Title>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="min-h-0 flex-1">
          <Table
            rowKey="id"
            dataSource={swiperList}
            columns={columns}
            loading={loading}
            scroll={{ x: 900 }}
            pagination={{
              position: ['bottomRight'],
              current: pagination.current,
              pageSize: pagination.pageSize,
              total,
              showTotal: (totalCount) => (
                <div className="mt-[9px] text-xs text-gray-500 dark:text-gray-400">
                  当前第 {pagination.current} / {Math.ceil(totalCount / pagination.pageSize)} 页 | 共 {totalCount} 条数据
                </div>
              ),
              onChange: (page, pageSize) => setPagination({ current: page, pageSize: pageSize ?? 8 }),
              onShowSizeChange: (page, pageSize) => setPagination({ current: page, pageSize: pageSize ?? 8 }),
              className: 'px-6!',
            }}
            className="[&_.ant-table-thead>tr>th]:bg-gray-50! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-gray-500! dark:[&_.ant-table-thead>tr>th]:text-gray-400! w-full"
          />
        </div>
      </div>

      <Modal
        open={isFormModalOpen}
        onCancel={closeFormModal}
        footer={null}
        title={editingSwiper.id ? '编辑轮播图' : '新增轮播图'}
        className="[&_.ant-modal-content]:rounded-2xl!"
      >
        <Spin spinning={editLoading}>
          <Form
            form={form}
            layout="vertical"
            initialValues={editingSwiper}
            size="large"
            preserve={false}
            className="mt-2 [&_.ant-input]:rounded-lg! [&_.ant-select-selector]:rounded-lg!"
          >
            <Form.Item label="标题" name="title" rules={[{ required: true, message: '轮播图标题不能为空' }]}>
              <Input placeholder="要么沉沦 要么巅峰!" />
            </Form.Item>

            <Form.Item label="描述" name="description">
              <Input placeholder="Either sink or peak!" />
            </Form.Item>

            <Form.Item label="链接" name="url">
              <Input placeholder="https://liuyuyang.net/" />
            </Form.Item>

            <Form.Item label="图片" name="image" rules={[{ required: true, message: '轮播图地址不能为空' }]}>
              <Input
                placeholder="https://liuyuyang.net/swiper.jpg"
                prefix={<PictureOutlined />}
                addonAfter={<UploadButton />}
                className="customizeAntdInputAddonAfter"
              />
            </Form.Item>

            <Form.Item className="mb-0!">
              <Button type="primary" onClick={handleSubmit} loading={submitLoading} className="w-full">
                确定
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Material
        open={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSelect={(url) => {
          form.setFieldValue('image', url.join('\n'));
          form.validateFields(['image']); // 手动触发 image 字段的校验
        }}
      />
    </div>
  );
}
