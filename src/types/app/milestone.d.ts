export interface Milestone {
  id?: number;
  eventDate: number | Dayjs;
  title: string;
  description: string;
  images: string[];
  tags: string[];
}

export interface MilestoneFilterQueryParams extends QueryParams {
  title?: string;
  year?: string;
}
