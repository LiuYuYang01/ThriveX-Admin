import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Table, Button, Image, notification, Popconfirm, Popover,
  Form, Input, DatePicker, Tooltip, Space, Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  DeleteOutlined,
  FormOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import Title from '@/components/Title';
import { delRecordDataAPI, getRecordListAPI } from '@/api/record';
import type { Record } from '@/types/app/record';
import { FilterForm } from '@/types/app/comment';

const { RangePicker } = DatePicker;

export default () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [btnLoading, setBtnLoading] = useState<number | null>(null); // 存储当前正在删除的ID
  const isFirstLoadRef = useRef<boolean>(true);

  const [recordList, setRecordList] = useState<Record[]>([]);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // 获取数据
  const fetchData = async (queryParams = {}) => {
    try {
      if (isFirstLoadRef.current) setInitialLoading(true);
      else setLoading(true);
      const { data } = await getRecordListAPI(queryParams);
      setRecordList(data as Record[]);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 删除逻辑
  const handleDelete = async (id: number) => {
    try {
      setBtnLoading(id);
      await delRecordDataAPI(id);
      await fetchData(); // 重新获取数据
      notification.success({ message: '删除成功' });
    } catch (error) {
      console.error(error);
    } finally {
      setBtnLoading(null);
    }
  };

  // 筛选提交
  const onFilterSubmit = (values: FilterForm) => {
    const query = {
      key: values.content,
      startDate: values.createTime?.[0]?.valueOf(),
      endDate: values.createTime?.[1]?.valueOf(),
    };
    fetchData({ query });
  };

  // 表格列定义
  const columns: ColumnsType<Record> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      align: 'center',
      render: (text) => <span className="text-gray-400 dark:text-gray-500 font-mono">#{text}</span>,
    },
    {
      title: '内容',
      dataIndex: 'content',
      width: 400,
      render: (text) => (
        <Tooltip title={text} placement="topLeft">
          <div className="max-w-[400px] truncate text-gray-700 dark:text-gray-200 font-medium cursor-pointer">
            {text || <span className="text-gray-300 dark:text-gray-500 italic">暂无文字内容</span>}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '图片',
      dataIndex: 'images',
      width: 170,
      render: (text) => {
        const list: string[] = JSON.parse(text || '[]');
        if (list.length === 0) return <span className="text-gray-300 dark:text-gray-500 text-xs">无图片</span>;

        const trigger = (
          <div className="record-images-collapse flex items-center gap-2">
            <div
              className="relative overflow-hidden rounded-lg border border-gray-100 dark:border-strokedark shadow-xs record-image-container group/img"
              style={{ width: 60, height: 60 }}
            >
              <Image
                src={list[0]}
                width={60}
                height={60}
                className="object-cover transition-transform duration-300 group-hover/img:scale-110"
                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                preview={{ mask: '预览' }}
              />
            </div>
            {list.length > 1 && (
              <div
                className="flex items-center justify-center rounded-lg border border-gray-100 dark:border-strokedark bg-gray-100 dark:bg-boxdark-2 text-gray-500 dark:text-gray-400 text-sm font-medium shrink-0 cursor-pointer"
                style={{ width: 60, height: 60 }}
              >
                +{list.length - 1}
              </div>
            )}
          </div>
        );

        if (list.length <= 1) {
          return (
            <Image.PreviewGroup>
              {trigger}
            </Image.PreviewGroup>
          );
        }

        return (
          <Popover
            trigger="hover"
            placement="bottomLeft"
            overlayClassName="record-images-popover"
            content={
              <Image.PreviewGroup>
                <div className="flex items-center gap-1.5 flex-wrap" style={{ maxWidth: 280 }}>
                  {list.map((src, idx) => (
                    <div
                      key={idx}
                      className="overflow-hidden rounded-sm border border-gray-100 dark:border-strokedark record-image-container shrink-0"
                      style={{ width: 56, height: 56 }}
                    >
                      <Image
                        src={src}
                        width={56}
                        height={56}
                        className="object-cover"
                        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                        preview={{ mask: '预览' }}
                      />
                    </div>
                  ))}
                </div>
              </Image.PreviewGroup>
            }
          >
            <span className="inline-block">
              <Image.PreviewGroup>
                {trigger}
              </Image.PreviewGroup>
            </span>
          </Popover>
        );
      },
    },
    {
      title: '发布时间',
      dataIndex: 'createTime',
      render: (text) => (
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
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space split={<Divider type="vertical" />}>
          <Tooltip title="编辑">
            <Link to={`/create_record?id=${record.id}`}>
              <Button
                type="text"
                size="small"
                icon={<FormOutlined className="text-blue-500" />}
                className="text-blue-500 dark:text-gray-300 dark:hover:text-blue-500! hover:bg-blue-50 dark:hover:bg-blue-900/20"
              />
            </Link>
          </Tooltip>

          <Tooltip title="删除">
            <Popconfirm
              title="删除确认"
              description="该操作无法撤销，确定删除吗？"
              okText="删除"
              okButtonProps={{ danger: true }}
              cancelText="取消"
              onConfirm={() => handleDelete(record.id!)}
            >
              <Button
                type="text"
                size="small"
                danger
                loading={btnLoading === record.id}
                icon={<DeleteOutlined />}
                className="hover:bg-red-50 dark:hover:bg-red-900/20"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 骨架屏
  if (initialLoading) return (
    <div className="space-y-2">
      <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark">
        <div className="skeleton h-8" style={{ width: 200 }} />
      </div>

      <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark">
        <div className="flex justify-between mb-6">
          <div className="flex gap-4">
            <div className="skeleton h-9" style={{ width: 200 }} />
            <div className="skeleton h-9" style={{ width: 300 }} />
          </div>
          <div className="skeleton h-9 rounded-md" style={{ width: 80 }} />
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

  return (
    <>
      <style>{`
        .record-image-container .ant-image,
        .record-image-container .ant-image-img,
        .record-image-container .ant-image-mask {
          width: 100% !important;
          height: 100% !important;
        }
        .record-image-container .ant-image {
          display: block !important;
        }
        .record-image-container .ant-image-img {
          object-fit: cover !important;
        }
        .record-images-popover.ant-popover .ant-popover-inner {
          padding: 10px;
          border-radius: 10px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }
      `}</style>

      <div>
        <Title value="说说管理" />

        <div className="bg-white dark:bg-boxdark rounded-2xl shadow-xs border border-gray-100 dark:border-strokedark overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-strokedark bg-gray-50/30 dark:bg-boxdark-2/50">
            <Form form={form} layout="inline" onFinish={onFilterSubmit} className="gap-y-3">
              <Form.Item name="content" className="mb-0! w-full sm:w-auto">
                <Input
                  prefix={<SearchOutlined className="text-gray-400 dark:text-gray-500" />}
                  placeholder="搜索说说内容..."
                  className="w-full sm:w-[240px]"
                  allowClear
                />
              </Form.Item>

              <Form.Item name="createTime" className="mb-0! w-full sm:w-auto">
                <RangePicker
                  className="w-full sm:w-[280px]"
                  placeholder={['开始日期', '结束日期']}
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                />
              </Form.Item>

              <div className="flex gap-2">
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  查询
                </Button>
              </div>
            </Form>
          </div>

          <Table
            rowKey="id"
            dataSource={recordList}
            columns={columns}
            loading={loading}
            pagination={{
              position: ['bottomRight'],
              current: currentPage,
              pageSize: pageSize,
              showTotal: (total) => (
                <div className="mt-[9px] text-xs text-gray-500 dark:text-gray-400">
                  当前第 {currentPage} / {Math.ceil(total / (pageSize || 8))} 页 | 共 {total} 条数据
                </div>
              ),
              onChange: (page, size) => {
                setCurrentPage(page);
                if (size !== pageSize) {
                  setPageSize(size);
                }
              },
              onShowSizeChange: (_current, size) => {
                setCurrentPage(1);
                setPageSize(size);
              },
              className: 'px-6! py-4!'
            }}
            className="[&_.ant-table-thead>tr>th]:bg-gray-50! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-gray-500! dark:[&_.ant-table-thead>tr>th]:text-gray-400!"
            scroll={{ x: 1030 }}
          />
        </div>
      </div>
    </>
  );
};