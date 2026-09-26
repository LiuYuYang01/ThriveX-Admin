import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Progress, Segmented, Skeleton, Spin, Table, Tag, Tooltip } from 'antd';
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

type CheckState = 'idle' | 'loading' | 'ok' | 'issue';

// 彩色图标芯片，Tailwind 需要静态类名所以用映射表
const HUE: Record<string, string> = {
  sky: 'bg-sky-50 text-sky-500 dark:bg-sky-500/10 dark:text-sky-400',
  blue: 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400',
  amber: 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400',
  violet: 'bg-violet-50 text-violet-500 dark:bg-violet-500/10 dark:text-violet-400',
  rose: 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400',
  emerald: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400',
};

const STATUS: Record<CheckState, { dot: string; text: string }> = {
  idle: { dot: 'bg-slate-300 dark:bg-slate-600', text: 'text-slate-400' },
  loading: { dot: 'bg-blue-400 animate-pulse', text: 'text-blue-500' },
  ok: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  issue: { dot: 'bg-red-500', text: 'text-red-500' },
};

const StatusPill = ({ state, label }: { state: CheckState; label?: string }) => (
  <span
    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium dark:bg-white/5 ${STATUS[state].text}`}
  >
    <span className={`inline-block size-1.5 rounded-full ${STATUS[state].dot}`} />
    {label ?? { idle: '未检测', loading: '检测中', ok: '正常', issue: '待处理' }[state]}
  </span>
);

const StatTile = ({ icon, hue, label, value, danger, loading }: { icon: ReactNode; hue: string; label: string; value: ReactNode; danger?: boolean; loading?: boolean }) => (
  <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200/70 bg-white px-3.5 py-3 dark:border-strokedark dark:bg-boxdark">
    <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${HUE[hue]}`}>{icon}</div>
    <div className="min-w-0">
      <div className="truncate text-xs text-slate-400">{label}</div>
      <div className={`truncate text-lg font-semibold leading-6 ${danger ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>
        {loading ? <Spin size="small" /> : value}
      </div>
    </div>
  </div>
);

const SectionCard = ({
  icon,
  hue,
  title,
  desc,
  state,
  issueLabel,
  extra,
  children,
}: {
  icon: ReactNode;
  hue: string;
  title: string;
  desc: string;
  state: CheckState;
  issueLabel?: string;
  extra?: ReactNode;
  children: ReactNode;
}) => (
  <section className="rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
    <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${HUE[hue]}`}>{icon}</div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <p className="truncate text-xs text-slate-400">{desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusPill state={state} label={state === 'issue' ? issueLabel : undefined} />
        {extra}
      </div>
    </header>
    <div className="px-4 py-3">{children}</div>
  </section>
);

const IdleHint = ({ icon, text }: { icon: ReactNode; text: string }) => (
  <div className="flex flex-col items-center gap-2.5 py-8">
    <div className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-300 dark:bg-white/5 dark:text-slate-600">{icon}</div>
    <p className="text-sm text-slate-400">{text}</p>
  </div>
);

