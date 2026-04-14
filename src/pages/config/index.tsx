import { useEffect, useState, useRef } from 'react';
import { Table, Button, Modal, Form, message, Card, Tabs, Skeleton } from 'antd';
import { FormOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd/es/form';

import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';

import Title from '@/components/Title';
import { getEnvConfigListAPI, updateEnvConfigDataAPI, getPageConfigListAPI, updatePageConfigDataAPI } from '@/api/config';
import { Config, THIRD_PARTY_ENV_NAMES } from '@/types/app/config';
import { titleSty } from '@/styles/sty';
import { ColumnsType } from 'antd/es/table';

interface Props {
  open: boolean;
  onCancel: () => void;
  onSave: () => void;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onFormat: () => void;
  loading: boolean;
  title: string;
  form: FormInstance;
}

function ConfigEditModal({ open, onCancel, onSave, value, error, onChange, onFormat, loading, title, form }: Props) {
  return (
    <Modal title={title} open={open} onCancel={onCancel} width={1000} footer={null}>
      <Form form={form} layout="vertical" onFinish={onSave} size="large">
        <Form.Item name="value" rules={[{ required: true, message: '请输入配置内容' }]} className="mb-4" validateStatus={error ? 'error' : ''} help={error ? `JSON格式错误: ${error}` : ''}>
          <CodeMirror value={value} extensions={[json()]} onChange={onChange} theme={document.body.classList.contains('dark') ? 'dark' : 'light'} basicSetup={{ lineNumbers: true, foldGutter: true }} style={error ? { border: '1px solid #ff4d4f', borderRadius: 6 } : { borderRadius: 6 }} />
        </Form.Item>

        <Button onClick={onFormat} className="w-full mb-2">
          格式化
        </Button>
        <Button type="primary" htmlType="submit" loading={loading} className="w-full">
          保存配置
        </Button>
      </Form>
    </Modal>
  );
}

const tabConfig = {
  env: {
    label: '环境配置',
    getList: getEnvConfigListAPI,
    update: async (item: Config, value: object) => updateEnvConfigDataAPI({ ...item, value }),
    modalTitle: '编辑配置',
  },
  page: {
    label: '页面配置',
    getList: getPageConfigListAPI,
    update: async (item: Config, value: object) => updatePageConfigDataAPI(Number(item.id), value),
    modalTitle: '编辑页面配置',
  },
};

export default () => {
  // 合并状态
  const [activeTab, setActiveTab] = useState<'env' | 'page'>('env');
  const [data, setData] = useState<{ [key: string]: Config[] }>({ env: [], page: [] });
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({ env: false, page: false });
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);
  const [editItem, setEditItem] = useState<Config | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonValue, setJsonValue] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);
  const formRef = useRef<{ [key: string]: FormInstance[] }>({ env: Form.useForm(), page: Form.useForm() });

  // 获取配置列表
  const fetchList = async (type: 'env' | 'page') => {
    // 如果是第一次加载，使用 initialLoading
    if (isFirstLoadRef.current) {
      setInitialLoading(true);
    } else {
      setLoading((l) => ({ ...l, [type]: true }));
    }

    try {
      const { data: list } = await tabConfig[type].getList();
      const filtered =
        type === 'env' ? list.filter((row) => !(THIRD_PARTY_ENV_NAMES as readonly string[]).includes(row.name)) : list;
      setData((d) => ({ ...d, [type]: filtered }));
      isFirstLoadRef.current = false;
    } catch (e) {
      console.error(e);
    } finally {
      setInitialLoading(false);
      setLoading((l) => ({ ...l, [type]: false }));
    }
  };

  useEffect(() => {
    fetchList(activeTab);
  }, [activeTab]);

  // 打开编辑弹窗
  const handleEdit = (item: Config) => {
    setEditItem(item);
    setIsModalOpen(true);
    const str = JSON.stringify(item.value, null, 2);
    setJsonValue(str);
    formRef.current[activeTab][0].setFieldsValue({ value: str });
    setJsonError(null);
  };

  // 保存编辑
  const handleSave = async () => {
    try {
      setBtnLoading(true);
      const values = await formRef.current[activeTab][0].validateFields();
      let parsed;
      try {
        parsed = JSON.parse(values.value);
      } catch (e) {
        console.error(e);
        message.error('请输入合法的JSON格式');
        setBtnLoading(false);
        return;
      }
      await tabConfig[activeTab].update(editItem!, parsed);
      message.success('保存成功');
      fetchList(activeTab);
      setIsModalOpen(false);
      setEditItem(null);
      setBtnLoading(false);
    } catch (e) {
      console.error(e);
      setBtnLoading(false);
    }
  };

  // JSON 输入变更时校验
  const handleJsonChange = (value: string) => {
    setJsonValue(value);
    formRef.current[activeTab][0].setFieldsValue({ value });
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
      formRef.current[activeTab][0].setFieldsValue({ value: formatted });
      setJsonError(null);
    } catch (error) {
      console.error(error);
    }
  };

  const columns: ColumnsType<Config> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'center' as const,
      width: 120,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
    },
    {
      title: '配置内容',
      dataIndex: 'value',
      key: 'value',
      render: (value: object) => <>{activeTab === 'page' ? <span className="text-sm text-gray-500">内容过多，不易展示</span> : <pre className="min-w-[200px] whitespace-pre-wrap break-all bg-slate-50 dark:bg-slate-800 p-2 rounded-sm text-xs overflow-auto">{JSON.stringify(value, null, 2)}</pre>}</>,
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      width: 100,
      fixed: 'right',
      render: (_: unknown, record: Config) => <Button type="text" icon={<FormOutlined className="text-primary" />} onClick={() => handleEdit(record)} />,
    },
  ];

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return (
      <div>
        {/* Title 骨架屏 */}
        <Card className="[&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5! mb-2">
          <Skeleton.Input active size="large" style={{ width: 150, height: 32 }} />
        </Card>

        {/* Tabs 和表格骨架屏 */}
        <Card className={`${titleSty} min-h-[calc(100vh-200px)] [&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5!`}>
          {/* Tabs 骨架屏 */}
          <div className="flex justify-center space-x-4 mb-6">
            <Skeleton.Button active size="default" style={{ width: 100, height: 40 }} />
            <Skeleton.Button active size="default" style={{ width: 100, height: 40 }} />
          </div>

          {/* 表格骨架屏 */}
          <div className="mb-4">
            {/* 表格行骨架屏 - 模拟多行 */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="flex items-center gap-4 mb-2 py-2 border-b border-gray-100">
                <Skeleton.Input active size="small" style={{ width: 60, height: 40 }} />
                <Skeleton.Input active size="small" style={{ width: 150, height: 40 }} />
                <Skeleton.Input active size="small" style={{ width: 200, height: 40, flex: 1 }} />
                <Skeleton.Input active size="small" style={{ width: 150, height: 40 }} />
                <Skeleton.Input active size="small" style={{ width: 200, height: 40 }} />
                <Skeleton.Input active size="small" style={{ width: 100, height: 40 }} />
                <Skeleton.Input active size="small" style={{ width: 300, height: 40 }} />
                <Skeleton.Input active size="small" style={{ width: 200, height: 40 }} />
              </div>
            ))}
          </div>

          {/* 分页骨架屏 */}
          <div className="flex justify-center my-5">
            <Skeleton.Input active size="default" style={{ width: 300, height: 32 }} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Title value="项目配置" />

      {/* <Alert type="warning" message="必看教程：https://docs.liuyuyang.net/docs/项目部署/API/人机验证.html" showIcon closable className="mb-2" /> */}

      <Card className={`${titleSty} min-h-[calc(100vh-155px)]`}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'env' | 'page')}
          items={Object.keys(tabConfig).map((key) => ({
            key,
            label: tabConfig[key as 'env' | 'page'].label,
            children: <Table rowKey="id" dataSource={data[key]} columns={columns} scroll={{ x: '1000px' }} loading={loading[key]} pagination={false} />,
          }))}
          className="[&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav-wrap]:justify-center"
        />
      </Card>

      <ConfigEditModal key={activeTab} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onSave={handleSave} value={jsonValue} error={jsonError} onChange={handleJsonChange} onFormat={handleFormatJson} loading={btnLoading} title={editItem ? tabConfig[activeTab].modalTitle : ''} form={formRef.current[activeTab][0]} />
    </div>
  );
};
