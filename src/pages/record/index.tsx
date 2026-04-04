import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Button,
  Form,
  Input,
  notification,
  Popconfirm,
  Table,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  DeleteOutlined,
  FormOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import Title from '@/components/Title';
import RangePicker from '@/components/RangePicker';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';

import { delRecordDataAPI, getRecordPagingAPI } from '@/api/record';
import type { Record, RecordFilterDataForm, RecordFilterQueryParams } from '@/types/app/record';

import Skeleton from './Skeleton';
import { RecordImageStyles, RecordImagesCell } from './recordTableShared';

export default () => {
  const [loading, setLoading] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState<number | null>(null);

  const [form] = Form.useForm<RecordFilterDataForm>();
  const [recordList, setRecordList] = useState<Record[]>([]);
  const [total, setTotal] = useState(0);

  const [filter, setFilter] = useState<RecordFilterQueryParams>({
    pageNum: 1,
    pageSize: 8,
  });

  const getRecordList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getRecordPagingAPI({
        query: {
          key: filter.key,
          startDate: filter.startDate,
          endDate: filter.endDate,
        },
        pagination: {
          pageNum: filter.pageNum ?? 1,
          pageSize: filter.pageSize ?? 8,
        },
      });

      if (data.result.length === 0 && (filter.pageNum ?? 1) > 1) {
        setFilter((prev) => ({ ...prev, pageNum: (prev.pageNum ?? 1) - 1 }));
        return;
      }

      setTotal(data.total);
      setRecordList(data.result);
    } catch (error) {
      console.error('获取说说列表失败：', error);
    } finally {
      setSkeletonLoading(false);
      setLoading(false);
    }
  }, [filter]);

  const delRecordData = useCallback(
    async (id: number) => {
      try {
        setBtnLoading(id);
        await delRecordDataAPI(id);
        await getRecordList();
        notification.success({ message: '删除成功' });
      } catch (error) {
        console.error('删除说说失败：', error);
      } finally {
        setBtnLoading(null);
      }
    },
    [getRecordList],
  );

  const columns: ColumnsType<Record> = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 80,
        align: 'center',
        render: (text: number) => (
          <span className="font-mono text-gray-400 dark:text-gray-500">
            #
            {text}
          </span>
        ),
      },
      {
        title: '内容',
        dataIndex: 'content',
        key: 'content',
        width: 400,
        render: (text: string) => (
          <Tooltip title={text} placement="topLeft">
            <div className="max-w-[400px] cursor-pointer truncate font-medium text-gray-700 dark:text-gray-200">
              {text ? text : <span className="italic text-gray-300 dark:text-gray-500">暂无文字内容</span>}
            </div>
          </Tooltip>
        ),
      },
      {
        title: '图片',
        dataIndex: 'images',
        key: 'images',
        width: 170,
        render: (_: unknown, row: Record) => <RecordImagesCell imagesRaw={row.images} />,
      },
      {
        title: '发布时间',
        dataIndex: 'createTime',
        key: 'createTime',
        render: (text: string | number) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-700 dark:text-gray-200">{dayjs(+text).format('YYYY-MM-DD')}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{dayjs(+text).format('HH:mm:ss')}</span>
          </div>
        ),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 120,
        align: 'center',
        render: (_: unknown, row: Record) => (
          <div className="flex items-center justify-center gap-0">
            <Tooltip title="编辑">
              <Link to={`/create_record?id=${row.id}`}>
                <Button
                  type="text"
                  icon={<FormOutlined className="text-blue-500" />}
                  className="text-blue-500 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-500!"
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
                onConfirm={() => delRecordData(row.id!)}
              >
                <Button
                  type="text"
                  danger
                  loading={btnLoading === row.id}
                  icon={<DeleteOutlined />}
                  className="hover:bg-red-50 dark:hover:bg-red-900/20"
                />
              </Popconfirm>
            </Tooltip>
          </div>
        ),
      },
    ],
    [btnLoading, delRecordData],
  );

  const { onValuesChange: onFilterChange } = useDebouncedChange<RecordFilterDataForm>({
    debouncedKeys: ['content'],
    debounceMs: 400,
    getValues: () => form.getFieldsValue(),
    onApply: (values) => {
      setFilter((prev) => ({
        ...prev,
        pageNum: 1,
        key: values.content,
        startDate: values.createTime?.[0] ? values.createTime[0].valueOf() : undefined,
        endDate: values.createTime?.[1] ? values.createTime[1].valueOf() : undefined,
      }));
    },
  });

  useEffect(() => {
    getRecordList();
  }, [getRecordList]);

  if (skeletonLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RecordImageStyles />

      <Title value="说说管理" />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="shrink-0 space-y-4 border-b border-gray-100 bg-gray-50/30 p-5 dark:border-strokedark dark:bg-boxdark-2/50">
          <Form
            form={form}
            layout="inline"
            onValuesChange={onFilterChange}
            className="flex! flex-wrap! items-center! gap-y-2.5!"
          >
            <Form.Item name="content" className="mb-0!">
              <Input
                prefix={<SearchOutlined className="text-gray-400 dark:text-gray-500" />}
                placeholder="搜索说说内容..."
                allowClear
                className="w-[220px]!"
              />
            </Form.Item>

            <Form.Item name="createTime" className="mb-0!">
              <RangePicker className="w-[260px]!" />
            </Form.Item>
          </Form>
        </div>

        <div className="min-h-0 flex-1">
          <Table
            rowKey="id"
            dataSource={recordList}
            columns={columns}
            loading={loading}
            pagination={{
              position: ['bottomRight'],
              current: filter.pageNum,
              pageSize: filter.pageSize,
              total,
              showTotal: (totalCount) => (
                <div className="mt-[9px] text-xs text-gray-500 dark:text-gray-400">
                  当前第
                  {' '}
                  {filter.pageNum ?? 1}
                  {' '}
                  /
                  {' '}
                  {Math.max(1, Math.ceil(totalCount / (filter.pageSize ?? 8)))}
                  {' '}
                  页 | 共
                  {' '}
                  {totalCount}
                  {' '}
                  条数据
                </div>
              ),
              onChange: (page, size) =>
                setFilter((prev) => ({
                  ...prev,
                  pageNum: page,
                  pageSize: size ?? prev.pageSize ?? 8,
                })),
              onShowSizeChange: (_, size) =>
                setFilter((prev) => ({
                  ...prev,
                  pageNum: 1,
                  pageSize: size ?? prev.pageSize ?? 8,
                })),
              className: 'px-6!',
            }}
            className="[&_.ant-table-thead>tr>th]:bg-gray-50! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-gray-500! dark:[&_.ant-table-thead>tr>th]:text-gray-400!"
            scroll={{ x: 1030 }}
          />
        </div>
      </div>
    </div>
  );
};
