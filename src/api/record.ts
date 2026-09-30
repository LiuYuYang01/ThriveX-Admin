import Request from '@/utils/request'
import { Record, RecordFilterQueryParams } from '@/types/app/record'

// 新增闪念
export const addRecordDataAPI = (data: Record) => Request('POST', '/record', { data })

// 删除闪念
export const delRecordDataAPI = (id: number) => Request('DELETE', `/record/${id}`)

// 修改闪念
export const editRecordDataAPI = (data: Record) => Request('PATCH', '/record', { data })

// 获取闪念
export const getRecordDataAPI = (id?: number) => Request<Record>('GET', `/record/${id}`)

// 获取闪念列表
export const getRecordListAPI = (params?: RecordFilterQueryParams) => Request<Paginate<Record[]>>('GET', `/record`, {
    params
})