import { useEffect, useState } from 'react';
import { Button, Form, message, Select } from 'antd';
import { editWebConfigDataAPI } from '@/api/config';
import { FileConfig, UPLOAD_COMPRESS_MODE_OPTIONS } from '@/types/app/config';
import { useFileStore } from '@/stores';
import { fetchFileConfig } from '@/utils/fileConfig';

export default () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<FileConfig>();
  const setFile = useFileStore((state) => state.setFile);

  const getConfigData = async () => {
    try {
      setLoading(true);
      const config = await fetchFileConfig();
      form.setFieldsValue(config);
      setFile(config);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getConfigData();
  }, []);

  const onSubmit = async (values: FileConfig) => {
    setLoading(true);
    try {
      await editWebConfigDataAPI('file', values);
      setFile(values);
      message.success('🎉 文件配置已保存');
      form.setFieldsValue(values);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl pb-4">文件配置</h2>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        配置上传图片时的压缩策略，作用于文件管理与文章编辑器的图片上传
      </p>

      <Form form={form} size="large" layout="vertical" onFinish={onSubmit} className="w-full lg:w-[500px] md:ml-10">
        <Form.Item
          label="压缩策略"
          name="upload_compress_mode"
          rules={[{ required: true, message: '请选择压缩策略' }]}
        >
          <Select
            options={UPLOAD_COMPRESS_MODE_OPTIONS.map((item) => ({
              value: item.value,
              label: (
                <div>
                  <div>{item.label}</div>
                  <div className="text-xs text-gray-400 font-normal">{item.description}</div>
                </div>
              ),
            }))}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            保存配置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
