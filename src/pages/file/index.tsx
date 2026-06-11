import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ColumnsType } from 'antd/es/table';
import {
  Button,
  Checkbox,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Spin,
  Table,
  Tooltip,
  message,
} from 'antd';
import {
  FiArrowLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiFolderPlus,
  FiGrid,
  FiList,
  FiRotateCcw,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
} from 'react-icons/fi';
import dayjs from 'dayjs';
import { batchDelFileDataAPI, createDirAPI, deleteDirAPI, delFileDataAPI, getFileDataAPI, getFileTreeAPI, renameDirAPI } from '@/api/file';
import FileUpload from '@/components/FileUpload';
import Title from '@/components/Title';
import { File as AppFile, FileInfo, FileTreeData, FileTreeNode } from '@/types/app/file';
import Skeleton from './Skeleton';
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

const iconBtnBase =
  'flex size-8 items-center justify-center rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40';

function TableIconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
  confirm,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
  confirm?: {
    title: string;
    onConfirm: () => void;
  };
}) {
  const button = (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={confirm ? undefined : onClick}
      className={
        danger
          ? `${iconBtnBase} text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10`
          : `${iconBtnBase} text-slate-400 hover:bg-slate-100 hover:text-primary dark:hover:bg-white/5 dark:hover:text-primary`
      }
    >
      {children}
    </button>
  );

  const trigger = confirm ? (
    <Popconfirm title={confirm.title} okText="确定" cancelText="取消" onConfirm={confirm.onConfirm}>
      {button}
    </Popconfirm>
  ) : (
    button
  );

  return <Tooltip title={label}>{trigger}</Tooltip>;
}

function ViewModeToggle({
  value,
  onChange,
}: {
  value: EntryViewMode;
  onChange: (mode: EntryViewMode) => void;
}) {
  return (
    <Segmented<EntryViewMode>
      value={value}
      onChange={onChange}
      options={[
        {
          label: (
            <span className="inline-flex items-center gap-1">
              <FiGrid size={14} />
              网格
            </span>
          ),
          value: 'grid',
        },
        {
          label: (
            <span className="inline-flex items-center gap-1">
              <FiList size={14} />
              列表
            </span>
          ),
          value: 'list',
        },
      ]}
    />
  );
}

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <header className="mb-3 flex items-center gap-2">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium tabular-nums text-slate-500 dark:bg-boxdark-2 dark:text-slate-400">
        {count}
      </span>
    </header>
  );
}

