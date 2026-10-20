import { Cate } from './cate';
import { Tag } from './tag';

export interface Config {
  id?: number;
  articleId?: number;
  status: 1 | 2 | 3;
  /** 访问密码：仅提交时携带，服务端不会回显明文 */
  password?: string;
  /** 服务端只读标记：是否已设置过访问密码 */
  hasPassword?: boolean;
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
  likeCount?: number;
  shareCount?: number;
  isTop?: boolean;
  config: Config;
  createTime?: number;
}

export interface ArticleFilterDataForm {
  title?: string;
  cateIds?: number[][];
  tagId?: number;
  createTime: Date[];
}

export interface ArticleFilterQueryParams extends QueryParams {
  title?: string;
  cateIds?: number[];
  tagId?: number;
  isDraft?: boolean;
  isDel?: boolean;
}
