import { Form, FormInstance, Input, Modal, Spin } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { FileInfo } from '@/types/app/file';
import { formatFileSize } from '../../utils';

interface FileModalsProps {
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  onCreateDir: () => void;
  createForm: FormInstance;

  renameOpen: boolean;
  setRenameOpen: (open: boolean) => void;
  onRenameDir: () => void;
  renameForm: FormInstance;

  detailOpen: boolean;
  setDetailOpen: (open: boolean) => void;
  detailLoading: boolean;
  fileInfo: FileInfo | null;
}

const FileModals: React.FC<FileModalsProps> = ({
  createOpen,
  setCreateOpen,
  onCreateDir,
  createForm,
  renameOpen,
  setRenameOpen,
  onRenameDir,
  renameForm,
  detailOpen,
  setDetailOpen,
  detailLoading,
  fileInfo,
}) => {
  return (
    <>
      <Modal
        title="新建目录"
        open={createOpen}
        onOk={onCreateDir}
        onCancel={() => setCreateOpen(false)}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="name"
            rules={[
              { required: true, message: '请输入目录名称' },
              { pattern: /^[^/\\]+$/, message: '目录名不能包含 / 或 \\' },
            ]}
          >
            <Input placeholder="例如：article" maxLength={64} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="重命名目录"
        open={renameOpen}
        onOk={onRenameDir}
        onCancel={() => setRenameOpen(false)}
        destroyOnClose
      >
        <Form form={renameForm} layout="vertical">
          <Form.Item
            label="目录名称"
            name="name"
            rules={[
              { required: true, message: '请输入目录名称' },
              { pattern: /^[^/\\]+$/, message: '目录名不能包含 / 或 \\' },
            ]}
          >
            <Input placeholder="请输入新目录名" maxLength={64} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="文件详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Spin spinning={detailLoading}>
          {fileInfo && (
            <div className="rounded-xl border border-black/6 bg-gray-50/50 dark:border-white/10 dark:bg-white/5">
              <dl className="divide-y divide-black/6 dark:divide-white/10">
                <div className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[6.75rem_1fr] sm:gap-x-4 sm:items-baseline">
                  <dt className="shrink-0 text-xs font-medium text-black/50 dark:text-white/45">名称</dt>
                  <dd className="min-w-0 text-sm leading-relaxed text-black/88 wrap-break-word dark:text-white/90">
                    {fileInfo.name}
                  </dd>
                </div>
                <div className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[6.75rem_1fr] sm:gap-x-4 sm:items-baseline">
                  <dt className="shrink-0 text-xs font-medium text-black/50 dark:text-white/45">路径</dt>
                  <dd className="min-w-0 font-mono text-xs leading-relaxed text-black/80 break-all dark:text-white/85">
                    {fileInfo.path}
                  </dd>
                </div>
                <div className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[6.75rem_1fr] sm:gap-x-4 sm:items-baseline">
                  <dt className="shrink-0 text-xs font-medium text-black/50 dark:text-white/45">类型</dt>
                  <dd className="min-w-0 font-mono text-xs text-black/80 break-all dark:text-white/85">
                    {fileInfo.mimeType}
                  </dd>
                </div>
                <div className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[6.75rem_1fr] sm:gap-x-4 sm:items-baseline">
                  <dt className="shrink-0 text-xs font-medium text-black/50 dark:text-white/45">大小</dt>
                  <dd className="min-w-0 text-sm tabular-nums text-black/88 dark:text-white/90">
                    {formatFileSize(fileInfo.size)}
                  </dd>
                </div>
                <div className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[6.75rem_1fr] sm:gap-x-4 sm:items-baseline">
                  <dt className="shrink-0 text-xs font-medium text-black/50 dark:text-white/45">上传时间</dt>
                  <dd className="min-w-0 text-sm tabular-nums text-black/88 dark:text-white/90">
                    {dayjs(fileInfo.putTime).format('YYYY-MM-DD HH:mm:ss')}
                  </dd>
                </div>
                <div className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[6.75rem_1fr] sm:gap-x-4 sm:items-baseline">
                  <dt className="shrink-0 text-xs font-medium text-black/50 dark:text-white/45">链接</dt>
                  <dd className="min-w-0 text-sm leading-relaxed">
                    <a
                      href={fileInfo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary break-all underline-offset-2 hover:underline"
                    >
                      {fileInfo.url}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </Spin>
      </Modal>
    </>
  );
};

export default FileModals;
