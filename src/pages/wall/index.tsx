import { useEffect, useState, useRef } from 'react';

import { Button, DatePicker, Form, Input, Modal, Popconfirm, Select, Table, Tag, message, Tooltip } from 'antd';
import dayjs from 'dayjs';
import TextArea from 'antd/es/input/TextArea';
import { DeleteOutlined, SendOutlined, StarFilled, StarOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';

import { getWallListAPI, delWallDataAPI, getWallCateListAPI, updateChoiceAPI } from '@/api/wall';
import { sendReplyWallEmailAPI } from '@/api/email';
import Title from '@/components/Title';
import { useWebStore } from '@/stores';
import type { Cate, Wall, FilterForm, FilterWall } from '@/types/app/wall';
import { ColumnsType } from 'antd/es/table';

export default () => {
  const web = useWebStore((state) => state.web);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);

  const [wall, setWall] = useState<Wall>({} as Wall);
  const [list, setList] = useState<Wall[]>([]);

  const [replyInfo, setReplyInfo] = useState('');
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const getWallList = async () => {
    try {
      // 如果是第一次加载，使用 initialLoading
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getWallListAPI();
      setList(data);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  const delWallData = async (id: number) => {
    setLoading(true);

    try {
      await delWallDataAPI(id);
      getWallList();
      message.success('🎉 删除留言成功');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }

    setLoading(false);
  };

  // 获取留言的分类列表
  const [cateList, setCateList] = useState<Cate[]>([]);
  const getCateList = async () => {
    const { data } = await getWallCateListAPI();
    setCateList((data as Cate[]).filter((item) => item.id !== 1));
  };

  useEffect(() => {
    getWallList();
    getCateList();
  }, []);

  const [filterForm] = Form.useForm();

  const onFilterReset = () => {
    filterForm.resetFields();
    getWallList();
  };

  const columns: ColumnsType<Wall> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'center',
      width: 80,
      render: (text: number) => <span className="text-gray-400 dark:text-gray-500 font-mono">#{text}</span>,
    },
    {
      title: '分类',
      dataIndex: 'cate',
      key: 'cate',
      width: 100,
      render: ({ name }: { name: string }, { color }: Wall) => (
        <Tag bordered={false} color={color} className="text-[#565656]! dark:text-white! m-0!">
          {name}
        </Tag>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text: string) => <span className="text-gray-700 dark:text-gray-200 font-medium">{text || '-'}</span>,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 320,
      render: (text: string, record: Wall) => (
        <>
          {text ? (
            <Tooltip
              title={text}
            >
              <span className="hover:text-primary cursor-pointer line-clamp-1 text-gray-700 dark:text-gray-200"
                onClick={() => {
                  setWall(record);
                }}>{text}</span>
            </Tooltip>
          )
            : (
              <span className="text-gray-300 dark:text-gray-500 italic">暂无内容</span>
            )
          }
        </>
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
      width: 180,
      render: (date: string) => <span className="text-gray-500 dark:text-gray-400">{dayjs(+date).format('YYYY-MM-DD HH:mm:ss')}</span>,
      sorter: (a: Wall, b: Wall) => +a.createTime! - +b.createTime!,
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
              onClick={async () => {
                try {
                  setLoading(true);
                  await updateChoiceAPI(record.id);
                  message.success('🎉 操作成功');
                  getWallList();
                } catch (error) {
                  console.error(error);
                } finally {
                  setLoading(false);
                }
              }}
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

          <Popconfirm title="警告" description="你确定要删除吗" okText="确定" cancelText="取消" onConfirm={() => delWallData(record.id)}>
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const { RangePicker } = DatePicker;

  const onFilterSubmit = async (values: FilterForm) => {
    try {
      setLoading(true);

      const query: FilterWall = {
        key: values.content,
        cateId: values.cateId,
        startDate: values.createTime?.[0]?.valueOf()?.toString(),
        endDate: values.createTime?.[1]?.valueOf()?.toString(),
      };

      const { data } = await getWallListAPI({ query });
      setList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
      getWallList();

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

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
              <div className="skeleton h-9" style={{ width: 180 }} />
              <div className="skeleton h-9" style={{ width: 180 }} />
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
      <Title value="留言管理" />

      <div className="bg-white dark:bg-boxdark rounded-2xl shadow-xs border border-gray-100 dark:border-strokedark overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-strokedark bg-gray-50/30 dark:bg-boxdark-2/50 space-y-4">
          <Form form={filterForm} layout="inline" onFinish={onFilterSubmit} className="flex! flex-wrap! items-center! gap-y-2.5!">
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
          dataSource={list}
          columns={columns}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            position: ['bottomRight'],
            defaultPageSize: 8,
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

      <Modal title="回复留言" open={isReplyModalOpen} footer={null} onCancel={() => setIsReplyModalOpen(false)}>
        <TextArea value={replyInfo} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyInfo(e.target.value)} placeholder="请输入回复内容" autoSize={{ minRows: 3, maxRows: 5 }} />

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
};
