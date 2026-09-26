import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Empty, Segmented, Spin, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import {
  FiActivity,
  FiAlignLeft,
  FiCheckCircle,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiImage,
  FiLink2,
  FiMap,
  FiPlay,
  FiRefreshCw,
} from 'react-icons/fi';

import Title from '@/components/Title';
import { getSeoArticleCheckAPI, getSeoLinkCheckAPI, getSeoSitemapCheckAPI } from '@/api/seo';
import type { SeoArticleCheck, SeoArticleIssue, SeoLinkCheck, SeoLinkResult, SeoSitemapCheck } from '@/types/app/seo';

// 概览统计块
const StatTile = ({ icon, label, value, danger, loading }: { icon: ReactNode; label: string; value: ReactNode; danger?: boolean; loading?: boolean }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-strokedark dark:bg-boxdark">
    <div
      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
        danger ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-300'
      }`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`truncate text-lg font-semibold ${danger ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>
        {loading ? <Spin size="small" /> : value}
      </div>
    </div>
  </div>
);

// 检查明细卡片容器
const SectionCard = ({ icon, title, desc, extra, children }: { icon: ReactNode; title: string; desc: string; extra?: ReactNode; children: ReactNode }) => (
  <section className="rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-300">{icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400">{desc}</p>
        </div>
      </div>
      {extra}
    </header>
    <div className="px-4 py-3">{children}</div>
  </section>
);

export default function SeoPage() {
  const navigate = useNavigate();

  const [metaLoading, setMetaLoading] = useState(false);
  const [sitemapLoading, setSitemapLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);

  const [meta, setMeta] = useState<SeoArticleCheck | null>(null);
  const [sitemap, setSitemap] = useState<SeoSitemapCheck | null>(null);
  const [links, setLinks] = useState<SeoLinkCheck | null>(null);
  const [linkView, setLinkView] = useState<'broken' | 'all'>('broken');

  const loadMeta = useCallback(async () => {
    try {
      setMetaLoading(true);
      const { data } = await getSeoArticleCheckAPI();
      setMeta(data);
    } catch (error) {
      console.error('文章元信息体检失败：', error);
    } finally {
      setMetaLoading(false);
    }
  }, []);

  const loadSitemap = useCallback(async () => {
    try {
      setSitemapLoading(true);
      const { data } = await getSeoSitemapCheckAPI();
      setSitemap(data);
    } catch (error) {
      console.error('sitemap 体检失败：', error);
    } finally {
      setSitemapLoading(false);
    }
  }, []);

  const loadLinks = useCallback(async () => {
    try {
      setLinkLoading(true);
      const { data } = await getSeoLinkCheckAPI();
      setLinks(data);
    } catch (error) {
      console.error('死链检测失败：', error);
    } finally {
      setLinkLoading(false);
    }
  }, []);

  // 页面加载后先跑两个快速检查，死链检测较耗时由用户手动触发
  useEffect(() => {
    void loadMeta();
    void loadSitemap();
  }, [loadMeta, loadSitemap]);

  const runAll = () => {
    void loadMeta();
    void loadSitemap();
    void loadLinks();
  };

  const runAllLoading = metaLoading || sitemapLoading || linkLoading;

  const metaColumns: ColumnsType<SeoArticleIssue> = [
    {
      title: '文章',
      dataIndex: 'title',
      render: (title: string) => <span className="text-sm">{title || '无标题'}</span>,
    },
    {
      title: '缺失项',
      key: 'missing',
      width: 150,
      render: (_: unknown, row: SeoArticleIssue) => (
        <div className="flex gap-1">
          {row.missingDescription ? <Tag color="orange">描述</Tag> : null}
          {row.missingCover ? <Tag color="orange">封面</Tag> : null}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      align: 'center',
      render: (_: unknown, row: SeoArticleIssue) => (
        <Button size="small" type="link" icon={<FiEdit3 size={13} />} onClick={() => navigate(`/create?id=${row.id}`)}>
          去修复
        </Button>
      ),
    },
  ];

  const linkColumns: ColumnsType<SeoLinkResult> = useMemo(
    () => [
      {
        title: '状态',
        dataIndex: 'ok',
        key: 'status',
        width: 90,
        render: (ok: boolean, row: SeoLinkResult) =>
          ok ? <Badge status="success" text={row.status != null ? String(row.status) : '正常'} /> : <Badge status="error" text={row.status != null ? String(row.status) : '失败'} />,
      },
      {
        title: '链接',
        dataIndex: 'url',
        key: 'url',
        render: (url: string) => (
          <a href={url} target="_blank" rel="noreferrer" className="break-all font-mono text-xs text-slate-500 hover:text-primary dark:text-slate-400">
            {url} <FiExternalLink size={11} className="inline" />
          </a>
        ),
      },
      {
        title: '说明',
        dataIndex: 'message',
        key: 'message',
        width: 240,
        render: (message?: string) => <span className="text-xs text-slate-400">{message || '—'}</span>,
      },
      {
        title: '引用文章',
        key: 'articles',
        width: 260,
        render: (_: unknown, row: SeoLinkResult) => (
          <div className="flex flex-wrap gap-1">
            {row.articles.map((article) => (
              <Tooltip key={article.id} title={article.title}>
                <Tag className="cursor-pointer" onClick={() => navigate(`/create?id=${article.id}`)}>
                  {article.title}
                </Tag>
              </Tooltip>
            ))}
          </div>
        ),
      },
    ],
    [navigate],
  );

  const visibleLinks = useMemo(() => {
    if (!links) return [];
    return linkView === 'broken' ? links.links.filter((item) => !item.ok) : links.links;
  }, [links, linkView]);

  const hasSitemapIssue = (sitemap?.missingArticles?.length ?? 0) > 0 || (sitemap?.missingStaticPages?.length ?? 0) > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="SEO 体检">
        <Button type="primary" icon={<FiActivity />} loading={runAllLoading} onClick={runAll}>
          开始体检
        </Button>
      </Title>

      {/* 概览统计 */}
      <section className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile icon={<FiFileText size={18} />} label="体检文章" value={meta?.total ?? '—'} loading={metaLoading} />
        <StatTile icon={<FiAlignLeft size={18} />} label="缺失描述" value={meta ? meta.missingDescriptionTotal : '—'} danger={(meta?.missingDescriptionTotal ?? 0) > 0} loading={metaLoading} />
        <StatTile icon={<FiImage size={18} />} label="缺失封面" value={meta ? meta.missingCoverTotal : '—'} danger={(meta?.missingCoverTotal ?? 0) > 0} loading={metaLoading} />
        <StatTile
          icon={<FiMap size={18} />}
          label="sitemap 文章收录"
          value={sitemap?.reachable ? `${sitemap.sitemapArticleCount}/${sitemap.articleTotal}` : '—'}
          danger={hasSitemapIssue}
          loading={sitemapLoading}
        />
        <StatTile
          icon={<FiLink2 size={18} />}
          label="正文死链"
          value={links ? links.brokenTotal : '未检测'}
          danger={(links?.brokenTotal ?? 0) > 0}
          loading={linkLoading}
        />
      </section>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-2">
        {/* sitemap 体检 */}
        <SectionCard
          icon={<FiMap size={16} />}
          title="Sitemap 生成情况"
          desc="检查 sitemap 可达性，以及文章与静态页面的收录情况"
          extra={
            <Button size="small" icon={<FiRefreshCw />} loading={sitemapLoading} onClick={() => void loadSitemap()}>
              重新检查
            </Button>
          }
        >
          {sitemapLoading && !sitemap ? (
            <div className="py-6 text-center"><Spin /></div>
          ) : !sitemap ? (
            <Empty description="尚未检查" className="py-4" />
          ) : !sitemap.reachable ? (
            <Alert type="error" showIcon message="sitemap 不可达" description={sitemap.message} />
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm">
                <span className="flex items-center gap-1">
                  地址：
                  <a href={sitemap.url} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">
                    {sitemap.url}
                  </a>
                </span>
                <span>URL 总数：{sitemap.sitemapTotal}</span>
                <span>
                  文章收录：
                  <b className={hasSitemapIssue ? 'text-red-500' : 'text-green-500'}>
                    {sitemap.sitemapArticleCount}/{sitemap.articleTotal}
                  </b>
                </span>
              </div>

              {!hasSitemapIssue ? (
                <p className="flex items-center gap-1.5 text-sm text-green-500">
                  <FiCheckCircle size={14} /> sitemap 收录完整
                </p>
              ) : (
                <div className="space-y-2">
                  {sitemap.missingArticles.length > 0 ? (
                    <div>
                      <p className="text-xs text-slate-400">未收录的文章（点击跳转编辑）</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {sitemap.missingArticles.map((article) => (
                          <Tag key={article.id} className="cursor-pointer" onClick={() => navigate(`/create?id=${article.id}`)}>
                            {article.title}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {sitemap.missingStaticPages && sitemap.missingStaticPages.length > 0 ? (
                    <div>
                      <p className="text-xs text-slate-400">未收录的静态页面</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {sitemap.missingStaticPages.map((page) => (
                          <Tag key={page} color="warning">
                            {page}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* 文章元信息体检 */}
        <SectionCard
          icon={<FiFileText size={16} />}
          title="文章元信息"
          desc="检查已发布文章是否缺失描述或封面，两者是搜索摘要与缩略图的关键来源"
          extra={
            <Button size="small" icon={<FiRefreshCw />} loading={metaLoading} onClick={() => void loadMeta()}>
              重新检查
            </Button>
          }
        >
          {metaLoading && !meta ? (
            <div className="py-6 text-center"><Spin /></div>
          ) : !meta ? (
            <Empty description="尚未检查" className="py-4" />
          ) : meta.articles.length === 0 ? (
            <p className="flex items-center gap-1.5 py-2 text-sm text-green-500">
              <FiCheckCircle size={14} /> 全部文章的描述与封面完整
            </p>
          ) : (
            <Table
              rowKey="id"
              size="small"
              columns={metaColumns}
              dataSource={meta.articles}
              pagination={false}
              locale={{ emptyText: <Empty description="暂无数据" /> }}
            />
          )}
        </SectionCard>

        {/* 死链检测 */}
        <SectionCard
          icon={<FiLink2 size={16} />}
          title="正文死链检测"
          desc="提取正文中的 http(s) 链接并逐一探测，同一链接只检测一次"
          extra={
            <div className="flex items-center gap-2">
              {links ? (
                <Segmented
                  size="small"
                  value={linkView}
                  onChange={(value) => setLinkView(value as 'broken' | 'all')}
                  options={[
                    { label: `仅异常 (${links.brokenTotal})`, value: 'broken' },
                    { label: `全部 (${links.checkedTotal})`, value: 'all' },
                  ]}
                />
              ) : null}
              <Button size="small" type="primary" ghost icon={links ? <FiRefreshCw /> : <FiPlay />} loading={linkLoading} onClick={() => void loadLinks()}>
                {links ? '重新检测' : '开始检测'}
              </Button>
            </div>
          }
        >
          {linkLoading ? (
            <div className="py-8 text-center">
              <Spin />
              <p className="mt-3 text-xs text-slate-400">正在逐个探测链接，可能需要 1~2 分钟</p>
            </div>
          ) : !links ? (
            <Empty description="尚未检测，点击「开始检测」" className="py-4" />
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>
                  扫描文章 <b className="text-slate-600 dark:text-slate-300">{links.articleTotal}</b> 篇，提取链接{' '}
                  <b className="text-slate-600 dark:text-slate-300">{links.linkTotal}</b> 个，已检测{' '}
                  <b className="text-slate-600 dark:text-slate-300">{links.checkedTotal}</b> 个
                </span>
                {links.truncated ? <span className="text-orange-400">链接较多，本次仅检测前 {links.checkedTotal} 个</span> : null}
                {links.brokenTotal === 0 ? (
                  <span className="flex items-center gap-1 text-green-500">
                    <FiCheckCircle size={13} /> 未发现死链
                  </span>
                ) : (
                  <span className="text-red-500">发现 {links.brokenTotal} 个异常链接</span>
                )}
              </div>

              <Table
                rowKey="url"
                size="small"
                columns={linkColumns}
                dataSource={visibleLinks}
                pagination={{ pageSize: 10, hideOnSinglePage: true, showTotal: (total) => `共 ${total} 条` }}
                locale={{ emptyText: <Empty description="没有异常链接" className="py-4" /> }}
              />
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
