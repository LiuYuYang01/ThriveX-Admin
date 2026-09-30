import { useState, useEffect, useRef, useCallback } from 'react';
import type { Dayjs } from 'dayjs';

import {
  message,
  Button,
  Form,
  Input,
  Tooltip,
  Modal,
  Pagination,
  Spin,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { FiCornerUpRight, FiRotateCcw, FiSearch, FiUser, FiX, FiZap } from 'react-icons/fi';

import {
  replyRecordCommentDataAPI,
  delRecordCommentDataAPI,
  getRecordCommentListAPI,
} from '@/api/recordComment';
import RangePicker from '@/components/RangePicker';
import Empty from '@/components/Empty';
import type { RecordComment, RecordCommentFilterQueryParams } from '@/types/app/recordComment';
import { useWebStore, useUserStore } from '@/stores';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';
import { CommentCard, type CommentCardItem } from './shared';
import Skeleton from './Skeleton';
import { buildCommentTree } from './commentTree';

const PAGE_SIZE = 8;

type FilterValues = RecordCommentFilterQueryParams & { createTime?: [Dayjs, Dayjs] };

interface Props {
  initRecordId?: number | null;
  onClearRecordFilter?: () => void;
  onTotalChange?: (total: number) => void;
}

export default function RecordCommentPanel({
  initRecordId,
  onClearRecordFilter,
  onTotalChange,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const isFirstLoadRef = useRef(true);
  const [page, setPage] = useState(1);

  const web = useWebStore((state) => state.web);
  const user = useUserStore((state) => state.user);

  const [btnLoading, setBtnLoading] = useState(false);
  const [replyInfo, setReplyInfo] = useState('');
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selected, setSelected] = useState<CommentCardItem | null>(null);
  const [list, setList] = useState<RecordComment[]>([]);
  const [recordIdFilter, setRecordIdFilter] = useState<number | undefined>(
    initRecordId ?? undefined,
  );

  const [filterForm] = Form.useForm();

  useEffect(() => {
    if (initRecordId) {
      setRecordIdFilter(initRecordId);
    }
  }, [initRecordId]);

  const buildQuery = useCallback(
    (values?: FilterValues) => {
      const query: RecordCommentFilterQueryParams = {
        content: values?.content,
        startDate: values?.createTime?.[0]?.valueOf(),
        endDate: values?.createTime?.[1]?.valueOf(),
        status: 1,
        pageNum: 1,
        pageSize: 9999,
      };

      if (recordIdFilter) {
        query.recordId = recordIdFilter;
      }

      return query;
    },
    [recordIdFilter],
  );

  const getCommentList = useCallback(
    async (values?: FilterValues) => {
      try {
        if (isFirstLoadRef.current) {
          setInitialLoading(true);
        } else {
          setLoading(true);
        }

        const { data } = await getRecordCommentListAPI(buildQuery(values));
        setList(buildCommentTree(data.result ?? []));
        onTotalChange?.(data.total ?? 0);
        isFirstLoadRef.current = false;
      } catch (error) {
        console.error(error);
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    },
    [buildQuery, onTotalChange],
  );

  useEffect(() => {
    void getCommentList(filterForm.getFieldsValue());
  }, [getCommentList, recordIdFilter, filterForm]);

  const onFilterChange = useCallback(
    async (values: FilterValues) => {
      try {
        setLoading(true);
        const { data } = await getRecordCommentListAPI(buildQuery(values));
        setList(buildCommentTree(data.result ?? []));
        onTotalChange?.(data.total ?? 0);
        setPage(1);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [buildQuery, onTotalChange],
  );

  const { onValuesChange: onFilterValuesChange } = useDebouncedChange<FilterValues>({
    debouncedKeys: ['content'],
    debounceMs: 400,
    getValues: () => filterForm.getFieldsValue(),
    onApply: (values) => void onFilterChange(values),
  });

  const resetFilters = () => {
    const hadRecordFilter = Boolean(recordIdFilter);
    filterForm.resetFields();
    setRecordIdFilter(undefined);
    setPage(1);
    onClearRecordFilter?.();
    if (!hadRecordFilter) {
      void onFilterChange({});
    }
  };

  const delCommentData = useCallback(
    async (item: CommentCardItem) => {
      if (!item.id) return;
      try {
        setLoading(true);
        await delRecordCommentDataAPI(item.id);
        await getCommentList(filterForm.getFieldsValue());
        message.success('评论已删除');
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    },
    [filterForm, getCommentList],
  );

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
      await replyRecordCommentDataAPI({
        avatar: user.avatar,
        url: web.url,
        content: replyInfo,
        commentId: selected.id,
        status: 1,
        email: user.email,
        name: user.name,
        recordId: selected.recordId!,
        createTime: Date.now(),
      });

      message.success('回复成功');
      setIsReplyModalOpen(false);
      setReplyInfo('');
      await getCommentList(filterForm.getFieldsValue());
    } catch (error) {
      console.error(error);
    } finally {
      setBtnLoading(false);
    }
  };

  const getSource = useCallback(
    (item: CommentCardItem) => ({
      label: item.recordContent || `闪念 #${item.recordId}`,
      href: `${web.url}/record`,
    }),
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
            {recordIdFilter && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
                闪念 #{recordIdFilter}
                <button
                  type="button"
                  onClick={() => {
                    setRecordIdFilter(undefined);
                    setPage(1);
                    onClearRecordFilter?.();
                  }}
                  className="flex size-4 cursor-pointer items-center justify-center rounded-full hover:bg-primary/10"
                  aria-label="清除闪念筛选"
                >
                  <FiX size={12} />
                </button>
              </span>
            )}
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
                    sourceIcon={FiZap}
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
