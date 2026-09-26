import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, notification, Popconfirm, Select, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';
import { FiDownload, FiTrash2, FiUploadCloud } from 'react-icons/fi';

import { delBackupDataAPI, exportBackupDataAPI, getBackupListAPI } from '@/api/backup';
import Title from '@/components/Title';
import { useUserStore } from '@/stores';
import { getApiUrl } from '@/utils/config';
import type { BackupRecord, BackupFilterQueryParams } from '@/types/app/backup';

import Skeleton from './Skeleton';

const DEFAULT_PAGE_SIZE = 10;

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const formatDuration = (ms: number): string => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

export default function BackupPage() {
  const store = useUserStore();

  const [loading, setLoading] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<'json' | 'sql'>('sql');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [list, setList] = useState<BackupRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<BackupFilterQueryParams>({
    pageNum: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const getBackupList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getBackupListAPI(filter);
      setList(data.result);
      setTotal(data.total);
    } catch (error) {
      console.error('获取备份列表失败：', error);
    } finally {
      setSkeletonLoading(false);
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void getBackupList();
  }, [getBackupList]);

  const onExport = async () => {
    try {
      setExporting(true);
      await exportBackupDataAPI({ format });
      notification.success({
        message: '备份成功',
        description: `数据库已全量导出为 ${format.toUpperCase()} 文件，请及时下载保管备份文件`,
      });
      await getBackupList();
    } catch (error) {
      console.error('备份失败：', error);
    } finally {
      setExporting(false);
    }
  };

  const onDownload = async (record: BackupRecord) => {
    try {
      setDownloadingId(record.id);
      const res = await fetch(`${getApiUrl()}/backup/download/${record.id}`, {
        headers: { Authorization: `Bearer ${store.token}` },
      });
      if (!res.ok) throw new Error(`服务返回 ${res.status}`);
      saveAs(await res.blob(), record.fileName);
    } catch (error) {
      notification.error({ message: '下载失败', description: (error as Error).message });
    } finally {
      setDownloadingId(null);
    }
  };

  const onDel = async (id: number) => {
    await delBackupDataAPI(id);
    notification.success({ message: '删除成功' });
    await getBackupList();
  };

  const columns: ColumnsType<BackupRecord> = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        width: 70,
        align: 'center',
      },
      {
        title: '备份文件',
        dataIndex: 'fileName',
        render: (fileName: string, record) => (
          <Tooltip title={record.checksum ? `SHA-256：${record.checksum}` : fileName}>
            <div className="flex flex-col leading-tight">
              <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{fileName}</span>
              <span className="text-xs text-slate-400">
                {record.tableCount ?? '-'} 张表 / {(record.rowTotal ?? 0).toLocaleString()} 行 ·{' '}
                {record.format.toUpperCase()} · {record.storage}
              </span>
            </div>
          </Tooltip>
        ),
      },
      {
        title: '大小',
        dataIndex: 'size',
        width: 90,
        align: 'center',
        render: (size: number | null) => (size != null ? formatSize(size) : '-'),
      },
      {
        title: '耗时',
        dataIndex: 'durationMs',
        width: 90,
        align: 'center',
        render: (ms: number | null) => (ms != null ? formatDuration(ms) : '-'),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 90,
        align: 'center',
        render: (status: BackupRecord['status'], record) => {
          if (status === 'success') return <Tag color="success">成功</Tag>;
          if (status === 'running') return <Tag color="processing">进行中</Tag>;
          return (
            <Tooltip title={record.error || '备份失败'}>
              <Tag color="error">失败</Tag>
            </Tooltip>
          );
        },
      },
      {
        title: '备份时间',
        dataIndex: 'createTime',
        width: 170,
        align: 'center',
        render: (t: number) => (t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-'),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        align: 'center',
        width: 100,
        render: (_: unknown, record) => (
          <div className="flex items-center justify-center gap-0.5">
            <Tooltip title={record.status === 'success' ? '下载备份文件' : '该备份未成功生成，无法下载'}>
              <button
                type="button"
                disabled={record.status !== 'success' || downloadingId === record.id}
                onClick={(e) => {
                  e.stopPropagation();
                  void onDownload(record);
                }}
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5 dark:hover:text-primary"
                aria-label="下载备份"
              >
                <FiDownload size={16} />
              </button>
            </Tooltip>
            <Popconfirm
              title="删除备份"
              description="将同时删除备份文件，删除后无法恢复，确定继续吗？"
              okText="删除"
              okButtonProps={{ danger: true }}
              cancelText="取消"
              onConfirm={() => onDel(record.id)}
            >
              <Tooltip title="删除">
                <button
                  type="button"
                  className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500 dark:hover:bg-white/5"
                  aria-label="删除备份"
                >
                  <FiTrash2 size={16} />
                </button>
              </Tooltip>
            </Popconfirm>
          </div>
        ),
      },
    ],
    [downloadingId],
  );

  if (skeletonLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title value="数据库备份">
        <Space.Compact>
          <Select
            value={format}
            onChange={setFormat}
            disabled={exporting}
            options={[
              { value: 'sql', label: 'SQL' },
              { value: 'json', label: 'JSON' },
            ]}
            className="w-24"
          />
          <Popconfirm
            title="立即备份"
            description={`将导出包含用户数据在内的全部数据库内容（${format.toUpperCase()} 格式），请妥善保管备份文件。`}
            okText="开始备份"
            cancelText="取消"
            onConfirm={onExport}
          >
            <Button
              type="primary"
              icon={<FiUploadCloud />}
              loading={exporting}
              className="inline-flex items-center gap-1"
            >
              立即备份
            </Button>
          </Popconfirm>
        </Space.Compact>
      </Title>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <Table
          rowKey="id"
          dataSource={list}
          columns={columns}
          loading={loading}
          scroll={{ x: 780 }}
          pagination={{
            position: ['bottomRight'],
            current: filter.pageNum,
            pageSize: filter.pageSize,
            total,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, size) => setFilter((prev) => ({ ...prev, pageNum: page, pageSize: size })),
          }}
        />
      </section>
    </div>
  );
}
