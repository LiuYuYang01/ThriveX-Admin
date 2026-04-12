import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';
import { Button, Empty, Image, Input, Modal, Space, Spin, Tooltip, message } from 'antd';
import { getFileTreeAPI } from '@/api/file';
import FileUpload from '@/components/FileUpload';
import { File, FileTreeData, FileTreeNode } from '@/types/app/file';
import errorImg from '@/pages/file/image/error.png';
import fileSvg from '@/pages/file/image/file.svg';

interface Props {
  multiple?: boolean;
  maxCount?: number;
  open: boolean;
  onClose: () => void;
  onSelect?: (files: string[]) => void;
}

function inferRootPathFromTree(data: FileTreeData | null): string {
  if (!data) return '';
  if (data.dir) {
    const d = String(data.dir).trim().replace(/\/+$/, '');
    if (d) return `${d}/`;
  }
  const roots = data.result || [];
  if (roots.length !== 1) return '';
  const first = roots[0];
  if (first?.path) {
    const seg = first.path.replace(/\/+$/, '').split('/').filter(Boolean)[0];
    if (seg) return `${seg}/`;
  }
  return '';
}

function normalizePathForRoot(path: string, root: string): string {
  const cleaned = path.trim().replace(/^\/+/, '').replace(/\/+/g, '/');
  const rootSeg = root.replace(/\/$/, '');
  if (!rootSeg) {
    if (!cleaned) return '';
    return cleaned.endsWith('/') ? cleaned : `${cleaned}/`;
  }
  if (!cleaned) return root;
  const withRoot = cleaned === rootSeg || cleaned.startsWith(`${rootSeg}/`) ? cleaned : `${rootSeg}/${cleaned}`;
  return withRoot.endsWith('/') ? withRoot : `${withRoot}/`;
}

