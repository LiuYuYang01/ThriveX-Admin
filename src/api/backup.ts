import Request from '@/utils/request'
import { BackupRecord } from '@/types/app/backup'

// 导出数据库备份（全量 SQL，数据量大时耗时较长，放宽超时到 5 分钟）
export const exportBackupDataAPI = () => Request<BackupRecord>('POST', '/backup/export', {
    timeout: 300000,
})

// 获取备份记录列表
export const getBackupListAPI = (params?: QueryParams) => Request<Paginate<BackupRecord[]>>('GET', '/backup/list', {
    params,
})

// 删除备份（同时删除备份文件与记录）
export const delBackupDataAPI = (id: number) => Request('DELETE', `/backup/${id}`)

// 下载备份文件：axios 响应拦截器会解析 JSON code，对 blob 不适用，
// 页面内走 fetch + Bearer（同 FileUpload 组件的做法）
