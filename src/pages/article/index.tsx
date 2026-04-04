import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { Table, Button, Tag, notification, Popconfirm, Form, Input, Select, message, Tooltip, Popover, Space } from 'antd';

import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import { DeleteOutlined, FormOutlined, InboxOutlined, EyeOutlined, CommentOutlined } from '@ant-design/icons';
import { HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi';
import dayjs from 'dayjs';

import Title from '@/components/Title';
import ArticleImportModal from './components/ArticleImportModal';
import ArticleExport from './components/ArticleExport';
import Skeleton from './Skeleton';

import { getCateListAPI } from '@/api/cate';
import { getTagListAPI } from '@/api/tag';
import { delArticleDataAPI, getArticlePagingAPI, addArticleDataAPI, delBatchArticleDataAPI } from '@/api/article';

import type { Tag as ArticleTag } from '@/types/app/tag';
import type { Cate as ArticleCate } from '@/types/app/cate';
import type { Article, Config, ArticleFilterQueryParams, ArticleFilterDataForm } from '@/types/app/article';

import { useWebStore } from '@/stores';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';
import RangePicker from '@/components/RangePicker';

const TAG_COLORS = [
  'default',
  'processing',
  'success',
  'warning',
  'cyan',
] as const;

const VISIBLE_TAG_COUNT = 1;

const ARTICLE_STATUS_LABEL: Record<string, string> = {
  1: '正常显示',
  2: '首页隐藏',
  3: '全站隐藏',
};

const ARTICLE_STATUS_COLOR: Record<string, string> = {
  1: 'success',
  2: 'warning',
  3: 'default',
};

function renderCollapsibleTags<T extends { id?: number; name: string }>(
  list: T[],
  keyPrefix: string,
) {
  if (list.length === 0) return null;
  const visible = list.slice(0, VISIBLE_TAG_COUNT);
  const restCount = list.length - VISIBLE_TAG_COUNT;
  const items = (
    <div className="flex flex-wrap gap-1.5 max-w-[280px]">
      {list.map((item, index) => (
        <Tag
          key={item.id ?? index}
          color={TAG_COLORS[index % TAG_COLORS.length]}
          className="m-0! border-0!"
        >
          {item.name}
        </Tag>
      ))}
    </div>
  );
  return (
    <div className="flex flex-wrap items-center gap-1.5 justify-start">
      {visible.map((item, index) => (
        <Tag
          key={`${keyPrefix}-${item.id ?? index}`}
          color={TAG_COLORS[index % TAG_COLORS.length]}
          className="m-0! border-0!"
        >
          {item.name}
        </Tag>
      ))}

      {restCount > 0 && (
        <Popover
          content={items}
          trigger="hover"
          placement="topLeft"
          classNames={{ root: 'article-tags-popover' }}
        >
          <span
            className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-boxdark-2 dark:text-gray-400 dark:hover:bg-strokedark/80 border-0 cursor-pointer"
            role="button"
            tabIndex={0}
          >
            +{restCount}
          </span>
        </Popover>
      )}
    </div>
  );
}

function renderArticleStatusCell(config: Config) {
  const hasPassword = Boolean(config.password?.trim());
  const label = hasPassword ? '文章加密' : ARTICLE_STATUS_LABEL[config.status];
  const color = hasPassword ? 'processing' : ARTICLE_STATUS_COLOR[config.status] ?? 'default';
  return <Tag color={color} className="m-0! border-0! whitespace-nowrap">{label}</Tag>;
}

const sortArticleByView = (a: Article, b: Article) => (a.view ?? 0) - (b.view ?? 0);
const sortArticleByComment = (a: Article, b: Article) => (a.comment ?? 0) - (b.comment ?? 0);

/** 批量导入时每批并发提交篇数，批内并行、批间顺序，减轻服务端压力 */
const IMPORT_ARTICLE_CONCURRENCY = 5;

export default () => {
  const [loading, setLoading] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [form] = Form.useForm();
  const web = useWebStore((state) => state.web);
  const [articleList, setArticleList] = useState<Article[]>([]);

  const [total, setTotal] = useState<number>(0);

  const [filter, setFilter] = useState<ArticleFilterQueryParams>();
  const [showBatchActions, setShowBatchActions] = useState<boolean>(false);

  // 分页获取文章
  const getArticleList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getArticlePagingAPI(filter);
      setTotal(data.total);
      setArticleList(data.result);
    } catch (error) {
      console.error('获取文章列表失败：', error);
    } finally {
      setSkeletonLoading(false);
      setLoading(false);
    }
  }, [filter]);

  const delArticleData = useCallback(
    async (id: number) => {
      try {
        setBtnLoading(true);
        await delArticleDataAPI(id, true);
        await getArticleList();
        notification.success({ message: '删除成功' });
      } catch (error) {
        console.error('删除文章失败：', error);
      } finally {
        setBtnLoading(false);
      }
    },
    [getArticleList],
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
              <Tooltip title={text} placement="topLeft">
                <a
                  href={`${web.url}/article/${record.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="max-w-[280px] truncate block text-gray-700 dark:text-gray-200 font-medium hover:text-primary dark:hover:text-primary"
                >
                  {text}
                </a>
              </Tooltip>
            )
              : (
                <span className="text-gray-300 dark:text-gray-500 italic">暂无标题</span>
              )
            }
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
              <Tooltip title={text}>
                <div className="max-w-[320px] truncate text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary cursor-pointer">
                  {text}
                </div>
              </Tooltip>
            ) : (
              <span className="text-gray-300 dark:text-gray-500 italic">暂无</span>
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
        render: (tags: ArticleTag[]) => renderCollapsibleTags(tags || [], 'tag'),
      },
      {
        title: '浏览量',
        dataIndex: 'view',
        key: 'view',
        width: 100,
        render: (v) => (
          <span className="inline-flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-300 tabular-nums">
            <EyeOutlined className="text-gray-400 dark:text-gray-500 text-xs" />
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
          <span className="inline-flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-300 tabular-nums">
            <CommentOutlined className="text-gray-400 dark:text-gray-500 text-xs" />
            <span className="font-medium">{v ?? 0}</span>
          </span>
        ),
        sorter: sortArticleByComment,
        showSorterTooltip: false,
      },
      {
        title: '状态',
        dataIndex: 'config',
        key: 'config',
        width: 130,
        render: (config: Config) => renderArticleStatusCell(config),
      },
      {
        title: '发布时间',
        dataIndex: 'createTime',
        key: 'createTime',
        render: (date: number) => (
          <div className="flex flex-col">
            <span className="text-gray-700 dark:text-gray-200 font-medium">{dayjs(date).format('YYYY-MM-DD')}</span>
            <span className="text-gray-400 dark:text-gray-500 text-xs">{dayjs(date).format('HH:mm:ss')}</span>
          </div>
        ),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 130,
        align: 'center',
        render: (_, record: Article) => (
          <div className="flex items-center justify-center">
            <ArticleExport.Single article={record} />

            <Tooltip title="编辑">
              <Link to={`/create?id=${record.id}`}>
                <Button
                  type="text"
                  icon={<FormOutlined className="text-blue-500" />}
                  className="text-blue-500 dark:text-gray-300 dark:hover:text-blue-500! hover:bg-blue-50 dark:hover:bg-blue-900/20"
                />
              </Link>
            </Tooltip>

            <Tooltip title="删除">
              <Popconfirm
                title="删除确认"
                description="该操作可从回收站恢复，确定删除吗？"
                okText="删除"
                okButtonProps={{ danger: true }}
                cancelText="取消"
                onConfirm={() => delArticleData(record.id!)}
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
    [web.url, btnLoading, delArticleData],
  );

  const { onValuesChange: onFilterChange } =
    useDebouncedChange<ArticleFilterDataForm>({
      debouncedKeys: ['title'],
      debounceMs: 400,
      getValues: () => form.getFieldsValue() as ArticleFilterDataForm,
      onApply: (values) => {
        setFilter((prev) => ({
          ...prev,
          title: values.title,
          cateId: values.cateId,
          tagId: values.tagId,
          startDate: values.createTime?.[0] ? values.createTime[0].valueOf() : undefined,
          endDate: values.createTime?.[1] ? values.createTime[1].valueOf() : undefined,
        }));
      },
    });

  const [cateList, setCateList] = useState<ArticleCate[]>([]);
  const [tagList, setTagList] = useState<ArticleTag[]>([]);

  const getCateList = async () => {
    const { data } = await getCateListAPI();
    setCateList(data.result.filter((item: ArticleCate) => item.type === 'cate'));
  };

  const getTagList = async () => {
    const { data } = await getTagListAPI();
    setTagList(data.result);
  };

  // 导入文章：收集文件后调用，仅负责解析与提交
  const handleArticleImport = async (files: File[]) => {
    const articles: Article[] = [];

    for (const file of files) {
      const text = await file.text();
      if (file.name.endsWith('.md')) {
        const article = parseMarkdownToArticle(text);
        articles.push(article);
      } else if (file.name.endsWith('.json')) {
        const json = JSON.parse(text);
        articles.push(...parseJsonToArticles(json));
      }
    }

    if (articles.length === 0) {
      notification.error({ message: '解析失败，未提取出有效文章数据' });
      return;
    }

    try {
      for (let i = 0; i < articles.length; i += IMPORT_ARTICLE_CONCURRENCY) {
        const batch = articles.slice(i, i + IMPORT_ARTICLE_CONCURRENCY);
        await Promise.all(
          batch.map(async (article) => {
            try {
              const { code } = await addArticleDataAPI(article);
              if (code === 200) message.success(`${article.title}--导入成功~`);
            } catch (error) {
              console.error(error);
              message.error(`${article.title}--导入失败~`);
            }
          }),
        );
      }
      await getArticleList();
      notification.success({ message: `🎉 成功导入 ${articles.length} 篇文章` });
    } catch (err) {
      console.error(err);
      notification.error({ message: '导入失败，请检查文件格式或控制台报错' });
      throw err;
    }
  };

  const getTagOrCateIdsByNames = (names: string[], allTags: ArticleTag[] | ArticleCate[]) => {
    const lowerCaseMap = new Map<string, number>();

    // 忽略大小写
    for (const item of allTags) {
      lowerCaseMap.set(item.name.toLowerCase(), item.id as number);
    }

    return (
      names
        .map((name) => lowerCaseMap.get(name.toLowerCase()))
        // 去除未匹配项
        .filter((id): id is number => id !== undefined)
    );
  };

  // 从 markdown 字符串解析为 Article JSON
  const parseMarkdownToArticle = (mdText: string): Article => {
    // 提取 frontmatter 块
    const frontmatterMatch = mdText.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) throw new Error('Markdown 文件格式错误，缺少 frontmatter');

    const frontmatterText = frontmatterMatch[1];
    // 去除 frontmatter 后的正文
    const content = mdText.replace(frontmatterMatch[0], '').trim();

    const meta: Record<string, string> = {};

    // 解析 frontmatter 每一行 key: value
    frontmatterText.split('\n').forEach((line) => {
      const [key, ...rest] = line.split(':');
      meta[key.trim()] = rest.join(':').trim();
    });

    // 时间戳（从 YYYY-MM-DD HH:mm:ss 转为毫秒时间戳）
    const parseDateToTimestamp = (str: string): number => {
      const d = new Date(str);
      if (isNaN(d.getTime())) return Date.now();
      return d.getTime();
    };
    const tagNames = meta.tags?.split(/\s+/).filter(Boolean) || [];
    const tagIds = getTagOrCateIdsByNames(tagNames, tagList);
    const cateNames = meta.categories?.split(/\s+/).filter(Boolean) || [];
    const cateIds = getTagOrCateIdsByNames(cateNames, cateList);

    const article: Article = {
      title: meta.title || '未命名文章',
      description: meta.description || '',
      content,
      cover: meta.cover || '',
      createTime: parseDateToTimestamp(meta.date || ''),
      cateIds,
      tagIds,
      config: {
        status: 1,
        password: '',
        isDraft: false,
        isEncrypt: false,
        isDel: false,
      },
    };

    return article;
  };

  // 解析 JSON 内容为文章数据列表
  const parseJsonToArticles = (raw: Article | Article[]): Article[] => {
    const parseSingle = (item: Article): Article => ({
      title: item.title || '未命名文章',
      description: item.description || '',
      content: item.content || '',
      cover: item.cover || '',
      createTime: item.createTime,
      cateIds: (item.cateList || []).map((cate) => cate.id).filter((id): id is number => id !== undefined),
      tagIds: (item.tagList || []).map((tag) => tag.id).filter((id): id is number => id !== undefined),
      config: {
        status: item.config?.status || 1,
        password: item.config?.password || '',
        isDraft: item.config?.isDraft || false,
        isEncrypt: item.config?.isEncrypt || false,
        isDel: item.config?.isDel || false,
      },
    });

    // 如果是数组则批量解析，否则解析单个
    return Array.isArray(raw) ? raw.map(parseSingle) : [parseSingle(raw)];
  };

  // 删除选中
  const delSelected = async () => {
    if (!selectedRowKeys.length) {
      message.warning('请选择要删除的文章');
      return;
    }

    try {
      setBatchDeleteLoading(true);
      const { code } = await delBatchArticleDataAPI(selectedRowKeys as number[]);
      if (code === 200) {
        message.success('删除成功');
        setSelectedRowKeys([]);
        setFilter((prev) => ({ ...prev, pageNum: 1 }));
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  // 选择行
  const rowSelection: TableRowSelection<Article> = {
    selectedRowKeys,
    onChange: onSelectChange,
    fixed: 'left',
  };

  // 导出全部时拉取所有文章
  const loadAllArticles = async (): Promise<Article[]> => {
    const { data } = await getArticlePagingAPI();
    return data.result;
  };

  useEffect(() => {
    getArticleList();
  }, [getArticleList]);

  useEffect(() => {
    void Promise.all([getCateList(), getTagList()]);
  }, []);

  // 首屏骨架（与部门管理 Skeleton 用法一致）
  if (skeletonLoading) {
    return (
      <Skeleton />
    );
  }

  return (
    <div className="mx-auto">
      <Title value="文章管理" />

      <div className="bg-white dark:bg-boxdark rounded-2xl shadow-xs border border-gray-100 dark:border-strokedark overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-strokedark bg-gray-50/30 dark:bg-boxdark-2/50 space-y-4">
          <Form form={form} layout="inline" onValuesChange={onFilterChange} className="flex! flex-wrap! items-center! gap-y-2.5!">
            <Form.Item name="title" className="mb-0!">
              <Input
                placeholder="搜索文章标题..."
                className="w-[220px]!"
                allowClear
              />
            </Form.Item>

            <Form.Item name="cateId" className="mb-0!">
              <Select
                allowClear
                options={cateList}
                fieldNames={{ label: 'name', value: 'id' }}
                placeholder="选择分类"
                className="w-[160px]!"
              />
            </Form.Item>

            <Form.Item name="tagId" className="mb-0!">
              <Select
                allowClear
                showSearch
                options={tagList}
                fieldNames={{ label: 'name', value: 'id' }}
                placeholder="选择标签"
                className="w-[140px]!"
                filterOption={(input, option) => (option?.name ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>

            <Form.Item name="createTime" className="mb-0!">
              <RangePicker
                className="w-[260px]!"
                placeholder={['开始日期', '结束日期']}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>

            <Space className="sm:flex-nowrap">
              <Button
                icon={showBatchActions ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                onClick={() => setShowBatchActions((v) => !v)}
              >
                {showBatchActions ? '收起' : '功能'}
              </Button>
            </Space>
          </Form>

          {showBatchActions && (
            <div className="flex justify-between items-center pt-2 mt-2! border-t border-gray-100 dark:border-strokedark gap-2">
              <div></div>

              <div className="flex space-x-3">
                <ArticleExport.Dropdown
                  selectedArticles={articleList.filter((a) => selectedRowKeys.includes(a.id as number))}
                  onLoadAll={loadAllArticles}
                  exportLoading={exportLoading}
                  setExportLoading={setExportLoading}
                />

                <Button type="primary" icon={<InboxOutlined />} onClick={() => setIsModalOpen(true)}>
                  导入文章
                </Button>
                <Popconfirm title="警告" description="你确定要删除选中的文章吗？" okText="确定" cancelText="取消" onConfirm={() => delSelected()}>
                  <Button danger icon={<DeleteOutlined />} loading={batchDeleteLoading}>
                    删除选中
                  </Button>
                </Popconfirm>
              </div>
            </div>
          )}
        </div>

        <Table
          rowKey="id"
          rowSelection={rowSelection}
          dataSource={articleList}
          columns={columns}
          loading={loading}
          pagination={{
            position: ['bottomRight'],
            current: filter?.pageNum,
            pageSize: filter?.pageSize,
            total,
            showTotal: (totalCount) => (
              <div className="mt-[9px] text-xs text-gray-500 dark:text-gray-400">
                当前第 {filter?.pageNum ?? 1} / {Math.ceil(totalCount / (filter?.pageSize ?? 8))} 页 | 共 {totalCount} 条数据
              </div>
            ),
            onChange: (page, size) => setFilter((prev) => ({ ...prev, pageNum: page, pageSize: size ?? prev?.pageSize ?? 8 })),
            onShowSizeChange: (_, size) => setFilter((prev) => ({ ...prev, pageNum: 1, pageSize: size ?? prev?.pageSize ?? 8 })),
            className: 'px-6!',
          }}
          className="[&_.ant-table-thead>tr>th]:bg-gray-50! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-gray-500! dark:[&_.ant-table-thead>tr>th]:text-gray-400!"
          scroll={{ x: 1480 }}
        />
      </div>

      <ArticleImportModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImport={handleArticleImport}
      />
    </div>
  );
};
