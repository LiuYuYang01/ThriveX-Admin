import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';
import { FileTreeNode } from '@/types/app/file';
import { formatFileSize } from '../../utils';
import fileSvg from '../../image/file.svg';

interface DirTableRow extends Omit<FileTreeNode, 'children'> {
  subDirCount: number;
}

interface DirSectionProps {
  viewMode: 'grid' | 'list';
  dirList: FileTreeNode[];
  dirTableRows: DirTableRow[];
  onNavigate: (path: string) => void;
  onRename: (dir: FileTreeNode) => void;
  onDelete: (path: string) => void;
}

const DirSection: React.FC<DirSectionProps> = ({
  viewMode,
  dirList,
  dirTableRows,
  onNavigate,
  onRename,
  onDelete,
}) => {
  if (dirList.length === 0) return null;

  return (
    <section>
      <header className="mb-4 flex items-center gap-2.5">
        <span className="text-[15px] font-semibold tracking-wide text-black/88 dark:text-white/88">目录</span>
        <span className="rounded-full bg-black/4 px-2 py-0.5 text-xs font-medium leading-none text-black/45 dark:bg-white/8 dark:text-white/45">
          {dirList.length}
        </span>
      </header>
      {viewMode === 'list' ? (
        <Table<DirTableRow>
          rowKey="path"
          pagination={false}
          scroll={{ x: 'max-content' }}
          className="[&_.ant-table-cell]:align-middle"
          dataSource={dirTableRows}
          columns={
            [
              {
                title: '名称',
                dataIndex: 'name',
                ellipsis: true,
                render: (_, row) => (
                  <button
                    type="button"
                    className="max-w-full cursor-pointer border-0 bg-transparent p-0 text-left font-inherit text-primary hover:underline"
                    onClick={() => onNavigate(row.path)}
                  >
                    {row.name}
                  </button>
                ),
              },
              {
                title: '子目录',
                width: 88,
                align: 'center',
                render: (_, row) => row.subDirCount,
              },
              {
                title: '文件数',
                width: 88,
                align: 'center',
                render: (_, row) => row.fileCount,
              },
              {
                title: '大小',
                width: 104,
                align: 'right',
                render: (_, row) => formatFileSize(row.totalSize),
              },
              {
                title: '操作',
                key: 'actions',
                width: 112,
                align: 'center',
                render: (_, row) => {
                  const node = dirList.find((d) => d.path === row.path);
                  return (
                    <div className="flex items-center justify-center gap-3">
                      <Tooltip title="重命名目录">
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          disabled={!node}
                          onClick={() => node && onRename(node)}
                        />
                      </Tooltip>
                      <Tooltip title="删除目录">
                        <Popconfirm
                          title="确定删除该目录吗？"
                          okText="确定"
                          cancelText="取消"
                          onConfirm={() => onDelete(row.path)}
                        >
                          <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Tooltip>
                    </div>
                  );
                },
              },
            ] as ColumnsType<DirTableRow>
          }
        />
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-3">
          {dirList.map((dir) => (
            <div
              key={dir.path}
              className="w-[120px] rounded-xl border border-black/6 bg-black/2 px-2 pb-2 pt-2.5 transition-[border-color,box-shadow,background] duration-200 hover:border-[#5b8ff9] hover:bg-[rgba(91,143,249,0.06)] hover:shadow-[0_4px_14px_rgba(91,143,249,0.12)] dark:border-white/8 dark:bg-white/4"
            >
              <div className="cursor-pointer text-center" onClick={() => onNavigate(dir.path)}>
                <img src={fileSvg} alt={dir.name} className="mx-auto mb-2 h-14 w-18 object-contain" />
                <Tooltip title={dir.name}>
                  <p className="m-0 line-clamp-2 wrap-break-word text-[13px] leading-snug text-black/85 dark:text-white/88">
                    {dir.name}
                  </p>
                </Tooltip>
              </div>
              <div className="mt-2 flex justify-center gap-1">
                <Tooltip title="重命名目录">
                  <Button type="text" icon={<EditOutlined />} onClick={() => onRename(dir)} />
                </Tooltip>
                <Popconfirm
                  title="确定删除该目录吗？"
                  okText="确定"
                  cancelText="取消"
                  onConfirm={() => onDelete(dir.path)}
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default DirSection;