export default () => {
  const [loading, setLoading] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
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
      setSkeletonLoading(false);
      setLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    if (!treeData) return;
    const targetPath = normalizePath(path);
    setKeyword('');
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

  const rawDirList = currentNode?.children ?? [];
  const rawFileList = currentNode?.files ?? [];
  const hasFilteredEntries = dirList.length > 0 || fileList.length > 0;
  const hasRawEntries = rawDirList.length > 0 || rawFileList.length > 0;
  const isSearchActive = !!keyword.trim();
  const isSearchEmpty = isSearchActive && !hasFilteredEntries && hasRawEntries;

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

  const canGoBack =
    (!rootPath && currentPath !== '') || (Boolean(rootPath) && currentPath !== rootPath);

  if (skeletonLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="文件管理">
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={<FiRotateCcw />} onClick={() => fetchTree(currentPath)}>
            刷新
          </Button>
          <Button icon={<FiFolderPlus />} disabled={atMultiRootHome} onClick={() => setCreateOpen(true)}>
            新建目录
          </Button>
          <Button
            type="primary"
            icon={<FiUploadCloud />}
            disabled={atMultiRootHome}
            onClick={() => setUploadOpen(true)}
          >
            上传文件
          </Button>
        </div>
      </Title>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <header className="shrink-0 border-b border-slate-100 px-3 py-2.5 sm:px-4 sm:py-3 dark:border-strokedark">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="返回上一级"
              disabled={!canGoBack}
              onClick={goBack}
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors cursor-pointer ${canGoBack
                ? 'border-slate-200/80 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-strokedark dark:bg-boxdark-2 dark:text-slate-300 dark:hover:bg-white/5'
                : 'cursor-not-allowed border-transparent bg-slate-50/60 text-slate-300 dark:bg-boxdark-2/50 dark:text-slate-600'
                }`}
            >
              <FiArrowLeft size={18} />
            </button>

            <nav
              className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-slate-200/60 bg-slate-50/80 px-3 py-2 dark:border-strokedark dark:bg-boxdark-2/80"
              aria-label="当前路径"
            >
              <ol className="flex min-w-max flex-wrap items-center gap-1 text-sm">
                {breadcrumbs.map((item, index) => {
                  const isCurrent = index === breadcrumbs.length - 1;
                  return (
                    <li key={`${index}-${item.path}`} className="flex items-center gap-1">
                      {index > 0 && (
                        <FiChevronRight className="shrink-0 text-slate-300 dark:text-slate-600" size={14} aria-hidden />
                      )}
                      <button
                        type="button"
                        onClick={() => !isCurrent && navigateTo(item.path)}
                        className={`max-w-48 truncate rounded px-0.5 transition-colors ${isCurrent
                          ? 'cursor-default font-semibold text-primary'
                          : 'cursor-pointer text-slate-500 hover:text-primary dark:text-slate-400'
                          }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
          <Spin
            spinning={loading}
            className="flex min-h-0 flex-1 flex-col [&_.ant-spin-container]:flex [&_.ant-spin-container]:min-h-0 [&_.ant-spin-container]:flex-1 [&_.ant-spin-container]:flex-col"
          >
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-4 flex shrink-0 flex-col gap-2 rounded-xl border border-slate-200/70 bg-slate-50/50 px-3 py-2.5 dark:border-strokedark dark:bg-boxdark-2/40 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {fileList.length > 0 && viewMode === 'grid' && (
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
                      全选文件
                    </Checkbox>
                  )}

                  {selectedFilePaths.length > 0 && (
                    <Popconfirm
                      title={`确定删除选中的 ${selectedFilePaths.length} 个文件吗？`}
                      okText="确定"
                      cancelText="取消"
                      onConfirm={onBatchDeleteFiles}
                    >
                      <Button type="primary" danger icon={<FiTrash2 />}>
                        批量删除 ({selectedFilePaths.length})
                      </Button>
                    </Popconfirm>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <ViewModeToggle value={viewMode} onChange={setViewMode} />

                  {rawDirList.length > 0 && (
                    <>
                      <span className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block dark:bg-strokedark" aria-hidden />
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">目录</span>
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

                  {rawFileList.length > 0 && (
                    <>
                      <span className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block dark:bg-strokedark" aria-hidden />
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">文件</span>
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

                  <Input
                    allowClear
                    prefix={<FiSearch className="text-slate-400" size={15} />}
                    placeholder="搜索当前目录"
                    className="w-full sm:w-52!"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              </div>

              {!hasFilteredEntries ? (
                <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-strokedark dark:bg-boxdark-2/30">
                  {isSearchEmpty ? (
                    <Empty description={`未找到匹配「${keyword.trim()}」的内容`}>
                      <Button type="primary" onClick={() => setKeyword('')}>
                        清除搜索
                      </Button>
                    </Empty>
                  ) : (
                    <Empty description="当前目录暂无内容" />
                  )}
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto">

                  {dirList.length > 0 && (
                    <section>
                      <SectionHeading title="目录" count={dirList.length} />
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
                                    className="max-w-full cursor-pointer border-0 bg-transparent p-0 text-left font-medium text-primary hover:underline"
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
                                render: (_, row) => (
                                  <span className="tabular-nums text-slate-600 dark:text-slate-300">{row.subDirCount}</span>
                                ),
                              },
                              {
                                title: '文件数',
                                width: 88,
                                align: 'center',
                                render: (_, row) => (
                                  <span className="tabular-nums text-slate-600 dark:text-slate-300">{row.fileCount}</span>
                                ),
                              },
                              {
                                title: '大小',
                                width: 104,
                                align: 'right',
                                render: (_, row) => (
                                  <span className="tabular-nums text-slate-600 dark:text-slate-300">
                                    {formatFileSize(row.totalSize)}
                                  </span>
                                ),
                              },
                              {
                                title: '操作',
                                key: 'actions',
                                width: 96,
                                align: 'center',
                                render: (_, row) => {
                                  const node = sortedDirList.find((d) => d.path === row.path);
                                  return (
                                    <div className="flex items-center justify-center gap-0.5">
                                      <TableIconButton
                                        label="重命名目录"
                                        disabled={!node}
                                        onClick={() => node && openRenameDir(node)}
                                      >
                                        <FiEdit2 size={16} />
                                      </TableIconButton>
                                      <TableIconButton
                                        label="删除目录"
                                        danger
                                        confirm={{
                                          title: '确定删除该目录吗？',
                                          onConfirm: () => onDeleteDir(row.path),
                                        }}
                                      >
                                        <FiTrash2 size={16} />
                                      </TableIconButton>
                                    </div>
                                  );
                                },
                              },
                            ] as ColumnsType<DirTableRow>
                          }
                        />
                      ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                          {sortedDirList.map((dir) => (
                            <div
                              key={dir.path}
                              className="group flex flex-col rounded-xl border border-slate-200/80 bg-slate-50/50 px-2 pb-2 pt-3 transition-colors hover:border-primary/30 hover:bg-primary/5 dark:border-strokedark dark:bg-boxdark-2/50 dark:hover:border-primary/35"
                            >
                              <button
                                type="button"
                                className="cursor-pointer text-center"
                                onClick={() => navigateTo(dir.path)}
                              >
                                <img src={fileSvg} alt="" className="mx-auto mb-2 h-12 w-14 object-contain" />
                                <Tooltip title={dir.name}>
                                  <p className="m-0 line-clamp-2 text-xs font-medium leading-snug text-slate-700 group-hover:text-primary dark:text-slate-200">
                                    {dir.name}
                                  </p>
                                </Tooltip>
                                <p className="mt-1 text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                                  {dir.fileCount} 个文件
                                </p>
                              </button>
                              <div className="mt-2 flex justify-center gap-0.5 border-t border-slate-200/60 pt-2 dark:border-strokedark">
                                <TableIconButton label="重命名目录" onClick={() => openRenameDir(dir)}>
                                  <FiEdit2 size={14} />
                                </TableIconButton>
                                <TableIconButton
                                  label="删除目录"
                                  danger
                                  confirm={{
                                    title: '确定删除该目录吗？',
                                    onConfirm: () => onDeleteDir(dir.path),
                                  }}
                                >
                                  <FiTrash2 size={14} />
                                </TableIconButton>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  {fileList.length > 0 && (
                    <section className={dirList.length > 0 ? 'mt-6 border-t border-slate-100 pt-5 dark:border-strokedark' : ''}>
                      <SectionHeading title="文件" count={fileList.length} />
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
                                    <div className="relative size-14 overflow-hidden rounded-lg bg-slate-100 dark:bg-boxdark-2">
                                      <Image
                                        src={file.url}
                                        fallback={errorImg}
                                        alt={file.name}
                                        loading="lazy"
                                        preview={{ alt: file.name }}
                                        rootClassName="absolute inset-0 block size-full"
                                        className="size-full h-[inherit]! object-cover"
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
                                      <span className="font-medium text-slate-800 dark:text-slate-100">{name}</span>
                                    </Tooltip>
                                  ),
                                },
                                {
                                  title: '大小',
                                  width: 108,
                                  align: 'right',
                                  render: (_, file) => (
                                    <span className="tabular-nums text-slate-600 dark:text-slate-300">
                                      {formatFileSize(file.size)}
                                    </span>
                                  ),
                                },
                                {
                                  title: '类型',
                                  width: 88,
                                  ellipsis: true,
                                  render: (_, file) => (
                                    <span className="inline-flex rounded-md border border-slate-200/80 bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] uppercase text-slate-500 dark:border-strokedark dark:bg-boxdark-2 dark:text-slate-400">
                                      {getFileTypeLabel(file)}
                                    </span>
                                  ),
                                },
                                {
                                  title: '操作',
                                  key: 'actions',
                                  width: 96,
                                  align: 'center',
                                  render: (_, file) => (
                                    <div className="flex items-center justify-center gap-0.5">
                                      <TableIconButton label="查看详情" onClick={() => onOpenFileDetail(file.path)}>
                                        <FiEye size={16} />
                                      </TableIconButton>
                                      <TableIconButton
                                        label="删除文件"
                                        danger
                                        confirm={{
                                          title: '确定删除该文件吗？',
                                          onConfirm: () => onDeleteFile(file.path),
                                        }}
                                      >
                                        <FiTrash2 size={16} />
                                      </TableIconButton>
                                    </div>
                                  ),
                                },
                              ] as ColumnsType<AppFile>
                            }
                          />
                        ) : (
                          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                            {sortedFileList.map((file) => {
                              const selected = selectedFilePaths.includes(file.path);
                              return (
                                <article
                                  key={file.path}
                                  className={`group flex flex-col overflow-hidden rounded-xl border bg-white transition-colors dark:bg-boxdark-2/30 ${selected
                                    ? 'border-primary/40 ring-1 ring-primary/15'
                                    : 'border-slate-200/80 hover:border-primary/30 dark:border-strokedark'
                                    }`}
                                >
                                  <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden bg-slate-100 dark:bg-boxdark-2">
                                    <div className="absolute left-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
                                      <Checkbox
                                        checked={selected}
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
                                      className="size-full h-[inherit]! cursor-zoom-in object-cover"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    className="min-h-[52px] flex-1 px-3 pb-1 pt-2.5 text-left cursor-pointer"
                                    onClick={() => {
                                      setSelectedFilePaths((prev) =>
                                        selected ? prev.filter((p) => p !== file.path) : [...prev, file.path],
                                      );
                                    }}
                                  >
                                    <Tooltip title={file.name} placement="topLeft">
                                      <p className="mb-1 line-clamp-2 text-xs font-medium leading-snug text-slate-800 group-hover:text-primary dark:text-slate-100">
                                        {file.name}
                                      </p>
                                    </Tooltip>
                                    <p className="m-0 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                                      {formatFileSize(file.size)}
                                    </p>
                                  </button>
                                  <div className="flex justify-end gap-0.5 border-t border-slate-100 px-2 py-1.5 dark:border-strokedark">
                                    <TableIconButton label="查看详情" onClick={() => onOpenFileDetail(file.path)}>
                                      <FiEye size={14} />
                                    </TableIconButton>
                                    <TableIconButton
                                      label="删除文件"
                                      danger
                                      confirm={{
                                        title: '确定删除该文件吗？',
                                        onConfirm: () => onDeleteFile(file.path),
                                      }}
                                    >
                                      <FiTrash2 size={14} />
                                    </TableIconButton>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </Image.PreviewGroup>
                    </section>
                  )}
                </div>
              )}
            </div>
          </Spin>
        </div>
      </section>

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
            <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-strokedark">
              <dl className="divide-y divide-slate-100 dark:divide-strokedark">
                {(
                  [
                    ['名称', fileInfo.name, 'text-sm text-slate-800 dark:text-slate-100'],
                    ['路径', fileInfo.path, 'font-mono text-xs break-all text-slate-600 dark:text-slate-300'],
                    ['类型', fileInfo.mimeType, 'font-mono text-xs text-slate-600 dark:text-slate-300'],
                    ['大小', formatFileSize(fileInfo.size), 'text-sm tabular-nums text-slate-800 dark:text-slate-100'],
                    [
                      '上传时间',
                      dayjs(fileInfo.putTime).format('YYYY-MM-DD HH:mm:ss'),
                      'text-sm tabular-nums text-slate-800 dark:text-slate-100',
                    ],
                  ] as const
                ).map(([label, value, valueClass]) => (
                  <div
                    key={label}
                    className="grid gap-1 bg-slate-50/50 px-4 py-3 sm:grid-cols-[5.5rem_1fr] sm:items-baseline sm:gap-x-4 dark:bg-boxdark-2/30"
                  >
                    <dt className="text-xs font-medium text-slate-400 dark:text-slate-500">{label}</dt>
                    <dd className={`min-w-0 leading-relaxed ${valueClass}`}>{value}</dd>
                  </div>
                ))}
                <div className="grid gap-1 bg-slate-50/50 px-4 py-3 sm:grid-cols-[5.5rem_1fr] sm:items-baseline sm:gap-x-4 dark:bg-boxdark-2/30">
                  <dt className="text-xs font-medium text-slate-400 dark:text-slate-500">链接</dt>
                  <dd className="min-w-0 text-sm">
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