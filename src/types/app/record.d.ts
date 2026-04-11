export interface Record {
  id?: number;
  content: string;
  images: string | string[];
  createTime?: string | Dayjs;
}

export interface RecordFilterDataForm {
  content?: string;
  createTime?: [Dayjs, Dayjs] | null;
}

export interface RecordFilterQueryParams extends QueryParams {
  content?: string;
}
