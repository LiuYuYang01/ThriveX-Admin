import { useEffect, useMemo, useState } from 'react';
import { Image, Spin, message, Button, Empty, Input } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import Masonry from 'react-masonry-css';
import { getFileTreeAPI } from '@/api/file';
import { File, FileTreeData, FileTreeNode } from '@/types/app/file';
import errorImg from '@/pages/file/image/error.png';
import fileSvg from '@/pages/file/image/file.svg';
import { PiKeyReturnFill } from 'react-icons/pi';
import FileUpload from '@/components/FileUpload';
import './index.scss';

interface Props {
  multiple?: boolean;
  maxCount?: number;
  open: boolean;
  onClose: () => void;
  onSelect?: (files: string[]) => void;
}

// Masonry 布局的响应式断点配置
const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,
};

export default ({ multiple, open, onClose, onSelect, maxCount }: Props) => {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<FileTreeData | null>(null);
  const [currentPath, setCurrentPath] = useState('static/');
  const [keyword, setKeyword] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const normalizePath = (path: string) => {
    const cleaned = path.trim().replace(/^\/+/, '').replace(/\/+/g, '/');
    if (!cleaned) return 'static/';
    const withRoot = cleaned === 'static' || cleaned.startsWith('static/') ? cleaned : `static/${cleaned}`;
    return withRoot.endsWith('/') ? withRoot : `${withRoot}/`;
  };
  const trimSlash = (path: string) => normalizePath(path).replace(/\/$/, '');

  const findNode = (list: FileTreeNode[], targetPath: string): FileTreeNode | null => {
    const target = normalizePath(targetPath);
    for (const node of list) {
      if (normalizePath(node.path) === target) return node;
      const found = findNode(node.children, targetPath);
      if (found) return found;
    }
    return null;
  };

  /** 仅拉取整棵树；目录点击、返回上级不调用 */
  const fetchTree = async (keepPath?: string) => {
    try {
      setLoading(true);
      const { data } = await getFileTreeAPI();
      setTreeData(data);
      const target = normalizePath(keepPath !== undefined ? keepPath : 'static/');
      const pathExists = target === 'static/' || !!findNode(data.result, target);
      setCurrentPath(pathExists ? target : 'static/');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    if (!treeData) return;
    const target = normalizePath(path);
    const pathExists = target === 'static/' || !!findNode(treeData.result, target);
    setCurrentPath(pathExists ? target : 'static/');
  };

  useEffect(() => {
    if (!open) return;
    setKeyword('');
    setSelectedFiles([]);
    // 已有整棵树则不再请求；无缓存时拉一次全量树（目录点击不触发请求）
    if (!treeData) {
      void fetchTree(currentPath);
    }
  }, [open]);

  const rootNode = useMemo(() => {
    if (!treeData) return null;
    return treeData.result.find((node) => normalizePath(node.path) === 'static/') || null;
  }, [treeData]);

  const currentNode = useMemo(() => {
    if (!treeData) return null;
    if (currentPath === 'static/') {
      if (rootNode) return rootNode;
      return {
        type: 'dir' as const,
        name: 'static',
        path: 'static/',
        children: treeData.result,
        files: [],
        fileCount: treeData.total,
        totalSize: 0,
      };
    }
    return findNode(treeData.result, currentPath);
  }, [treeData, currentPath, rootNode]);

  const visibleDirs = useMemo(() => {
    const dirs = currentNode?.children || [];
    if (!keyword.trim()) return dirs;
    return dirs.filter((item) => item.name.toLowerCase().includes(keyword.toLowerCase()));
  }, [currentNode, keyword]);

  const visibleFiles = useMemo(() => {
    const files = currentNode?.files || [];
    if (!keyword.trim()) return files;
    return files.filter((item) => item.name.toLowerCase().includes(keyword.toLowerCase()));
  }, [currentNode, keyword]);

  const onCancelSelect = () => {
    reset();
    onClose();
  };

  const onHandleSelectImage = (item: File) => {
    setSelectedFiles((prev) => {
      const isMultiple = multiple || (maxCount !== undefined && maxCount !== 1);

      if (isMultiple) {
        const isSelected = prev.some((file) => file.url === item.url);
        if (isSelected) {
          return prev.filter((file) => file.url !== item.url);
        } else {
          if (maxCount && prev.length >= maxCount) {
            message.warning(`最多只能选择 ${maxCount} 个文件`);
            return prev;
          }
          return [...prev, item];
        }
      } else {
        return [item];
      }
    });
  };

  const onUpdateSuccess = (urls: string[]) => {
    setIsUploadModalOpen(false);
    fetchTree(currentPath);
    if (onSelect) {
      onSelect(urls);
      reset();
      onClose();
    }
  };

  const onHandleSelect = () => {
    const list = selectedFiles.map((item) => item.url);
    if (onSelect) onSelect(list);
    reset();
    onClose();
  };

  const reset = () => {
    setSelectedFiles([]);
    setKeyword('');
    setCurrentPath('static/');
  };

  const canGoBack = currentPath !== 'static/';

  return (
    <Modal
      title="素材库"
      width={1200}
      open={open}
      onCancel={onCancelSelect}
      destroyOnHidden
      footer={
        [
          <Button key="cancel" onClick={onCancelSelect}>
            取消
          </Button>,
          <Button key="confirm" type="primary" onClick={onHandleSelect} disabled={selectedFiles.length === 0}>
            选择 ({selectedFiles.length})
          </Button>,
        ]
      }
      zIndex={1100}
    >
      <div className="flex justify-between mb-4 px-4">
        <PiKeyReturnFill
          className={`text-4xl cursor-pointer ${canGoBack ? 'text-primary' : 'text-[#E0DFDF]'}`}
          onClick={() => {
            if (!canGoBack || !currentNode?.path) return;
            const parentPath = normalizePath(currentNode.path.split('/').slice(0, -2).join('/'));
            navigateTo(parentPath || 'static/');
          }}
        />
        <div className="flex items-center gap-3">
          <Input allowClear placeholder="搜索当前目录文件/目录" className="w-64" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Button type="primary" onClick={() => setIsUploadModalOpen(true)}>
            上传文件
          </Button>
        </div>
      </div>

      <Spin spinning={loading}>
        <div className="overflow-y-auto max-h-[calc(100vh-300px)] px-3">
          {visibleDirs.length === 0 && visibleFiles.length === 0 ? (
            <Empty description="当前目录暂无内容" className="py-10" />
          ) : (
            <>
              <div className="flex flex-wrap gap-4 mb-6">
                {visibleDirs.map((item) => (
                  <div key={item.path} className="group w-20 flex flex-col items-center cursor-pointer" onClick={() => navigateTo(item.path)}>
                    <img src={fileSvg} alt="" />
                    <p className="group-hover:text-primary transition-colors text-center break-all">{item.name}</p>
                  </div>
                ))}
              </div>

              {visibleFiles.length > 0 && (
                <Masonry breakpointCols={breakpointColumnsObj} className="masonry-grid" columnClassName="masonry-grid_column">
                  {visibleFiles.map((item, index) => (
                    <div
                      key={index}
                      className={`group relative overflow-hidden rounded-md cursor-pointer mb-4 border-2 border-stroke dark:border-transparent hover:border-primary! p-1 ${
                        selectedFiles.some((file) => file.url === item.url) ? 'border-primary' : 'border-gray-100'
                      }`}
                      onClick={() => onHandleSelectImage(item)}
                    >
                      <div className="relative">
                        <Image src={item.url} className="w-full rounded-md" loading="lazy" fallback={errorImg} preview={false} />
                        {selectedFiles.some((file) => file.url === item.url) && (
                          <div className="absolute top-2 right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                            <CheckOutlined />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </Masonry>
              )}
            </>
          )}
        </div>
      </Spin>

      <FileUpload multiple={multiple || (maxCount !== undefined && maxCount !== 1)} dir={trimSlash(currentPath)} open={isUploadModalOpen} onSuccess={onUpdateSuccess} onCancel={() => setIsUploadModalOpen(false)} />
    </Modal>
  );
};
