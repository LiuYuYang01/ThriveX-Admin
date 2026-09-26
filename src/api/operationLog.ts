import Request from '@/utils/request'
import { OperationLog, OperationLogFilterQueryParams } from '@/types/app/operationLog'

// 获取操作日志列表
export const getOperationLogListAPI = (params?: OperationLogFilterQueryParams) => Request<Paginate<OperationLog[]>>('GET', `/operation_log`, {
    params,
})

// 删除操作日志
export const delOperationLogDataAPI = (id: number) => Request('DELETE', `/operation_log/${id}`)

// 批量删除操作日志
export const batchDelOperationLogDataAPI = (ids: number[]) => Request('DELETE', `/operation_log/batch`, { data: ids })

// 清空操作日志
export const clearOperationLogDataAPI = () => Request('DELETE', `/operation_log/clear`)
