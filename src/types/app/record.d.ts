export interface Record {
  id?: number;
  content: string;
  images: string | string[];
  video?: string;
  likeCount?: number;
  commentCount?: number;
  mood?: string;
  location?: string;
  createTime?: string | Dayjs;
}

export interface RecordFilterDataForm {
  content?: string;
  createTime?: [Dayjs, Dayjs] | null;
}

export interface RecordFilterQueryParams extends QueryParams {
  content?: string;
}
