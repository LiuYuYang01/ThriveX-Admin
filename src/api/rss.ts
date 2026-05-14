import { Rss } from '@/types/app/rss';
import Request from '@/utils/request';

// 获取订阅的内容
export const getRssAPI = (params?: QueryParams) => Request<Paginate<Rss[]>>('GET', `/rss`, {
    params
})