import { useState, useEffect, useRef } from 'react';
import { Table, Button, Tag, notification, Popconfirm, Form, Tooltip, Popover, Space, Divider } from 'antd';
import { Link } from 'react-router-dom';
import { DeleteOutlined, FormOutlined, EyeOutlined, CommentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import Title from '@/components/Title';
import { delArticleDataAPI, getArticlePagingAPI } from '@/api/article';
import { useWebStore } from '@/stores';
import type { Tag as ArticleTag } from '@/types/app/tag';
import type { Cate } from '@/types/app/cate';
import type { Article } from '@/types/app/article';
import { ColumnsType } from 'antd/es/table';

export default () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);

  const web = useWebStore((state) => state.web);

  const [current, setCurrent] = useState<number>(1);
  const [articleList, setArticleList] = useState<Article[]>([]);

  const [form] = Form.useForm();

  const getArticleList = async () => {
    try {
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }
      const { data } = await getArticlePagingAPI({ isDraft: true, pageNum: 1, pageSize: 8 });
      setArticleList(data.result);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    getArticleList();
  }, []);

  const delArticleData = async (id: number) => {
    try {
      setLoading(true);
      await delArticleDataAPI(id);
      await getArticlePagingAPI({ pageNum: 1, pageSize: 8 });
      form.resetFields();
      setCurrent(1);
      notification.success({ message: '🎉 删除文章成功' });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 分类/标签：与文章管理一致，柔和色系 + 收纳展示（默认显示前 1 个，其余 +N，悬停展示全部）
  const tagColors = ['default', 'processing', 'success', 'warning', 'cyan'] as const;
  const VISIBLE_TAG_COUNT = 1;

  const renderCollapsibleTags = <T extends { id?: number; name: string }>(list: T[], keyPrefix: string) => {
    const items = list || [];
    if (items.length === 0) return null;
    const visible = items.slice(0, VISIBLE_TAG_COUNT);
    const restCount = items.length - VISIBLE_TAG_COUNT;
    const tagList = (
      <div className="flex flex-wrap gap-1.5 max-w-[280px]">
        {items.map((item, index) => (
          <Tag key={item.id ?? index} color={tagColors[index % tagColors.length]} className="m-0! border-0!">
            {item.name}
          </Tag>
        ))}
      </div>
    );
    return (
      <div className="flex flex-wrap items-center gap-1.5 justify-start">
        {visible.map((item, index) => (
          <Tag key={`${keyPrefix}-${item.id ?? index}`} color={tagColors[index % tagColors.length]} className="m-0! border-0!">
            {item.name}
          </Tag>
        ))}
        {restCount > 0 && (
          <Popover content={tagList} trigger="hover" placement="topLeft" overlayClassName="article-tags-popover">
            <span
              className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-xs font-medium cursor-default bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-boxdark-2 dark:text-gray-400 dark:hover:bg-strokedark/80 border-0 cursor-pointer"
              role="button"
              tabIndex={0}
            >
              +{restCount}
            </span>
          </Popover>
        )}
      </div>
    );
  };

  const columns: ColumnsType<Article> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'center',
      width: 80,
      render: (text: number) => <span className="text-gray-400 dark:text-gray-500 font-mono">#{text}</span>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      render: (text: string, record: Article) => (
        <a href={`${web.url}/article/${record.id}`} target="_blank" className="hover:text-primary! line-clamp-1 text-gray-700! dark:text-gray-200! font-medium" rel="noreferrer">
          {text || <span className="text-gray-300 dark:text-gray-500 italic">暂无标题</span>}
        </a>
      ),
    },
    {
      title: '摘要',
      dataIndex: 'description',
      key: 'description',
      width: 320,
      render: (text: string) => (
        <div className="line-clamp-2 text-gray-600 dark:text-gray-300">{text || <span className="text-gray-400 dark:text-gray-500 italic">该文章暂未设置文章摘要</span>}</div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'cateList',
      key: 'cateList',
      width: 140,
      render: (cates: Cate[] = []) => renderCollapsibleTags(cates, 'cate'),
    },
    {
      title: '标签',
      dataIndex: 'tagList',
      key: 'tagList',
      width: 160,
      render: (tags: ArticleTag[] = []) => (
        <div>
          {
            tags.length > 0 ? (
              renderCollapsibleTags(tags, 'tag')
            ) : (
              <span className="text-gray-300 dark:text-gray-500 italic">暂无标签</span>
            )
          }
        </div>
      ),
    },
    {
      title: '浏览量',
      dataIndex: 'view',
      key: 'view',
      width: 100,
      align: 'center',
      render: (v: number) => (
        <span className="inline-flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-300 tabular-nums">
          <EyeOutlined className="text-gray-400 dark:text-gray-500 text-xs" />
          <span className="font-medium">{v ?? 0}</span>
        </span>
      ),
      sorter: (a: Article, b: Article) => (a.view ?? 0) - (b.view ?? 0),
      showSorterTooltip: false,
    },
    {
      title: '评论',
      dataIndex: 'comment',
      key: 'comment',
      width: 90,
      align: 'center',
      render: (v: number) => (
        <span className="inline-flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-300 tabular-nums">
          <CommentOutlined className="text-gray-400 dark:text-gray-500 text-xs" />
          <span className="font-medium">{v ?? 0}</span>
        </span>
      ),
      sorter: (a: Article, b: Article) => (a.comment ?? 0) - (b.comment ?? 0),
      showSorterTooltip: false,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      align: 'left',
      render: (text: string) => {
        if (!text) return <span className="text-gray-400 dark:text-gray-500">-</span>;
        const d = dayjs(+text);
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-700 dark:text-gray-200 font-medium">{d.format('YYYY-MM-DD')}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{d.format('HH:mm:ss')}</span>
          </div>
        );
      },
      sorter: (a: Article, b: Article) => +(a.createTime ?? 0) - +(b.createTime ?? 0),
      showSorterTooltip: false,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'center',
      width: 130,
      render: (_: string, record: Article) => (
        <Space split={<Divider type="vertical" />}>
          <Tooltip title="编辑">
            <Link to={`/create?id=${record.id}&draft=true`}>
              <Button type="text" icon={<FormOutlined className="text-primary" />} />
            </Link>
          </Tooltip>
          <Popconfirm title="警告" description="你确定要删除吗" okText="确定" cancelText="取消" onConfirm={() => delArticleData(record.id!)}>
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (initialLoading) {
    return (
      <div className="space-y-2">
        <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark">
          <div className="skeleton h-8" style={{ width: 200 }} />
        </div>
        <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex gap-4 mb-4 items-center">
              <div className="skeleton shrink-0 rounded-lg" style={{ width: 56, height: 56 }} />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="skeleton h-4 w-full rounded-sm" />
                <div className="skeleton h-3 rounded-sm" style={{ width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <Title value="草稿箱" />

      <div className="bg-white dark:bg-boxdark rounded-2xl shadow-xs border border-gray-100 dark:border-strokedark overflow-hidden">
        <Table
          rowKey="id"
          dataSource={articleList}
          columns={columns}
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            position: ['bottomRight'],
            current,
            pageSize: 8,
            total: articleList.length,
            showTotal: (totalCount) => (
              <div className="mt-[9px] text-xs text-gray-500 dark:text-gray-400">
                共 {totalCount} 条数据
              </div>
            ),
            onChange: (page) => setCurrent(page),
            className: 'px-6! py-4!',
          }}
          className="[&_.ant-table-thead>tr>th]:bg-gray-50! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-gray-500! dark:[&_.ant-table-thead>tr>th]:text-gray-400!"
        />
      </div>
    </div>
  );
};
