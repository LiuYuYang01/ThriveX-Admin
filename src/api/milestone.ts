import Request from '@/utils/request';
import { Milestone, MilestoneFilterQueryParams } from '@/types/app/milestone';

export const addMilestoneDataAPI = (data: Milestone) => Request('POST', '/milestone', { data });

export const delMilestoneDataAPI = (id: number) => Request('DELETE', `/milestone/${id}`);

export const editMilestoneDataAPI = (data: Milestone) => Request('PATCH', '/milestone', { data });

export const getMilestoneDataAPI = (id: number) => Request<Milestone>('GET', `/milestone/${id}`);

export const getMilestoneListAPI = (params?: MilestoneFilterQueryParams) =>
  Request<Paginate<Milestone[]>>('GET', '/milestone', { params });
