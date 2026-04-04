export interface Comment {
  id?: number;
  name: string;
  avatar: string;
  email: string | null;
  url: string;
  content: string;
  articleId: number;
  articleTitle?: string;
  commentId: number;
  auditStatus: number;
  createTime: number;
}

export interface Info {
  tab: string;
  loading: boolean;
  list: Comment[];
  paginate: Page;
}

export interface CommentFilterQueryParams extends QueryParams {
  content?: string;
}
