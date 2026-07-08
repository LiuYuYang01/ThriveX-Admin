import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';

import {
  message,
  Table,
  Popconfirm,
  Button,
  Modal,
  Form,
  Input,
  Tooltip,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import type { ColumnsType } from 'antd/es/table';
import {
  FiMessageSquare,
  FiSearch,
  FiTrash2,
  FiCornerUpRight,
  FiUser,
  FiMail,
  FiGlobe,
  FiFileText,
  FiX,
  FiRotateCcw,
  FiCalendar,
  FiInbox,
} from 'react-icons/fi';

import { addCommentDataAPI, getCommentListAPI, delCommentDataAPI } from '@/api/comment';
import RangePicker from '@/components/RangePicker';
import type { Comment, CommentFilterQueryParams } from '@/types/app/comment';
import { useWebStore, useUserStore } from '@/stores';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';
import { CommentAvatar, ExternalLink } from './shared';
import Skeleton from './Skeleton';
import {
  commentExpandColumn,
  commentTableExpandable,
  commentTableTreeClassName,
  findInCommentTree,
  normalizeCommentTree,
} from './commentTree';

export default function ArticleCommentPanel() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const isFirstLoadRef = useRef(true);

  const web = useWebStore((state) => state.web);
  const user = useUserStore((state) => state.user);

  const [btnLoading, setBtnLoading] = useState(false);
  const [selected, setSelected] = useState<Comment | null>(null);
  const [list, setList] = useState<Comment[]>([]);

  const [filterForm] = Form.useForm();
  const tableExpandable = useMemo(() => commentTableExpandable<Comment>(), []);

  const getCommentList = useCallback(async () => {
    try {
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getCommentListAPI();
      setList(normalizeCommentTree(data.result));
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void getCommentList();
  }, [getCommentList]);

  const onFilterChange = useCallback(async (values: CommentFilterQueryParams) => {
    try {
      setLoading(true);
      const query = {
        content: values?.content,
        startDate: values.createTime?.[0]?.valueOf(),
        endDate: values.createTime?.[1]?.valueOf(),
      };
      const { data } = await getCommentListAPI(query);
      const tree = normalizeCommentTree(data.result);
      setList(tree);
      setSelected((prev) => {
        if (!prev?.id) return prev;
        return findInCommentTree(tree, prev.id) ?? null;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const { onValuesChange: onFilterValuesChange } = useDebouncedChange<CommentFilterQueryParams>({
    debouncedKeys: ['content'],
    debounceMs: 400,
    getValues: () => filterForm.getFieldsValue() as CommentFilterQueryParams,
    onApply: (values) => void onFilterChange(values),
  });

  const resetFilters = () => {
    filterForm.resetFields();
    void onFilterChange({} as CommentFilterQueryParams);
  };

  const delCommentData = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        await delCommentDataAPI(id);
        if (selected?.id === id) setSelected(null);
        await getCommentList();
        message.success('🎉 删除评论成功');
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    },
    [getCommentList, selected?.id],
  );

  const openReply = useCallback((record: Comment) => {
    setSelected(record);
    setReplyInfo('');
    setIsReplyModalOpen(true);
  }, []);

  const columns: ColumnsType<Comment> = useMemo(
    () => [
      commentExpandColumn,
      {
        title: '评论者',
        dataIndex: 'name',
        key: 'name',
        width: 168,
        render: (_: string, record: Comment) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(record);
            }}
            className="flex w-full min-w-0 items-center gap-2.5 text-left transition-opacity hover:opacity-80 cursor-pointer"
          >
            <CommentAvatar avatar={record.avatar} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {record.name || '匿名'}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                {record.email || '暂无邮箱'}
              </p>
            </div>
          </button>
        ),
      },
      {
        title: '评论内容',
        dataIndex: 'content',
        key: 'content',
        ellipsis: true,
        render: (text: string, record: Comment) =>
          text ? (
            <Tooltip placement="topLeft" title={text}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(record);
                }}
                className={`line-clamp-2 text-left text-sm leading-relaxed transition-colors cursor-pointer ${selected?.id === record.id
                  ? 'text-primary'
                  : 'text-slate-700 hover:text-primary dark:text-slate-200'
                  }`}
              >
                {text}
              </button>
            </Tooltip>
          ) : (
            <span className="text-xs italic text-slate-400 dark:text-slate-500">暂无内容</span>
          ),
      },
      {
        title: '所属文章',
        dataIndex: 'articleTitle',
        key: 'articleTitle',
        width: 200,
        ellipsis: true,
        render: (text: string, record: Comment) =>
          text ? (
            <Tooltip placement="topLeft" title={text}>
              <ExternalLink href={`${web.url}/article/${record.articleId}`}>{text}</ExternalLink>
            </Tooltip>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500">未绑定文章</span>
          ),
      },
      {
        title: '评论时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 120,
        render: (date: number) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium tabular-nums text-slate-700 dark:text-slate-200">
              {dayjs(date).format('YYYY-MM-DD')}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
              {dayjs(date).format('HH:mm')}
            </span>
          </div>
        ),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        align: 'center',
        width: 96,
        render: (_: string, record: Comment) => (
          <div className="flex items-center justify-center gap-0.5">
            <Tooltip title="回复">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openReply(record);
                }}
                aria-label={`回复 ${record.name}`}
                className="flex size-8 items-center justify-center rounded-lg text-slate-400! transition-colors hover:bg-slate-100! hover:text-primary! dark:hover:bg-white/5! dark:hover:text-primary! cursor-pointer"
              >
                <FiCornerUpRight size={16} />
              </button>
            </Tooltip>
            <Popconfirm
              title="删除评论"
              description={`确定删除「${record.name || '该用户'}」的这条评论吗？`}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => delCommentData(record.id!)}
            >
              <Tooltip title="删除">
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="删除评论"
                  className="flex size-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 cursor-pointer"
                >
                  <FiTrash2 size={16} />
                </button>
              </Tooltip>
            </Popconfirm>
          </div>
        ),
      },
    ],
    [delCommentData, openReply, selected?.id, web.url],
  );

  const [replyInfo, setReplyInfo] = useState('');
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const onHandleReply = async () => {
    if (!selected?.id) return;
    if (!replyInfo.trim()) {
      message.warning('请输入回复内容');
      return;
    }

    try {
      setBtnLoading(true);
      await addCommentDataAPI({
        avatar: user.avatar,
        url: web.url,
        content: replyInfo,
        commentId: selected.id,
        status: 1,
        email: user.email,
        name: user.name,
        articleId: selected.articleId ?? 0,
        createTime: new Date().getTime(),
      });

      message.success('🎉 回复评论成功');
      setIsReplyModalOpen(false);
      setReplyInfo('');
      await getCommentList();
    } catch (error) {
      console.error(error);
    } finally {
      setBtnLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  const DetailPanel = ({ record }: { record: Comment }) => (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">评论详情</h3>
        <button
          type="button"
          onClick={() => setSelected(null)}
          aria-label="关闭详情"
          className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-200 cursor-pointer"
        >
          <FiX size={16} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-strokedark">
          <CommentAvatar avatar={record.avatar} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {record.name || '匿名'}
            </p>
            <time className="mt-0.5 block font-mono text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
              {dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss')}
            </time>
          </div>
        </div>

        <div className="px-4 py-3.5">
          <p className="border-l-2 border-primary/40 pl-3 text-[15px] leading-relaxed whitespace-pre-wrap wrap-break-word text-slate-800 dark:text-slate-100">
            {record.content || '—'}
          </p>
        </div>

        <footer className="space-y-2.5 border-t border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-strokedark dark:bg-boxdark-2/40">
          <div className="flex min-w-0 items-start gap-2.5 text-xs">
            <FiMail size={14} className="mt-0.5 shrink-0 text-slate-400" />
            <span className="w-8 shrink-0 text-slate-400">邮箱</span>
            <span className="min-w-0 flex-1 break-all text-slate-600 dark:text-slate-300">
              {record.email || '暂无'}
            </span>
          </div>
          <div className="flex min-w-0 items-start gap-2.5 text-xs">
            <FiGlobe size={14} className="mt-0.5 shrink-0 text-slate-400" />
            <span className="w-8 shrink-0 text-slate-400">网站</span>
            <div className="min-w-0 flex-1">
              {record.url ? (
                <ExternalLink href={record.url}>{record.url}</ExternalLink>
              ) : (
                <span className="text-slate-400">暂无</span>
              )}
            </div>
          </div>
          <div className="flex min-w-0 items-start gap-2.5 text-xs">
            <FiFileText size={14} className="mt-0.5 shrink-0 text-slate-400" />
            <span className="w-8 shrink-0 text-slate-400">文章</span>
            <div className="min-w-0 flex-1">
              {record.articleTitle ? (
                <ExternalLink href={`${web.url}/article/${record.articleId}`}>
                  {record.articleTitle}
                </ExternalLink>
              ) : (
                <span className="text-slate-400">未绑定文章</span>
              )}
            </div>
          </div>
        </footer>
      </div>

      <div className="shrink-0 border-t border-slate-100 p-4 dark:border-strokedark">
        <Button
          type="primary"
          block
          icon={<FiCornerUpRight />}
          onClick={() => openReply(record)}
          className="h-10!"
        >
          回复这条评论
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <header className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
            <Form form={filterForm} onValuesChange={onFilterValuesChange}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <Form.Item name="content" className="mb-0! w-full sm:w-52">
                    <Input
                      allowClear
                      placeholder="搜索评论内容…"
                      prefix={<FiSearch className="text-slate-400" size={15} />}
                    />
                  </Form.Item>
                  <Form.Item name="createTime" className="mb-0! w-full sm:w-auto">
                    <RangePicker className="w-full sm:w-56!" />
                  </Form.Item>
                  <Tooltip title="重置筛选">
                    <Button
                      type="text"
                      icon={<FiRotateCcw size={15} />}
                      onClick={resetFilters}
                      className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    />
                  </Tooltip>
                </div>
                <p className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                  <FiCalendar className="mr-1 inline -mt-px" size={12} />
                  点击箭头展开回复，点击行查看详情
                </p>
              </div>
            </Form>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <Table
              rowKey="id"
              dataSource={list}
              columns={columns}
              loading={loading}
              scroll={{ x: 'max-content' }}
              expandable={tableExpandable}
              onRow={(record) => ({
                onClick: () => setSelected(record),
                className: `cursor-pointer transition-colors ${selected?.id === record.id
                  ? '[&>td]:bg-primary/5! dark:[&>td]:bg-primary/10!'
                  : 'hover:[&>td]:bg-slate-50/80! dark:hover:[&>td]:bg-boxdark-2/50!'
                  }`,
              })}
              pagination={{
                position: ['bottomRight'],
                pageSize: 8,
                showSizeChanger: false,
                className: 'px-4! py-3!',
                showTotal: (total) => (
                  <span className="text-xs text-slate-500 dark:text-slate-400">共 {total} 条</span>
                ),
              }}
              className={commentTableTreeClassName}
              locale={{
                emptyText: (
                  <div className="py-14 text-center">
                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2 dark:text-slate-500">
                      <FiInbox size={22} />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      暂无评论，读者留言后会显示在这里
                    </p>
                  </div>
                ),
              }}
            />
          </div>
        </section>

        <aside
          className={`w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark lg:w-[320px] xl:w-[360px] ${selected ? 'flex min-h-[280px] flex-col lg:min-h-0' : 'hidden lg:flex lg:min-h-0 lg:flex-col'
            }`}
        >
          {selected ? (
            <DetailPanel record={selected} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2 dark:text-slate-500">
                <FiMessageSquare size={22} />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">选择一条评论</p>
              <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                在左侧列表点击任意行，可在此查看完整内容与联系方式
              </p>
            </div>
          )}
        </aside>
      </div>

      <Modal
        title={
          <span className="inline-flex items-center gap-2">
            <FiCornerUpRight className="text-primary" />
            回复评论
          </span>
        }
        open={isReplyModalOpen}
        footer={null}
        onCancel={() => setIsReplyModalOpen(false)}
        destroyOnClose
        classNames={{ body: 'pt-2!' }}
      >
        {selected && (
          <div className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-3 dark:border-strokedark dark:bg-boxdark-2/60">
            <div className="mb-1.5 flex items-center gap-2">
              <FiUser size={14} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {selected.name || '匿名'}
              </span>
            </div>
            <p className="line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {selected.content}
            </p>
          </div>
        )}

        <TextArea
          value={replyInfo}
          onChange={(e) => setReplyInfo(e.target.value)}
          placeholder="写下你的回复，将作为子评论展示在原文下方…"
          autoSize={{ minRows: 4, maxRows: 8 }}
          className="rounded-lg!"
        />

        <div className="mt-4 flex gap-3">
          <Button className="h-10! flex-1" onClick={() => setIsReplyModalOpen(false)}>
            取消
          </Button>
          <Button
            type="primary"
            loading={btnLoading}
            onClick={onHandleReply}
            icon={<FiCornerUpRight />}
            className="h-10! flex-1"
          >
            发送回复
          </Button>
        </div>
      </Modal>
    </>
  );
}
