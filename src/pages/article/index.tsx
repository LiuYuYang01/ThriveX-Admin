import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';

import {
  Table,
  Button,
  notification,
  Popconfirm,
  Form,
  Input,
  Select,
  message,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import {
  FiFileText,
  FiSearch,
  FiEye,
  FiMessageSquare,
  FiEdit2,
  FiTrash2,
  FiUpload,
  FiPlus,
  FiExternalLink,
  FiLock,
  FiCalendar,
  FiCheckSquare,
  FiRotateCcw,
} from 'react-icons/fi';
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

import { renderCollapsibleTags, sortArticleByComment, sortArticleByView } from './articleTableShared';

const ARTICLE_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  1: {
    label: '正常显示',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  2: {
    label: '首页隐藏',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  },
  3: {
    label: '全站隐藏',
    className: 'bg-slate-100 text-slate-600 dark:bg-boxdark-2 dark:text-slate-400',
  },
};

function renderArticleStatusCell(config: Config) {
  const hasPassword = Boolean(config.password?.trim());
  if (hasPassword) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
        <FiLock size={11} />
        文章加密
      </span>
    );
  }
  const meta = ARTICLE_STATUS_META[config.status] ?? ARTICLE_STATUS_META['3'];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${meta.className}`}>
      {meta.label}
    </span>
  );
}

const IMPORT_ARTICLE_CONCURRENCY = 5;

export default function ArticlePage() {
  const [loading, setLoading] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form] = Form.useForm();
  const web = useWebStore((state) => state.web);
  const [articleList, setArticleList] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<ArticleFilterQueryParams>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [cateList, setCateList] = useState<ArticleCate[]>([]);
  const [tagList, setTagList] = useState<ArticleTag[]>([]);

  const selectedCount = selectedRowKeys.length;
  const pageViews = useMemo(
    () => articleList.reduce((sum, item) => sum + (item.view ?? 0), 0),
    [articleList],
  );

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
        render: (text: string, record: Article) =>
          text ? (
            <Tooltip title={text} placement="topLeft">
              <a
                href={`${web.url}/article/${record.id}`}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex max-w-[280px] items-center gap-2 truncate"
              >
                <span className="truncate font-medium text-slate-700 transition-colors group-hover:text-primary dark:text-slate-200">
                  {text}
                </span>
                <FiExternalLink
                  size={12}
                  className="shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-500"
                />
              </a>
            </Tooltip>
          ) : (
            <span className="text-xs italic text-slate-400 dark:text-slate-500">暂无标题</span>
          ),
      },
      {
        title: '摘要',
        dataIndex: 'description',
        key: 'description',
        width: 300,
        render: (text: string) =>
          text ? (
            <Tooltip title={text}>
              <p className="line-clamp-2 max-w-[300px] text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {text}
              </p>
            </Tooltip>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
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
        width: 130,
        render: (tags: ArticleTag[]) => renderCollapsibleTags(tags || [], 'tag'),
      },
      {
        title: '浏览',
        dataIndex: 'view',
        key: 'view',
        width: 96,
        render: (v) => (
          <span className="inline-flex items-center gap-1.5 tabular-nums text-slate-600 dark:text-slate-300">
            <FiEye size={13} className="text-slate-400" />
            <span className="text-sm font-medium">{v ?? 0}</span>
          </span>
        ),
        sorter: sortArticleByView,
        showSorterTooltip: false,
      },
      {
        title: '评论',
        dataIndex: 'comment',
        key: 'comment',
        width: 88,
        render: (v) => (
          <span className="inline-flex items-center gap-1.5 tabular-nums text-slate-600 dark:text-slate-300">
            <FiMessageSquare size={13} className="text-slate-400" />
            <span className="text-sm font-medium">{v ?? 0}</span>
          </span>
        ),
        sorter: sortArticleByComment,
        showSorterTooltip: false,
      },
      {
        title: '状态',
        dataIndex: 'config',
        key: 'config',
        width: 120,
        render: (config: Config) => renderArticleStatusCell(config),
      },
      {
        title: '发布时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 140,
        render: (date: number) => (
          <div className="flex gap-2 text-sm">
            <FiCalendar size={13} className="shrink-0 text-slate-400 mt-0.5" />
            <div className="flex flex-col leading-tight">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {dayjs(date).format('YYYY-MM-DD')}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {dayjs(date).format('HH:mm')}
              </span>
            </div>
          </div>
        ),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 120,
        align: 'center',
        render: (_, record: Article) => (
          <div className="flex items-center justify-center gap-0.5">
            <ArticleExport.Single article={record} />
            <Tooltip title="编辑">
              <Link
                to={`/create?id=${record.id}`}
                className="flex size-8 items-center justify-center rounded-lg text-slate-400! transition-colors hover:bg-slate-100! hover:text-primary! dark:hover:bg-white/5! dark:hover:text-primary!"
                aria-label={`编辑 ${record.title}`}
              >
                <FiEdit2 size={16} />
              </Link>
            </Tooltip>
            <Popconfirm
              title="删除文章"
              description="文章将移入回收站，可随时恢复。确定删除吗？"
              okText="删除"
              okButtonProps={{ danger: true }}
              cancelText="取消"
              onConfirm={() => delArticleData(record.id!)}
            >
              <Tooltip title="删除">
                <button
                  type="button"
                  disabled={btnLoading}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 cursor-pointer"
                  aria-label={`删除 ${record.title}`}
                >
                  <FiTrash2 size={16} />
                </button>
              </Tooltip>
            </Popconfirm>
          </div>
        ),
      },
    ],
    [web.url, btnLoading, delArticleData],
  );

  const { onValuesChange: onFilterChange } = useDebouncedChange<ArticleFilterDataForm>({
    debouncedKeys: ['title'],
    debounceMs: 400,
    getValues: () => form.getFieldsValue() as ArticleFilterDataForm,
    onApply: (values) => {
      setFilter((prev) => ({
        ...prev,
        pageNum: 1,
        title: values.title,
        cateId: values.cateId,
        tagId: values.tagId,
        startDate: values.createTime?.[0] ? values.createTime[0].valueOf() : undefined,
        endDate: values.createTime?.[1] ? values.createTime[1].valueOf() : undefined,
      }));
    },
  });

  const getCateList = async () => {
    const { data } = await getCateListAPI();
    setCateList(data.result.filter((item: ArticleCate) => item.type === 'cate'));
  };

  const getTagList = async () => {
    const { data } = await getTagListAPI();
    setTagList(data.result);
  };

  const getTagOrCateIdsByNames = (names: string[], allTags: ArticleTag[] | ArticleCate[]) => {
    const lowerCaseMap = new Map<string, number>();
    for (const item of allTags) {
      lowerCaseMap.set(item.name.toLowerCase(), item.id as number);
    }
    return names
      .map((name) => lowerCaseMap.get(name.toLowerCase()))
      .filter((id): id is number => id !== undefined);
  };

  const parseMarkdownToArticle = (mdText: string): Article => {
    const frontmatterMatch = mdText.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) throw new Error('Markdown 文件格式错误，缺少 frontmatter');

    const frontmatterText = frontmatterMatch[1];
    const content = mdText.replace(frontmatterMatch[0], '').trim();
    const meta: Record<string, string> = {};

    frontmatterText.split('\n').forEach((line) => {
      const [key, ...rest] = line.split(':');
      meta[key.trim()] = rest.join(':').trim();
    });

    const parseDateToTimestamp = (str: string): number => {
      const d = new Date(str);
      if (isNaN(d.getTime())) return Date.now();
      return d.getTime();
    };
    const tagNames = meta.tags?.split(/\s+/).filter(Boolean) || [];
    const tagIds = getTagOrCateIdsByNames(tagNames, tagList);
    const cateNames = meta.categories?.split(/\s+/).filter(Boolean) || [];
    const cateIds = getTagOrCateIdsByNames(cateNames, cateList);

    return {
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
  };

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
    return Array.isArray(raw) ? raw.map(parseSingle) : [parseSingle(raw)];
  };

  const handleArticleImport = async (files: File[]) => {
    const articles: Article[] = [];

    for (const file of files) {
      const text = await file.text();
      if (file.name.endsWith('.md')) {
        articles.push(parseMarkdownToArticle(text));
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
              if (code === 200) message.success(`${article.title} — 导入成功`);
            } catch (error) {
              console.error(error);
              message.error(`${article.title} — 导入失败`);
            }
          }),
        );
      }
      await getArticleList();
      notification.success({ message: `成功导入 ${articles.length} 篇文章` });
    } catch (err) {
      console.error(err);
      notification.error({ message: '导入失败，请检查文件格式或控制台报错' });
      throw err;
    }
  };

  const delSelected = async () => {
    if (!selectedRowKeys.length) {
      message.warning('请先勾选要删除的文章');
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

  const rowSelection: TableRowSelection<Article> = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    fixed: 'left',
  };

  const loadAllArticles = async (): Promise<Article[]> => {
    const { data } = await getArticlePagingAPI();
    return data.result;
  };

  const resetFilters = () => {
    form.resetFields();
    setFilter((prev) => ({
      pageNum: 1,
      pageSize: prev?.pageSize ?? 8,
    }));
  };

  useEffect(() => {
    void getArticleList();
  }, [getArticleList]);

  useEffect(() => {
    void Promise.all([getCateList(), getTagList()]);
  }, []);

  if (skeletonLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  const statCards = [
    {
      label: '已选',
      value: selectedCount,
      icon: FiCheckSquare,
      accent:
        selectedCount > 0
          ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300'
          : 'text-slate-500 bg-slate-100 dark:bg-boxdark-2 dark:text-slate-400',
    },
    {
      label: '文章总数',
      value: total,
      icon: FiFileText,
      accent: 'text-primary bg-primary/10 dark:bg-primary/20',
    },
    {
      label: '本页浏览量',
      value: pageViews,
      icon: FiEye,
      accent: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-300',
    }
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="文章管理">
        <Link to="/create">
          <Button type="primary" icon={<FiPlus />} className="inline-flex items-center gap-1">
            写文章
          </Button>
        </Link>
      </Title>

      <div className="mb-2 grid grid-cols-3 gap-2 sm:gap-3">
        {statCards.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-3.5 text-center sm:flex-row sm:items-center sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3.5 sm:text-left dark:border-strokedark dark:bg-boxdark"
          >
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
              <Icon size={18} />
            </div>
            <div className="flex min-w-0 flex-col items-center gap-0.5 sm:items-start sm:flex-col-reverse">
              <p className="text-xl font-semibold tabular-nums text-slate-800 dark:text-slate-100">{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <header className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
          <Form form={form} onValuesChange={onFilterChange}>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <Form.Item name="title" className="mb-0! w-full sm:w-52">
                  <Input
                    allowClear
                    placeholder="搜索标题"
                    prefix={<FiSearch className="text-slate-400" size={15} />}
                  />
                </Form.Item>
                <Form.Item name="cateId" className="mb-0! w-[calc(50%-4px)] sm:w-32">
                  <Select
                    allowClear
                    options={cateList}
                    fieldNames={{ label: 'name', value: 'id' }}
                    placeholder="分类"
                  />
                </Form.Item>
                <Form.Item name="tagId" className="mb-0! w-[calc(50%-4px)] sm:w-28">
                  <Select
                    allowClear
                    showSearch
                    options={tagList}
                    fieldNames={{ label: 'name', value: 'id' }}
                    placeholder="标签"
                    filterOption={(input, option) =>
                      (option?.name ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
                <Form.Item name="createTime" className="mb-0! w-full sm:w-auto">
                  <RangePicker
                    className="w-full sm:w-56!"
                    placeholder={['开始', '结束']}
                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                  />
                </Form.Item>
                <Tooltip title="重置筛选">
                  <Button
                    type="text"
                    icon={<FiRotateCcw size={15} />}
                    onClick={resetFilters}
                    className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  />
                </Tooltip>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 self-end xl:self-auto">
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50/80 p-1 dark:border-strokedark dark:bg-boxdark-2/50">
                  <ArticleExport.Dropdown
                    selectedArticles={articleList.filter((a) =>
                      selectedRowKeys.includes(a.id as number),
                    )}
                    onLoadAll={loadAllArticles}
                    exportLoading={exportLoading}
                    setExportLoading={setExportLoading}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<FiUpload size={15} />}
                    onClick={() => setIsModalOpen(true)}
                    className="text-slate-600 dark:text-slate-300"
                  >
                    导入
                  </Button>
                  <Popconfirm
                    title="批量删除"
                    description={
                      selectedCount > 0
                        ? `确定删除已选的 ${selectedCount} 篇文章？可从回收站恢复。`
                        : undefined
                    }
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                    disabled={selectedCount === 0}
                    onConfirm={() => void delSelected()}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger={selectedCount > 0}
                      icon={<FiTrash2 size={15} />}
                      loading={batchDeleteLoading}
                      disabled={selectedCount === 0}
                      className={selectedCount === 0 ? 'text-slate-400' : ''}
                    >
                      删除{selectedCount > 0 ? ` · ${selectedCount}` : ''}
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            </div>
          </Form>
        </header>

        <div className="min-h-0 flex-1">
          <Table
            rowKey="id"
            rowSelection={rowSelection}
            dataSource={articleList}
            columns={columns}
            loading={loading}
            scroll={{ x: 1420 }}
            pagination={{
              position: ['bottomRight'],
              current: filter?.pageNum,
              pageSize: filter?.pageSize,
              total,
              showTotal: (totalCount) => {
                const pageSize = filter?.pageSize ?? 8;
                const pageNum = filter?.pageNum ?? 1;
                const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
                return (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    第 {pageNum} / {totalPages} 页 · 共 {totalCount} 篇
                  </span>
                );
              },
              onChange: (page, size) =>
                setFilter((prev) => ({ ...prev, pageNum: page, pageSize: size ?? prev?.pageSize ?? 8 })),
              onShowSizeChange: (_, size) =>
                setFilter((prev) => ({ ...prev, pageNum: 1, pageSize: size ?? prev?.pageSize ?? 8 })),
              className: 'px-5! py-3!',
            }}
            className="min-h-0 flex-1 [&_.ant-table-thead>tr>th]:bg-slate-50! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-slate-500! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! dark:[&_.ant-table-thead>tr>th]:text-slate-400!"
            locale={{
              emptyText: (
                <div className="py-14 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2 dark:text-slate-500">
                    <FiFileText size={22} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    暂无文章，点击右上角「写文章」开始创作
                  </p>
                </div>
              ),
            }}
          />
        </div>
      </section>

      <ArticleImportModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImport={handleArticleImport}
      />
    </div>
  );
}
