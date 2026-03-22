import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftOutlined, CloudUploadOutlined, DeleteOutlined, EditOutlined, EyeOutlined, FolderAddOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Form, Image, Input, Modal, Popconfirm, Space, Spin, Tooltip, message } from 'antd';
import dayjs from 'dayjs';
import { createDirAPI, deleteDirAPI, delFileDataAPI, getFileDataAPI, getFileTreeAPI, renameDirAPI } from '@/api/file';
import FileUpload from '@/components/FileUpload';
import Title from '@/components/Title';
import { FileInfo, FileTreeData, FileTreeNode } from '@/types/app/file';
import errorImg from './image/error.png';
import fileSvg from './image/file.svg';
import './index.scss';

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
    <div className="FilePage">
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
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              disabled={(!rootPath && currentPath === '') || (Boolean(rootPath) && currentPath === rootPath)}
              onClick={goBack}
            >
              返回上一级
            </Button>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {breadcrumbs.map((item, index) => (
                <span key={item.path}>
                  <span className="cursor-pointer hover:text-primary" onClick={() => navigateTo(item.path)}>
                    {item.label}
                  </span>
                  {index < breadcrumbs.length - 1 ? ' / ' : ''}
                </span>
              ))}
            </div>
          </Space>
          <Input allowClear placeholder="搜索当前目录文件/目录" className="w-72" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>

        <Spin spinning={loading}>
          {dirList.length === 0 && fileList.length === 0 ? (
            <Empty description="当前目录暂无内容" className="py-16" />
          ) : (
            <>
              {dirList.length > 0 && (
                <section className="file-section file-section--dirs">
                  <header className="file-section__head">
                    <span className="file-section__title">目录</span>
                    <span className="file-section__count">{dirList.length}</span>
                  </header>
                  <div className="folder-grid">
                    {dirList.map((dir) => (
                      <div key={dir.path} className="folder-item">
                        <div className="cursor-pointer text-center" onClick={() => navigateTo(dir.path)}>
                          <img src={fileSvg} alt={dir.name} className="mx-auto mb-2 w-18 h-14 object-contain" />
                          <Tooltip title={dir.name}>
                            <p className="folder-item__name line-clamp-2">{dir.name}</p>
                          </Tooltip>
                        </div>
                        <div className="folder-actions">
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
                <section className={`file-section ${dirList.length > 0 ? 'file-section--after-dirs' : ''}`}>
                  <header className="file-section__head">
                    <span className="file-section__title">文件</span>
                    <span className="file-section__count">{fileList.length}</span>
                  </header>
                  <div className="file-grid">
                    {fileList.map((file) => (
                      <div key={file.path} className="file-card">
                        <div className="file-card__thumb">
                          <Image src={file.url} fallback={errorImg} preview={false} />
                        </div>
                        <div className="file-card__body">
                          <Tooltip title={file.name} placement="topLeft">
                            <p className="file-card__name">{file.name}</p>
                          </Tooltip>
                          <p className="file-card__size">{formatFileSize(file.size)}</p>
                        </div>
                        <div className="file-actions">
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
            <div className="space-y-2 break-all">
              <p>
                <strong>名称：</strong>
                {fileInfo.name}
              </p>
              <p>
                <strong>路径：</strong>
                {fileInfo.path}
              </p>
              <p>
                <strong>MIME：</strong>
                {fileInfo.mimeType}
              </p>
              <p>
                <strong>大小：</strong>
                {formatFileSize(fileInfo.size)}
              </p>
              <p>
                <strong>上传时间：</strong>
                {dayjs(Math.floor(fileInfo.putTime / 10000)).format('YYYY-MM-DD HH:mm:ss')}
              </p>
              <p>
                <strong>链接：</strong>
                <a href={fileInfo.url} target="_blank" rel="noreferrer">
                  {fileInfo.url}
                </a>
              </p>
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
};