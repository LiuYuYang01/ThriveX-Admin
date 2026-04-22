import { useEffect, useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { editWebConfigDataAPI, getWebConfigDataAPI } from '@/api/config';
import { Other } from '@/types/app/config';

export default () => {
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm<Other>();

  const getConfigData = async () => {
    try {
      setLoading(true);
      const { data } = await getWebConfigDataAPI('other');
      form.setFieldsValue(data.value);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  useEffect(() => {
    getConfigData();
  }, []);

  const onSubmit = async (values: Other) => {
    setLoading(true);

    try {
      const submitData = { ...values };

      await editWebConfigDataAPI('other', submitData);
      message.success('🎉 编辑配置成功');

      form.setFieldsValue(submitData);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }

    setLoading(false);
  };

  const Label = ({ title, url }: { title: string; url: string }) => {
    return (
      <div className="w-full flex items-center justify-between">
        <span>{title}</span>
        <a href={url} target="_blank" rel="noreferrer" className="hover:text-primary text-xs text-gray-400">配置教程</a>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-xl pb-4">其他配置</h2>

      <Form form={form} size="large" layout="vertical" onFinish={onSubmit} className="w-full lg:w-[500px] md:ml-10">
        <Form.Item label={<Label title="百度统计 Token" url="https://docs.liuyuyang.net/docs/项目部署/API/百度统计.html" />} name="baidu_token" className="[&_label]:w-full">
          <Input placeholder="e5bf799a3e49312141c8b677b7bec1c2" />
        </Form.Item>

        <Form.Item label={<Label title="HCaptcha Key" url="https://docs.liuyuyang.net/docs/项目部署/API/人机验证.html" />} name="hcaptcha_key" rules={[{ required: true, message: 'HCaptcha Key 不能为空' }]} className="[&_label]:w-full">
          <Input placeholder="bfb82d04-e46a-4da0-9b6e-9adc052672c8" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            确定
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
