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
  auditStatus: number;
  isChoice: number;
  createTime: number;
}

export interface FilterForm {
  content?: string;
  cateId?: number;
  createTime: Date[];
}

export interface FilterWall extends FilterQueryParams {
  content?: string;
  cateId?: number;
}
