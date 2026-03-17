import { useState, useEffect, useRef } from 'react';
import { Table, Button, Form, Input, Popconfirm, message, Card, Spin, Skeleton, Tooltip } from 'antd';
import { getTagListAPI, addTagDataAPI, editTagDataAPI, delTagDataAPI, getTagDataAPI } from '@/api/tag';
import { Tag } from '@/types/app/tag';
import Title from '@/components/Title';
import { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, FormOutlined } from '@ant-design/icons';

export default () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const isFirstLoadRef = useRef<boolean>(true);

  const [form] = Form.useForm();

  const [tag, setTag] = useState<Tag>({} as Tag);
  const [list, setList] = useState<Tag[]>([]);

  const columns: ColumnsType<Tag> = [
    {
      title: 'ID',
      width: 100,
      key: 'id',
      dataIndex: 'id',
      align: 'center',
    },
    {
      title: '标签名称',
      key: 'name',
      dataIndex: 'name',
      width: 200,
      align: 'center',
      render: (text: string) => (
        <Tooltip title={text}>
          <div className="max-w-[200px] truncate text-gray-700 dark:text-gray-200 hover:text-primary cursor-pointer">
            {text}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '文章数量',
      key: 'count',
      dataIndex: 'count',
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      width: 130,
      render: (_: string, record: Tag) => (
        <div className="space-x-2">
          <Tooltip title="编辑">
            <Button type="text" onClick={() => editTagData(record)} icon={<FormOutlined className="text-blue-500" />} />
          </Tooltip>

          <Tooltip title="删除">
            <Popconfirm title="警告" description="你确定要删除吗" okText="确定" cancelText="取消" onConfirm={() => delTagData(record.id!)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </div>
      ),
    },
  ];

  const getTagList = async () => {
    try {
      // 如果是第一次加载，使用 initialLoading
      // 否则使用 loading
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getTagListAPI();
      setList(data as Tag[]);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    getTagList();
  }, []);

  const editTagData = async (record: Tag) => {
    try {
      setEditLoading(true);

      const { data } = await getTagDataAPI(record.id);
      setTag(data);
      form.setFieldsValue(data);

      setEditLoading(false);
    } catch (error) {
      console.error(error);
      setEditLoading(false);
    }
  };

  const delTagData = async (id: number) => {
    try {
      setLoading(true);

      await delTagDataAPI(id);
      getTagList();
      message.success('🎉 删除标签成功');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    try {
      setLoading(true);
      setBtnLoading(true);

      form.validateFields().then(async (values: Tag) => {
        if (tag.id) {
          await editTagDataAPI({ ...tag, ...values });
          message.success('🎉 编辑标签成功');
        } else {
          await addTagDataAPI(values);
          
          message.success('🎉 新增标签成功');
        }

        getTagList();
        form.resetFields();
        form.setFieldsValue({ name: '' });
        setTag({} as Tag);
      });

      setLoading(false);
      setBtnLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
      setBtnLoading(false);
    }
  };

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return (
      <div>
        {/* Title 骨架屏 */}
        <Card className="[&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5! mb-2">
          <Skeleton.Input active size="large" style={{ width: 150, height: 32 }} />
        </Card>

        <div className="flex md:justify-between flex-col md:flex-row mx-auto mt-2 h-[calc(100vh-180px)]">
          {/* 左侧表单卡片骨架屏 */}
          <div className="w-full md:w-[40%]">
            <Card className="border-stroke w-full h-46 [&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5!">
              <Skeleton style={{ width: '100%', height: 30 }} />
            </Card>
          </div>

          {/* 右侧表格卡片骨架屏 */}
          <Card className="border-stroke w-full md:w-[59%] [&>.ant-card-body]:p-0! mt-2 md:mt-0">
            {/* 表格行骨架屏 - 模拟多行 */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="flex items-center gap-4 mb-2 py-2 px-4 border-b border-gray-100">
                <Skeleton.Input active size="small" style={{ width: 60, height: 20 }} />
                <Skeleton.Input active size="small" style={{ width: 150, height: 20, flex: 1 }} />
                <Skeleton.Input active size="small" style={{ width: 100, height: 20 }} />
                <Skeleton.Input active size="small" style={{ width: 80, height: 20 }} />
                <Skeleton.Input active size="small" style={{ width: 110, height: 20 }} />
              </div>
            ))}
            {/* 分页骨架屏 */}
            <div className="flex justify-center my-5">
              <Skeleton.Input active size="default" style={{ width: 300, height: 32 }} />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Title value="标签管理" />

      <div className="flex md:justify-between flex-col md:flex-row mx-auto mt-2 h-[calc(100vh-180px)]">
        <div className="w-full md:w-[40%]">
          <Spin spinning={editLoading}>
            <Card className="border-stroke w-full h-46">
              <Form form={form} layout="vertical" initialValues={tag} onFinish={onSubmit} size="large">
                <Form.Item label="标签名称" name="name" rules={[{ required: true, message: '标签名称不能为空' }]}>
                  <Input placeholder="请输入标签名称" />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={btnLoading} className="w-full">
                    {tag.id ? '编辑标签' : '新增标签'}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Spin>
        </div>

        <Card className="border-stroke w-full md:w-[59%] [&>.ant-card-body]:p-0! mt-2 md:mt-0">
          <Table
            rowKey="id"
            dataSource={list}
            columns={columns}
            scroll={{ x: 'max-content' }}
            pagination={{
              position: ['bottomCenter'],
              pageSize: 8,
            }}
            loading={loading}
          />
        </Card>
      </div>
    </div>
  );
};
