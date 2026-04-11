import Request from '@/utils/request'
import { Wall, Cate, WallFilterQueryParams } from '@/types/app/wall'

// 新增留言
export const addWallDataAPI = (data: Wall) => Request('POST', '/wall', { data })

// 删除留言
export const delWallDataAPI = (id: number) => Request('DELETE', `/wall/${id}`)

// 审核留言
export const auditWallDataAPI = (id: number) => Request('PATCH', `/wall/audit/${id}`)

// 修改留言
export const editWallDataAPI = (data: Wall) => Request('PATCH', '/wall', { data })

// 获取留言
export const getWallDataAPI = (id?: number) => Request<Paginate<Wall>>('GET', `/wall/${id}`)

// 获取留言列表
export const getWallListAPI = (params?: WallFilterQueryParams) => Request<Paginate<Wall[]>>('GET', `/wall`, {
    params
})

// 获取留言分类列表
export const getWallCateListAPI = () => Request<Cate[]>('GET', `/wall/cate`)

// 设置与取消精选
export const updateChoiceAPI = (id: number) => Request('PATCH', `/wall/choice/${id}`)