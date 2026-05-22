import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Table, Button, Form, Input, Popconfirm, message, Spin, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FiTag,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiHash,
  FiFileText,
  FiX,
  FiSearch,
} from 'react-icons/fi';

import { getTagListAPI, addTagDataAPI, editTagDataAPI, delTagDataAPI, getTagDataAPI } from '@/api/tag';
import type { Tag } from '@/types/app/tag';
import Title from '@/components/Title';
import Skeleton from './Skeleton';

export default function TagPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [search, setSearch] = useState('');
  const isFirstLoadRef = useRef(true);

  const [form] = Form.useForm();
  const [tag, setTag] = useState<Tag>({} as Tag);
  const [list, setList] = useState<Tag[]>([]);

  const isEditing = Boolean(tag.id);

  const filteredList = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return list;
    return list.filter((item) => item.name?.toLowerCase().includes(keyword));
  }, [list, search]);

  const getTagList = useCallback(async () => {
    try {
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getTagListAPI();
      setList(data.result);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void getTagList();
  }, [getTagList]);

  const resetFormState = useCallback(() => {
    form.resetFields();
    setTag({} as Tag);
  }, [form]);

  const editTagData = useCallback(
    async (record: Tag) => {
      try {
        setEditLoading(true);
        const { data } = await getTagDataAPI(record.id);
        setTag(data);
        form.setFieldsValue(data);
      } catch (error) {
        console.error(error);
      } finally {
        setEditLoading(false);
      }
    },
    [form],
  );

  const delTagData = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        await delTagDataAPI(id);
        if (tag.id === id) resetFormState();
        await getTagList();
        message.success('🎉 删除标签成功');
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    },
    [getTagList, resetFormState, tag.id],
  );

  const onSubmit = async () => {
    try {
      setBtnLoading(true);
      const values = await form.validateFields();
      if (tag.id) {
        await editTagDataAPI({ ...tag, ...values });
        message.success('🎉 编辑标签成功');
      } else {
        await addTagDataAPI(values);
        message.success('🎉 新增标签成功');
      }
      await getTagList();
      resetFormState();
    } catch (error) {
      console.error(error);
    } finally {
      setBtnLoading(false);
    }
  };

  const columns: ColumnsType<Tag> = useMemo(
    () => [
      {
        title: 'ID',
        width: 88,
        key: 'id',
        dataIndex: 'id',
        align: 'center',
        render: (id: number) => (
          <span className="font-mono text-xs text-slate-400 dark:text-slate-500">#{id}</span>
        ),
      },
      {
        title: '标签名称',
        key: 'name',
        dataIndex: 'name',
        render: (text: string) => (
          <Tooltip title={text}>
            <span className="inline-flex max-w-[240px] items-center gap-2 truncate">
              <span className="truncate font-medium text-slate-700 transition-colors hover:text-primary dark:text-slate-200">
                {text}
              </span>
            </span>
          </Tooltip>
        ),
      },
      {
        title: '关联文章',
        key: 'count',
        dataIndex: 'count',
        width: 120,
        align: 'center',
        render: (count: number) => (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${count > 0
              ? 'bg-slate-100 text-slate-600 dark:bg-boxdark-2 dark:text-slate-300'
              : 'bg-slate-50 text-slate-400 dark:bg-boxdark/60 dark:text-slate-500'
              }`}
          >
            <FiFileText size={12} />
            {count ?? 0}
          </span>
        ),
      },
      {
        title: '操作',
        key: 'action',
        align: 'center',
        width: 108,
        fixed: 'right',
        render: (_: string, record: Tag) => (
          <div className="flex items-center justify-center gap-0.5">
            <Tooltip title="编辑">
              <button
                type="button"
                onClick={() => editTagData(record)}
                className="flex size-8 items-center justify-center rounded-lg text-slate-400! transition-colors hover:bg-slate-100! hover:text-primary! dark:hover:bg-white/5! dark:hover:text-primary! cursor-pointer"
                aria-label={`编辑 ${record.name}`}
              >
                <FiEdit2 size={16} />
              </button>
            </Tooltip>
            <Popconfirm
              title="删除标签"
              description={
                record.count
                  ? `「${record.name}」下仍有 ${record.count} 篇文章，确定删除吗？`
                  : `确定要删除「${record.name}」吗？`
              }
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => delTagData(record.id!)}
            >
              <Tooltip title="删除">
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 cursor-pointer"
                  aria-label={`删除 ${record.name}`}
                >
                  <FiTrash2 size={16} />
                </button>
              </Tooltip>
            </Popconfirm>
          </div>
        ),
      },
    ],
    [delTagData, editTagData],
  );

  if (initialLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="标签管理" />

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        {/* 列表区 */}
        <section className="flex min-w-0 flex-1 flex-col rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-strokedark">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">全部标签</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-boxdark-2 dark:text-slate-300">
                {filteredList.length}
              </span>
            </div>
            <Input
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标签名称…"
              prefix={<FiSearch className="text-slate-400" />}
              className="w-full max-w-[220px]!"
            />
          </header>

          <Table
            rowKey="id"
            dataSource={filteredList}
            columns={columns}
            loading={loading}
            scroll={{ x: 'max-content' }}
            pagination={{
              position: ['bottomRight'],
              pageSize: 8,
              showSizeChanger: false,
              className: 'px-5! py-3!',
              showTotal: (total) => (
                <span className="text-xs text-slate-500 dark:text-slate-400">共 {total} 条</span>
              ),
            }}
            className="min-h-0 flex-1 [&_.ant-table-thead>tr>th]:bg-slate-50! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-slate-500! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! dark:[&_.ant-table-thead>tr>th]:text-slate-400!"
            locale={{
              emptyText: (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2 dark:text-slate-500">
                    <FiTag size={22} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {search.trim() ? '没有匹配的标签，试试其他关键词' : '还没有标签，在左侧创建第一个吧'}
                  </p>
                </div>
              ),
            }}
          />
        </section>

        {/* 表单区 */}
        <aside className="w-full shrink-0 lg:w-[340px] xl:w-[360px]">
          <Spin spinning={editLoading}>
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
              <header className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-strokedark">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                  <FiTag size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    {isEditing ? '编辑标签' : '新建标签'}
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {isEditing
                      ? '修改名称后保存，右侧列表会同步更新'
                      : '为文章添加语义化标签，便于检索与归档'}
                  </p>
                </div>
              </header>

              {isEditing && (
                <div className="mx-5 mt-4 flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 dark:border-primary/30 dark:bg-primary/10">
                  <span className="truncate text-sm font-medium text-primary">{tag.name}</span>
                  <button
                    type="button"
                    onClick={resetFormState}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-700 dark:hover:bg-boxdark dark:hover:text-slate-200 cursor-pointer"
                  >
                    <FiX size={14} />
                    取消
                  </button>
                </div>
              )}

              <div className="p-5 pt-2">
                <Form form={form} layout="vertical" onFinish={onSubmit} size="large" requiredMark="optional">
                  <Form.Item
                    label="标签名称"
                    name="name"
                    rules={[{ required: true, message: '标签名称不能为空' }]}
                    className="mb-4!"
                  >
                    <Input
                      placeholder="例如：React、随笔、教程"
                      allowClear
                      prefix={<FiHash className="text-slate-400" />}
                    />
                  </Form.Item>

                  <Form.Item className="mb-0!">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={btnLoading}
                      block
                      icon={isEditing ? <FiEdit2 /> : <FiPlus />}
                      className="h-11!"
                    >
                      {isEditing ? '保存修改' : '新增标签'}
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            </section>
          </Spin>
        </aside>
      </div>
    </div>
  );
}
