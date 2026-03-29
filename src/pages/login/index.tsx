import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'antd/es/form/Form';
import { Button, Form, Input, notification } from 'antd';
import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

import { getUserDataAPI, loginDataAPI } from '@/api/user';
import { useUserStore } from '@/stores';
import { setShowLoginNotification } from '@/components/SystemNotification';

export default () => {
  const navigate = useNavigate();
  const location = useLocation();
  const store = useUserStore();

  const [loading, setLoading] = useState(false);

  const [form] = useForm();

  const [isPassVisible, setIsPassVisible] = useState(false);
  const returnUrl = new URLSearchParams(location.search).get('returnUrl') || '/';

  const onSubmit = async () => {
    try {
      setLoading(true);

      const values = await form.validateFields();
      const { data: loginData } = await loginDataAPI(values);
      const { data: userData } = await getUserDataAPI(loginData.token);

      // 将用户信息和token保存起来
      store.setToken(loginData.token);
      store.setUser(userData);

      // 设置显示登录通知的标记
      setShowLoginNotification();

      notification.success({
        message: '🎉 登录成功',
        description: `Hello ${userData.name} 欢迎回来`,
      });

      setLoading(false);
      navigate(returnUrl);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 sm:p-8 selection:bg-blue-500 selection:text-white">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* 点阵网格背景 */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-400/15 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[rgba(255,255,255,0.5)] backdrop-blur-xs rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="flex justify-center space-x-4 mb-8">
            <img src="/logo.png" alt="" className="w-12 h-12" />
            <div className="flex flex-col">
              <h1 className="font-bold text-lg text-slate-700">ThriveX</h1>
              <p className="text-slate-400 text-sm">现代化博客管理系统</p>
            </div>
          </div>

          <Form form={form} size="large" layout="vertical" onFinish={onSubmit} className="space-y-1">
            <Form.Item name="username" label={<span className="text-gray-700 font-medium">账号</span>} rules={[{ required: true, message: '请输入账号' }]}>
              <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="请输入用户名" className="h-12 rounded-xl border-gray-200 hover:border-blue-400 focus:border-blue-500 transition-colors" />
            </Form.Item>

            <Form.Item name="password" label={<span className="text-gray-700 font-medium">密码</span>} rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined className="text-gray-400" />} type={isPassVisible ? 'text' : 'password'} placeholder="请输入密码" className="h-12 rounded-xl border-gray-200 hover:border-blue-400 focus:border-blue-500 transition-colors" iconRender={(visible) => (visible ? <EyeOutlined onClick={() => setIsPassVisible(!isPassVisible)} /> : <EyeInvisibleOutlined onClick={() => setIsPassVisible(!isPassVisible)} />)} />
            </Form.Item>

            <Form.Item className="mb-6">
              <Button type="primary" htmlType="submit" loading={loading} className="w-full h-12 mt-4 rounded-xl shadow-lg hover:shadow-xl font-medium text-base" block>
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="text-center mt-4">
          <p className="text-gray-500 text-sm">再小的个体，也有自己的品牌</p>
        </div>
      </div>
    </div>
  );
};
