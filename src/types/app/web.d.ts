export interface WebType {
  id: number;
  name: string;
  order: number;
  isAdmin: number;
}

export interface Web {
  id?: number;
  title: string;
  description: string;
  email: string;
  image: string;
  url: string;
  rss: string;
  order: number;
  typeId: number;
  type: WebType;
  status?: 0 | 1;
  createTime?: number;
}

export interface WebFilterQueryParams extends QueryParams {
  title?: string;
  status?: 0 | 1;
  key?: string;
}
