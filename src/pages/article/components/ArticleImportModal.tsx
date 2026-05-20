import { useState, useRef, useEffect, useCallback, ChangeEvent, DragEvent } from 'react';
import { Modal, Button, message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { RcFile } from 'antd/es/upload/interface';
import type { UploadFileStatus } from 'antd/es/upload/interface';
import { FiUploadCloud, FiFileText, FiX, FiDownload } from 'react-icons/fi';

const ACCEPT_EXT = ['.md', '.json'];
const MAX_FILES = 5;

const createUploadFile = (file: File): UploadFile => {
  const rc = file as RcFile;
  if (!rc.uid) rc.uid = Math.random().toString();
  return {
    uid: rc.uid,
    name: file.name,
    status: 'done' as UploadFileStatus,
    originFileObj: rc,
  };
};

const isValidFile = (name: string) =>
  ACCEPT_EXT.some((ext) => name.toLowerCase().endsWith(ext));

interface ArticleImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (files: File[]) => Promise<void>;
}

export default function ArticleImportModal({ open, onClose, onImport }: ArticleImportModalProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setFileList([]);
      setIsDragging(false);
    }
  }, [open]);

  const handleCancel = useCallback(() => {
    if (!importLoading) onClose();
  }, [importLoading, onClose]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      const valid = files.filter((f) => isValidFile(f.name));
      if (!valid.length) {
        message.error('仅支持 Markdown(.md) 或 JSON(.json) 文件');
        return;
      }
      if (fileList.length + valid.length > MAX_FILES) {
        message.error(`最多只能上传 ${MAX_FILES} 个文件`);
        return;
      }
      setFileList((prev) => [...prev, ...valid.map(createUploadFile)]);
      message.success(`成功添加 ${valid.length} 个文件`);
    },
    [fileList.length],
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const valid = files.filter((f) => isValidFile(f.name));
      if (!valid.length) {
        message.error('仅支持 Markdown(.md) 或 JSON(.json) 文件');
        e.target.value = '';
        return;
      }
      if (fileList.length + valid.length > MAX_FILES) {
        message.error(`最多只能上传 ${MAX_FILES} 个文件`);
        e.target.value = '';
        return;
      }
      setFileList((prev) => [...prev, ...valid.map(createUploadFile)]);
      e.target.value = '';
    },
    [fileList.length],
  );

  const removeFile = useCallback((uid: string) => {
    setFileList((prev) => prev.filter((f) => f.uid !== uid));
  }, []);

  const downloadMarkdownTemplate = useCallback(() => {
    const content = `---\ntitle: 示例文章标题\ndescription: 这里是文章描述\ntags: 示例标签1 示例标签2\ncategories: 示例分类\ncover: https://example.com/image.png\ndate: 2025-07-12 12:00:00\nkeywords: 示例标签1 示例标签2 示例分类\n---\n\n这里是 Markdown 正文内容，请开始创作吧~`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '文章模板.md';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadJsonTemplate = useCallback(() => {
    const data = {
      title: '示例文章标题',
      description: '文章描述',
      content: '# 正文内容',
      cover: '',
      createTime: Date.now().toString(),
      cateList: [{ id: 1, name: '示例分类' }],
      tagList: [{ id: 2, name: '示例标签' }],
      config: {
        status: 1,
        password: '',
        isDraft: false,
        isEncrypt: false,
        isDel: false,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '文章模板.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(async () => {
    if (fileList.length === 0) {
      message.warning('请上传至少一个 .md 或 .json 文件');
      return;
    }
    const files = fileList.map((f) => f.originFileObj as File).filter(Boolean);
    if (!files.length) return;
    setImportLoading(true);
    try {
      await onImport(files);
      onClose();
    } finally {
      setImportLoading(false);
    }
  }, [fileList, onImport, onClose]);

  return (
    <Modal
      title={
        <span className="inline-flex items-center gap-2">
          <FiUploadCloud className="text-primary" />
          导入文章
        </span>
      }
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={importLoading}>
          取消
        </Button>,
        <Button
          key="import"
          type="primary"
          onClick={() => void handleImport()}
          loading={importLoading}
          disabled={fileList.length === 0}
          icon={<FiUploadCloud />}
        >
          开始导入
        </Button>,
      ]}
    >
      <div className="space-y-4 py-2">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 transition-colors duration-200 ${isDragging
              ? 'border-primary bg-primary/5 dark:bg-primary/10'
              : 'border-slate-200 bg-slate-50/80 hover:border-primary hover:bg-slate-50 dark:border-strokedark dark:bg-boxdark-2/50 dark:hover:border-primary'
            }`}
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
            <FiUploadCloud size={24} />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {isDragging ? '松开鼠标即可上传' : '点击或拖拽文件到此处'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            支持 Markdown / JSON，单次最多 {MAX_FILES} 个文件
          </p>
        </div>

        <input
          multiple
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
          accept=".md,.json"
        />

        {fileList.length > 0 ? (
          <ul className="space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">已选择 {fileList.length} 个文件</p>
            {fileList.map((file) => (
              <li
                key={file.uid}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-strokedark dark:bg-boxdark-2"
              >
                <span className="inline-flex min-w-0 items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <FiFileText className="shrink-0 text-slate-400" />
                  <span className="truncate">{file.name}</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.uid);
                  }}
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 cursor-pointer"
                  aria-label={`移除 ${file.name}`}
                >
                  <FiX size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-strokedark dark:bg-boxdark-2/30">
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">可先下载模板，填写后再导入：</p>
            <div className="flex flex-wrap gap-2">
              <Button type="link" size="small" icon={<FiDownload />} onClick={downloadMarkdownTemplate} className="px-0!">
                Markdown 模板
              </Button>
              <Button type="link" size="small" icon={<FiDownload />} onClick={downloadJsonTemplate} className="px-0!">
                JSON 模板
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
