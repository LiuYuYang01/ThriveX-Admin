export interface OperationLog {
  id?: number;
  module: string | null;
  type: string | null;
  description: string | null;
  username: string | null;
  method: string | null;
  url: string | null;
  ip: string | null;
  params: string | null;
  status: number;
  errorMsg: string | null;
  elapsed: number;
  createTime: number;
}

export interface OperationLogFilterQueryParams extends QueryParams {
  module?: string;
  type?: string;
  status?: number;
  keyword?: string;
}
