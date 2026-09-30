import { useMemo } from 'react';
import { Tooltip } from 'antd';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FiMapPin } from 'react-icons/fi';

import { RecordActions, RecordLikeCount, RecordMoodTag } from './recordBits';
import { RecordMediaCell } from './recordTableShared';
import { formatRecordTime } from './recordMeta';
import type { Record } from '@/types/app/record';

/**
 * 密集列表视图：给需要一屏扫过很多条的人用。
 * 原来的 8 列里，ID / 心情 / 位置三样低信息量的列被折进「内容」单元格，
 * 图片和视频合成一列，于是固定宽度从 4 列降到 4 列、内容列拿到了真正的空间。
 */
export function RecordList({
  list,
  loading,
  onDelete,
  deletingIds,
  onComments,
}: {
  list: Record[];
  loading: boolean;
  onDelete: (id: number) => void;
  deletingIds: number[];
  onComments: (record: Record) => void;
}) {
  const columns: ColumnsType<Record> = useMemo(
    () => [
      {
        title: '内容',
        dataIndex: 'content',
        key: 'content',
        render: (text: string | undefined, row: Record) => (
          <div className="min-w-0 py-1">
            {text ? (
              <Tooltip title={text} placement="topLeft">
                <p className="line-clamp-2 whitespace-pre-line text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                  {text}
                </p>
              </Tooltip>
            ) : (
              <span className="text-sm italic text-slate-500 dark:text-slate-400">无文字</span>
            )}

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <RecordMoodTag mood={row.mood} />

              {row.location ? (
                <span className="flex min-w-0 max-w-56 items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <FiMapPin size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="truncate" title={row.location}>
                    {row.location}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        title: '附件',
        key: 'media',
        width: 104,
        render: (_: unknown, row: Record) => (
          <RecordMediaCell imagesRaw={row.images} video={row.video} />
        ),
      },
      {
        title: '点赞',
        dataIndex: 'likeCount',
        key: 'likeCount',
        width: 76,
        render: (count: number | undefined) => <RecordLikeCount count={count} />,
      },
      {
        title: '发布时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 136,
        render: (value: string | number) => (
          <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {formatRecordTime(value)}
          </span>
        ),
      },
      {
        title: '操作',
        key: 'action',
        width: 96,
        align: 'center',
        render: (_: unknown, row: Record) => (
          <RecordActions
            record={row}
            onDelete={onDelete}
            deleting={deletingIds.includes(row.id!)}
            onComments={onComments}
          />
        ),
      },
    ],
    [onDelete, deletingIds, onComments],
  );

  return (
    <Table<Record>
      rowKey="id"
      dataSource={list}
      columns={columns}
      loading={loading}
      size="middle"
      scroll={{ x: 720 }}
      onRow={() => ({
        className:
          'hover:[&>td]:bg-slate-50/80! dark:hover:[&>td]:bg-boxdark-2/60!',
      })}
      className="[&_.ant-table-thead>tr>th]:bg-slate-50! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-slate-500! dark:[&_.ant-table-thead>tr>th]:bg-[#1f2838]! dark:[&_.ant-table-thead>tr>th]:text-slate-400!"
    />
  );
}
