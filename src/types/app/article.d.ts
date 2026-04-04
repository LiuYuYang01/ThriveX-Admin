import { Cate } from './cate';
import { Tag } from './tag';

export interface Config {
  id?: number;
  articleId?: number;
  status: 1 | 2 | 3;
  password: string;
  isEncrypt: boolean;
  isDraft: boolean;
  isDel: boolean;
}

export interface Article {
  id?: number;
  title: string;
  description: string;
  content: string;
  cover: string;
  cateList?: Cate[];
  tagList?: Tag[];
  cateIds?: number[];
  tagIds?: number[];
  view?: number;
  comment?: number;
  config: Config;
  createTime?: number;
}

export interface ArticleFilterDataForm {
  title?: string;
  cateId?: number;
  tagId?: number;
  createTime: Date[];
}

export interface ArticleFilterQueryParams extends Page {
  key?: string;
  cateId?: number;
  tagId?: number;
  isDraft?: boolean;
  isDel?: boolean;
  startDate?: string;
  endDate?: string;
}
