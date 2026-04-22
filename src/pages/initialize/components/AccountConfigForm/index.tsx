import { useEffect } from 'react';
import { Form, Input, message } from 'antd';
import { editAdminPassAPI, getUserDataAPI } from '@/api/user';
import { useUserStore } from '@/stores';
import type { InitStepFormProps } from '../types';

interface AccountFormValues {
  newUsername: string;
  oldPassword: string;
  newPassword: string;
}

export default function AccountConfigForm({ onSuccess }: InitStepFormProps) {
  const [form] = Form.useForm<AccountFormValues>();
  const token = useUserStore((state) => state.token);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const { data } = await getUserDataAPI(token);
        form.setFieldsValue({
          newUsername: data.username || user.username || '',
          oldPassword: '',
          newPassword: '',
        });
      } catch {
        message.error('管理员信息加载失败');
      }
    };

    getUserInfo();
  }, []);

  const handleSave = async (values: AccountFormValues) => {
    await editAdminPassAPI({
      oldUsername: user.username || values.newUsername,
      ...values,
    });
    message.success('账号设置已保存');
    onSuccess();
  };

  return (
    <Form
      id="init-form-account"
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={{ newUsername: 'admin', oldPassword: '', newPassword: '' }}
      onFinish={handleSave}
    >
      <Form.Item label="管理员账号" name="newUsername" rules={[{ required: true, message: '请先填写管理员账号' }]}>
        <Input placeholder="请输入管理员账号" />
      </Form.Item>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Form.Item label="旧密码" name="oldPassword">
          <Input.Password placeholder="请输入旧密码（首次可留空）" />
        </Form.Item>
        <Form.Item label="新密码" name="newPassword" rules={[{ required: true, message: '请先填写新密码' }]}>
          <Input.Password placeholder="请输入新密码" />
        </Form.Item>
      </div>
    </Form>
  );
}
