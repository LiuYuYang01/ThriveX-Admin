export interface Cate {
  id?: number;
  name: string;
  mark: string;
  url: string;
  icon: string;
  level: number;
  order: number;
  type: string;
  children?: Cate[];

  parent_id?: number[];
}

export interface CateFilterQueryParams extends Page {
  pattern?: 'list' | 'tree';
}