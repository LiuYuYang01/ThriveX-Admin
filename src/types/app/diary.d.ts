export interface Diary {
  id?: number;
  /** 日记对应的日子，YYYY-MM-DD */
  diaryDate: string;
  title?: string;
  content: string;
  images: string[];
  mood?: string;
  weather?: string;
  location?: string;
  createTime?: number;
  updateTime?: number;
}

export interface DiaryFilterQueryParams extends Page {
  keyword?: string;
  /** 日记日期范围，YYYY-MM-DD */
  startDate?: string;
  endDate?: string;
}

export interface DiaryCredential {
  id?: number;
  question: string;
  /** 仅写入时使用；编辑时留空表示保持原答案不变 */
  answer?: string;
  createTime?: number;
}
