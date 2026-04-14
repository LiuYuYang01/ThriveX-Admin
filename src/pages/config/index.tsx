import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Empty, Form, Modal, Typography, message } from 'antd';

import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';

import Title from '@/components/Title';
import { getPageConfigListAPI, updatePageConfigDataAPI } from '@/api/config';
import { Config } from '@/types/app/config';
import Skeleton from './Skeleton';

export default () => {
  const [data, setData] = useState<Config[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<Config | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonValue, setJsonValue] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const formRef = useRef(form);

  const fetchList = async () => {
    if (isFirstLoadRef.current) {
      setInitialLoading(true);
    }

    try {
      const { data: list } = await getPageConfigListAPI();
      setData(list);
      const shouldResetActive = !list.some((item) => Number(item.id) === activeId);
      if (shouldResetActive) {
        setActiveId(list.length ? Number(list[0].id) : null);
      }
      isFirstLoadRef.current = false;
    } catch (e) {
      console.error(e);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // 打开编辑弹窗
  const handleEdit = (item: Config) => {
    setEditItem(item);
    setIsModalOpen(true);
    const str = JSON.stringify(item.value, null, 2);
    setJsonValue(str);
    formRef.current.setFieldsValue({ value: str });
    setJsonError(null);
  };

  // 保存编辑
  const handleSave = async () => {
    try {
      setBtnLoading(true);
      const values = await formRef.current.validateFields();
      let parsed;
      try {
        parsed = JSON.parse(values.value);
      } catch (e) {
        console.error(e);
        message.error('请输入合法的JSON格式');
        setBtnLoading(false);
        return;
      }
      await updatePageConfigDataAPI(Number(editItem!.id), parsed);
      message.success('保存成功');
      fetchList();
      setIsModalOpen(false);
      setEditItem(null);
      setBtnLoading(false);
    } catch (e) {
      console.error(e);
      setBtnLoading(false);
    }
  };

  const activeConfig = useMemo(() => {
    if (!data.length) {
      return null;
    }
    const matched = data.find((item) => Number(item.id) === activeId);
    return matched || data[0];
  }, [data, activeId]);

  useEffect(() => {
    if (activeConfig && Number(activeConfig.id) !== activeId) {
      setActiveId(Number(activeConfig.id));
    }
  }, [activeConfig, activeId]);

  // JSON 输入变更时校验
  const handleJsonChange = (value: string) => {
    setJsonValue(value);
    formRef.current.setFieldsValue({ value });
    try {
      JSON.parse(value);
    } catch (error) {
      console.error(error);
    }
  };

  // 格式化 JSON
  const handleFormatJson = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(jsonValue), null, 2);
      setJsonValue(formatted);
      formRef.current.setFieldsValue({ value: formatted });
      setJsonError(null);
    } catch (error) {
      console.error(error);
    }
  };

  const prettyValue = useMemo(() => {
    if (!activeConfig) {
      return '';
    }
    return JSON.stringify(activeConfig.value, null, 2);
  }, [activeConfig]);

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return <Skeleton />;
  }

  return (
    <div>
      <Title value="项目配置">
        <Button type="primary" onClick={() => handleEdit(activeConfig!)}>
          编辑配置
        </Button>
      </Title>

      <Card className="border-stroke mt-2 min-h-[calc(100vh-160px)]">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-[20%] md:mr-5 mb-10 md:mb-0 border-b-0 md:border-r border-stroke dark:border-strokedark divide-y divide-solid divide-[#F6F6F6] dark:divide-strokedark">
            {!data.length ? (
              <Card className="m-3">
                <Empty description="暂无配置" />
              </Card>
            ) : (
              data.map((item) => {
                const isActive = Number(item.id) === Number(activeConfig?.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(Number(item.id))}
                    className={`relative w-full cursor-pointer p-3 pl-5 text-left transition-all before:absolute before:top-1/2 before:left-0 before:h-[0%] before:w-[3.5px] before:-translate-y-1/2 before:bg-primary before:content-[''] ${isActive ? 'bg-[#f7f7f8] before:h-full dark:bg-[#3c5370]' : 'hover:bg-[#f7f7f8]/70 dark:hover:bg-[#3c5370]/50'}`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <Typography.Text strong ellipsis>
                        {item.name}
                      </Typography.Text>
                    </div>
                    <Typography.Paragraph className="m-0 text-sm text-bodydark2 dark:text-gray-400" ellipsis={{ rows: 2 }}>
                      {item.notes || '暂无备注'}
                    </Typography.Paragraph>
                  </button>
                );
              })
            )}
          </div>

          <div className="w-full md:w-[80%] px-0 md:px-8">
            {!activeConfig ? (
              <Empty description="请选择一个配置项" />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stroke pb-3 dark:border-strokedark">
                  <div className="text-xl font-bold dark:text-white">{activeConfig.notes || activeConfig.name}</div>
                </div>

                <div>
                  <Typography.Text strong className="mb-2 block">
                    配置预览
                  </Typography.Text>
                  <pre className="max-h-[calc(100vh-420px)] overflow-auto rounded-lg border border-stroke bg-gray-50 p-4 text-xs leading-6 text-bodydark dark:border-strokedark dark:bg-black/20 dark:text-gray-300">
                    {prettyValue}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Modal title={editItem ? '编辑页面配置' : ''} open={isModalOpen} onCancel={() => setIsModalOpen(false)} width={1000} footer={null}>
        <Form form={formRef.current} layout="vertical" onFinish={handleSave} size="large">
          <Form.Item name="value" rules={[{ required: true, message: '请输入配置内容' }]} className="mb-4" validateStatus={jsonError ? 'error' : ''} help={jsonError ? `JSON格式错误: ${jsonError}` : ''}>
            <CodeMirror value={jsonValue} extensions={[json()]} onChange={handleJsonChange} theme={document.body.classList.contains('dark') ? 'dark' : 'light'} basicSetup={{ lineNumbers: true, foldGutter: true }} style={jsonError ? { border: '1px solid #ff4d4f', borderRadius: 6 } : { borderRadius: 6 }} />
          </Form.Item>

          <Button onClick={handleFormatJson} className="w-full mb-2">
            格式化
          </Button>
          <Button type="primary" htmlType="submit" loading={btnLoading} className="w-full">
            保存配置
          </Button>
        </Form>
      </Modal>
    </div>
  );
};
