import Request from '@/utils/request'
import type { Diary, DiaryArchiveYear, DiaryCredential, DiaryFilterQueryParams } from '@/types/app/diary'

// 新增日记
export const addDiaryDataAPI = (data: Diary) => Request('POST', '/diary', { data })

// 修改日记
export const editDiaryDataAPI = (data: Diary) => Request('PATCH', '/diary', { data })

// 删除日记
export const delDiaryDataAPI = (id: number) => Request('DELETE', `/diary/${id}`)

// 获取日记详情
export const getDiaryDataAPI = (id: number) => Request<Diary>('GET', `/diary/${id}`)

// 获取日记列表
export const getDiaryListAPI = (params?: DiaryFilterQueryParams) => Request<Paginate<Diary[]>>('GET', '/diary', {
  params
})

// 获取年 / 月归档目录
export const getDiaryArchiveAPI = () => Request<DiaryArchiveYear[]>('GET', '/diary/archive')

// 获取密语问答列表
export const getDiaryCredentialListAPI = () => Request<DiaryCredential[]>('GET', '/diary/credential')

// 新增密语问答
export const addDiaryCredentialAPI = (data: DiaryCredential) => Request('POST', '/diary/credential', { data })

// 修改密语问答
export const editDiaryCredentialAPI = (data: DiaryCredential) => Request('PATCH', '/diary/credential', { data })

// 删除密语问答
export const delDiaryCredentialAPI = (id: number) => Request('DELETE', `/diary/credential/${id}`)
