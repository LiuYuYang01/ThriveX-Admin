import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';

import { message, Table, Popconfirm, Button, Modal, Form, Input, DatePicker, Tooltip } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, SendOutlined } from '@ant-design/icons';

import { addCommentDataAPI, getCommentListAPI, delCommentDataAPI } from '@/api/comment';
import Title from '@/components/Title';
import { Comment, CommentFilterQueryParams } from '@/types/app/comment';
import { useWebStore, useUserStore } from '@/stores';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';

export default () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);

  const web = useWebStore((state) => state.web);
  const user = useUserStore((state) => state.user);

  const [btnLoading, setBtnLoading] = useState(false);

  const [comment, setComment] = useState<Comment>({} as Comment);
  const [list, setList] = useState<Comment[]>([]);

  const getCommentList = async () => {
    try {
      // 如果是第一次加载，使用 initialLoading
      // 否则使用 loading
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getCommentListAPI();
      setList(data.result);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    getCommentList();
  }, []);

  const [filterForm] = Form.useForm();

  const onFilterChange = async (values: CommentFilterQueryParams) => {
    try {
      setLoading(true);
      const query = {
        content: values?.content,
        startDate: values.createTime?.[0]?.valueOf(),
        endDate: values.createTime?.[1]?.valueOf(),
      };
      const { data } = await getCommentListAPI(query);
      setList(data.result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const { onValuesChange: onFilterValuesChange } = useDebouncedChange<CommentFilterQueryParams>({
    debouncedKeys: ['content'],
    debounceMs: 400,
    getValues: () => filterForm.getFieldsValue() as CommentFilterQueryParams,
    onApply: (values) => void onFilterChange(values),
  });

  const columns: ColumnsType<Comment> = [
    {
      title: '评论者名称',
      dataIndex: 'name',
      key: 'name',
      width: 130,
      render: (text: string) => <span className="text-gray-700 dark:text-gray-200 font-medium">{text || '-'}</span>,
    },
    {
      title: '评论内容',
      dataIndex: 'content',
      key: 'content',
      width: 260,
      render: (text: string, record: Comment) => (
        <>
          {text ? (
            <Tooltip
              placement="topLeft"
              title={text}
            >
              <p className="line-clamp-1 hover:text-primary cursor-pointer text-gray-700 dark:text-gray-200"
                onClick={() => {
                  setComment(record);
                }}>{text}</p>
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
      title: '所属文章',
      dataIndex: 'articleTitle',
      key: 'articleTitle',
      width: 260,
      render: (text: string, record: Comment) =>
        text ? (
          <Tooltip placement="topLeft" title={text}>
            <a href={`${web.url}/article/${record.articleId}`} target="_blank" className="line-clamp-1 hover:text-primary text-gray-600 dark:text-gray-300" rel="noreferrer">
              {text}
            </a>
          </Tooltip>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">该评论暂未绑定文章</span>
        ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 210,
      render: (text: string) => <span className="text-gray-500 dark:text-gray-400">{text || '暂无邮箱'}</span>,
    },
    {
      title: '网站',
      dataIndex: 'url',
      key: 'url',
      width: 210,
      render: (url: string) =>
        url ? (
          <a href={url} target="_blank" className="hover:text-primary text-gray-600 dark:text-gray-300" rel="noreferrer">
            {url}
          </a>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">无网站</span>
        ),
    },
    {
      title: '评论时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (date: number) => (
        <div className="flex flex-col">
          <span className="text-gray-700 dark:text-gray-200 font-medium">{dayjs(date).format('YYYY-MM-DD')}</span>
          <span className="text-gray-400 dark:text-gray-500 text-xs">{dayjs(date).format('HH:mm:ss')}</span>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'center',
      width: 110,
      render: (_: string, record: Comment) => (
        <div className="flex justify-center space-x-2">
          <Tooltip title="回复">
            <Button
              type="text"
              onClick={() => {
                setComment(record);
                setIsReplyModalOpen(true);
              }}
              icon={<SendOutlined className="text-primary" />}
            />
          </Tooltip>

          <Popconfirm title="警告" description="你确定要删除吗" okText="确定" cancelText="取消" onConfirm={() => delCommentData(record.id!)}>
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const { RangePicker } = DatePicker;

  const delCommentData = async (id: number) => {
    setLoading(true);

    try {
      await delCommentDataAPI(id);
      await getCommentList();
      message.success('🎉 删除评论成功');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // 回复内容
  const [replyInfo, setReplyInfo] = useState('');
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const onHandleReply = async () => {
    try {
      setBtnLoading(true);

      await addCommentDataAPI({
        avatar: user.avatar,
        url: web.url,
        content: replyInfo,
        commentId: comment?.id ?? 0,
        auditStatus: 1,
        email: user.email,
        name: user.name,
        articleId: comment?.articleId ?? 0,
        createTime: new Date().getTime(),
      });

      message.success('🎉 回复评论成功');
      getCommentList();
      setIsReplyModalOpen(false);
      setReplyInfo('');
    } catch (error) {
      console.error(error);
    } finally {
      setBtnLoading(false);
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
          <div className="flex gap-4 flex-wrap mb-6">
            <div className="skeleton h-9" style={{ width: 200 }} />
            <div className="skeleton h-9" style={{ width: 200 }} />
            <div className="skeleton h-9" style={{ width: 280 }} />
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
      <Title value="评论管理" />

      <div className="bg-white dark:bg-boxdark rounded-2xl shadow-xs border border-gray-100 dark:border-strokedark overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-strokedark bg-gray-50/30 dark:bg-boxdark-2/50 space-y-4">
          <Form
            form={filterForm}
            layout="inline"
            onValuesChange={onFilterValuesChange}
            className="flex! flex-wrap! items-center! gap-y-2.5!"
          >
            <Form.Item name="content" className="mb-0!">
              <Input
                placeholder="搜索评论内容..."
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
          </Form>
        </div>

        <Table
          rowKey="id"
          dataSource={list}
          columns={columns}
          loading={loading}
          scroll={{ x: 1300 }}
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

      <Modal title="回复评论" open={isReplyModalOpen} footer={null} onCancel={() => setIsReplyModalOpen(false)}>
        <TextArea value={replyInfo} onChange={(e) => setReplyInfo(e.target.value)} placeholder="请输入回复内容" autoSize={{ minRows: 3, maxRows: 5 }} />

        <div className="flex space-x-4">
          <Button className="w-full mt-2" onClick={() => setIsReplyModalOpen(false)}>
            取消
          </Button>
          <Button type="primary" loading={btnLoading} onClick={onHandleReply} className="w-full mt-2">
            确定
          </Button>
        </div>
      </Modal>
    </div>
  );
};
