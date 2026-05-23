import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Empty, Form, Modal, message, Tooltip } from 'antd';
import {
  BiUser,
  BiFile,
  BiWrench,
  BiFolder,
  BiGlobe,
  BiGridAlt,
  BiCog,
  BiEdit,
  BiCopy,
  BiCheck,
} from 'react-icons/bi';

import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';

import Title from '@/components/Title';
import { getPageConfigListAPI, updatePageConfigDataAPI } from '@/api/config';
import { Config } from '@/types/app/config';
import Skeleton from './Skeleton';

const getConfigIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('my') || n.includes('user') || n.includes('profile')) return <BiUser />;
  if (n.includes('resume') || n.includes('file')) return <BiFile />;
  if (n.includes('equipment') || n.includes('tool')) return <BiWrench />;
  if (n.includes('project')) return <BiFolder />;
  if (n.includes('web') || n.includes('site') || n.includes('global')) return <BiGlobe />;
  if (n.includes('app')) return <BiGridAlt />;
  return <BiCog />;
};

const CONFIG_DESC_MAP: Record<string, string> = {
  my: '个人简介、性格标签、社交链接与头像设置',
  resume: '教育背景、工作经历、专业技能与证书管理',
  equipment: '开发设备、常用软件与生产力工具清单',
};

const getConfigDesc = (name: string) => {
  const key = name.toLowerCase();
  return CONFIG_DESC_MAP[key] || '页面数据配置';
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

  const handleEdit = (item: Config) => {
    setEditItem(item);
    setIsModalOpen(true);
    const str = JSON.stringify(item.value, null, 2);
    setJsonValue(str);
    formRef.current.setFieldsValue({ value: str });
    setJsonError(null);
  };

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

  if (initialLoading) {
    return <Skeleton />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title value="页面配置" />

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-3 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex-1 overflow-y-auto">
            {!data.length ? (
              <div className="flex h-full items-center justify-center p-10">
                <Empty description="暂无配置" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ) : (
              <div className="flex flex-col p-2 gap-0.5">
                {data.map((item) => {
                  const isActive = Number(item.id) === Number(activeConfig?.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveId(Number(item.id))}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        isActive
                          ? 'bg-primary/8 dark:bg-primary/15'
                          : 'hover:bg-gray-50 dark:hover:bg-white/5'
                      } cursor-pointer`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-primary" />
                      )}

                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-400 dark:bg-white/8 dark:text-gray-500 group-hover:text-gray-600'
                        }`}
                      >
                        <span className="text-[15px]">{getConfigIcon(item.name)}</span>
                      </div>

                      <div className="flex flex-1 flex-col overflow-hidden">
                        <span
                          className={`truncate text-sm font-medium transition-colors ${
                            isActive ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {item.notes}
                        </span>
                        <span className="truncate text-xs text-gray-400 dark:text-gray-500">{getConfigDesc(item.name)}</span>
                      </div>

                      {isActive && (
                        <div className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-9 flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-strokedark dark:bg-boxdark">
          {!activeConfig ? (
            <div className="flex h-full items-center justify-center">
              <Empty description="请选择一个配置项" />
            </div>
          ) : (
            <div className="flex flex-1 min-h-0 flex-col">
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-strokedark">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{activeConfig.notes}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Tooltip title="编辑配置">
                    <button
                      type="button"
                      onClick={() => handleEdit(activeConfig!)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary dark:hover:bg-white/10"
                    >
                      <BiEdit className="text-lg" />
                    </button>
                  </Tooltip>
                  <Tooltip title="复制 JSON">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary dark:hover:bg-white/10"
                    >
                      {copied ? <BiCheck className="text-lg text-green-500" /> : <BiCopy className="text-lg" />}
                    </button>
                  </Tooltip>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col p-4">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-[#1e1e1e] dark:border-strokedark">
                  <CodeMirror
                    className="h-full min-h-0 [&_.cm-editor]:h-full"
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
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <BiEdit className="text-primary" />
            <span>{editItem?.notes}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={900}
        footer={null}
        centered
        destroyOnClose
      >
        <Form form={formRef.current} layout="vertical" onFinish={handleSave} size="large" className="mt-4">
          <Form.Item
            name="value"
            rules={[{ required: true, message: '请输入配置内容' }]}
            className="mb-5"
            validateStatus={jsonError ? 'error' : ''}
            help={jsonError ? `JSON 格式错误: ${jsonError}` : ''}
          >
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-[#1e1e1e] dark:border-strokedark">
              <CodeMirror
                value={jsonValue}
                extensions={[json()]}
                onChange={handleJsonChange}
                theme="dark"
                basicSetup={{ lineNumbers: true, foldGutter: true }}
                height="460px"
              />
            </div>
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={handleFormatJson}>格式化</Button>
            <Button type="primary" htmlType="submit" loading={btnLoading}>
              保存
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
