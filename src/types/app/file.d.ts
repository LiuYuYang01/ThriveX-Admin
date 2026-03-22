export type DirList = string;

export interface File {
  type?: 'file' | string;
  name: string;
  path: string;
  dir?: string;
  size: number;
  url: string;
  ext?: string;
  basePath?: string;
  date?: number;
  createTime?: number;
  /** 与详情接口 putTime 一致时可用于排序（可选） */
  putTime?: number;
  mimeType?: string;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  hash: string;
  mimeType: string;
  putTime: number;
  url: string;
}

export interface FileDir {
  path: string;
  name: string;
  icon?: string;
}

export interface FileTreeNode {
  type: 'dir';
  name: string;
  path: string;
  children: FileTreeNode[];
  files: File[];
  fileCount: number;
  totalSize: number;
  /** 目录更新时间（毫秒时间戳，可选，由接口返回） */
  mtime?: number;
  updateTime?: number;
}

export interface FileTreeData {
  dir: string;
  basePath: string;
  total: number;
  result: FileTreeNode[];
}
