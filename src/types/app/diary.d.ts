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
  /** 归档筛选：年 / 月，逐级收窄 */
  year?: number;
  month?: number;
}

export interface DiaryArchiveMonth {
  month: number;
  name: string;
  total: number;
}

export interface DiaryArchiveYear {
  year: number;
  total: number;
  months: DiaryArchiveMonth[];
}

export interface DiaryCredential {
  id?: number;
  question: string;
  /** 仅写入时使用；编辑时留空表示保持原答案不变 */
  answer?: string;
  createTime?: number;
}