function findNodeInTree(list: FileTreeNode[], targetPath: string, root: string): FileTreeNode | null {
  const target = normalizePathForRoot(targetPath, root);
  for (const node of list) {
    if (normalizePathForRoot(node.path, root) === target) return node;
    const found = findNodeInTree(node.children, targetPath, root);
    if (found) return found;
  }
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default ({ multiple, open, onClose, onSelect, maxCount }: Props) => {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<FileTreeData | null>(null);
  const [currentPath, setCurrentPath] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const rootPath = useMemo(() => inferRootPathFromTree(treeData), [treeData]);

  const normalizePath = (path: string) => normalizePathForRoot(path, rootPath);
  const trimSlash = (path: string) => normalizePathForRoot(path, rootPath).replace(/\/$/, '');

  const findNode = (list: FileTreeNode[], targetPath: string): FileTreeNode | null =>
    findNodeInTree(list, targetPath, rootPath);

  const fetchTree = async (keepPath?: string) => {
    try {
      setLoading(true);
      const { data } = await getFileTreeAPI();
      setTreeData(data);

      const rp = inferRootPathFromTree(data);
      const targetPath = keepPath !== undefined ? normalizePathForRoot(keepPath, rp) : rp;
      const exists =
        rp === ''
          ? targetPath === '' || !!findNodeInTree(data.result, targetPath, '')
          : !targetPath || targetPath === rp || !!findNodeInTree(data.result, targetPath, rp);
      setCurrentPath(exists ? targetPath : rp === '' ? '' : rp);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    if (!treeData) return;
    const targetPath = normalizePath(path);
    if (!rootPath) {
      const exists = targetPath === '' || !!findNode(treeData.result, targetPath);
      setCurrentPath(exists ? targetPath : '');
      return;
    }
    const exists = targetPath === rootPath || !!findNode(treeData.result, targetPath);
    setCurrentPath(exists ? targetPath : rootPath);
  };

  useEffect(() => {
    if (!open) return;
    setKeyword('');
    setSelectedFiles([]);
    if (!treeData) {
      void fetchTree(currentPath);
    }
  }, [open]);

  const rootNode = useMemo(() => {
    if (!treeData || !rootPath) return null;
    return treeData.result.find((node) => normalizePathForRoot(node.path, rootPath) === rootPath) || null;
  }, [treeData, rootPath]);

  const currentNode = useMemo(() => {
    if (!treeData) return null;
    if (!rootPath) {
      if (currentPath === '') {
        return {
          type: 'dir' as const,
          name: 'root',
          path: '',
          children: treeData.result,
          files: [],
          fileCount: treeData.total,
          totalSize: 0,
        };
      }
      return findNodeInTree(treeData.result, currentPath, '');
    }
    if (currentPath === rootPath) {
      if (rootNode) return rootNode;
      return {
        type: 'dir' as const,
        name: rootPath.replace(/\/$/, '') || 'root',
        path: rootPath,
        children: treeData.result,
        files: [],
        fileCount: treeData.total,
        totalSize: 0,
      };
    }
    return findNodeInTree(treeData.result, currentPath, rootPath);
  }, [treeData, currentPath, rootNode, rootPath]);

  const dirList = useMemo(() => {
    const list = currentNode?.children || [];
    if (!keyword.trim()) return list;
    return list.filter((item) => item.name.toLowerCase().includes(keyword.toLowerCase()));
  }, [currentNode, keyword]);

  const fileList = useMemo(() => {
    const list = currentNode?.files || [];
    if (!keyword.trim()) return list;
    return list.filter((item) => item.name.toLowerCase().includes(keyword.toLowerCase()));
  }, [currentNode, keyword]);

  const breadcrumbs = useMemo(() => {
    const trimmed = trimSlash(currentPath);
    if (!trimmed) {
      if (!rootPath) return [{ label: '根目录', path: '' }];
      return [{ label: rootPath.replace(/\/$/, '') || 'root', path: rootPath }];
    }
    const parts = trimmed.split('/');
    const items: { label: string; path: string }[] = [];
    if (!rootPath) {
      items.push({ label: '根目录', path: '' });
    }
    parts.forEach((_, index) => {
      const path = normalizePath(parts.slice(0, index + 1).join('/'));
      items.push({ label: parts[index], path });
    });
    return items;
  }, [currentPath, rootPath]);

  const goBack = () => {
    if (!treeData) return;
    if (!rootPath) {
      if (currentPath === '') return;
      const cleaned = trimSlash(currentPath);
      const parts = cleaned.split('/');
      if (parts.length <= 1) {
        setCurrentPath('');
        return;
      }
      navigateTo(normalizePath(parts.slice(0, -1).join('/')));
      return;
    }
    if (currentPath === rootPath) return;
    const parentPath = normalizePath(currentPath.split('/').slice(0, -2).join('/'));
    navigateTo(parentPath || rootPath);
  };

  const atMultiRootHome = !rootPath && currentPath === '';

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
        }
        if (maxCount && prev.length >= maxCount) {
          message.warning(`最多只能选择 ${maxCount} 个文件`);
          return prev;
        }
        return [...prev, item];
      }
      return [item];
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
    if (treeData) {
      const rp = inferRootPathFromTree(treeData);
      setCurrentPath(rp === '' ? '' : rp);
    } else {
      setCurrentPath('');
    }
  };

  return (
    <Modal
      title="素材库"
      width={1123}
      open={open}
      onCancel={onCancelSelect}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onCancelSelect}>
          取消
        </Button>,
        <Button key="confirm" type="primary" onClick={onHandleSelect} disabled={selectedFiles.length === 0}>
          选择 ({selectedFiles.length})
        </Button>,
      ]}
      zIndex={1100}
    >
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              disabled={(!rootPath && currentPath === '') || (Boolean(rootPath) && currentPath === rootPath)}
              onClick={goBack}
              className={`shrink-0 ${(!rootPath && currentPath === '') || (Boolean(rootPath) && currentPath === rootPath) ? 'bg-gray-50! dark:bg-gray-700!' : 'bg-gray-100! hover:bg-gray-200! dark:bg-gray-700! hover:dark:bg-gray-800!'}`}
            />

            <div className="min-w-0 flex-1 rounded-md bg-gray-100/50 px-4 py-1 leading-normal dark:bg-gray-700!">
              {breadcrumbs.map((item, index) => {
                const isCurrent = index === breadcrumbs.length - 1;
                return (
                  <span key={item.path}>
                    <span
                      className={isCurrent ? 'text-primary' : 'cursor-pointer hover:text-primary'}
                      onClick={() => navigateTo(item.path)}
                    >
                      {item.label}
                    </span>
                    {index < breadcrumbs.length - 1 ? ' / ' : ''}
                  </span>
                );
              })}
            </div>
          </Space>
          <Space>
            <Input allowClear placeholder="搜索当前目录文件/目录" className="w-72" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            <Button type="primary" disabled={atMultiRootHome} onClick={() => setIsUploadModalOpen(true)}>
              上传文件
            </Button>
          </Space>
        </div>

        <Spin spinning={loading}>
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-px">
            {dirList.length === 0 && fileList.length === 0 ? (
              <Empty description="当前目录暂无内容" className="py-16" />
            ) : (
              <>
                {dirList.length > 0 && (
                  <section>
                    <header className="mb-4 flex items-center gap-2.5">
                      <span className="text-[15px] font-semibold tracking-wide text-black/88 dark:text-white/88">目录</span>
                      <span className="rounded-full bg-black/4 px-2 py-0.5 text-xs font-medium leading-none text-black/45 dark:bg-white/8 dark:text-white/45">
                        {dirList.length}
                      </span>
                    </header>
                    <div className="flex flex-wrap gap-x-4 gap-y-3">
                      {dirList.map((dir) => (
                        <div
                          key={dir.path}
                          className="w-[120px] rounded-xl border border-black/6 bg-black/2 px-2 pb-2.5 pt-2.5 transition-[border-color,box-shadow,background] duration-200 hover:border-[#5b8ff9] hover:bg-[rgba(91,143,249,0.06)] hover:shadow-[0_4px_14px_rgba(91,143,249,0.12)] dark:border-white/8 dark:bg-white/4"
                        >
                          <div className="cursor-pointer text-center" onClick={() => navigateTo(dir.path)}>
                            <img src={fileSvg} alt={dir.name} className="mx-auto mb-2 h-14 w-18 object-contain" />
                            <Tooltip title={dir.name}>
                              <p className="m-0 line-clamp-2 wrap-break-word text-[13px] leading-snug text-black/85 dark:text-white/88">{dir.name}</p>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {fileList.length > 0 && (
                  <section className={dirList.length > 0 ? 'mt-7 border-t border-black/6 pt-6 dark:border-white/8' : ''}>
                    <header className="mb-4 flex items-center gap-2.5">
                      <span className="text-[15px] font-semibold tracking-wide text-black/88 dark:text-white/88">文件</span>
                      <span className="rounded-full bg-black/4 px-2 py-0.5 text-xs font-medium leading-none text-black/45 dark:bg-white/8 dark:text-white/45">
                        {fileList.length}
                      </span>
                    </header>
                    <div className="grid gap-[18px] grid-cols-[repeat(auto-fill,minmax(232px,1fr))]">
                      {fileList.map((file) => {
                        const isSelected = selectedFiles.some((f) => f.url === file.url);
                        return (
                          <div
                            key={file.path}
                            role="button"
                            tabIndex={0}
                            className={`group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-black/6 bg-white p-0 outline-none transition-[border-color,box-shadow] duration-200 focus-visible:shadow-[0_0_0_2px_rgba(91,143,249,0.45)] dark:border-white/8 dark:bg-white/4 hover:border-[rgba(91,143,249,0.45)] hover:shadow-[0_10px_28px_rgba(17,24,39,0.08)] dark:hover:border-[rgba(91,143,249,0.45)] ${isSelected
                              ? 'border-[rgba(91,143,249,0.65)]! shadow-[0_0_0_2px_rgba(91,143,249,0.18)] dark:border-[rgba(96,165,250,0.65)]! dark:shadow-[0_0_0_2px_rgba(96,165,250,0.2)]'
                              : ''
                              }`}
                            onClick={() => onHandleSelectImage(file)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onHandleSelectImage(file);
                              }
                            }}
                          >
                            <div className="relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-[#f4f6f9] to-[#eceff4] dark:from-[#1f2937] dark:to-[#111827] [&_.ant-image]:block [&_.ant-image]:h-full [&_.ant-image]:w-full [&_.ant-image-img]:block [&_.ant-image-img]:h-full [&_.ant-image-img]:w-full [&_.ant-image-img]:object-cover">
                              <Image src={file.url} fallback={errorImg} preview={false} loading="lazy" />
                              {isSelected && (
                                <span
                                  className="pointer-events-none absolute right-2 top-2 z-2 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primary text-xs text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                                  aria-hidden
                                >
                                  <CheckOutlined />
                                </span>
                              )}
                            </div>
                            <div className="min-h-[52px] flex-1 px-3 pb-1 pt-2.5">
                              <Tooltip title={file.name} placement="topLeft">
                                <p className="mb-1 line-clamp-2 break-all text-[13px] font-medium leading-[1.45] text-black/88 group-hover:text-primary dark:text-white/88">
                                  {file.name}
                                </p>
                              </Tooltip>
                              <p className="m-0 text-xs text-black/45 dark:text-white/45">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </Spin>
      </div>

      <FileUpload
        multiple={multiple || (maxCount !== undefined && maxCount !== 1)}
        dir={trimSlash(currentPath)}
        open={isUploadModalOpen}
        onSuccess={onUpdateSuccess}
        onCancel={() => setIsUploadModalOpen(false)}
      />
    </Modal>
  );
};