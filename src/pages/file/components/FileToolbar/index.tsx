import { AppstoreOutlined, BarsOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Checkbox, Input, Popconfirm, Segmented, Select } from 'antd';
import React from 'react';
import { EntryViewMode, SortField, SortOrder } from '../../index';

interface FileToolbarProps {
  viewMode: EntryViewMode;
  onViewModeChange: (mode: EntryViewMode) => void;
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  selectedCount: number;
  onBatchDelete: () => void;
  allFileSelected: boolean;
  someFileSelected: boolean;
  onSelectAllChange: (checked: boolean) => void;
  hasFiles: boolean;
  hasDirs: boolean;
}

const SORT_FIELD_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'time', label: '时间' },
  { value: 'name', label: '名称' },
  { value: 'size', label: '大小' },
  { value: 'type', label: '类型' },
  { value: 'fileCount', label: '文件数' },
];

const FileToolbar: React.FC<FileToolbarProps> = ({
  viewMode,
  onViewModeChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderChange,
  keyword,
  onKeywordChange,
  selectedCount,
  onBatchDelete,
  allFileSelected,
  someFileSelected,
  onSelectAllChange,
  hasFiles,
  hasDirs,
}) => {
  return (
    <div className="mb-5 flex justify-between flex-col gap-3 rounded-xl border border-black/6 bg-black/2 px-3 py-2 dark:border-white/8 dark:bg-white/3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
      <div>
        {hasFiles && (
          <>
            {viewMode === 'grid' && (
              <Checkbox
                className="shrink-0"
                checked={allFileSelected}
                indeterminate={someFileSelected && !allFileSelected}
                onChange={(e) => onSelectAllChange(e.target.checked)}
              >
                全选
              </Checkbox>
            )}

            {selectedCount > 0 && (
              <Popconfirm
                title={`确定删除选中的 ${selectedCount} 个文件吗？`}
                okText="确定"
                cancelText="取消"
                onConfirm={onBatchDelete}
              >
                <Button type="primary" danger>
                  批量删除 ({selectedCount})
                </Button>
              </Popconfirm>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Segmented<EntryViewMode>
          value={viewMode}
          onChange={onViewModeChange}
          options={[
            {
              value: 'grid',
              label: (
                <span className="inline-flex items-center gap-1">
                  <AppstoreOutlined />
                  网格
                </span>
              ),
            },
            {
              value: 'list',
              label: (
                <span className="inline-flex items-center gap-1">
                  <BarsOutlined />
                  列表
                </span>
              ),
            },
          ]}
        />

        {(hasDirs || hasFiles) && (
          <>
            <span className="hidden h-5 w-px shrink-0 bg-black/10 sm:block dark:bg-white/12" aria-hidden />
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
              <Select<SortField>
                className="min-w-22"
                value={sortField}
                options={SORT_FIELD_OPTIONS.filter((opt) => {
                  if (opt.value === 'type') return hasFiles;
                  if (opt.value === 'fileCount') return hasDirs;
                  return true;
                })}
                onChange={onSortFieldChange}
              />
              <Segmented<SortOrder>
                value={sortOrder}
                onChange={onSortOrderChange}
                options={[
                  { label: '升序', value: 'ascend' },
                  { label: '降序', value: 'descend' },
                ]}
              />
            </div>
          </>
        )}

        <span className="hidden h-5 w-px shrink-0 bg-black/10 sm:block dark:bg-white/12" aria-hidden />
        <Input
          allowClear
          prefix={<SearchOutlined className="text-black/35 dark:text-white/35" />}
          placeholder="搜索当前目录下的文件或目录"
          className="flex-1 w-72!"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default FileToolbar;
