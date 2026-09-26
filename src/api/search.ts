import Request from '@/utils/request'
import { SearchResult } from '@/types/app/search'

// 统一搜索：文章按标题、闪念按内容
export const getSearchAPI = (params: { keyword: string; limit?: number }) => Request<SearchResult>('GET', '/search', { params })
