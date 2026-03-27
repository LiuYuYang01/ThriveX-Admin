import Request from '@/utils/request'
import { Tag } from '@/types/app/tag'

// 新增标签
export const addTagDataAPI = (data: Tag) => Request('POST', '/tag', { data })

// 删除标签
export const delTagDataAPI = (id: number) => Request('DELETE', `/tag/${id}`)

// 修改标签
export const editTagDataAPI = (data: Tag) => Request('PATCH', '/tag', { data })

// 获取标签
export const getTagDataAPI = (id?: number) => Request<Tag>('GET', `/tag/${id}`)

// 获取标签列表
export const getTagListAPI = () => Request<Paginate<Tag[]>>('GET', '/tag')
