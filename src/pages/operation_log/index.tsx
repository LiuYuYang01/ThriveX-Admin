import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Empty, Form, Input, message, Modal, notification, Popconfirm, Select, Spin, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import DatePicker from 'antd/lib/date-picker';
import {
  FiAlertCircle,
  FiClock,
  FiEye,
  FiGitCommit,
  FiRotateCcw,
  FiSearch,
  FiTrash2,
  FiUser,
} from 'react-icons/fi';

import {
  batchDelOperationLogDataAPI,
  clearOperationLogDataAPI,
  delOperationLogDataAPI,
  getOperationLogListAPI,
} from '@/api/operationLog';
import Title from '@/components/Title';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';
import type { OperationLog } from '@/types/app/operationLog';

dayjs.locale('zh-cn');

const { RangePicker } = DatePicker;

const DEFAULT_PAGE_SIZE = 10;

const MODULE_OPTIONS = [
  '文章管理',
  '分类管理',
  '标签管理',
  '评论管理',
  '闪念管理',
  '说说评论管理',
  '留言管理',
  '友链管理',
  '轮播图管理',
  '足迹管理',
  '里程碑管理',
  '用户管理',
  '系统配置',
  '页面配置',
  '第三方配置',
  '文件管理',
  'AI助手管理',
  '邮件管理',
  '操作日志管理',
  '鱼塘管理',
].map((name) => ({ label: name, value: name }));

const TYPE_OPTIONS = ['新增', '修改', '删除', '登录', '操作'].map((name) => ({ label: name, value: name }));

const STATUS_OPTIONS = [
  { label: '成功', value: 1 },
  { label: '失败', value: 0 },
];

const METHOD_COLORS: Record<string, string> = {
  POST: 'blue',
  PUT: 'orange',
  PATCH: 'gold',
  DELETE: 'red',
};

const TYPE_COLORS: Record<string, string> = {
  新增: '#3b82f6',
  修改: '#f59e0b',
  删除: '#ef4444',
  登录: '#8b5cf6',
  操作: '#06b6d4',
};

interface FilterFormValues {
  keyword?: string;
  module?: string;
  type?: string;
  status?: number;
  range?: [Dayjs, Dayjs];
}

const formatElapsed = (elapsed?: number) => {
  if (elapsed == null) return '—';
  return elapsed < 1000 ? `${elapsed}ms` : `${(elapsed / 1000).toFixed(2)}s`;
};

const prettyParams = (params?: string | null) => {
  if (!params) return '';
  try {
    return JSON.stringify(JSON.parse(params), null, 2);
  } catch {
    return params;
  }
};

