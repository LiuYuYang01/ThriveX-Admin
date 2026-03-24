import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Checkbox, Image, Popconfirm, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';
import { File as AppFile } from '@/types/app/file';
import { formatFileSize, getFileTypeLabel } from '../../utils';
import errorImg from '../../image/error.png';

interface FileSectionProps {
  viewMode: 'grid' | 'list';
  fileList: AppFile[];
  selectedFilePaths: string[];
  onSelectChange: (paths: string[]) => void;
  onOpenFileDetail: (path: string) => void;
  onDeleteFile: (path: string) => void;
  hasDirs: boolean;
}

const FileSection: React.FC<FileSectionProps> = ({
  viewMode,
  fileList,
  selectedFilePaths,
  onSelectChange,
  onOpenFileDetail,
  onDeleteFile,
  hasDirs,
}) => {
  if (fileList.length === 0) return null;

  return (
    <section className={hasDirs ? 'mt-7 border-t border-black/6 pt-6 dark:border-white/8' : ''}>
      <header className="mb-4 flex items-center gap-2.5">
        <span className="text-[15px] font-semibold tracking-wide text-black/88 dark:text-white/88">文件</span>
        <span className="rounded-full bg-black/4 px-2 py-0.5 text-xs font-medium leading-none text-black/45 dark:bg-white/8 dark:text-white/45">
          {fileList.length}
        </span>
      </header>
      <Image.PreviewGroup>
        {viewMode === 'list' ? (
          <Table<AppFile>
            rowKey="path"
            pagination={false}
            scroll={{ x: 'max-content' }}
            className="[&_.ant-table-cell]:align-middle"
            dataSource={fileList}
            rowSelection={{
              selectedRowKeys: selectedFilePaths,
              onChange: (keys) => onSelectChange(keys as string[]),
              columnWidth: 40,
            }}
            columns={
              [
                {
                  title: '预览',
                  key: 'thumb',
                  width: 88,
                  render: (_, file) => (
                    <div className="relative size-14 overflow-hidden rounded-lg bg-linear-to-br from-[#f4f6f9] to-[#eceff4] dark:from-[#1f2937] dark:to-[#111827]">
                      <Image
                        src={file.url}
                        fallback={errorImg}
                        alt={file.name}
                        loading="lazy"
                        preview={{ alt: file.name }}
                        rootClassName="block size-full"
                        className="size-full object-cover"
                      />
                    </div>
                  ),
                },
                {
                  title: '名称',
                  dataIndex: 'name',
                  ellipsis: true,
                  render: (name: string) => (
                    <Tooltip title={name} placement="topLeft">
                      <span className="font-medium text-black/88 dark:text-white/88">{name}</span>
                    </Tooltip>
                  ),
                },
                {
                  title: '大小',
                  width: 108,
                  align: 'right',
                  render: (_, file) => (
                    <span className="tabular-nums text-black/88 dark:text-white/88">
                      {formatFileSize(file.size)}
                    </span>
                  ),
                },
                {
                  title: '类型',
                  width: 88,
                  ellipsis: true,
                  render: (_, file) => (
                    <span className="font-mono text-xs text-black/65 dark:text-white/65">
                      {getFileTypeLabel(file)}
                    </span>
                  ),
                },
                {
                  title: '操作',
                  key: 'actions',
                  width: 112,
                  align: 'center',
                  render: (_, file) => (
                    <div className="flex items-center justify-center gap-3">
                      <Tooltip title="查看详情">
                        <Button
                          type="text"
                          icon={<EyeOutlined />}
                          onClick={() => onOpenFileDetail(file.path)}
                        />
                      </Tooltip>
                      <Tooltip title="删除文件">
                        <Popconfirm
                          title="确定删除该文件吗？"
                          okText="确定"
                          cancelText="取消"
                          onConfirm={() => onDeleteFile(file.path)}
                        >
                          <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Tooltip>
                    </div>
                  ),
                },
              ] as ColumnsType<AppFile>
            }
          />
        ) : (
          <div className="grid gap-[18px] grid-cols-[repeat(auto-fill,minmax(232px,1fr))]">
            {fileList.map((file) => (
              <div
                key={file.path}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-black/6 bg-white p-0 transition-[border-color,box-shadow,transform] duration-200 ease-out dark:border-white/8 dark:bg-white/4 hover:-translate-y-1 hover:border-[rgba(91,143,249,0.45)] hover:shadow-[0_14px_36px_rgba(17,24,39,0.12)] dark:hover:border-[rgba(91,143,249,0.45)] dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.45)]"
              >
                <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden bg-linear-to-br from-[#f4f6f9] to-[#eceff4] transition-[filter] duration-200 group-hover:brightness-[1.03] dark:from-[#1f2937] dark:to-[#111827] dark:group-hover:brightness-[1.06]">
                  <div className="absolute left-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedFilePaths.includes(file.path)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        onSelectChange(
                          checked
                            ? [...selectedFilePaths, file.path]
                            : selectedFilePaths.filter((p) => p !== file.path),
                        );
                      }}
                    />
                  </div>
                  <Image
                    src={file.url}
                    fallback={errorImg}
                    alt={file.name}
                    loading="lazy"
                    preview={{ alt: file.name }}
                    rootClassName="absolute inset-0 block size-full"
                    className="size-full h-[inherit]! cursor-zoom-in object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  />
                </div>
                <div className="min-h-[52px] flex-1 px-3 pb-1 pt-2.5">
                  <Tooltip title={file.name} placement="topLeft">
                    <p className="mb-1 line-clamp-2 break-all text-[13px] font-medium leading-[1.45] text-black/88 group-hover:text-primary dark:text-white/88">
                      {file.name}
                    </p>
                  </Tooltip>
                  <p className="m-0 text-xs text-black/45 dark:text-white/45">{formatFileSize(file.size)}</p>
                </div>
                <div className="mt-auto flex justify-end gap-0.5 px-2 pb-2">
                  <Tooltip title="查看详情">
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => onOpenFileDetail(file.path)}
                    />
                  </Tooltip>
                  <Tooltip title="删除文件">
                    <Popconfirm
                      title="确定删除该文件吗？"
                      okText="确定"
                      cancelText="取消"
                      onConfirm={() => onDeleteFile(file.path)}
                    >
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </Image.PreviewGroup>
    </section>
  );
};

export default FileSection;
