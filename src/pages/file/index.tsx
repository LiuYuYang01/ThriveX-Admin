import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftOutlined, CloudUploadOutlined, DeleteOutlined, EditOutlined, EyeOutlined, FolderAddOutlined, ReloadOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Card, Empty, Form, Image, Input, Modal, Popconfirm, Space, Spin, Tooltip, message } from 'antd';
import dayjs from 'dayjs';
import { createDirAPI, deleteDirAPI, delFileDataAPI, getFileDataAPI, getFileTreeAPI, renameDirAPI } from '@/api/file';
import FileUpload from '@/components/FileUpload';
import Title from '@/components/Title';
import { FileInfo, FileTreeData, FileTreeNode } from '@/types/app/file';
import errorImg from './image/error.png';
import fileSvg from './image/file.svg';

/** 从整棵树推断根目录前缀（如 static/）；多根目录时返回空串，由虚拟根列表展示全部 result */
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

export default () => {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<FileTreeData | null>(null);
  const [currentPath, setCurrentPath] = useState('');
  const [keyword, setKeyword] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileTreeNode | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [createForm] = Form.useForm<{ name: string }>();
  const [renameForm] = Form.useForm<{ name: string }>();

  const rootPath = useMemo(() => inferRootPathFromTree(treeData), [treeData]);

  const normalizePath = (path: string) => normalizePathForRoot(path, rootPath);
  const trimSlash = (path: string) => normalizePathForRoot(path, rootPath).replace(/\/$/, '');

  const findNode = (list: FileTreeNode[], targetPath: string): FileTreeNode | null =>
    findNodeInTree(list, targetPath, rootPath);

  /** 仅请求接口拉取整棵树；目录点击、面包屑、返回上一级不调用 */
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
    fetchTree();
  }, []);

  const rootNode = useMemo(() => {
    if (!treeData || !rootPath) return null;
    return treeData.result.find((node) => normalizePathForRoot(node.path, rootPath) === rootPath) || null;
  }, [treeData, rootPath]);

  const currentNode = useMemo(() => {
    if (!treeData) return null;
    // 多根：虚拟根层展示全部 result 作为一级目录
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

  const onCreateDir = async () => {
    try {
      const { name } = await createForm.validateFields();
      const dir = `${trimSlash(currentPath)}/${name.trim()}`;
      await createDirAPI({ dir });
      message.success('🎉 新建目录成功');
      setCreateOpen(false);
      createForm.resetFields();
      fetchTree(currentPath);
    } catch (error) {
      console.error(error);
    }
  };

  const openRenameDir = (target: FileTreeNode) => {
    setRenameTarget(target);
    renameForm.setFieldValue('name', target.name);
    setRenameOpen(true);
  };

  const onRenameDir = async () => {
    if (!renameTarget) return;
    try {
      const { name } = await renameForm.validateFields();
      const parentDir = renameTarget.path.split('/').slice(0, -2).join('/');
      const toDir = `${parentDir}/${name.trim()}`.replace(/^\/+/, '');
      await renameDirAPI({
        fromDir: trimSlash(renameTarget.path),
        toDir,
      });
      message.success('🎉 目录重命名成功');
      setRenameOpen(false);
      setRenameTarget(null);
      renameForm.resetFields();
      fetchTree(currentPath);
    } catch (error) {
      console.error(error);
    }
  };

  const onDeleteDir = async (dirPath: string) => {
    try {
      await deleteDirAPI(trimSlash(dirPath));
      message.success('🎉 删除目录成功');
      fetchTree(currentPath);
    } catch (error) {
      console.error(error);
    }
  };

  const onDeleteFile = async (filePath: string) => {
    try {
      await delFileDataAPI(filePath);
      message.success('🎉 删除文件成功');
      fetchTree(currentPath);
    } catch (error) {
      console.error(error);
    }
  };

  const onOpenFileDetail = async (filePath: string) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      const { data } = await getFileDataAPI(filePath);
      setFileInfo(data);
    } catch (error) {
      console.error(error);
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <Title value="文件管理">
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchTree(currentPath)}>
            刷新
          </Button>
          <Button icon={<FolderAddOutlined />} disabled={atMultiRootHome} onClick={() => setCreateOpen(true)}>
            新建目录
          </Button>
          <Button type="primary" icon={<CloudUploadOutlined />} disabled={atMultiRootHome} onClick={() => setUploadOpen(true)}>
            上传文件
          </Button>
        </Space>
      </Title>

      <Card className="rounded-2xl!">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              disabled={(!rootPath && currentPath === '') || (Boolean(rootPath) && currentPath === rootPath)}
              onClick={goBack}
              className={`shrink-0 ${(!rootPath && currentPath === '') || (Boolean(rootPath) && currentPath === rootPath) ? 'bg-gray-50! dark:bg-gray-700!' : 'bg-gray-100! hover:bg-gray-200! dark:bg-gray-700! hover:dark:bg-gray-800!'}`}
            />

            <nav className="min-w-0 flex-1 rounded-md bg-gray-100/50 px-4 py-1 leading-normal dark:bg-gray-700!" aria-label="当前路径">
              <Breadcrumb
                className="text-sm [&.ant-breadcrumb]:text-inherit [&_ol]:flex [&_ol]:flex-wrap [&_ol]:items-center [&_ol]:gap-y-1 [&_.ant-breadcrumb-separator]:mx-1"
                separator={<span className="select-none text-black/22 dark:text-white/25">/</span>}
                items={breadcrumbs.map((item, index) => {
                  const isCurrent = index === breadcrumbs.length - 1;
                  return {
                    key: `${index}-${item.path}`,
                    title: (
                      <button
                        type="button"
                        className={
                          isCurrent
                            ? 'max-w-full cursor-default rounded border-0 bg-transparent p-0 text-left font-inherit font-semibold text-primary focus-visible:outline focus-visible:outline-primary focus-visible:outline-offset-2 dark:text-white/92'
                            : 'max-w-full cursor-pointer rounded border-0 bg-transparent p-0 text-left font-inherit text-black/55 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 dark:text-white/55 dark:hover:text-primary'
                        }
                        onClick={() => navigateTo(item.path)}
                      >
                        {item.label}
                      </button>
                    ),
                  };
                })}
              />
            </nav>
          </div>

          <div className="w-full shrink-0 sm:w-auto sm:min-w-[240px] sm:max-w-[min(100%,18rem)]">
            <Input allowClear placeholder="搜索当前目录文件/目录" className="w-full" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
        </div>

        <Spin spinning={loading}>
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
                        className="w-[120px] rounded-xl border border-black/6 bg-black/2 px-2 pb-2 pt-2.5 transition-[border-color,box-shadow,background] duration-200 hover:border-[#5b8ff9] hover:bg-[rgba(91,143,249,0.06)] hover:shadow-[0_4px_14px_rgba(91,143,249,0.12)] dark:border-white/8 dark:bg-white/4"
                      >
                        <div className="cursor-pointer text-center" onClick={() => navigateTo(dir.path)}>
                          <img src={fileSvg} alt={dir.name} className="mx-auto mb-2 h-14 w-18 object-contain" />
                          <Tooltip title={dir.name}>
                            <p className="m-0 line-clamp-2 wrap-break-word text-[13px] leading-snug text-black/85 dark:text-white/88">{dir.name}</p>
                          </Tooltip>
                        </div>
                        <div className="mt-2 flex justify-center gap-1">
                          <Tooltip title="重命名目录">
                            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openRenameDir(dir)} />
                          </Tooltip>
                          <Popconfirm title="确认删除该目录及其所有文件？" okText="确定" cancelText="取消" onConfirm={() => onDeleteDir(dir.path)}>
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
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
                    {fileList.map((file) => (
                      <div
                        key={file.path}
                        className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-black/6 bg-white p-0 transition-[border-color,box-shadow,transform] duration-200 ease-out dark:border-white/8 dark:bg-white/4 hover:-translate-y-1 hover:border-[rgba(91,143,249,0.45)] hover:shadow-[0_14px_36px_rgba(17,24,39,0.12)] dark:hover:border-[rgba(91,143,249,0.45)] dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.45)]"
                      >
                        <div className="relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-[#f4f6f9] to-[#eceff4] transition-[filter] duration-200 group-hover:brightness-[1.03] dark:from-[#1f2937] dark:to-[#111827] dark:group-hover:brightness-[1.06] [&_.ant-image]:block [&_.ant-image]:h-full [&_.ant-image]:w-full [&_.ant-image-img]:block [&_.ant-image-img]:h-full [&_.ant-image-img]:w-full [&_.ant-image-img]:origin-center [&_.ant-image-img]:object-cover [&_.ant-image-img]:transition-transform [&_.ant-image-img]:duration-300 [&_.ant-image-img]:ease-out group-hover:[&_.ant-image-img]:scale-105">
                          <Image src={file.url} fallback={errorImg} preview={false} loading="lazy" className="h-[inherit]!"/>
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
                            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onOpenFileDetail(file.path)} />
                          </Tooltip>
                          <Popconfirm title="确认删除该文件？" okText="确定" cancelText="取消" onConfirm={() => onDeleteFile(file.path)}>
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </Spin>
      </Card>

      <FileUpload
        multiple
        dir={trimSlash(currentPath)}
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        onSuccess={() => {
          setUploadOpen(false);
          fetchTree(currentPath);
        }}
      />

      <Modal title="新建目录" open={createOpen} onOk={onCreateDir} onCancel={() => setCreateOpen(false)} destroyOnHidden>
        <Form form={createForm} layout="vertical">
          <Form.Item
            label="目录名称"
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

      <Modal title="重命名目录" open={renameOpen} onOk={onRenameDir} onCancel={() => setRenameOpen(false)} destroyOnHidden>
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

      <Modal title="文件详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} destroyOnHidden>
        <Spin spinning={detailLoading}>
          {fileInfo && (
            <div className="rounded-xl border border-black/6 bg-gray-50/50 dark:border-white/10 dark:bg-white/5">
              <dl className="divide-y divide-black/6 dark:divide-white/10">
                <div className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[6.75rem_1fr] sm:gap-x-4 sm:items-baseline">
                  <dt className="shrink-0 text-xs font-medium text-black/50 dark:text-white/45">名称</dt>
                  <dd className="min-w-0 text-sm leading-relaxed text-black/88 wrap-break-word dark:text-white/90">{fileInfo.name}</dd>
                </div>
                <div className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[6.75rem_1fr] sm:gap-x-4 sm:items-baseline">
                  <dt className="shrink-0 text-xs font-medium text-black/50 dark:text-white/45">路径</dt>
                  <dd className="min-w-0 font-mono text-xs leading-relaxed text-black/80 break-all dark:text-white/85">{fileInfo.path}</dd>
                </div>
                <div className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[6.75rem_1fr] sm:gap-x-4 sm:items-baseline">
                  <dt className="shrink-0 text-xs font-medium text-black/50 dark:text-white/45">MIME</dt>
                  <dd className="min-w-0 font-mono text-xs text-black/80 break-all dark:text-white/85">{fileInfo.mimeType}</dd>
                </div>
                <div className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[6.75rem_1fr] sm:gap-x-4 sm:items-baseline">
                  <dt className="shrink-0 text-xs font-medium text-black/50 dark:text-white/45">大小</dt>
                  <dd className="min-w-0 text-sm tabular-nums text-black/88 dark:text-white/90">{formatFileSize(fileInfo.size)}</dd>
                </div>
                <div className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[6.75rem_1fr] sm:gap-x-4 sm:items-baseline">
                  <dt className="shrink-0 text-xs font-medium text-black/50 dark:text-white/45">上传时间</dt>
                  <dd className="min-w-0 text-sm tabular-nums text-black/88 dark:text-white/90">
                    {dayjs(Math.floor(fileInfo.putTime / 10000)).format('YYYY-MM-DD HH:mm:ss')}
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
    </div>
  );
};