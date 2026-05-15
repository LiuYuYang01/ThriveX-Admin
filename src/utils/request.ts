import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { notification } from 'antd';
import { useUserStore } from '@/stores';

// 配置项目API域名
// 最新调整：在本地 .env 文件配置你的后端API地址
export const baseURL = import.meta.env.VITE_PROJECT_API;

// 创建 axios 实例
export const instance = axios.create({
    // 项目API根路径
    baseURL,
    // 请求超时的时间
    timeout: 10000,
});

// 用于取消请求
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

// 标记是否已经处理过401错误
let isHandling401Error = false;

const handleUnauthorized = (messageText?: string) => {
    if (isHandling401Error) return;
    isHandling401Error = true;

    if (messageText) {
        notification.error({
            message: '登录已失效',
            description: messageText,
        });
    }

    const store = useUserStore.getState();
    store.quitLogin();
};

// 请求拦截
instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 获取token
        const token = JSON.parse(localStorage.getItem('user_storage') || '{}')?.state.token

        // 如果有token就把赋值给请求头
        if (token) config.headers['Authorization'] = `Bearer ${token}`;

        return config;
    },
    (err: AxiosError) => {
        notification.error({
            message: '请求异常',
            description: err.message,
        })

        return Promise.reject(err);
    }
);

// 响应拦截
instance.interceptors.response.use(
    (res: AxiosResponse) => {
        if (res.data?.code === 600) return res.data

        if (res.data?.code === 401) {
            handleUnauthorized(res.data?.message || '请重新登录');
            return Promise.reject(res.data);
        }

        // 只要code不等于200, 就相当于响应失败
        if (res.data?.code !== 200) {
            notification.error({
                message: '响应异常',
                description: res.data?.message || '未知错误',
            })

            return Promise.reject(res.data);
        }

        return res.data;
    },
    (err: AxiosError) => {
        if (isHandling401Error) return Promise.reject(err);

        // 如果code为401就证明认证失败
        if (err.response?.status === 401) {
            handleUnauthorized('请重新登录');
            return Promise.reject(err.response?.data);
        }

        notification.error({
            message: '程序异常',
            description: err.message || '未知错误',
        })

        return Promise.reject(err);
    }
);

const request = <T>(method: string, url: string, reqParams?: object) => {
    return instance.request<Response<T>, Response<T>>({
        method,
        url,
        ...reqParams,
        cancelToken: source.token
    });
};

export default request;
