import { useEffect, useState } from 'react';
import { Form, notification, Input, Button } from 'antd';

import { Theme } from '@/types/app/config';
import { editWebConfigDataAPI, getWebConfigDataAPI } from '@/api/config';

export default () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [theme, setTheme] = useState<Theme>({} as Theme);

  const [form] = Form.useForm();

  const getLayoutData = async () => {
    try {
      setLoading(true);

      const { data } = await getWebConfigDataAPI<{ value: Theme }>('theme');

      const theme = data.value;

      setTheme(theme);

      form.setFieldsValue({
        record_name: theme.record_name,
        record_info: theme.record_info,
      });

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getLayoutData();
  }, []);

  const editThemeData = async (values: { record_name: string; record_info: string }) => {
    try {
      setLoading(true);

      await editWebConfigDataAPI('theme', {
        ...theme,
        record_name: values.record_name,
        record_info: values.record_info,
      });

      notification.success({
        message: '成功',
        description: '🎉 修改主题成功',
      });

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl py-4 pl-10">闪念配置</h2>

      <div className="w-full lg:w-[500px] md:ml-10">
        <Form form={form} onFinish={editThemeData} layout="vertical">
          <Form.Item name="record_name" label="个人名称">
            <Input size="large" placeholder="请输入个人名称" />
          </Form.Item>

          <Form.Item name="record_info" label="个人介绍">
            <Input.TextArea size="large" autoSize={{ minRows: 2, maxRows: 4 }} placeholder="请输入个人介绍" />
          </Form.Item>

          <Button type="primary" size="large" className="w-full mt-4" htmlType="submit" loading={loading}>
            确定
          </Button>
        </Form>
      </div>
    </div>
  );
};
