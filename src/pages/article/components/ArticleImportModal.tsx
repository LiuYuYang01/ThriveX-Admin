import { useState, useRef, useEffect, useCallback, ChangeEvent, DragEvent } from 'react';
import { Modal, Button, message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { RcFile } from 'antd/es/upload/interface';
import type { UploadFileStatus } from 'antd/es/upload/interface';
import { InboxOutlined } from '@ant-design/icons';

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

export default ({ open, onClose, onImport }: ArticleImportModalProps) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 关闭时清空文件列表
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

  const handleDrop = useCallback((e: DragEvent) => {
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
  }, [fileList.length]);

  const handleFileInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
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
  }, [fileList.length]);

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
    const files = fileList
      .map((f) => f.originFileObj as File)
      .filter(Boolean);
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
      title="导入文章"
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={importLoading}>
          取消
        </Button>,
        <Button
          key="import"
          type="primary"
          onClick={handleImport}
          loading={importLoading}
          disabled={fileList.length === 0}
        >
          开始导入
        </Button>,
      ]}
    >
      <div className="py-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full h-40 p-4 border border-dashed rounded-lg transition-all duration-300 ${isDragging
            ? 'border-primary bg-primary/5'
            : 'border-[#D7D7D7] hover:border-primary bg-[#FAFAFA]'
            } space-y-2 cursor-pointer`}
        >
          <div className="flex justify-center">
            <InboxOutlined className="text-5xl text-primary" />
          </div>
          <p className="text-base text-center">
            {isDragging ? '文件放在此处即上传' : '点击或拖动文件到此区域'}
          </p>
          <p className="text-sm text-[#999] text-center">
            仅支持 Markdown 或 JSON 格式
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

        {fileList.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">已选择的文件：</p>
            <ul className="space-y-2">
              {fileList.map((file) => (
                <li
                  key={file.uid}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded-sm"
                >
                  <span className="text-sm">{file.name}</span>
                  <Button
                    type="text"
                    danger
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.uid);
                    }}
                  >
                    删除
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {fileList.length === 0 && (
          <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
            <span>你可以下载模板后填写再导入：</span>
            <div className="space-x-2">
              <Button type="link" size="small" onClick={downloadMarkdownTemplate}>
                下载 Markdown 模板
              </Button>
              <Button type="link" size="small" onClick={downloadJsonTemplate}>
                下载 JSON 模板
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};