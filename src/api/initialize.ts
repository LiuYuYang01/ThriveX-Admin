import Request from '@/utils/request';

interface SystemInitStatusData {
  is_system_init: boolean;
}

// 查看系统是否完成初始化
export const getSystemInitStatusAPI = () => Request<SystemInitStatusData>('GET', '/env_config/is_system_init');

// 完成系统初始化
export const completeSystemInitAPI = () => Request('POST', '/env_config/is_system_init');
