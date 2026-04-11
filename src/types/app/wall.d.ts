export interface Cate {
  id: number;
  name: string;
  mark: string;
  order: number;
}

export interface Wall {
  id: number;
  name: string;
  cateId: number;
  cate: Category;
  color: string;
  content: string;
  email: string;
  status: number;
  isChoice: number;
  createTime: number;
}

export interface WallFilterQueryParams extends QueryParams {
  status?: 0 | 1;
  content?: string;
  cateId?: number;
}