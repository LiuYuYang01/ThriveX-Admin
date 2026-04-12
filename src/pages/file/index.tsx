import { useEffect, useMemo, useState } from 'react';
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  BarsOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FolderAddOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Breadcrumb, Button, Card, Checkbox, Empty, Form, Image, Input, Modal, Popconfirm, Segmented, Select, Space, Spin, Table, Tooltip, message } from 'antd';
import dayjs from 'dayjs';
import { batchDelFileDataAPI, createDirAPI, deleteDirAPI, delFileDataAPI, getFileDataAPI, getFileTreeAPI, renameDirAPI } from '@/api/file';
import FileUpload from '@/components/FileUpload';
import Title from '@/components/Title';
import { File as AppFile, FileInfo, FileTreeData, FileTreeNode } from '@/types/app/file';
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

const FILE_VIEW_STORAGE_KEY = 'thrivex-file-entry-view';

type EntryViewMode = 'grid' | 'list';

function compareLocale(a: string, b: string, order: 'ascend' | 'descend'): number {
  const cmp = a.localeCompare(b, 'zh-CN', { numeric: true, sensitivity: 'base' });
  return order === 'ascend' ? cmp : -cmp;
}

/** 目录排序用时间：优先接口字段，否则取当前目录下文件 createTime/date 的最大值 */
function getDirTimeMs(dir: FileTreeNode): number {
  const direct = dir.mtime ?? dir.updateTime;
  if (typeof direct === 'number' && !Number.isNaN(direct)) return direct;
  let max = 0;
  for (const f of dir.files ?? []) {
    const t = f.createTime ?? f.date ?? 0;
    if (t > max) max = t;
  }
  return max;
}

function sortDirNodes(list: FileTreeNode[], field: 'name' | 'fileCount' | 'totalSize' | 'time', order: 'ascend' | 'descend'): FileTreeNode[] {
  const next = [...list];
  next.sort((a, b) => {
    if (field === 'name') return compareLocale(a.name, b.name, order);
    if (field === 'fileCount') return order === 'ascend' ? a.fileCount - b.fileCount : b.fileCount - a.fileCount;
    if (field === 'totalSize') return order === 'ascend' ? a.totalSize - b.totalSize : b.totalSize - a.totalSize;
    const cmp = getDirTimeMs(a) - getDirTimeMs(b);
    return order === 'ascend' ? cmp : -cmp;
  });
  return next;
}

function getFileTypeLabel(file: AppFile): string {
  if (file.ext) return String(file.ext).replace(/^\./, '').toLowerCase();
  const i = file.name.lastIndexOf('.');
  return i >= 0 ? file.name.slice(i + 1).toLowerCase() : '—';
}

/** 文件排序用时间：createTime / date / putTime（与接口字段对齐，缺省为 0） */
function getFileTimeMs(file: AppFile): number {
  const t = file.createTime ?? file.date ?? file.putTime;
  if (typeof t !== 'number' || Number.isNaN(t)) return 0;
  // 秒级时间戳与毫秒混用时，统一按毫秒比较（小于 1e12 视为秒）
  return t < 1e12 ? t * 1000 : t;
}

function sortFiles(list: AppFile[], field: 'name' | 'size' | 'type' | 'time', order: 'ascend' | 'descend'): AppFile[] {
  const next = [...list];
  next.sort((a, b) => {
    if (field === 'name') return compareLocale(a.name, b.name, order);
    if (field === 'size') return order === 'ascend' ? a.size - b.size : b.size - a.size;
    if (field === 'type') return compareLocale(getFileTypeLabel(a), getFileTypeLabel(b), order);
    const cmp = getFileTimeMs(a) - getFileTimeMs(b);
    return order === 'ascend' ? cmp : -cmp;
  });
  return next;
}

type DirSortField = 'name' | 'fileCount' | 'totalSize' | 'time';

