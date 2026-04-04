import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { Table, Button, notification, Popconfirm, Form, Input, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, FormOutlined, EyeOutlined, CommentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import Title from '@/components/Title';
import RangePicker from '@/components/RangePicker';
import Skeleton from '../article/Skeleton';

import { delArticleDataAPI, getArticlePagingAPI } from '@/api/article';
import { useWebStore } from '@/stores';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';

import type { Tag as ArticleTag } from '@/types/app/tag';
import type { Cate as ArticleCate } from '@/types/app/cate';
import type { Article, ArticleFilterDataForm, ArticleFilterQueryParams } from '@/types/app/article';

import {
  renderCollapsibleTags,
  sortArticleByComment,
  sortArticleByCreateTime,
  sortArticleByView,
} from '../article/articleTableShared';

const DEFAULT_PAGE_SIZE = 8;

export default () => {
  const [loading, setLoading] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

  const [form] = Form.useForm();
  const web = useWebStore((state) => state.web);
  const [draftList, setDraftList] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);

  const [filter, setFilter] = useState<ArticleFilterQueryParams>({
    isDraft: true,
    pageNum: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const getDraftList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getArticlePagingAPI({
        ...filter,
        isDraft: true,
      });
      setTotal(data.total);
      setDraftList(data.result);
    } catch (error) {
      console.error('获取草稿列表失败：', error);
    } finally {
      setSkeletonLoading(false);
      setLoading(false);
    }
  }, [filter]);

  const deleteDraft = useCallback(
    async (id: number) => {
      try {
        setBtnLoading(true);
        await delArticleDataAPI(id, true);
        await getDraftList();
        notification.success({ message: '删除成功' });
      } catch (error) {
        console.error('删除草稿失败：', error);
      } finally {
        setBtnLoading(false);
      }
    },
    [getDraftList],
  );

  const columns: ColumnsType<Article> = useMemo(
    () => [
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        width: 280,
        render: (text: string, record: Article) => (
          <>
            {text ? (
              <Tooltip placement="topLeft" title={text}>
                <a
                  href={`${web.url}/article/${record.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="max-w-[280px] truncate block text-gray-700 dark:text-gray-200 font-medium hover:text-primary dark:hover:text-primary"
                >
                  {text}
                </a>
              </Tooltip>
            ) : (
              <span className="text-gray-300 italic dark:text-gray-500">暂无标题</span>
            )}
          </>
        ),
      },
      {
        title: '摘要',
        dataIndex: 'description',
        key: 'description',
        width: 320,
        render: (text: string) => (
          <>
            {text ? (
              <Tooltip placement="topLeft" title={text}>
                <div className="max-w-[320px] truncate cursor-pointer text-gray-700 hover:text-primary dark:text-gray-200 dark:hover:text-primary">
                  {text}
                </div>
              </Tooltip>
            ) : (
              <span className="text-gray-300 italic dark:text-gray-500">暂无</span>
            )}
          </>
        ),
      },
      {
        title: '分类',
        dataIndex: 'cateList',
        key: 'cateList',
        width: 150,
        render: (cates: ArticleCate[]) => renderCollapsibleTags(cates || [], 'cate'),
      },
      {
        title: '标签',
        dataIndex: 'tagList',
        key: 'tagList',
        width: 130,
        render: (tags: ArticleTag[]) =>
          tags?.length ? (
            renderCollapsibleTags(tags, 'tag')
          ) : (
            <span className="text-gray-300 italic dark:text-gray-500">暂无标签</span>
          ),
      },
      {
        title: '浏览量',
        dataIndex: 'view',
        key: 'view',
        width: 100,
        render: (v) => (
          <span className="inline-flex items-center justify-center gap-1.5 text-gray-600 tabular-nums dark:text-gray-300">
            <EyeOutlined className="text-xs text-gray-400 dark:text-gray-500" />
            <span className="font-medium">{v ?? 0}</span>
          </span>
        ),
        sorter: sortArticleByView,
        showSorterTooltip: false,
      },
      {
        title: '评论',
        dataIndex: 'comment',
        key: 'comment',
        width: 90,
        render: (v) => (
          <span className="inline-flex items-center justify-center gap-1.5 text-gray-600 tabular-nums dark:text-gray-300">
            <CommentOutlined className="text-xs text-gray-400 dark:text-gray-500" />
            <span className="font-medium">{v ?? 0}</span>
          </span>
        ),
        sorter: sortArticleByComment,
        showSorterTooltip: false,
      },
      {
        title: '创建时间',
        dataIndex: 'createTime',
        key: 'createTime',
        render: (date: number) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-700 dark:text-gray-200">{dayjs(date).format('YYYY-MM-DD')}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{dayjs(date).format('HH:mm:ss')}</span>
          </div>
        ),
        sorter: sortArticleByCreateTime,
        showSorterTooltip: false,
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 110,
        align: 'center',
        render: (_, record: Article) => (
          <div className="flex items-center justify-center gap-0.5">
            <Tooltip title="编辑">
              <Link to={`/create?id=${record.id}&draft=true`}>
                <Button
                  type="text"
                  icon={<FormOutlined className="text-blue-500" />}
                  className="text-blue-500 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-500!"
                />
              </Link>
            </Tooltip>

            <Tooltip title="删除">
              <Popconfirm
                title="删除确认"
                description="确定删除该草稿吗？删除后可在回收站恢复。"
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                onConfirm={() => deleteDraft(record.id!)}
              >
                <Button
                  type="text"
                  danger
                  loading={btnLoading}
                  icon={<DeleteOutlined />}
                  className="hover:bg-red-50 dark:hover:bg-red-900/20"
                />
              </Popconfirm>
            </Tooltip>
          </div>
        ),
      },
    ],
    [web.url, btnLoading, deleteDraft],
  );

  const { onValuesChange: onFilterChange } = useDebouncedChange<ArticleFilterDataForm>({
    debouncedKeys: ['title'],
    debounceMs: 400,
    getValues: () => form.getFieldsValue() as ArticleFilterDataForm,
    onApply: (values) => {
      setFilter((prev) => ({
        ...prev,
        isDraft: true,
        pageNum: 1,
        title: values.title,
        startDate: values.createTime?.[0] ? values.createTime[0].valueOf() : undefined,
        endDate: values.createTime?.[1] ? values.createTime[1].valueOf() : undefined,
      }));
    },
  });

  useEffect(() => {
    getDraftList();
  }, [getDraftList]);

  if (skeletonLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title value="草稿箱" />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs dark:border-strokedark dark:bg-boxdark">
        <div className="shrink-0 border-b border-gray-100 bg-gray-50/30 p-5 dark:border-strokedark dark:bg-boxdark-2/50">
          <Form form={form} layout="inline" onValuesChange={onFilterChange} className="flex! flex-wrap! items-center! gap-y-2.5!">
            <Form.Item name="title" className="mb-0!">
              <Input placeholder="搜索标题..." className="w-[220px]!" allowClear />
            </Form.Item>

            <Form.Item name="createTime" className="mb-0!">
              <RangePicker />
            </Form.Item>
          </Form>
        </div>

        <div className="min-h-0 flex-1">
          <Table
            rowKey="id"
            dataSource={draftList}
            columns={columns}
            loading={loading}
            pagination={{
              position: ['bottomRight'],
              current: filter.pageNum,
              pageSize: filter.pageSize,
              total,
              showTotal: (totalCount) => (
                <div className="mt-[9px] text-xs text-gray-500 dark:text-gray-400">
                  当前第 {filter.pageNum ?? 1} / {Math.ceil(totalCount / (filter.pageSize ?? DEFAULT_PAGE_SIZE))} 页 | 共{' '}
                  {totalCount} 条数据
                </div>
              ),
              onChange: (page, size) =>
                setFilter((prev) => ({
                  ...prev,
                  pageNum: page,
                  pageSize: size ?? prev.pageSize ?? DEFAULT_PAGE_SIZE,
                })),
              onShowSizeChange: (_, size) =>
                setFilter((prev) => ({
                  ...prev,
                  pageNum: 1,
                  pageSize: size ?? prev.pageSize ?? DEFAULT_PAGE_SIZE,
                })),
              className: 'px-6!',
            }}
            className="[&_.ant-table-thead>tr>th]:bg-gray-50! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-gray-500! dark:[&_.ant-table-thead>tr>th]:text-gray-400!"
            scroll={{ x: 1480 }}
          />
        </div>
      </div>
    </div>
  );
};
