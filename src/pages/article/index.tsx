import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { Table, Button, Tag, notification, Popconfirm, Form, Input, Select, DatePicker, message, Tooltip, Space, Divider, Popover } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import { DeleteOutlined, FormOutlined, InboxOutlined, SearchOutlined, ClearOutlined, EyeOutlined, CommentOutlined } from '@ant-design/icons';
import { HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi';
import dayjs from 'dayjs';

import Title from '@/components/Title';
import ArticleImportModal from './components/ArticleImportModal';
import ArticleExport from './components/ArticleExport';

import { getCateListAPI } from '@/api/cate';
import { getTagListAPI } from '@/api/tag';
import { delArticleDataAPI, getArticlePagingAPI, addArticleDataAPI, delBatchArticleDataAPI } from '@/api/article';

import type { Tag as ArticleTag } from '@/types/app/tag';
import type { Cate as ArticleCate } from '@/types/app/cate';
import type { Article, Config, ArticleFilterQueryParams, ArticleFilterDataForm } from '@/types/app/article';

import { useWebStore } from '@/stores';

const { RangePicker } = DatePicker;

export default () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [btnLoading, setBtnLoading] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const isFirstLoadRef = useRef<boolean>(true);
  const filterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form] = Form.useForm();
  const web = useWebStore((state) => state.web);
  const [articleList, setArticleList] = useState<Article[]>([]);

  const [total, setTotal] = useState<number>(0);

  const [filter, setFilter] = useState<ArticleFilterQueryParams>({
    key: undefined,
    cateId: undefined,
    tagId: undefined,
    isDraft: false,
    isDel: false,
    startDate: undefined,
    endDate: undefined,
    pageNum: 1,
    pageSize: 8,
  });
  const [showBatchActions, setShowBatchActions] = useState<boolean>(false);

  // 分页获取文章
  const getArticleList = async () => {
    try {
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getArticlePagingAPI(filter);
      setTotal(data.total);
      setArticleList(data.result);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  const delArticleData = async (id: number) => {
    try {
      setBtnLoading(id);
      await delArticleDataAPI(id, true);
      await getArticleList();
      notification.success({ message: '删除成功' });
    } catch (error) {
      console.error(error);
    } finally {
      setBtnLoading(null);
    }
  };

  // 分类/标签：柔和色系，收纳展示（默认显示前 2 个，其余 +N，悬停展示全部）
  const tagColors = [
    'default',
    'processing',
    'success',
    'warning',
    'cyan',
  ] as const;
  const VISIBLE_TAG_COUNT = 1;

  const renderCollapsibleTags = <T extends { id?: number; name: string }>(
    list: T[],
    keyPrefix: string,
  ) => {
    if (list.length === 0) return null;
    const visible = list.slice(0, VISIBLE_TAG_COUNT);
    const restCount = list.length - VISIBLE_TAG_COUNT;
    const items = (
      <div className="flex flex-wrap gap-1.5 max-w-[280px]">
        {list.map((item, index) => (
          <Tag
            key={item.id ?? index}
            color={tagColors[index % tagColors.length]}
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
            color={tagColors[index % tagColors.length]}
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
  };

  const columns: ColumnsType<Article> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      align: 'center',
      render: (text) => <span className="text-gray-400 dark:text-gray-500 font-mono">#{text}</span>,
    },
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
            <span className="text-gray-300 dark:text-gray-500 italic">暂无摘要</span>
          )}
        </>
      ),
    },
    {
      title: '分类',
      dataIndex: 'cateList',
      key: 'cateList',
      width: 140,
      render: (cates: ArticleCate[]) => renderCollapsibleTags(cates || [], 'cate'),
    },
    {
      title: '标签',
      dataIndex: 'tagList',
      key: 'tagList',
      width: 160,
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
      sorter: (a: Article, b: Article) => (a.view ?? 0) - (b.view ?? 0),
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
      sorter: (a: Article, b: Article) => (a.comment ?? 0) - (b.comment ?? 0),
      showSorterTooltip: false,
    },
    {
      title: '状态',
      dataIndex: 'config',
      key: 'config',
      width: 130,
      align: 'center',
      render: (config: Config) => {
        const statusMap: Record<string, string> = {
          1: '正常',
          2: '首页隐藏',
          3: '全站隐藏',
        };
        const label = config.password?.trim() ? '文章加密' : statusMap[config.status];
        const statusColorMap: Record<string, string> = {
          1: 'success',
          2: 'warning',
          3: 'default',
        };
        const color = config.password?.trim() ? 'processing' : statusColorMap[config.status] ?? 'default';
        return <Tag color={color} className="m-0! border-0! whitespace-nowrap">{label}</Tag>;
      },
    },
    {
      title: '发布时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 140,
      render: (text: string) => (
        <div className="flex flex-col">
          <span className="text-gray-700 dark:text-gray-200 font-medium">{dayjs(+text).format('YYYY-MM-DD')}</span>
          <span className="text-gray-400 dark:text-gray-500 text-xs">{dayjs(+text).format('HH:mm:ss')}</span>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 165,
      align: 'center',
      render: (_, record: Article) => (
        <Space separator={<Divider orientation="vertical" />}>
          <ArticleExport.Single article={record} />

          <Tooltip title="编辑">
            <Link to={`/create?id=${record.id}`}>
              <Button
                type="text"
                size="small"
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
                size="small"
                danger
                loading={btnLoading === record.id}
                icon={<DeleteOutlined />}
                className="hover:bg-red-50 dark:hover:bg-red-900/20"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const applyFormValuesToFilter = (values: ArticleFilterDataForm) => {
    setFilter((prev) => ({
      ...prev,
      key: values.title,
      cateId: values.cateId,
      tagId: values.tagId,
      startDate: values.createTime?.[0] ? String(values.createTime[0].valueOf()) : undefined,
      endDate: values.createTime?.[1] ? String(values.createTime[1].valueOf()) : undefined,
      pageNum: 1,
      pageSize: prev.pageSize ?? 8,
    }));
  };

  const onFilterValuesChange = (_: Partial<ArticleFilterDataForm>, allValues: ArticleFilterDataForm) => {
    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current);
      filterDebounceRef.current = null;
    }
    const hasTitleChange = 'title' in (_ as Partial<ArticleFilterDataForm>);
    if (hasTitleChange) {
      filterDebounceRef.current = setTimeout(() => applyFormValuesToFilter(allValues), 400);
    } else {
      applyFormValuesToFilter(allValues);
    }
  };

  const onFilterReset = () => {
    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current);
      filterDebounceRef.current = null;
    }
    form.resetFields();
    setFilter({
      pageNum: 1,
      pageSize: 8,
      key: undefined,
      cateId: undefined,
      tagId: undefined,
      isDraft: false,
      isDel: false,
      startDate: undefined,
      endDate: undefined,
    });
  };

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
      setLoading(true);
      for (const article of articles) {
        try {
          const { code } = await addArticleDataAPI(article);
          if (code === 200) message.success(`${article.title}--导入成功~`);
        } catch (error) {
          console.error(error);
          message.error(`${article.title}--导入失败~`);
        }
      }
      await getArticleList();
      notification.success({ message: `🎉 成功导入 ${articles.length} 篇文章` });
    } catch (err) {
      console.error(err);
      notification.error({ message: '导入失败，请检查文件格式或控制台报错' });
      throw err;
    } finally {
      setLoading(false);
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

    // 时间戳（从 YYYY-MM-DD HH:mm:ss 转为 timestamp）
    const parseDateToTimestamp = (str: string): string => {
      const d = new Date(str);
      if (isNaN(d.getTime())) return Date.now().toString();
      return d.getTime().toString();
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
      setLoading(true);
      const { code } = await delBatchArticleDataAPI(selectedRowKeys as number[]);
      if (code === 200) {
        message.success('删除成功');
        await getArticlePagingAPI({ pageNum: 1, pageSize: 8 });
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
  }, [filter]);

  useEffect(() => {
    getCateList();
    getTagList();
  }, []);

  // 自定义骨架屏
  if (initialLoading) {
    return (
      <div className="space-y-2">
        <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark">
          <div className="skeleton h-8" style={{ width: 200 }} />
        </div>

        <div className="px-6 py-3 bg-white dark:bg-boxdark rounded-xl shadow-xs border border-gray-100 dark:border-strokedark">
          <div className="flex justify-between mb-6">
            <div className="flex gap-4 flex-wrap">
              <div className="skeleton h-9" style={{ width: 200 }} />
              <div className="skeleton h-9" style={{ width: 180 }} />
              <div className="skeleton h-9" style={{ width: 180 }} />
              <div className="skeleton h-9" style={{ width: 280 }} />
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-9 rounded-md" style={{ width: 80 }} />
              <div className="skeleton h-9 rounded-md" style={{ width: 80 }} />
            </div>
          </div>

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
      <Title value="文章管理" />

      <div className="bg-white dark:bg-boxdark rounded-2xl shadow-xs border border-gray-100 dark:border-strokedark overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-strokedark bg-gray-50/30 dark:bg-boxdark-2/50 space-y-4">
          {/* 筛选区：搜索条件 + 查询/重置 */}
          <Form form={form} layout="inline" onValuesChange={onFilterValuesChange} className="flex! flex-wrap! items-center! gap-y-2.5!">
            <Form.Item name="title" className="mb-0!">
              <Input
                prefix={<SearchOutlined className="text-gray-400 dark:text-gray-500" />}
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
              <Button icon={<ClearOutlined />} onClick={onFilterReset}>
                重置
              </Button>
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
                  setLoading={setLoading}
                />

                <Button type="primary" icon={<InboxOutlined />} onClick={() => setIsModalOpen(true)}>
                  导入文章
                </Button>
                <Popconfirm title="删除确认" description="确定要删除选中的文章吗？" okText="删除" okButtonProps={{ danger: true }} cancelText="取消" onConfirm={() => delSelected()}>
                  <Button danger icon={<DeleteOutlined />}>删除选中</Button>
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
            current: filter.pageNum,
            pageSize: filter.pageSize,
            total,
            showTotal: (totalCount) => (
              <div className="mt-[9px] text-xs text-gray-500 dark:text-gray-400">
                当前第 {filter.pageNum} / {Math.ceil(totalCount / (filter.pageSize || 8))} 页 | 共 {totalCount} 条数据
              </div>
            ),
            onChange: (page, size) => setFilter((prev) => ({ ...prev, pageNum: page, pageSize: size || prev.pageSize })),
            onShowSizeChange: (_, size) => setFilter((prev) => ({ ...prev, pageNum: 1, pageSize: size })),
            className: 'px-6! py-4!',
          }}
          className="[&_.ant-table-thead>tr>th]:bg-gray-50! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-gray-500! dark:[&_.ant-table-thead>tr>th]:text-gray-400!"
          scroll={{ x: 1400 }}
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
