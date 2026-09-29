import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Form, message, Pagination } from 'antd';
import { FiMessageSquare, FiPlus, FiSearch } from 'react-icons/fi';

import Title from '@/components/Title';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';

import { delRecordDataAPI, getRecordListAPI } from '@/api/record';
import type { Record, RecordFilterDataForm, RecordFilterQueryParams } from '@/types/app/record';

import { RecordCommentsModal } from './RecordCommentsModal';
import { RecordFeed } from './RecordFeed';
import { RecordList } from './RecordList';
import { RecordToolbar, type RecordView } from './RecordToolbar';
import Skeleton from './Skeleton';

const VIEW_STORAGE_KEY = 'thrivex_record_view';

export default function RecordPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form] = Form.useForm<RecordFilterDataForm>();
  const [recordList, setRecordList] = useState<Record[]>([]);
  const [total, setTotal] = useState(0);
  const [commentsRecord, setCommentsRecord] = useState<Record | null>(null);

  const [view, setView] = useState<RecordView>(() => {
    if (typeof window === 'undefined') return 'feed';
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === 'list' ? 'list' : 'feed';
  });

  const [filter, setFilter] = useState<RecordFilterQueryParams>({
    pageNum: 1,
    pageSize: 8,
  });

  const hasActiveFilters = Boolean(filter.content?.trim() || filter.startDate || filter.endDate);

  const getRecordList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getRecordListAPI({
        content: filter.content,
        startDate: filter.startDate,
        endDate: filter.endDate,
        pageNum: filter.pageNum ?? 1,
        pageSize: filter.pageSize ?? 8,
      });

      if (data.result.length === 0 && (filter.pageNum ?? 1) > 1) {
        setFilter((prev) => ({ ...prev, pageNum: (prev.pageNum ?? 1) - 1 }));
        return;
      }

      setTotal(data.total);
      setRecordList(data.result);
    } catch (error) {
      console.error('获取闪念列表失败：', error);
    } finally {
      setSkeletonLoading(false);
      setLoading(false);
    }
  }, [filter]);

  const delRecordData = useCallback(
    async (id: number) => {
      try {
        setDeletingId(id);
        await delRecordDataAPI(id);
        await getRecordList();
        message.success('闪念已删除');
      } catch (error) {
        console.error('删除闪念失败：', error);
      } finally {
        setDeletingId(null);
      }
    },
    [getRecordList],
  );

  const { onValuesChange: onFilterChange, cancelPending } = useDebouncedChange<RecordFilterDataForm>({
    debouncedKeys: ['content'],
    debounceMs: 400,
    getValues: () => form.getFieldsValue(),
    onApply: (values) => {
      setFilter((prev) => ({
        ...prev,
        pageNum: 1,
        content: values.content,
        startDate: values.createTime?.[0] ? values.createTime[0].valueOf() : undefined,
        endDate: values.createTime?.[1] ? values.createTime[1].valueOf() : undefined,
      }));
    },
  });

  const resetFilters = useCallback(() => {
    cancelPending();
    form.resetFields();
    setFilter((prev) => ({ pageNum: 1, pageSize: prev.pageSize ?? 8 }));
  }, [cancelPending, form]);

  const changeView = useCallback((next: RecordView) => {
    setView(next);
    window.localStorage.setItem(VIEW_STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    void getRecordList();
  }, [getRecordList]);

  const summary = useMemo(() => {
    if (loading && !recordList.length) return '正在加载…';
    return hasActiveFilters ? `筛选出 ${total} 条` : `共 ${total} 条`;
  }, [hasActiveFilters, loading, recordList.length, total]);

  if (skeletonLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="闪念管理">
        <Button
          type="primary"
          icon={<FiPlus />}
          onClick={() => navigate('/create_record')}
          className="inline-flex cursor-pointer items-center gap-1"
        >
          发布闪念
        </Button>
      </Title>

      <div className="mb-3">
        <RecordToolbar
          form={form}
          onValuesChange={onFilterChange}
          view={view}
          onViewChange={changeView}
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
          summary={summary}
        />
      </div>

      {view === 'feed' ? (
        <div className="min-h-0 flex-1 overflow-y-auto pb-1">
          {recordList.length > 0 ? (
            <RecordFeed
              list={recordList}
              onDelete={delRecordData}
              deletingId={deletingId}
              onComments={setCommentsRecord}
            />
          ) : (
            <EmptyState hasActiveFilters={hasActiveFilters} onReset={resetFilters} />
          )}

          {recordList.length > 0 ? (
            <Pagination
              current={filter.pageNum}
              pageSize={filter.pageSize}
              total={total}
              showSizeChanger={false}
              onChange={(page, size) =>
                setFilter((prev) => ({ ...prev, pageNum: page, pageSize: size ?? prev.pageSize }))
              }
              className="mt-1 flex justify-center! pb-1"
            />
          ) : null}
        </div>
      ) : (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {recordList.length > 0 ? (
              <RecordList
                list={recordList}
                loading={loading}
                onDelete={delRecordData}
                deletingId={deletingId}
                onComments={setCommentsRecord}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyState hasActiveFilters={hasActiveFilters} onReset={resetFilters} />
              </div>
            )}
          </div>

          {recordList.length > 0 ? (
            <div className="shrink-0 border-t border-slate-100 px-5 py-2.5 dark:border-strokedark">
              <Pagination
                current={filter.pageNum}
                pageSize={filter.pageSize}
                total={total}
                size="small"
                showSizeChanger={false}
                onChange={(page, size) =>
                  setFilter((prev) => ({ ...prev, pageNum: page, pageSize: size ?? prev.pageSize }))
                }
                className="flex justify-end!"
              />
            </div>
          ) : null}
        </section>
      )}

      <RecordCommentsModal record={commentsRecord} onClose={() => setCommentsRecord(null)} />
    </div>
  );
}

function EmptyState({
  hasActiveFilters,
  onReset,
}: {
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-boxdark-2 dark:text-slate-400">
        {hasActiveFilters ? <FiSearch size={22} /> : <FiMessageSquare size={22} />}
      </div>

      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {hasActiveFilters ? '没有匹配的闪念' : '还没有闪念'}
      </p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {hasActiveFilters
          ? '换个关键词，或者把日期范围放宽一点试试'
          : '闪念是带时间的心情碎片，可以配图、配视频，也可以只写一句话'}
      </p>

      {hasActiveFilters ? (
        <Button icon={<FiSearch size={14} />} onClick={onReset} className="mt-4 cursor-pointer">
          清除筛选条件
        </Button>
      ) : null}
    </div>
  );
}
