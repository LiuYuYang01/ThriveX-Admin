import { useEffect, useState } from 'react';
import { Form, notification, Input, Button, Space, Radio } from 'antd';
import { CloudUploadOutlined, PictureOutlined } from '@ant-design/icons';

import { Theme } from '@/types/app/config';
import { editWebConfigDataAPI, getWebConfigDataAPI } from '@/api/config';
import Material from '@/components/Material';

interface ImageUrlInputProps {
  type: string;
  placeholder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPick: (type: string) => void;
}

function ImageUrlInput({ type, placeholder, value, onChange, onPick }: ImageUrlInputProps) {
  return (
    <Space.Compact block className="image-url-compact">
      <Input
        value={value}
        onChange={onChange}
        prefix={<PictureOutlined className="text-slate-400" />}
        allowClear
        placeholder={placeholder}
      />
      <Button type="default" icon={<CloudUploadOutlined />} onClick={() => onPick(type)}>
        选择
      </Button>
    </Space.Compact>
  );
}

export default () => {
  const [loading, setLoading] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [currentUploadType, setCurrentUploadType] = useState('');
  const [theme, setTheme] = useState<Theme>({} as Theme);
  const [form] = Form.useForm();

  const getLayoutData = async () => {
    try {
      setLoading(true);
      const { data } = await getWebConfigDataAPI('theme');
      const next = data.value as Theme;
      setTheme(next);
      form.setFieldsValue({
        record_name: next.record_name,
        record_avatar: next.record_avatar,
        record_cover: next.record_cover,
        record_mode: next.record_mode ?? 'page',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLayoutData();
  }, []);

  const editThemeData = async (values: {
    record_name: string;
    record_avatar: string;
    record_cover: string;
    record_mode: 'modal' | 'page';
  }) => {
    try {
      setLoading(true);
      const nextTheme = {
        ...theme,
        record_name: values.record_name,
        record_avatar: values.record_avatar,
        record_cover: values.record_cover,
        record_mode: values.record_mode,
      };
      await editWebConfigDataAPI('theme', nextTheme);
      setTheme(nextTheme);
      notification.success({
        message: '成功',
        description: '🎉 修改闪念配置成功',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openMaterialPicker = (type: string) => {
    setCurrentUploadType(type);
    setIsMaterialModalOpen(true);
  };

  const recordAvatar = Form.useWatch('record_avatar', form);
  const recordCover = Form.useWatch('record_cover', form);

  return (
    <div className="w-full lg:w-[500px]">
      <Form form={form} onFinish={editThemeData} layout="vertical">
        <Form.Item name="record_mode" label="展现模式" initialValue="page" tooltip="弹窗模式：全站点击闪念入口弹出弹窗浏览；页面模式：跳转到 /record 页面浏览">
          <Radio.Group optionType="button" buttonStyle="solid">
            <Radio.Button value="page">页面模式</Radio.Button>
            <Radio.Button value="modal">弹窗模式</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="record_name" label="个人名称">
          <Input size="large" placeholder="请输入个人名称" />
        </Form.Item>

        <Form.Item name="record_avatar" label="头像">
          <ImageUrlInput type="record_avatar" placeholder="请输入头像地址" onPick={openMaterialPicker} />
        </Form.Item>
        {recordAvatar && <img src={recordAvatar} alt="" className="mb-4 h-16 w-16 rounded-md object-cover" />}

        <Form.Item name="record_cover" label="背景图">
          <ImageUrlInput type="record_cover" placeholder="请输入背景图地址" onPick={openMaterialPicker} />
        </Form.Item>
        {recordCover && <img src={recordCover} alt="" className="mb-4 w-full max-w-xs rounded-sm object-cover" />}

        <Button type="primary" size="large" className="w-full mt-4" htmlType="submit" loading={loading}>
          确定
        </Button>
      </Form>

      <Material
        open={isMaterialModalOpen}
        onClose={() => {
          setIsMaterialModalOpen(false);
          setCurrentUploadType('');
        }}
        onSelect={(url: string[]) => {
          if (currentUploadType) {
            form.setFieldValue(currentUploadType, url[0]);
            form.validateFields([currentUploadType]);
            setTheme({ ...theme, [currentUploadType]: url[0] });
          }
        }}
      />
    </div>
  );
};
