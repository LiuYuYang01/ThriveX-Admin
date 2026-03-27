import Request from '@/utils/request'
import { Swiper } from '@/types/app/swiper'

// 新增轮播图
export const addSwiperDataAPI = (data: Swiper) => Request('POST', '/swiper', { data })

// 删除轮播图
export const delSwiperDataAPI = (id: number) => Request('DELETE', `/swiper/${id}`)

// 修改轮播图
export const editSwiperDataAPI = (data: Swiper) => Request('PATCH', '/swiper', { data })

// 获取轮播图
export const getSwiperDataAPI = (id?: number) => Request<Swiper>('GET', `/swiper/${id}`)

// 获取轮播图数据列表
export const getSwiperListAPI = () => Request<Paginate<Swiper[]>>('GET', `/swiper`)