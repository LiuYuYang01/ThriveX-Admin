import { useState, useEffect, useRef, useCallback } from 'react';

import { message, Button, Form, Input, Modal, Tooltip, Pagination, Spin } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { FiCornerUpRight, FiFileText, FiRotateCcw, FiSearch, FiUser } from 'react-icons/fi';

import { replyCommentDataAPI, getCommentListAPI, delCommentDataAPI } from '@/api/comment';
import RangePicker from '@/components/RangePicker';
import Empty from '@/components/Empty';
import type { Comment, CommentFilterQueryParams } from '@/types/app/comment';
import { useWebStore, useUserStore } from '@/stores';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';
import { CommentCard, type CommentCardItem } from './shared';
import Skeleton from './Skeleton';
import { normalizeCommentTree } from './commentTree';

const PAGE_SIZE = 8;

export default function ArticleCommentPanel({
  onTotalChange,
}: {
  onTotalChange?: (total: number) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const isFirstLoadRef = useRef(true);
  const [page, setPage] = useState(1);

  const web = useWebStore((state) => state.web);
  const user = useUserStore((state) => state.user);

  const [btnLoading, setBtnLoading] = useState(false);
  const [selected, setSelected] = useState<CommentCardItem | null>(null);
  const [list, setList] = useState<Comment[]>([]);

  const [filterForm] = Form.useForm();

  const getCommentList = useCallback(async () => {
    try {
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getCommentListAPI();
      setList(normalizeCommentTree(data.result));
      onTotalChange?.(data.total ?? 0);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, [onTotalChange]);

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
      setList(normalizeCommentTree(data.result));
      onTotalChange?.(data.total ?? 0);
      setPage(1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [onTotalChange]);

  const { onValuesChange: onFilterValuesChange } = useDebouncedChange<CommentFilterQueryParams>({
    debouncedKeys: ['content'],
    debounceMs: 400,
    getValues: () => filterForm.getFieldsValue() as CommentFilterQueryParams,
    onApply: (values) => void onFilterChange(values),
  });

  const resetFilters = () => {
    filterForm.resetFields();
    setPage(1);
    void onFilterChange({} as CommentFilterQueryParams);
  };

  const delCommentData = useCallback(
    async (item: CommentCardItem) => {
      if (!item.id) return;
      try {
        setLoading(true);
        await delCommentDataAPI(item.id);
        await getCommentList();
        message.success('🎉 删除评论成功');
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    },
    [getCommentList],
  );

  const [replyInfo, setReplyInfo] = useState('');
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const openReply = useCallback((item: CommentCardItem) => {
    setSelected(item);
    setReplyInfo('');
    setIsReplyModalOpen(true);
  }, []);

  const onHandleReply = async () => {
    if (!selected?.id) return;
    if (!replyInfo.trim()) {
      message.warning('请输入回复内容');
      return;
    }

    try {
      setBtnLoading(true);
      await replyCommentDataAPI({
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

  const getSource = useCallback(
    (item: CommentCardItem) =>
      item.articleId
        ? {
            label: item.articleTitle || `文章 #${item.articleId}`,
            href: `${web.url}/article/${item.articleId}`,
          }
        : null,
    [web.url],
  );

  if (initialLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  const pageList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-3 shrink-0 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-strokedark dark:bg-boxdark">
        <Form form={filterForm} onValuesChange={onFilterValuesChange}>
          <div className="flex flex-wrap items-center gap-2">
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
                className="shrink-0 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              />
            </Tooltip>
          </div>
        </Form>
      </header>

      <Spin
        spinning={loading}
        className="flex min-h-0 flex-1 flex-col [&_.ant-spin-container]:flex [&_.ant-spin-container]:min-h-0 [&_.ant-spin-container]:flex-1 [&_.ant-spin-container]:flex-col"
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          {list.length === 0 ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white dark:border-strokedark dark:bg-boxdark">
              <Empty />
            </div>
          ) : (
            <ul className="space-y-3">
              {pageList.map((item) => (
                <li key={item.id}>
                  <CommentCard
                    item={item}
                    sourceIcon={FiFileText}
                    getSource={getSource}
                    onReply={openReply}
                    onDelete={delCommentData}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Spin>

      {list.length > 0 && (
        <footer className="flex shrink-0 items-center justify-end gap-2 pt-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">共 {list.length} 条</span>
          {list.length > PAGE_SIZE && (
            <Pagination
              size="small"
              showSizeChanger={false}
              current={page}
              pageSize={PAGE_SIZE}
              total={list.length}
              onChange={(p) => setPage(p)}
              className="m-0!"
            />
          )}
        </footer>
      )}

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
    </div>
  );
}
