import Request from '@/utils/request'
import { LoginReturn, EditUser, Login, User, UserInfo } from '@/types/app/user'

// 编辑管理员
export const editUserDataAPI = (data: UserInfo) => Request('PATCH', '/user', { data })

// 获取管理员信息
export const getUserDataAPI = (token?: string) => Request<User>('GET', token ? `/user/info?token=${token}` : '/user/info')

// 管理员登录
export const loginDataAPI = (data: Login) => Request<LoginReturn>('POST', '/user/login', { data })

// 修改管理员密码
export const editAdminPassAPI = (data: EditUser) => Request('PATCH', '/user/pass', { data })

// 判断当前token是否有效
export const isCheckTokenAPI = () => Request('GET', `/user/check`)