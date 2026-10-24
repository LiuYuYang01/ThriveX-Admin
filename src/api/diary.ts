import Request from '@/utils/request'
import type { Diary, DiaryCredential, DiaryFilterQueryParams } from '@/types/app/diary'

// 服务端以 JSON 字符串保存图片列表，序列化收在 API 层，页面始终用 string[]
const toDiaryPayload = ({ images, ...rest }: Diary) => ({ ...rest, images: JSON.stringify(images ?? []) })

// 新增日记
export const addDiaryDataAPI = (data: Diary) => Request('POST', '/diary', { data: toDiaryPayload(data) })

// 修改日记
export const editDiaryDataAPI = (data: Diary) => Request('PATCH', '/diary', { data: toDiaryPayload(data) })

// 删除日记
export const delDiaryDataAPI = (id: number) => Request('DELETE', `/diary/${id}`)

// 获取日记详情
export const getDiaryDataAPI = (id: number) => Request<Diary>('GET', `/diary/${id}`)

// 获取日记列表
export const getDiaryListAPI = (params?: DiaryFilterQueryParams) => Request<Paginate<Diary[]>>('GET', '/diary', {
  params
})

// 获取密语问答列表
export const getDiaryCredentialListAPI = () => Request<DiaryCredential[]>('GET', '/diary/credential')

// 新增密语问答
export const addDiaryCredentialAPI = (data: DiaryCredential) => Request('POST', '/diary/credential', { data })

// 修改密语问答
export const editDiaryCredentialAPI = (data: DiaryCredential) => Request('PATCH', '/diary/credential', { data })

// 删除密语问答
export const delDiaryCredentialAPI = (id: number) => Request('DELETE', `/diary/credential/${id}`)
