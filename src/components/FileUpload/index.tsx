import { useRef, useState, useCallback } from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { message, Modal, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { useUserStore, useFileStore } from '@/stores';
import { DirList } from '@/types/app/file';
import { getApiUrl } from '@/utils/config';
import { compressImageFiles, getUploadCompressModeLabel } from '@/utils/imageCompress';

interface Props {
  multiple?: boolean;
  dir: DirList;
  open: boolean;
  onSuccess: (urls: string[]) => void;
  onCancel: () => void;
}

function parseUploadUrls(data: unknown): string[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'urls' in data && Array.isArray((data as { urls: string[] }).urls)) {
    return (data as { urls: string[] }).urls;
  }
  return [];
}

export default ({ multiple, dir, open, onCancel, onSuccess }: Props) => {
  const store = useUserStore();
  const uploadCompressMode = useFileStore((state) => state.file.upload_compress_mode);
  const dragCounterRef = useRef(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const onCloseModel = useCallback(() => {
    setIsLoading(false);
    onCancel();
  }, [onCancel]);

  const onUploadFile = useCallback(
    async (files: File[]) => {
      try {
        setIsLoading(true);

        const compressedFiles = await compressImageFiles(files, uploadCompressMode);

        const formData = new FormData();
        formData.append('dir', dir);
        for (let i = 0; i < compressedFiles.length; i++) {
          formData.append('files', compressedFiles[i]);
        }

        const res = await fetch(`${getApiUrl()}/file`, {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${store.token}`,
          },
        });

        const { code, message: msg, data } = await res.json();
        if (code !== 200) return message.error('文件上传失败：' + msg);

        const urls = parseUploadUrls(data);

        try {
          await navigator.clipboard.writeText(urls.join('\n'));
        } catch (error) {
          console.error(error);
          message.error('复制到剪贴板失败，请手动复制');
          onSuccess(urls);
          setIsLoading(false);
          return;
        }

        message.success(`🎉 文件上传成功，URL链接已复制到剪贴板`);
        onSuccess(urls);
        onCloseModel();
      } catch (error) {
        message.error('文件上传失败：' + (error as Error).message);
        onCloseModel();
      }
    },
    [dir, onCloseModel, onSuccess, store.token, uploadCompressMode],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onUploadFile([...e.target.files]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onUploadFile(files);
      }
    },
    [onUploadFile],
  );

  return (
    <Modal title="文件上传" open={open} onCancel={onCloseModel} footer={null}>
      <Spin spinning={isLoading}>
        <p className="my-4 text-sm text-gray-500 dark:text-gray-400">
          当前压缩策略：
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {getUploadCompressModeLabel(uploadCompressMode)}
          </span>
          <Link to="/setup/system?tab=file" className="ml-2 text-primary hover:underline" onClick={onCloseModel}>
            去修改
          </Link>
        </p>

        <div
          onClick={() => fileInputRef?.current?.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full h-40 p-4 border border-dashed rounded-lg transition-all duration-300 ${
            isDragging ? 'border-primary bg-primary/5' : 'border-[#D7D7D7] hover:border-primary bg-[#FAFAFA]'
          } space-y-2 cursor-pointer`}
        >
          <div className="flex justify-center">
            <InboxOutlined className="text-5xl text-primary" />
          </div>

          <p className="text-base text-center">{isDragging ? '释放文件以上传' : '点击或拖动文件到此区域进行上传'}</p>
          <p className="text-sm text-[#999] text-center">支持单个或多个上传</p>
        </div>

        <input multiple={multiple} type="file" onChange={handleFileInput} ref={fileInputRef} className="hidden" />
      </Spin>
    </Modal>
  );
};
