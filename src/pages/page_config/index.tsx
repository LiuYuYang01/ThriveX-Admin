import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Empty, Form, Modal, Typography, message, Space, Tooltip } from 'antd';
import {
  CopyOutlined,
  EditOutlined,
  CheckOutlined,
  FileTextOutlined,
  UserOutlined,
  ProjectOutlined,
  ToolOutlined,
  SettingOutlined,
  AppstoreOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';

import Title from '@/components/Title';
import { getPageConfigListAPI, updatePageConfigDataAPI } from '@/api/config';
import { Config } from '@/types/app/config';
import Skeleton from './Skeleton';

const getConfigIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('my') || n.includes('user') || n.includes('profile')) return <UserOutlined />;
  if (n.includes('resume') || n.includes('file')) return <FileTextOutlined />;
  if (n.includes('equipment') || n.includes('tool')) return <ToolOutlined />;
  if (n.includes('project')) return <ProjectOutlined />;
  if (n.includes('web') || n.includes('site') || n.includes('global')) return <GlobalOutlined />;
  if (n.includes('app')) return <AppstoreOutlined />;
  return <SettingOutlined />;
};

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
  const [copied, setCopied] = useState(false);
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
      setJsonError(null);
    } catch (error) {
      if (error instanceof Error) {
        setJsonError(error.message);
      } else {
        setJsonError(String(error));
      }
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
      message.error('JSON 格式错误，无法格式化');
    }
  };

  const prettyValue = useMemo(() => {
    if (!activeConfig) {
      return '';
    }
    return JSON.stringify(activeConfig.value, null, 2);
  }, [activeConfig]);

  const handleCopy = () => {
    navigator.clipboard.writeText(prettyValue);
    setCopied(true);
    message.success('已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return <Skeleton />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title value="页面配置" />

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-2 lg:grid-cols-12">
        {/* 左侧列表 */}
        <Card className="lg:col-span-3 overflow-hidden border-none shadow-none dark:bg-boxdark" styles={{ body: { padding: 0 } }}>
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-strokedark">
            {!data.length ? (
              <div className="p-10 text-center">
                <Empty description="暂无配置" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ) : (
              data.map((item) => {
                const isActive = Number(item.id) === Number(activeConfig?.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(Number(item.id))}
                    className={`group relative flex items-center gap-3 p-4 text-left transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/5 ${isActive ? 'bg-primary/5 dark:bg-primary/10' : 'bg-transparent'
                      } cursor-pointer`}
                  >
                    {/* 激活指示条 */}
                    {isActive && <div className="absolute left-0 top-0 h-full w-1 bg-primary" />}

                    {/* 图标 */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-gray-50 text-gray-400 dark:bg-white/5 dark:text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'
                        }`}
                    >
                      <span className="text-lg">{getConfigIcon(item.name)}</span>
                    </div>

                    <div className="flex flex-1 flex-col overflow-hidden">
                      <div className="flex items-center justify-between">
                        <Typography.Text
                          strong
                          className={`text-xl transition-colors ${isActive ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          ellipsis
                        >
                          {item.notes}
                        </Typography.Text>
                        {isActive && (
                          <div className="relative flex h-2.5 w-2.5 mr-1">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* 右侧预览 */}
        <Card className="lg:col-span-9 flex flex-col border-none shadow-none dark:bg-boxdark" styles={{ body: { padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } }}>
          {!activeConfig ? (
            <div className="flex h-full items-center justify-center">
              <Empty description="请选择一个配置项" />
            </div>
          ) : (
            <div className="flex flex-1 min-h-0 flex-col gap-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-5 dark:border-strokedark">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20">
                    <span className="text-2xl">{getConfigIcon(activeConfig.name)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xl font-bold text-gray-800 dark:text-white">{activeConfig.notes}</span>
                  </div>
                </div>
              </div>

              <div className="relative group flex flex-1 min-h-0 flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 rounded-full bg-primary" />
                    <Typography.Text strong className="text-gray-700 dark:text-gray-300">
                      预览
                    </Typography.Text>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tooltip title="编辑配置">
                      <Button type="text" size="small" className="flex items-center gap-1.5 text-gray-400 hover:text-primary" icon={<EditOutlined />} onClick={() => handleEdit(activeConfig!)} />
                    </Tooltip>
                    <Tooltip title="复制 JSON 内容">
                      <Button type="text" size="small" className="flex items-center gap-1.5 text-gray-400 hover:text-primary" icon={copied ? <CheckOutlined className="text-green-500" /> : <CopyOutlined />} onClick={handleCopy} />
                    </Tooltip>
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-gray-800 bg-[#1e1e1e] shadow-lg transition-all">
                  <CodeMirror
                    value={prettyValue}
                    extensions={[json()]}
                    theme="dark"
                    editable={false}
                    readOnly={true}
                    basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: false }}
                    height="100%"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal title={editItem?.notes} open={isModalOpen} onCancel={() => setIsModalOpen(false)} width={1000} footer={null} centered className="config-modal" destroyOnClose>
        <Form form={formRef.current} layout="vertical" onFinish={handleSave} size="large" className="mt-4">
          <Form.Item name="value" rules={[{ required: true, message: '请输入配置内容' }]} className="mb-6" validateStatus={jsonError ? 'error' : ''} help={jsonError ? `JSON 格式错误: ${jsonError}` : ''}>
            <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#1e1e1e]">
              <CodeMirror value={jsonValue} extensions={[json()]} onChange={handleJsonChange} theme="dark" basicSetup={{ lineNumbers: true, foldGutter: true }} height="500px" />
            </div>
          </Form.Item>

          <Space className="w-full justify-end">
            <Button onClick={handleFormatJson}>格式化</Button>
            <Button type="primary" htmlType="submit" loading={btnLoading}>
              保存
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

