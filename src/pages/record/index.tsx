import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Button,
  Form,
  Input,
  message,
  Popconfirm,
  Table,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  FiMessageSquare,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiCalendar,
  FiRotateCcw,
  FiHash,
} from 'react-icons/fi';

import Title from '@/components/Title';
import RangePicker from '@/components/RangePicker';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';

import { delRecordDataAPI, getRecordListAPI } from '@/api/record';
import type { Record, RecordFilterDataForm, RecordFilterQueryParams } from '@/types/app/record';

import Skeleton from './Skeleton';
import { RecordImagesCell } from './recordTableShared';

export default function RecordPage() {
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

  const hasActiveFilters = Boolean(
    filter.content?.trim() || filter.startDate || filter.endDate,
  );

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
        message.success('删除成功');
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
        width: 72,
        align: 'center',
        render: (id: number) => (
          <span className="inline-flex items-center gap-0.5 font-mono text-xs text-slate-400 dark:text-slate-500">
            <FiHash size={11} />
            {id}
          </span>
        ),
      },
      {
        title: '内容',
        dataIndex: 'content',
        key: 'content',
        width: 300,
        render: (text: string) => (
          <Tooltip title={text} placement="topLeft">
            <div className="max-w-md py-0.5">
              {text ? (
                <p className="line-clamp-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {text}
                </p>
              ) : (
                <span className="text-sm italic text-slate-400 dark:text-slate-500">暂无文字</span>
              )}
            </div>
          </Tooltip>
        ),
      },
      {
        title: '图片',
        dataIndex: 'images',
        key: 'images',
        width: 150,
        render: (_: unknown, row: Record) => <RecordImagesCell imagesRaw={row.images} />,
      },
      {
        title: '发布时间',
        dataIndex: 'createTime',
        key: 'createTime',
        render: (text: string | number) => (
          <div className="flex items-center gap-2 text-sm">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-boxdark-2 dark:text-slate-400">
              <FiCalendar size={14} />
            </span>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {dayjs(+text).format('YYYY-MM-DD')}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {dayjs(+text).format('HH:mm')}
              </span>
            </div>
          </div>
        ),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 96,
        align: 'center',
        render: (_: unknown, row: Record) => (
          <div className="flex items-center justify-center gap-0.5">
            <Tooltip title="编辑">
              <Link
                to={`/create_record?id=${row.id}`}
                className="flex size-8 items-center justify-center rounded-lg text-slate-400! transition-colors hover:bg-slate-100! hover:text-primary! dark:hover:bg-white/5! dark:hover:text-primary!"
                aria-label="编辑说说"
              >
                <FiEdit2 size={16} />
              </Link>
            </Tooltip>
            <Popconfirm
              title="删除说说"
              description="删除后无法恢复，确定继续吗？"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => delRecordData(row.id!)}
            >
              <Tooltip title="删除">
                <button
                  type="button"
                  disabled={btnLoading === row.id}
                  className="flex size-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 cursor-pointer"
                  aria-label="删除说说"
                >
                  {btnLoading === row.id ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-red-500" />
                  ) : (
                    <FiTrash2 size={16} />
                  )}
                </button>
              </Tooltip>
            </Popconfirm>
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
        content: values.content,
        startDate: values.createTime?.[0] ? values.createTime[0].valueOf() : undefined,
        endDate: values.createTime?.[1] ? values.createTime[1].valueOf() : undefined,
      }));
    },
  });

  const resetFilters = () => {
    form.resetFields();
    setFilter((prev) => ({
      pageNum: 1,
      pageSize: prev.pageSize ?? 8,
    }));
  };

  useEffect(() => {
    void getRecordList();
  }, [getRecordList]);

  if (skeletonLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="说说管理">
        <Link to="/create_record">
          <Button type="primary" icon={<FiPlus />} className="inline-flex items-center gap-1">
            发布闪念
          </Button>
        </Link>
      </Title>


      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <header className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
          <Form form={form} onValuesChange={onFilterChange}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <Form.Item name="content" className="mb-0! w-full sm:w-56">
                  <Input
                    allowClear
                    placeholder="搜索说说内容…"
                    prefix={<FiSearch className="text-slate-400" size={15} />}
                  />
                </Form.Item>
                <Form.Item name="createTime" className="mb-0! w-full sm:w-auto">
                  <RangePicker
                    className="w-full sm:w-56!"
                    placeholder={['开始日期', '结束日期']}
                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                  />
                </Form.Item>
                <Tooltip title="重置筛选">
                  <Button
                    type="text"
                    icon={<FiRotateCcw size={15} />}
                    onClick={resetFilters}
                    disabled={!hasActiveFilters}
                    className="shrink-0 text-slate-400 hover:text-slate-600 disabled:opacity-40 dark:hover:text-slate-200"
                  />
                </Tooltip>
              </div>
            </div>
          </Form>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Table
            rowKey="id"
            dataSource={recordList}
            columns={columns}
            loading={loading}
            scroll={{ x: 'max-content' }}
            pagination={{
              position: ['bottomRight'],
              current: filter.pageNum,
              pageSize: filter.pageSize,
              total,
              showTotal: (totalCount) => {
                const pageSize = filter.pageSize ?? 8;
                const pageNum = filter.pageNum ?? 1;
                const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
                return (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    第 {pageNum} / {totalPages} 页 · 共 {totalCount} 条
                  </span>
                );
              },
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
              className: 'px-5! py-3!',
            }}
            className="min-h-0 flex-1 [&_.ant-table-thead>tr>th]:bg-slate-50! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-slate-500! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! dark:[&_.ant-table-thead>tr>th]:text-slate-400!"
            locale={{
              emptyText: (
                <div className="py-14 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2 dark:text-slate-500">
                    <FiMessageSquare size={22} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {hasActiveFilters
                      ? '没有匹配的说说，试试调整关键词或日期范围'
                      : '还没有说说，点击右上角「发布闪念」写下第一条吧'}
                  </p>
                </div>
              ),
            }}
          />
        </div>
      </section>
    </div>
  );
}
