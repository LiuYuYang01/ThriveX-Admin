interface Response<T> {
  code: number;
  message: string;
  data: T;
}

interface Paginate<T> {
  next: boolean;
  prev: boolean;
  pageNum: number;
  pageSize: number;
  pages: number;
  total: number;
  result: T;
}

interface Page {
  pageNum?: number;
  pageSize?: number;
}

interface FilterQueryParams {
  key?: string;
  content?: string;
  status?: 0 | 1;
  startDate?: string;
  endDate?: string;
  createTime?: Date[];
}

interface QueryData<T = FilterQueryParams> {
  // 通用的
  sort?: 'asc' | 'desc';
  pattern?: 'list' | 'recursion';
  query?: T;

  // 文件相关
  dir?: 'all' | string;
}