const DIR_SORT_FIELD_OPTIONS: { value: DirSortField; label: string }[] = [
  { value: 'time', label: '时间' },
  { value: 'name', label: '名称' },
  { value: 'fileCount', label: '文件数' },
  { value: 'totalSize', label: '大小' },
];

type FileSortField = 'name' | 'size' | 'type' | 'time';

const FILE_SORT_FIELD_OPTIONS: { value: FileSortField; label: string }[] = [
  { value: 'time', label: '时间' },
  { value: 'name', label: '名称' },
  { value: 'size', label: '大小' },
  { value: 'type', label: '类型' },
];

/** 供 Table 使用：去掉 `children` 避免被当作树表；子目录个数单独保留 */
type DirTableRow = Omit<FileTreeNode, 'children'> & { subDirCount: number };

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
  const [dirSortField, setDirSortField] = useState<DirSortField>('time');
  const [dirSortOrder, setDirSortOrder] = useState<'ascend' | 'descend'>('descend');
  const [fileSortField, setFileSortField] = useState<FileSortField>('time');
  const [fileSortOrder, setFileSortOrder] = useState<'ascend' | 'descend'>('descend');

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

  const sortedDirList = useMemo(() => sortDirNodes(dirList, dirSortField, dirSortOrder), [dirList, dirSortField, dirSortOrder]);

  const dirTableRows = useMemo<DirTableRow[]>(
    () =>
      sortedDirList.map((dir) => {
        const { children, ...rest } = dir;
        return { ...rest, subDirCount: children.length };
      }),
    [sortedDirList],
  );

  const sortedFileList = useMemo(() => sortFiles(fileList, fileSortField, fileSortOrder), [fileList, fileSortField, fileSortOrder]);

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
        <div className="mb-4 flex min-w-0 items-center gap-2 sm:gap-3">
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

        <Spin spinning={loading}>
          {dirList.length === 0 && fileList.length === 0 ? (
            <Empty description="当前目录暂无内容" className="py-16" />
          ) : (
            <>
              <div className="mb-5 flex justify-between flex-col gap-3 rounded-xl border border-black/6 bg-black/2 px-3 py-2 dark:border-white/8 dark:bg-white/3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                <div>
                  {fileList.length > 0 && (
                    <>
                      {viewMode === 'grid' && (
                        <Checkbox
                          className="shrink-0"
                          checked={allFileSelected}
                          indeterminate={someFileSelected && !allFileSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFilePaths(fileList.map((f) => f.path));
                            } else {
                              setSelectedFilePaths([]);
                            }
                          }}
                        >
                          全选
                        </Checkbox>
                      )}

                      {selectedFilePaths.length > 0 && (
                        <Popconfirm
                          title={`确定删除选中的 ${selectedFilePaths.length} 个文件吗？`}
                          okText="确定"
                          cancelText="取消"
                          onConfirm={onBatchDeleteFiles}
                        >
                          <Button type="primary" danger>
                            批量删除 ({selectedFilePaths.length})
                          </Button>
                        </Popconfirm>
                      )}
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Segmented<EntryViewMode>
                    value={viewMode}
                    onChange={setViewMode}
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

                  {dirList.length > 0 && (
                    <>
                      <span className="hidden h-5 w-px shrink-0 bg-black/10 sm:block dark:bg-white/12" aria-hidden />
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                        <Select<DirSortField>
                          className="min-w-22"
                          value={dirSortField}
                          options={DIR_SORT_FIELD_OPTIONS}
                          onChange={setDirSortField}
                        />
                        <Segmented<'ascend' | 'descend'>
                          value={dirSortOrder}
                          onChange={setDirSortOrder}
                          options={[
                            { label: '升序', value: 'ascend' },
                            { label: '降序', value: 'descend' },
                          ]}
                        />
                      </div>
                    </>
                  )}

                  {fileList.length > 0 && (
                    <>
                      <span className="hidden h-5 w-px shrink-0 bg-black/10 sm:block dark:bg-white/12" aria-hidden />
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                        <Select<FileSortField>
                          className="min-w-22"
                          value={fileSortField}
                          options={FILE_SORT_FIELD_OPTIONS}
                          onChange={setFileSortField}
                        />
                        <Segmented<'ascend' | 'descend'>
                          value={fileSortOrder}
                          onChange={setFileSortOrder}
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
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              </div>

              {dirList.length > 0 && (
                <section>
                  <header className="mb-4 flex items-center gap-2.5">
                    <span className="text-[15px] font-semibold tracking-wide text-black/88 dark:text-white/88">目录</span>
                    <span className="rounded-full bg-black/4 px-2 py-0.5 text-xs font-medium leading-none text-black/45 dark:bg-white/8 dark:text-white/45">
                      {dirList.length}
                    </span>
                  </header>
                  {viewMode === 'list' ? (
                    <Table<DirTableRow>
                      rowKey="path"
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                      className="[&_.ant-table-cell]:align-middle"
                      dataSource={dirTableRows}
                      columns={
                        [
                          {
                            title: '名称',
                            dataIndex: 'name',
                            ellipsis: true,
                            render: (_, row) => (
                              <button
                                type="button"
                                className="max-w-full cursor-pointer border-0 bg-transparent p-0 text-left font-inherit text-primary hover:underline"
                                onClick={() => navigateTo(row.path)}
                              >
                                {row.name}
                              </button>
                            ),
                          },
                          {
                            title: '子目录',
                            width: 88,
                            align: 'center',
                            render: (_, row) => row.subDirCount,
                          },
                          {
                            title: '文件数',
                            width: 88,
                            align: 'center',
                            render: (_, row) => row.fileCount,
                          },
                          {
                            title: '大小',
                            width: 104,
                            align: 'right',
                            render: (_, row) => formatFileSize(row.totalSize),
                          },
                          {
                            title: '操作',
                            key: 'actions',
                            width: 112,
                            align: 'center',
                            render: (_, row) => {
                              const node = sortedDirList.find((d) => d.path === row.path);
                              return (
                                <div className="flex items-center justify-center gap-3">
                                  <Tooltip title="重命名目录">
                                    <Button
                                      type="text"
                                      icon={<EditOutlined />}
                                      disabled={!node}
                                      onClick={() => node && openRenameDir(node)}
                                    />
                                  </Tooltip>
                                  <Tooltip title="删除目录">
                                    <Popconfirm title="确定删除该目录吗？" okText="确定" cancelText="取消" onConfirm={() => onDeleteDir(row.path)}>
                                      <Button type="text" danger icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                  </Tooltip>
                                </div>
                              );
                            },
                          },
                        ] as ColumnsType<DirTableRow>
                      }
                    />
                  ) : (
                    <div className="flex flex-wrap gap-x-4 gap-y-3">
                      {sortedDirList.map((dir) => (
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
                              <Button type="text" icon={<EditOutlined />} onClick={() => openRenameDir(dir)} />
                            </Tooltip>
                            <Popconfirm title="确定删除该目录吗？" okText="确定" cancelText="取消" onConfirm={() => onDeleteDir(dir.path)}>
                              <Button type="text" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <Image.PreviewGroup>
                    {viewMode === 'list' ? (
                      <Table<AppFile>
                        rowKey="path"
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        className="[&_.ant-table-cell]:align-middle"
                        dataSource={sortedFileList}
                        rowSelection={{
                          selectedRowKeys: selectedFilePaths,
                          onChange: (keys) => setSelectedFilePaths(keys as string[]),
                          columnWidth: 40,
                        }}
                        columns={
                          [
                            {
                              title: '预览',
                              key: 'thumb',
                              width: 88,
                              render: (_, file) => (
                                <div className="relative size-14 overflow-hidden rounded-lg bg-linear-to-br from-[#f4f6f9] to-[#eceff4] dark:from-[#1f2937] dark:to-[#111827]">
                                  <Image
                                    src={file.url}
                                    fallback={errorImg}
                                    alt={file.name}
                                    loading="lazy"
                                    preview={{ alt: file.name }}
                                    rootClassName="block size-full"
                                    className="size-full object-cover"
                                  />
                                </div>
                              ),
                            },
                            {
                              title: '名称',
                              dataIndex: 'name',
                              ellipsis: true,
                              render: (name: string) => (
                                <Tooltip title={name} placement="topLeft">
                                  <span className="font-medium text-black/88 dark:text-white/88">{name}</span>
                                </Tooltip>
                              ),
                            },
                            {
                              title: '大小',
                              width: 108,
                              align: 'right',
                              render: (_, file) => (
                                <span className="tabular-nums text-black/88 dark:text-white/88">{formatFileSize(file.size)}</span>
                              ),
                            },
                            {
                              title: '类型',
                              width: 88,
                              ellipsis: true,
                              render: (_, file) => (
                                <span className="font-mono text-xs text-black/65 dark:text-white/65">{getFileTypeLabel(file)}</span>
                              ),
                            },
                            {
                              title: '操作',
                              key: 'actions',
                              width: 112,
                              align: 'center',
                              render: (_, file) => (
                                <div className="flex items-center justify-center gap-3">
                                  <Tooltip title="查看详情">
                                    <Button type="text" icon={<EyeOutlined />} onClick={() => onOpenFileDetail(file.path)} />
                                  </Tooltip>
                                  <Tooltip title="删除文件">
                                    <Popconfirm title="确定删除该文件吗？" okText="确定" cancelText="取消" onConfirm={() => onDeleteFile(file.path)}>
                                      <Button type="text" danger icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                  </Tooltip>
                                </div>
                              ),
                            },
                          ] as ColumnsType<AppFile>
                        }
                      />
                    ) : (
                      <div className="grid gap-[18px] grid-cols-[repeat(auto-fill,minmax(232px,1fr))]">
                        {sortedFileList.map((file) => (
                          <div
                            key={file.path}
                            className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-black/6 bg-white p-0 transition-[border-color,box-shadow,transform] duration-200 ease-out dark:border-white/8 dark:bg-white/4 hover:-translate-y-1 hover:border-[rgba(91,143,249,0.45)] hover:shadow-[0_14px_36px_rgba(17,24,39,0.12)] dark:hover:border-[rgba(91,143,249,0.45)] dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.45)]"
                          >
                            <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden bg-linear-to-br from-[#f4f6f9] to-[#eceff4] transition-[filter] duration-200 group-hover:brightness-[1.03] dark:from-[#1f2937] dark:to-[#111827] dark:group-hover:brightness-[1.06]">
                              <div className="absolute left-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedFilePaths.includes(file.path)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedFilePaths((prev) =>
                                      checked ? [...prev, file.path] : prev.filter((p) => p !== file.path),
                                    );
                                  }}
                                />
                              </div>
                              <Image
                                src={file.url}
                                fallback={errorImg}
                                alt={file.name}
                                loading="lazy"
                                preview={{ alt: file.name }}
                                rootClassName="absolute inset-0 block size-full"
                                className="size-full h-[inherit]! cursor-zoom-in object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                              />
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
                              <Tooltip title="删除文件">
                                <Popconfirm title="确定删除该文件吗？" okText="确定" cancelText="取消" onConfirm={() => onDeleteFile(file.path)}>
                                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                              </Tooltip>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Image.PreviewGroup>
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
                  <dt className="shrink-0 text-xs font-medium text-black/50 dark:text-white/45">类型</dt>
                  <dd className="min-w-0 font-mono text-xs text-black/80 break-all dark:text-white/85">{fileInfo.mimeType}</dd>
                </div>
                <div className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[6.75rem_1fr] sm:gap-x-4 sm:items-baseline">
                  <dt className="shrink-0 text-xs font-medium text-black/50 dark:text-white/45">大小</dt>
                  <dd className="min-w-0 text-sm tabular-nums text-black/88 dark:text-white/90">{formatFileSize(fileInfo.size)}</dd>
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
    </div>
  );
};