const SuccessLine = ({ text }: { text: string }) => (
  <p className="flex items-center justify-center gap-1.5 py-3 text-sm text-emerald-600 dark:text-emerald-400">
    <FiCheckCircle size={15} /> {text}
  </p>
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

  const hasSitemapIssue = (sitemap?.missingArticles?.length ?? 0) > 0 || (sitemap?.missingStaticPages?.length ?? 0) > 0;

  // 健康分：满分 100，按三类问题扣分
  const score = useMemo(() => {
    if (!meta && !sitemap && !links) return null;
    let value = 100;
    if (meta) value -= Math.min(30, meta.missingDescriptionTotal + meta.missingCoverTotal);
    if (sitemap) {
      if (!sitemap.reachable) value -= 25;
      else value -= Math.min(25, (sitemap.missingArticles.length + (sitemap.missingStaticPages?.length ?? 0)) * 2);
    }
    if (links) value -= Math.min(30, links.brokenTotal * 2);
    return Math.max(0, value);
  }, [meta, sitemap, links]);

  const band = useMemo(() => {
    if (score == null) return { label: '待体检', color: '#94a3b8' };
    if (score >= 90) return { label: '优秀', color: '#10b981' };
    if (score >= 75) return { label: '良好', color: '#60a5fa' };
    if (score >= 60) return { label: '一般', color: '#f59e0b' };
    return { label: '较差', color: '#ef4444' };
  }, [score]);

  const metaColumns: ColumnsType<SeoArticleIssue> = [
    {
      title: '文章',
      dataIndex: 'title',
      render: (title: string, row: SeoArticleIssue) => (
        <span className="text-sm">
          <span className="mr-1.5 font-mono text-xs text-slate-400">#{row.id}</span>
          {title || '无标题'}
        </span>
      ),
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
        render: (ok: boolean, row: SeoLinkResult) => (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            <span className={`inline-block size-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {row.status ?? '失败'}
          </span>
        ),
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
        width: 230,
        render: (message?: string) => <span className="text-xs text-slate-400">{message || '—'}</span>,
      },
      {
        title: '引用文章',
        key: 'articles',
        width: 240,
        render: (_: unknown, row: SeoLinkResult) => {
          const shown = row.articles.slice(0, 2);
          const rest = row.articles.length - shown.length;
          return (
            <div className="flex flex-wrap items-center gap-1">
              {shown.map((article) => (
                <Tooltip key={article.id} title={article.title}>
                  <Tag className="cursor-pointer" onClick={() => navigate(`/create?id=${article.id}`)}>
                    {article.title}
                  </Tag>
                </Tooltip>
              ))}
              {rest > 0 ? (
                <Tooltip title={row.articles.slice(2).map((a) => a.title).join('、')}>
                  <Tag>+{rest}</Tag>
                </Tooltip>
              ) : null}
            </div>
          );
        },
      },
    ],
    [navigate],
  );

  const visibleLinks = useMemo(() => {
    if (!links) return [];
    return linkView === 'broken' ? links.links.filter((item) => !item.ok) : links.links;
  }, [links, linkView]);

  const tiles = [
    { icon: <FiFileText size={16} />, hue: 'sky', label: '体检文章', value: meta ? meta.total : '—', danger: false, loading: metaLoading },
    { icon: <FiAlignLeft size={16} />, hue: 'amber', label: '缺失描述', value: meta ? meta.missingDescriptionTotal : '—', danger: (meta?.missingDescriptionTotal ?? 0) > 0, loading: metaLoading },
    { icon: <FiImage size={16} />, hue: 'violet', label: '缺失封面', value: meta ? meta.missingCoverTotal : '—', danger: (meta?.missingCoverTotal ?? 0) > 0, loading: metaLoading },
    {
      icon: <FiMap size={16} />,
      hue: 'blue',
      label: 'sitemap 收录',
      value: sitemap?.reachable ? `${sitemap.sitemapArticleCount}/${sitemap.articleTotal}` : '—',
      danger: hasSitemapIssue,
      loading: sitemapLoading,
    },
    { icon: <FiLink2 size={16} />, hue: 'rose', label: '正文死链', value: links ? links.brokenTotal : '未检测', danger: (links?.brokenTotal ?? 0) > 0, loading: linkLoading },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="SEO 体检">
        <Button type="primary" icon={<FiActivity />} loading={runAllLoading} onClick={runAll}>
          开始体检
        </Button>
      </Title>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-2">
        {/* 报告头：健康分 + 概览统计 */}
        <section className="rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex flex-col items-center gap-5 p-4 lg:flex-row">
            <div className="flex shrink-0 flex-col items-center gap-1">
              <Progress
                type="circle"
                size={118}
                percent={score ?? 0}
                strokeColor={band.color}
                trailColor="rgba(148, 163, 184, 0.18)"
                format={() => (
                  <div className="leading-tight">
                    <div className={`text-2xl font-bold ${score == null ? 'text-slate-300 dark:text-slate-600' : 'text-slate-800 dark:text-slate-100'}`}>
                      {score ?? '—'}
                    </div>
                    <div className="text-[11px]" style={{ color: score == null ? undefined : band.color }}>
                      {band.label}
                    </div>
                  </div>
                )}
              />
              <span className="text-[11px] text-slate-400">SEO 健康分（满分 100）</span>
            </div>

            <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {tiles.map((tile) => (
                <StatTile key={tile.label} {...tile} />
              ))}
            </div>
          </div>
        </section>

        {/* sitemap 体检 */}
        <SectionCard
          icon={<FiMap size={15} />}
          hue="blue"
          title="Sitemap 生成情况"
          desc="检查 sitemap 可达性，以及文章与静态页面的收录情况"
          state={!sitemap ? (sitemapLoading ? 'loading' : 'idle') : hasSitemapIssue ? 'issue' : 'ok'}
          issueLabel={sitemap ? `${sitemap.missingArticles.length + (sitemap.missingStaticPages?.length ?? 0)} 项未收录` : undefined}
          extra={
            <Button size="small" icon={<FiRefreshCw />} loading={sitemapLoading} onClick={() => void loadSitemap()}>
              重新检查
            </Button>
          }
        >
          {!sitemap ? (
            sitemapLoading ? (
              <Skeleton active title={false} paragraph={{ rows: 2 }} />
            ) : (
              <IdleHint icon={<FiMap size={18} />} text="尚未检查，点击右上角「重新检查」或顶部「开始体检」" />
            )
          ) : !sitemap.reachable ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <div className="flex size-11 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
                <FiMap size={18} />
              </div>
              <p className="text-sm font-medium text-red-500">sitemap 不可达</p>
              <p className="max-w-md text-center text-xs text-slate-400">{sitemap.message}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={sitemap.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-xs items-center gap-1 truncate rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-xs text-slate-500 hover:text-primary dark:bg-white/5 dark:text-slate-400"
                  title={sitemap.url}
                >
                  <FiExternalLink size={11} className="shrink-0" /> {sitemap.url}
                </a>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  URL 总数 <b className="text-slate-800 dark:text-slate-100">{sitemap.sitemapTotal}</b>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  文章收录
                  <b className={hasSitemapIssue ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}>
                    {sitemap.sitemapArticleCount}/{sitemap.articleTotal}
                  </b>
                </span>
              </div>

              {!hasSitemapIssue ? (
                <SuccessLine text="sitemap 收录完整" />
              ) : (
                <div className="space-y-2.5">
                  {sitemap.missingArticles.length > 0 ? (
                    <div>
                      <p className="mb-1.5 text-xs text-slate-400">未收录的文章（点击跳转编辑）</p>
                      <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                        {sitemap.missingArticles.map((article) => (
                          <Tag key={article.id} className="cursor-pointer" title={`ID: ${article.id}`} onClick={() => navigate(`/create?id=${article.id}`)}>
                            {article.title}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {sitemap.missingStaticPages && sitemap.missingStaticPages.length > 0 ? (
                    <div>
                      <p className="mb-1.5 text-xs text-slate-400">未收录的静态页面</p>
                      <div className="flex flex-wrap gap-1.5">
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
          icon={<FiFileText size={15} />}
          hue="violet"
          title="文章元信息"
          desc="检查已发布文章是否缺失描述或封面，两者是搜索摘要与缩略图的关键来源"
          state={!meta ? (metaLoading ? 'loading' : 'idle') : meta.articles.length > 0 ? 'issue' : 'ok'}
          issueLabel={`${meta?.articles.length ?? 0} 篇需完善`}
          extra={
            <Button size="small" icon={<FiRefreshCw />} loading={metaLoading} onClick={() => void loadMeta()}>
              重新检查
            </Button>
          }
        >
          {!meta ? (
            metaLoading ? (
              <Skeleton active title={false} paragraph={{ rows: 2 }} />
            ) : (
              <IdleHint icon={<FiFileText size={18} />} text="尚未检查，点击右上角「重新检查」或顶部「开始体检」" />
            )
          ) : meta.articles.length === 0 ? (
            <SuccessLine text="全部文章的描述与封面完整" />
          ) : (
            <Table
              rowKey="id"
              size="small"
              columns={metaColumns}
              dataSource={meta.articles}
              pagination={false}
              locale={{ emptyText: <span className="block py-4 text-center text-xs text-slate-400">暂无数据</span> }}
            />
          )}
        </SectionCard>

        {/* 死链检测 */}
        <SectionCard
          icon={<FiLink2 size={15} />}
          hue="rose"
          title="正文死链检测"
          desc="提取正文中的 http(s) 链接并逐一探测，同一链接只检测一次"
          state={!links ? (linkLoading ? 'loading' : 'idle') : links.brokenTotal > 0 ? 'issue' : 'ok'}
          issueLabel={`${links?.brokenTotal ?? 0} 个异常`}
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
          {linkLoading && !links ? (
            <Skeleton active title={false} paragraph={{ rows: 3 }} />
          ) : linkLoading ? (
            <div className="py-6 text-center">
              <Spin />
              <p className="mt-3 text-xs text-slate-400">正在逐个探测链接，可能需要 1~2 分钟</p>
            </div>
          ) : !links ? (
            <IdleHint icon={<FiLink2 size={18} />} text="尚未检测，点击右上角「开始检测」" />
          ) : (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>
                  扫描文章 <b className="text-slate-600 dark:text-slate-300">{links.articleTotal}</b> 篇 · 提取链接{' '}
                  <b className="text-slate-600 dark:text-slate-300">{links.linkTotal}</b> 个 · 已检测{' '}
                  <b className="text-slate-600 dark:text-slate-300">{links.checkedTotal}</b> 个
                </span>
                {links.truncated ? <span className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-500 dark:bg-amber-500/10">链接较多，本次仅检测前 {links.checkedTotal} 个</span> : null}
              </div>

              {links.brokenTotal === 0 && linkView === 'broken' ? (
                <SuccessLine text={`未发现死链，${links.checkedTotal} 个链接全部可用`} />
              ) : (
                <Table
                  rowKey="url"
                  size="small"
                  columns={linkColumns}
                  dataSource={visibleLinks}
                  pagination={{ pageSize: 10, hideOnSinglePage: true, showTotal: (total) => `共 ${total} 条` }}
                  locale={{ emptyText: <span className="block py-4 text-center text-xs text-slate-400">暂无数据</span> }}
                />
              )}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