export default function OperationLogPage() {
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState<number | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const [logList, setLogList] = useState<OperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: DEFAULT_PAGE_SIZE });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [filters, setFilters] = useState<FilterFormValues>({});
  const [filterForm] = Form.useForm<FilterFormValues>();

  const [detailRecord, setDetailRecord] = useState<OperationLog | null>(null);

  const hasActiveFilters = Boolean(
    filters.keyword?.trim() || filters.module || filters.type || filters.status != null || filters.range,
  );

  const getLogList = useCallback(
    async (page = pagination.current, pageSize = pagination.pageSize, filterValues: FilterFormValues = filters) => {
      try {
        setLoading(true);
        const [startDate, endDate] = filterValues.range ?? [];
        const { data } = await getOperationLogListAPI({
          pageNum: page,
          pageSize,
          keyword: filterValues.keyword?.trim() || undefined,
          module: filterValues.module,
          type: filterValues.type,
          status: filterValues.status,
          startDate: startDate ? startDate.valueOf() : undefined,
          endDate: endDate ? endDate.valueOf() : undefined,
        });
        setLogList(data.result ?? []);
        setTotal(data.total ?? 0);
        setSelectedIds([]);
      } catch (error) {
        console.error('获取操作日志失败：', error);
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.current, pagination.pageSize],
  );

  useEffect(() => {
    void getLogList();
  }, []);

  const { onValuesChange: onFilterValuesChange } = useDebouncedChange<FilterFormValues>({
    debouncedKeys: ['keyword'],
    debounceMs: 400,
    getValues: () => filterForm.getFieldsValue(),
    onApply: (values) => {
      setFilters(values);
      setPagination((prev) => ({ ...prev, current: 1 }));
      void getLogList(1, pagination.pageSize, values);
    },
  });

  const resetFilters = () => {
    filterForm.resetFields();
    setFilters({});
    setPagination((prev) => ({ ...prev, current: 1 }));
    void getLogList(1, pagination.pageSize, {});
  };

  const delLogData = useCallback(
    async (id: number) => {
      try {
        setBtnLoading(id);
        await delOperationLogDataAPI(id);
        notification.success({ message: '删除成功' });
        await getLogList();
      } catch (error) {
        console.error('删除操作日志失败：', error);
      } finally {
        setBtnLoading(null);
      }
    },
    [getLogList],
  );

  const batchDelLogData = useCallback(async () => {
    if (!selectedIds.length) return;
    try {
      setBatchLoading(true);
      await batchDelOperationLogDataAPI(selectedIds);
      message.success(`已删除 ${selectedIds.length} 条日志`);
      await getLogList();
    } catch (error) {
      console.error('批量删除操作日志失败：', error);
    } finally {
      setBatchLoading(false);
    }
  }, [getLogList, selectedIds]);

  const clearLogData = useCallback(async () => {
    try {
      setBatchLoading(true);
      await clearOperationLogDataAPI();
      notification.success({ message: '日志已清空' });
      await getLogList(1, pagination.pageSize);
    } catch (error) {
      console.error('清空操作日志失败：', error);
    } finally {
      setBatchLoading(false);
    }
  }, [getLogList, pagination.pageSize]);

  const columns: ColumnsType<OperationLog> = useMemo(
    () => [
      {
        title: '操作人',
        dataIndex: 'username',
        key: 'username',
        width: 100,
        render: (username: string) => (
          <span className="inline-flex items-center gap-1 text-sm">
            <FiUser size={13} className="text-slate-400" />
            {username || '未知'}
          </span>
        ),
      },
      {
        title: '模块 / 操作',
        key: 'module',
        width: 220,
        render: (_: unknown, row: OperationLog) => (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {row.module ? (
                <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{row.module}</span>
              ) : (
                <span className="text-slate-400">—</span>
              )}
              {row.type ? (
                <span
                  className="rounded-full px-1.5 py-px text-[10px] text-white"
                  style={{ backgroundColor: TYPE_COLORS[row.type] ?? '#94a3b8' }}
                >
                  {row.type}
                </span>
              ) : null}
            </div>
            {row.description ? (
              <p className="mt-0.5 truncate text-xs text-slate-500">{row.description}</p>
            ) : null}
          </div>
        ),
      },
      {
        title: '请求',
        key: 'request',
        render: (_: unknown, row: OperationLog) => (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {row.method ? <Tag color={METHOD_COLORS[row.method] ?? 'default'}>{row.method}</Tag> : null}
              <span className="truncate font-mono text-xs text-slate-500">{row.url || '—'}</span>
            </div>
          </div>
        ),
      },
      {
        title: 'IP',
        dataIndex: 'ip',
        key: 'ip',
        width: 160,
        render: (ip: string) => <span className="whitespace-nowrap font-mono text-xs text-slate-500">{ip || '—'}</span>,
      },
      {
        title: '时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 170,
        render: (time: number) => (
          <span className="whitespace-nowrap font-mono text-xs text-slate-500">
            {time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '—'}
          </span>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 90,
        align: 'center',
        render: (status: number) =>
          status === 1 ? <Badge status="success" text="成功" /> : <Badge status="error" text="失败" />,
      },
      {
        title: '耗时',
        dataIndex: 'elapsed',
        key: 'elapsed',
        width: 90,
        align: 'center',
        render: (elapsed: number) => (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-500">
            <FiClock size={11} />
            {formatElapsed(elapsed)}
          </span>
        ),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        align: 'center',
        width: 100,
        render: (_: unknown, record: OperationLog) => (
          <div className="flex items-center justify-center gap-0.5">
            <Tooltip title="详情">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailRecord(record);
                }}
                className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-white/5 cursor-pointer"
              >
                <FiEye size={15} />
              </button>
            </Tooltip>

            <Popconfirm title="确定删除该条日志？" onConfirm={() => delLogData(record.id!)}>
              <Tooltip title="删除">
                <button
                  type="button"
                  disabled={btnLoading === record.id}
                  onClick={(e) => e.stopPropagation()}
                  className="flex size-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 cursor-pointer"
                >
                  <FiTrash2 size={15} />
                </button>
              </Tooltip>
            </Popconfirm>
          </div>
        ),
      },
    ],
    [btnLoading, delLogData],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="操作日志">
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 ? (
            <Popconfirm title={`确定删除选中的 ${selectedIds.length} 条日志？`} onConfirm={() => void batchDelLogData()}>
              <Button danger icon={<FiTrash2 />} loading={batchLoading}>
                批量删除 ({selectedIds.length})
              </Button>
            </Popconfirm>
          ) : null}
          <Popconfirm
            title="确定清空全部操作日志？"
            description="清空后不可恢复，请谨慎操作"
            onConfirm={() => void clearLogData()}
          >
            <Button danger icon={<FiAlertCircle />} loading={batchLoading && selectedIds.length === 0}>
              清空日志
            </Button>
          </Popconfirm>
        </div>
      </Title>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <header className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
          <Form form={filterForm} layout="inline" onValuesChange={onFilterValuesChange}>
            <Form.Item name="keyword" className="mb-2! min-w-[200px] flex-1">
              <Input
                prefix={<FiSearch className="text-slate-400" />}
                placeholder="搜索描述 / 地址 / 操作人 / IP"
                allowClear
              />
            </Form.Item>
            <Form.Item name="module" className="mb-2! w-40">
              <Select allowClear placeholder="模块" options={MODULE_OPTIONS} showSearch />
            </Form.Item>
            <Form.Item name="type" className="mb-2! w-28">
              <Select allowClear placeholder="类型" options={TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item name="status" className="mb-2! w-24">
              <Select allowClear placeholder="状态" options={STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="range" className="mb-2!">
              <RangePicker showTime placeholder={['开始时间', '结束时间']} />
            </Form.Item>
            {hasActiveFilters ? (
              <Button icon={<FiRotateCcw />} onClick={resetFilters}>
                重置
              </Button>
            ) : null}
          </Form>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Spin spinning={loading}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={logList}
              rowSelection={{
                selectedRowKeys: selectedIds,
                onChange: (keys) => setSelectedIds(keys as number[]),
              }}
              locale={{
                emptyText: <Empty description="暂无操作日志" className="py-10" />,
              }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total,
                showSizeChanger: true,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (current, pageSize) => {
                  setPagination({ current, pageSize });
                  void getLogList(current, pageSize);
                },
              }}
              scroll={{ x: 1150 }}
            />
          </Spin>
        </div>
      </section>

      <Modal
        title={
          <span className="inline-flex items-center gap-2">
            <FiGitCommit className="text-slate-400" />
            日志详情 {detailRecord?.id ? `#${detailRecord.id}` : ''}
          </span>
        }
        open={detailRecord != null}
        onCancel={() => setDetailRecord(null)}
        footer={null}
        width={680}
        destroyOnHidden
      >
        {detailRecord ? (
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-slate-400">时间：</span>
                <span className="font-mono">{dayjs(detailRecord.createTime).format('YYYY-MM-DD HH:mm:ss')}</span>
              </div>
              <div>
                <span className="text-slate-400">状态：</span>
                {detailRecord.status === 1 ? <Badge status="success" text="成功" /> : <Badge status="error" text="失败" />}
              </div>
              <div>
                <span className="text-slate-400">操作人：</span>
                <span>{detailRecord.username || '未知'}</span>
              </div>
              <div>
                <span className="text-slate-400">IP：</span>
                <span className="font-mono">{detailRecord.ip || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400">模块：</span>
                <span>{detailRecord.module || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400">类型：</span>
                <span>{detailRecord.type || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400">耗时：</span>
                <span className="font-mono">{formatElapsed(detailRecord.elapsed)}</span>
              </div>
            </div>

            <div>
              <span className="text-sm text-slate-400">请求：</span>
              <div className="mt-1 flex items-center gap-2">
                {detailRecord.method ? <Tag color={METHOD_COLORS[detailRecord.method] ?? 'default'}>{detailRecord.method}</Tag> : null}
                <span className="break-all font-mono text-xs text-slate-600 dark:text-slate-300">{detailRecord.url || '—'}</span>
              </div>
            </div>

            {detailRecord.errorMsg ? (
              <div>
                <span className="text-sm text-red-500">错误信息：</span>
                <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-red-50 p-3 text-xs whitespace-pre-wrap text-red-600 dark:bg-red-500/10 dark:text-red-300">
                  {detailRecord.errorMsg}
                </pre>
              </div>
            ) : null}

            {detailRecord.params ? (
              <div>
                <span className="text-sm text-slate-400">请求参数：</span>
                <pre className="mt-1 max-h-72 overflow-auto rounded-lg bg-slate-50 p-3 text-xs whitespace-pre-wrap text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  {prettyParams(detailRecord.params)}
                </pre>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
