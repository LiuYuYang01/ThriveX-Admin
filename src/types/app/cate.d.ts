export interface Cate {
  id?: number;
  name: string;
  mark: string;
  url: string;
  level: number;
  order: number;
  type: 'cate' | 'page' | 'nav';
  isHide?: boolean;
  count?: number;
  children?: Cate[];
}

export interface CateFilterQueryParams extends Page {
  pattern?: 'list' | 'tree';
}
