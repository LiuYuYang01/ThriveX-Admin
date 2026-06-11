import { useEffect, useState } from 'react';
import { Button, Form, message, Radio } from 'antd';
import { FiCheck } from 'react-icons/fi';
import { editWebConfigDataAPI } from '@/api/config';
import { FileConfig, UPLOAD_COMPRESS_MODE_OPTIONS } from '@/types/app/config';
import { useFileStore } from '@/stores';
import { fetchFileConfig } from '@/utils/fileConfig';

const optionCardClass =
  'mx-0! mt-0! mb-3! flex! w-full! rounded-xl! border! border-gray-200! p-0! shadow-none! transition-all! hover:border-gray-300! last:mb-0! dark:border-strokedark! dark:bg-boxdark/40! dark:hover:border-slate-600! [&_.ant-radio]:hidden! [&_.ant-radio+span]:flex! [&_.ant-radio+span]:w-full! [&_.ant-radio+span]:p-0! [&.ant-radio-wrapper-checked]:border-primary! [&.ant-radio-wrapper-checked]:bg-primary/[0.04]! [&.ant-radio-wrapper-checked]:ring-1! [&.ant-radio-wrapper-checked]:ring-primary/20! dark:[&.ant-radio-wrapper-checked]:bg-primary/10! [&.ant-radio-wrapper-checked_.option-check]:border-primary! [&.ant-radio-wrapper-checked_.option-check]:bg-primary! [&.ant-radio-wrapper-checked_.option-check_svg]:block!';

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

      <Form form={form} size="large" layout="vertical" onFinish={onSubmit} className="w-full max-w-xl md:ml-10">
        <Form.Item
          label="压缩策略"
          name="upload_compress_mode"
          rules={[{ required: true, message: '请选择压缩策略' }]}
          className="mb-2"
        >
          <Radio.Group className="flex! w-full! flex-col!">
            {UPLOAD_COMPRESS_MODE_OPTIONS.map((item) => (
              <Radio key={item.value} value={item.value} className={optionCardClass}>
                <div className="flex w-full items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.label}</span>
                      {item.value === 'auto' && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium leading-none text-primary dark:bg-primary/20">
                          推荐
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-400 dark:text-gray-500">{item.description}</p>
                  </div>

                  <span className="option-check flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-gray-300 transition-all dark:border-gray-600">
                    <FiCheck className="hidden h-3 w-3 text-white" />
                  </span>
                </div>
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>

        <Form.Item className="mt-6">
          <Button type="primary" htmlType="submit" loading={loading} block>
            保存配置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
