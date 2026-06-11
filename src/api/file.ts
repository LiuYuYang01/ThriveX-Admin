import Request from '@/utils/request'
import { File, FileCompressItem, FileCompressResult, FileInfo, FileTreeData } from '@/types/app/file'

export interface CreateDirBody {
  dir: string;
}

export interface RenameDirBody {
  fromDir: string;
  toDir: string;
}

// 删除文件
export const delFileDataAPI = (filePath: string) => Request<null>('DELETE', `/file?filePath=${encodeURIComponent(filePath)}`)

// 批量删除文件
export const batchDelFileDataAPI = (filePaths: string[]) => Request<null>('DELETE', '/file/batch', { data: filePaths })

// 图片瘦身（七牛 pfop 异步提交）
export const compressFileDataAPI = (paths: string[], mode = 'auto') =>
  Request<FileCompressResult>('POST', '/file/compress', {
    data: { paths, mode },
    timeout: 30000,
  })

// 批量查询瘦身任务状态
export const queryCompressTasksAPI = (taskIds: string[]) =>
  Request<FileCompressItem[]>('POST', '/file/compress/tasks', {
    data: { taskIds },
    timeout: 30000,
  })

// 获取文件
export const getFileDataAPI = (filePath: string) => Request<FileInfo>('GET', `/file/info?filePath=${encodeURIComponent(filePath)}`)

// 获取文件列表
export const getFileListAPI = (dir: string, paging?: Page) => Request<Paginate<File[]>>('GET', `/file/list?dir=${encodeURIComponent(dir)}`, {
  params: {
    ...paging
  }
})

// 获取完整目录树
export const getFileTreeAPI = () => Request<FileTreeData>('GET', '/file/tree')

// 新增目录
export const createDirAPI = (data: CreateDirBody) => Request<{ dir: string; placeholder: string }>('POST', '/file/dir', { data })

// 重命名目录
export const renameDirAPI = (data: RenameDirBody) => Request<{ fromDir: string; toDir: string; moved: number }>('PATCH', '/file/dir', { data })

// 删除目录
export const deleteDirAPI = (dir: string) => Request<{ dir: string; deleted: number }>('DELETE', '/file/dir', { data: { dir } })