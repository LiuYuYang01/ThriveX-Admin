export interface Milestone {
  id?: number;
  eventDate: number | Dayjs;
  title: string;
  description: string;
  image?: string;
  tags: string[];
}

export interface MilestoneFilterQueryParams extends QueryParams {
  title?: string;
  year?: string;
}
