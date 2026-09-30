import { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, message, Switch } from 'antd';

import { editWebConfigDataAPI, getWebConfigDataAPI } from '@/api/config';
import { revalidateFrontendCacheAPI } from '@/api/revalidate';
import { useWebStore } from '@/stores';
import { Announcement, DEFAULT_ANNOUNCEMENT_CONFIG } from '@/types/app/config';

export default () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<Announcement>();
  const web = useWebStore((state) => state.web);
  // 关闭开关时隐藏下方表单（保留保存按钮以便保存禁用状态）
  const enable = Form.useWatch('enable', form) ?? DEFAULT_ANNOUNCEMENT_CONFIG.enable;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getWebConfigDataAPI('announcement');
        if (data?.value) form.setFieldsValue({ ...DEFAULT_ANNOUNCEMENT_CONFIG, ...data.value });
      } catch {
        // 首次使用时配置不存在，保持默认值
      }
    })();
  }, []);

  const onSubmit = async (values: Announcement) => {
    setLoading(true);
    try {
      await editWebConfigDataAPI('announcement', { ...values, update_time: Date.now() });
      message.success('🎉 公告配置已保存');

      // 公告时效性强，保存后立即刷新前台缓存让其生效
      try {
        if (web?.url) await revalidateFrontendCacheAPI(web.url);
      } catch (error) {
        console.error(error);
        message.warning('公告已保存，但前台缓存刷新失败，可稍后在仪表盘手动清空缓存');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl pb-4">公告配置</h2>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        开启后访客进入前台将弹出公告弹窗，公告内容更新后会重新弹出
      </p>

      <Form
        form={form}
        size="large"
        layout="vertical"
        onFinish={onSubmit}
        initialValues={DEFAULT_ANNOUNCEMENT_CONFIG}
        className="w-full max-w-xl md:ml-10"
      >
        <Form.Item label="启用公告" name="enable" valuePropName="checked" className="mb-6">
          <Switch />
        </Form.Item>

        {enable && (
          <>
            <Form.Item
              label="公告标题"
              name="title"
              rules={[{ required: true, message: '请输入公告标题' }]}
              className="mb-4"
            >
              <Input placeholder="站点公告" maxLength={30} showCount />
            </Form.Item>

            <Form.Item
              label="公告内容"
              name="content"
              rules={[{ required: true, message: '请输入公告内容' }]}
              className="mb-4"
            >
              <Input.TextArea placeholder="输入公告内容，支持换行" rows={10} maxLength={500} showCount />
            </Form.Item>

            <Form.Item
              label="自动关闭（秒）"
              name="auto_close"
              extra="弹窗弹出多少秒后自动关闭，0 表示不自动关闭"
              className="mb-4"
            >
              <InputNumber min={0} max={600} className="w-28!" />
            </Form.Item>

            <Form.Item
              label="关闭后不再提示（天）"
              name="silent_days"
              extra="访客关闭公告后多少天内不再弹出，0 表示每次访问都弹出"
              className="mb-4"
            >
              <InputNumber min={0} max={365} className="w-28!" />
            </Form.Item>
          </>
        )}

        <Form.Item className="mt-6">
          <Button type="primary" htmlType="submit" loading={loading} block>
            保存配置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
