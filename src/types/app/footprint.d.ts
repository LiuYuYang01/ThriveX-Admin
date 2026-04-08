export interface Footprint {
  id?: number;
  title: string;
  address: string;
  content: string;
  position: string;
  images: string | string[];
  createTime?: number | Dayjs;
}


export interface FootprintFilterQueryParams extends QueryParams {
  address?: string;
}
