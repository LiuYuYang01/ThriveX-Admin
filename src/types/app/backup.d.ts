export interface BackupRecord {
  id: number;
  type: 'manual' | 'scheduled';
  format: string;
  fileName: string;
  size: number | null;
  checksum: string | null;
  storage: string;
  storageKey: string;
  status: 'running' | 'success' | 'failed';
  tableCount: number | null;
  rowTotal: number | null;
  tableStats: Record<string, number> | null;
  durationMs: number | null;
  error: string | null;
  createTime: number;
}

export interface BackupFilterQueryParams extends QueryParams {
  format?: string;
}
