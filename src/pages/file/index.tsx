import { useEffect, useMemo, useState } from 'react';
import {
  CloudUploadOutlined,
  FolderAddOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, Card, Empty, Form, Space, Spin, message } from 'antd';
import { batchDelFileDataAPI, createDirAPI, deleteDirAPI, delFileDataAPI, getFileDataAPI, getFileTreeAPI, renameDirAPI } from '@/api/file';
import FileUpload from '@/components/FileUpload';
import Title from '@/components/Title';
import { FileInfo, FileTreeData, FileTreeNode } from '@/types/app/file';
import {
  findNodeInTree,
  inferRootPathFromTree,
  normalizePathForRoot,
  sortDirNodes,
  sortFiles,
} from './utils';
import FileBreadcrumb from './components/FileBreadcrumb';
import FileToolbar from './components/FileToolbar';
import DirSection from './components/DirSection';
import FileSection from './components/FileSection';
import FileModals from './components/FileModals';

const FILE_VIEW_STORAGE_KEY = 'thrivex-file-entry-view';

export type EntryViewMode = 'grid' | 'list';
export type SortField = 'name' | 'size' | 'time' | 'type' | 'fileCount';
export type SortOrder = 'ascend' | 'descend';

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
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<EntryViewMode>(() => {
    try {
      return localStorage.getItem(FILE_VIEW_STORAGE_KEY) === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });
  const [sortField, setSortField] = useState<SortField>('time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('descend');

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
    fetchTree();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FILE_VIEW_STORAGE_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

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

  const sortedDirList = useMemo(() => {
    let field: 'name' | 'fileCount' | 'totalSize' | 'time' = 'time';
    if (sortField === 'name') field = 'name';
    if (sortField === 'size') field = 'totalSize';
    if (sortField === 'fileCount') field = 'fileCount';
    return sortDirNodes(dirList, field, sortOrder);
  }, [dirList, sortField, sortOrder]);

  const dirTableRows = useMemo(
    () =>
      sortedDirList.map((dir) => {
        const { children, ...rest } = dir;
        return { ...rest, subDirCount: children.length };
      }),
    [sortedDirList],
  );

  const sortedFileList = useMemo(() => {
    let field: 'name' | 'size' | 'type' | 'time' = 'time';
    if (sortField === 'name') field = 'name';
    if (sortField === 'size') field = 'size';
    if (sortField === 'type') field = 'type';
    return sortFiles(fileList, field, sortOrder);
  }, [fileList, sortField, sortOrder]);

  const allFileSelected = useMemo(
    () => fileList.length > 0 && fileList.every((f) => selectedFilePaths.includes(f.path)),
    [fileList, selectedFilePaths],
  );
  const someFileSelected = useMemo(
    () => fileList.some((f) => selectedFilePaths.includes(f.path)),
    [fileList, selectedFilePaths],
  );

  useEffect(() => {
    const allowed = new Set(fileList.map((f) => f.path));
    setSelectedFilePaths((prev) => prev.filter((p) => allowed.has(p)));
  }, [fileList]);

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
      setSelectedFilePaths((prev) => prev.filter((p) => p !== filePath));
      fetchTree(currentPath);
    } catch (error) {
      console.error(error);
    }
  };

  const onBatchDeleteFiles = async () => {
    if (selectedFilePaths.length === 0) return;
    try {
      await batchDelFileDataAPI(selectedFilePaths);
      message.success('🎉 批量删除成功');
      setSelectedFilePaths([]);
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
        <FileBreadcrumb
          rootPath={rootPath}
          currentPath={currentPath}
          breadcrumbs={breadcrumbs}
          onNavigate={navigateTo}
          onGoBack={goBack}
        />

        <Spin spinning={loading}>
          {dirList.length === 0 && fileList.length === 0 ? (
            <Empty description="当前目录暂无内容" className="py-16" />
          ) : (
            <>
              <FileToolbar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                sortField={sortField}
                onSortFieldChange={setSortField}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                keyword={keyword}
                onKeywordChange={setKeyword}
                selectedCount={selectedFilePaths.length}
                onBatchDelete={onBatchDeleteFiles}
                allFileSelected={allFileSelected}
                someFileSelected={someFileSelected}
                onSelectAllChange={(checked) => {
                  setSelectedFilePaths(checked ? fileList.map((f) => f.path) : []);
                }}
                hasFiles={fileList.length > 0}
                hasDirs={dirList.length > 0}
              />

              <DirSection
                viewMode={viewMode}
                dirList={sortedDirList}
                dirTableRows={dirTableRows}
                onNavigate={navigateTo}
                onRename={openRenameDir}
                onDelete={onDeleteDir}
              />

              <FileSection
                viewMode={viewMode}
                fileList={sortedFileList}
                selectedFilePaths={selectedFilePaths}
                onSelectChange={setSelectedFilePaths}
                onOpenFileDetail={onOpenFileDetail}
                onDeleteFile={onDeleteFile}
                hasDirs={dirList.length > 0}
              />
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

      <FileModals
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        onCreateDir={onCreateDir}
        createForm={createForm}
        renameOpen={renameOpen}
        setRenameOpen={setRenameOpen}
        onRenameDir={onRenameDir}
        renameForm={renameForm}
        detailOpen={detailOpen}
        setDetailOpen={setDetailOpen}
        detailLoading={detailLoading}
        fileInfo={fileInfo}
      />
    </div>
  );
};
