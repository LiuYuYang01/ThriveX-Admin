import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Form, Input, Modal, Popconfirm, Select, Table, Tag, message, Tooltip } from 'antd';
import dayjs from 'dayjs';
import TextArea from 'antd/es/input/TextArea';
import { DeleteOutlined, SendOutlined, StarFilled, StarOutlined, SearchOutlined } from '@ant-design/icons';

import { getWallListAPI, delWallDataAPI, getWallCateListAPI, updateChoiceAPI } from '@/api/wall';
import { sendReplyWallEmailAPI } from '@/api/email';
import Title from '@/components/Title';
import RangePicker from '@/components/RangePicker';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';
import { useWebStore } from '@/stores';
import type { Cate, Wall, WallFilterQueryParams } from '@/types/app/wall';
import type { ColumnsType } from 'antd/es/table';
import Skeleton from './Skeleton';

interface WallFilterFormValues {
  content?: string;
  cateId?: number;
  createTime?: [dayjs.Dayjs, dayjs.Dayjs];
}

export default function WallPage() {
  const web = useWebStore((state) => state.web);

  const [loading, setLoading] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filterParams, setFilterParams] = useState<WallFilterQueryParams>({
    status: 0,
    pageNum: 1,
    pageSize: 8,
  });

  const [wall, setWall] = useState<Wall>({} as Wall);
  const [list, setList] = useState<Wall[]>([]);

  const [replyInfo, setReplyInfo] = useState('');
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const fetchWallList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getWallListAPI(filterParams);
      setList(data.result);
      setTotal(data.total ?? data.result.length);
    } catch (error) {
      console.error(error);
    } finally {
      setSkeletonLoading(false);
      setLoading(false);
    }
  }, [filterParams]);

  const deleteWallItem = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await delWallDataAPI(id);
      await fetchWallList();
      message.success('🎉 删除留言成功');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [fetchWallList]);

  // 获取留言的分类列表
  const [cateList, setCateList] = useState<Cate[]>([]);
  const fetchWallCateList = useCallback(async () => {
    const { data } = await getWallCateListAPI();
    setCateList(data.filter((item) => item.id !== 1));
  }, []);

  useEffect(() => {
    fetchWallCateList();
  }, [fetchWallCateList]);

  useEffect(() => {
    fetchWallList();
  }, [fetchWallList]);

  const [filterForm] = Form.useForm();

  const { onValuesChange: onFilterValuesChange } = useDebouncedChange<WallFilterFormValues>({
    debouncedKeys: ['content'],
    debounceMs: 400,
    getValues: () => filterForm.getFieldsValue() as WallFilterFormValues,
    onApply: (values) => {
      setFilterParams((prev) => ({
        ...prev,
        pageNum: 1,
        content: values.content,
        cateId: values.cateId,
        startDate: values.createTime?.[0]?.valueOf(),
        endDate: values.createTime?.[1]?.valueOf(),
      }));
    },
  });

  const handleToggleChoice = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await updateChoiceAPI(id);
      message.success('🎉 操作成功');
      await fetchWallList();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [fetchWallList]);

  const columns: ColumnsType<Wall> = useMemo(() => [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'center',
      width: 80,
      render: (text: number) => <span className="font-mono text-gray-400 dark:text-gray-500">#{text}</span>,
    },
    {
      title: '分类',
      dataIndex: 'cate',
      key: 'cate',
      width: 100,
      render: ({ name }: { name: string }, { color }: Wall) => (
        <Tag bordered={false} color={color} className="m-0! text-[#565656]! dark:text-white!">
          {name}
        </Tag>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text: string) => <span className="font-medium text-gray-700 dark:text-gray-200">{text || '-'}</span>,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 320,
      render: (text: string, record: Wall) => (
        text ? (
          <Tooltip title={text}>
            <span
              className="line-clamp-1 cursor-pointer text-gray-700 hover:text-primary dark:text-gray-200"
              onClick={() => setWall(record)}
            >
              {text}
            </span>
          </Tooltip>
        ) : (
          <span className="italic text-gray-300 dark:text-gray-500">暂无内容</span>
        )
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      render: (text: string) => <span className="text-gray-500 dark:text-gray-400">{text || '暂无邮箱'}</span>,
    },
    {
      title: '留言时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (date: string) => <span className="text-gray-500 dark:text-gray-400">{dayjs(+date).format('YYYY-MM-DD HH:mm:ss')}</span>,
      sorter: (a: Wall, b: Wall) => a.createTime - b.createTime,
      showSorterTooltip: false,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'center',
      width: 130,
      render: (_: string, record: Wall) => (
        <div className="flex justify-center space-x-2">
          <Tooltip title={record.isChoice === 1 ? '取消精选' : '设为精选'}>
            <Button
              type="text"
              onClick={() => handleToggleChoice(record.id)}
              icon={record.isChoice === 1 ? <StarFilled className="text-yellow-400" /> : <StarOutlined />}
            />
          </Tooltip>

          <Tooltip title="回复">
            <Button
              type="text"
              onClick={() => {
                setWall(record);
                setIsReplyModalOpen(true);
              }}
              icon={<SendOutlined className="text-primary" />}
            />
          </Tooltip>

          <Popconfirm title="警告" description="你确定要删除该留言吗?" okText="确定" cancelText="取消" onConfirm={() => deleteWallItem(record.id)}>
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ], [deleteWallItem, handleToggleChoice]);

  // 回复留言
  const onHandleReply = async () => {
    try {
      setLoading(true);

      await sendReplyWallEmailAPI({
        to: wall?.email,
        recipient: wall?.name,
        your_content: wall?.content,
        reply_content: replyInfo,
        time: dayjs(+wall?.createTime).format('YYYY-MM-DD HH:mm:ss'),
        url: web.url + '/wall/all',
      });

      message.success('🎉 回复留言成功');
      setIsReplyModalOpen(false);
      setReplyInfo('');
      await fetchWallList();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (skeletonLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title value="留言管理" />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="shrink-0 space-y-4 border-b border-gray-100 bg-gray-50/30 p-5 dark:border-strokedark dark:bg-boxdark-2/50">
          <Form form={filterForm} layout="inline" onValuesChange={onFilterValuesChange} className="flex! flex-wrap! items-center! gap-y-2.5!">
            <Form.Item name="content" className="mb-0!">
              <Input
                prefix={<SearchOutlined className="text-gray-400 dark:text-gray-500" />}
                placeholder="搜索留言内容..."
                className="w-[220px]!"
                allowClear
              />
            </Form.Item>
            <Form.Item name="cateId" className="mb-0!">
              <Select
                allowClear
                options={cateList}
                fieldNames={{ label: 'name', value: 'id' }}
                placeholder="选择分类"
                className="w-[160px]!"
              />
            </Form.Item>
            <Form.Item name="createTime" className="mb-0!">
              <RangePicker
                className="w-[260px]!"
                placeholder={['开始日期', '结束日期']}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>
          </Form>
        </div>

        <div className="min-h-0 flex-1">
          <Table
            rowKey="id"
            dataSource={list}
            columns={columns}
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              position: ['bottomRight'],
              current: filterParams.pageNum,
              pageSize: filterParams.pageSize,
              total,
              showTotal: (totalCount) => (
                <div className="mt-[9px] text-xs text-gray-500 dark:text-gray-400">
                  当前第 {filterParams.pageNum ?? 1} / {Math.ceil(totalCount / (filterParams.pageSize ?? 8))} 页 | 共 {totalCount} 条数据
                </div>
              ),
              onChange: (page, size) => setFilterParams((prev) => ({ ...prev, pageNum: page, pageSize: size ?? prev.pageSize ?? 8 })),
              onShowSizeChange: (_, size) => setFilterParams((prev) => ({ ...prev, pageNum: 1, pageSize: size ?? prev.pageSize ?? 8 })),
              className: 'px-6!',
            }}
            className="[&_.ant-table-thead>tr>th]:bg-gray-50! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-gray-500! dark:[&_.ant-table-thead>tr>th]:text-gray-400!"
          />
        </div>
      </div>

      <Modal title="回复留言" open={isReplyModalOpen} footer={null} onCancel={() => setIsReplyModalOpen(false)}>
        <TextArea
          value={replyInfo}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyInfo(e.target.value)}
          placeholder="请输入回复内容"
          autoSize={{ minRows: 3, maxRows: 5 }}
        />

        <div className="flex space-x-4">
          <Button className="w-full mt-2" onClick={() => setIsReplyModalOpen(false)}>
            取消
          </Button>
          <Button type="primary" loading={loading} onClick={onHandleReply} className="w-full mt-2">
            确定
          </Button>
        </div>
      </Modal>
    </div>
  );
}
