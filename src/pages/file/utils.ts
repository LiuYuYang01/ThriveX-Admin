import { File as AppFile, FileTreeData, FileTreeNode } from '@/types/app/file';

/** 从整棵树推断根目录前缀（如 static/）；多根目录时返回空串，由虚拟根列表展示全部 result */
export function inferRootPathFromTree(data: FileTreeData | null): string {
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

export function normalizePathForRoot(path: string, root: string): string {
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

export function findNodeInTree(list: FileTreeNode[], targetPath: string, root: string): FileTreeNode | null {
  const target = normalizePathForRoot(targetPath, root);
  for (const node of list) {
    if (normalizePathForRoot(node.path, root) === target) return node;
    const found = findNodeInTree(node.children, targetPath, root);
    if (found) return found;
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function compareLocale(a: string, b: string, order: 'ascend' | 'descend'): number {
  const cmp = a.localeCompare(b, 'zh-CN', { numeric: true, sensitivity: 'base' });
  return order === 'ascend' ? cmp : -cmp;
}

/** 目录排序用时间：优先接口字段，否则取当前目录下文件 createTime/date 的最大值 */
export function getDirTimeMs(dir: FileTreeNode): number {
  const direct = dir.mtime ?? dir.updateTime;
  if (typeof direct === 'number' && !Number.isNaN(direct)) return direct;
  let max = 0;
  for (const f of dir.files ?? []) {
    const t = f.createTime ?? f.date ?? 0;
    if (t > max) max = t;
  }
  return max;
}

export function sortDirNodes(
  list: FileTreeNode[],
  field: 'name' | 'fileCount' | 'totalSize' | 'time',
  order: 'ascend' | 'descend',
): FileTreeNode[] {
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

export function getFileTypeLabel(file: AppFile): string {
  if (file.ext) return String(file.ext).replace(/^\./, '').toLowerCase();
  const i = file.name.lastIndexOf('.');
  return i >= 0 ? file.name.slice(i + 1).toLowerCase() : '—';
}

/** 文件排序用时间：createTime / date / putTime（与接口字段对齐，缺省为 0） */
export function getFileTimeMs(file: AppFile): number {
  const t = file.createTime ?? file.date ?? file.putTime;
  if (typeof t !== 'number' || Number.isNaN(t)) return 0;
  // 秒级时间戳与毫秒混用时，统一按毫秒比较（小于 1e12 视为秒）
  return t < 1e12 ? t * 1000 : t;
}

export function sortFiles(
  list: AppFile[],
  field: 'name' | 'size' | 'type' | 'time',
  order: 'ascend' | 'descend',
): AppFile[] {
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
