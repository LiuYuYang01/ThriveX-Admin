import Request from '@/utils/request'
import { Cate, CateFilterQueryParams } from '@/types/app/cate'

// 新增分类
export const addCateDataAPI = (data: Cate) => Request('POST', '/cate', { data })

// 删除分类
export const delCateDataAPI = (id: number) => Request('DELETE', `/cate/${id}`)

// 修改分类
export const editCateDataAPI = (data: Cate) => Request('PATCH', '/cate', { data })

// 获取分类
export const getCateDataAPI = (id?: number) => Request<Cate>('GET', `/cate/${id}`)

// 获取分类列表
export const getCateListAPI = (params?: CateFilterQueryParams) => Request<Paginate<Cate[]>>('GET', `/cate`, { params })