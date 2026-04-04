export interface Record {
  id?: number;
  content: string;
  images: string | string[];
  createTime?: string | Dayjs;
}

/** 说说列表筛选表单（受控字段） */
export interface RecordFilterDataForm {
  content?: string;
  createTime?: [Dayjs, Dayjs] | null;
}

/** 说说列表查询参数（含分页，提交给分页接口） */
export interface RecordFilterQueryParams extends QueryParams {
  /** 内容关键词，对应后端 `key` */
  key?: string;
}
