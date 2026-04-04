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

// 优化
// interface FilterQueryParams {
//   key?: string;
//   content?: string;
//   status?: 0 | 1;
//   startDate?: string;
//   endDate?: string;
//   createTime?: Date[];
// }

interface QueryParams extends Page {
  startDate?: number;
  endDate?: number;
  createTime?: Date[];
}