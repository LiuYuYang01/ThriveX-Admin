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
}

export interface FileTreeData {
  dir: string;
  basePath: string;
  total: number;
  result: FileTreeNode[];
}
