import { ReactNode, Ref, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Progress, Segmented, Skeleton, Spin, Table, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiLink2,
  FiMap,
  FiPlay,
  FiRefreshCw,
} from 'react-icons/fi';

import Title from '@/components/Title';
import { getSeoArticleCheckAPI, getSeoLinkCheckAPI, getSeoSitemapCheckAPI } from '@/api/seo';
import type { SeoArticleCheck, SeoArticleIssue, SeoLinkCheck, SeoLinkResult, SeoSitemapCheck } from '@/types/app/seo';

type CheckState = 'idle' | 'loading' | 'ok' | 'issue' | 'error';

const STORAGE_KEY = 'thrivex_seo_report';

// 本地缓存结构：整份报告随写随存，刷新后先回放缓存再静默刷新
interface CachedReport {
  meta: SeoArticleCheck | null;
  sitemap: SeoSitemapCheck | null;
  links: SeoLinkCheck | null;
  checkedAt: number;
}

const readCache = (): Partial<CachedReport> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

// 图标芯片统一中性色（Tailwind 需要静态类名），问题严重度只由状态胶囊和数字颜色表达
const CHIP_ICON = 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400';

// 小标签色调：neutral 常规信息，warn 缺失类问题
const TONE: Record<'neutral' | 'warn', string> = {
  neutral: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  warn: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
};

const STATUS: Record<CheckState, { dot: string; text: string }> = {
  idle: { dot: 'bg-slate-300 dark:bg-slate-600', text: 'text-slate-400' },
  loading: { dot: 'bg-blue-400 animate-pulse', text: 'text-blue-500' },
  ok: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  issue: { dot: 'bg-red-500', text: 'text-red-500' },
  error: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
};

const StatusPill = ({ state, label }: { state: CheckState; label?: string }) => (
  <span
    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium dark:bg-white/5 ${STATUS[state].text}`}
  >
    <span className={`inline-block size-1.5 rounded-full ${STATUS[state].dot}`} />
    {label ?? { idle: '未检测', loading: '检测中', ok: '正常', issue: '待处理', error: '检测失败' }[state]}
  </span>
);

const Chip = ({ tone = 'neutral', children }: { tone?: 'neutral' | 'warn'; children: ReactNode }) => (
  <span className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-xs ${TONE[tone]}`}>{children}</span>
);

// 原生 button 保证键盘可达，体检结果的修复入口是本页核心交互
const ClickChip = ({ children, onClick, title }: { children: ReactNode; onClick: () => void; title?: string }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className="block max-w-44 cursor-pointer truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-left text-xs text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
  >
    {children}
  </button>
);

const SectionCard = ({
  icon,
  title,
  desc,
  state,
  issueLabel,
  extra,
  children,
  ref,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  state: CheckState;
  issueLabel?: string;
  extra?: ReactNode;
  children: ReactNode;
  ref?: Ref<HTMLElement>;
}) => (
  <section ref={ref} className="rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
    <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${CHIP_ICON}`}>{icon}</div>
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

// 检测请求本身失败（区别于「检测出问题」），给出重试出口，不再静默回到未检测态
const FailHint = ({ icon, onRetry }: { icon: ReactNode; onRetry: () => void }) => (
  <div className="flex flex-col items-center gap-2.5 py-8">
    <div className="flex size-11 items-center justify-center rounded-full bg-amber-50 text-amber-400 dark:bg-amber-500/10 dark:text-amber-400">{icon}</div>
    <p className="text-sm text-slate-400">检测失败，网络或服务异常，请重试</p>
    <Button size="small" icon={<FiRefreshCw />} onClick={onRetry}>
      重试
    </Button>
  </div>
);

const SuccessLine = ({ text }: { text: string }) => (
  <p className="flex items-center justify-center gap-1.5 py-3 text-sm text-emerald-600 dark:text-emerald-400">
    <FiCheckCircle size={15} /> {text}
  </p>
);

export default function SeoPage() {
  const navigate = useNavigate();

  // 先回放上次报告，页面不再是「刷新即蒸发」
  const [cache] = useState(readCache);
  const [meta, setMeta] = useState<SeoArticleCheck | null>(() => cache.meta ?? null);
  const [sitemap, setSitemap] = useState<SeoSitemapCheck | null>(() => cache.sitemap ?? null);
  const [links, setLinks] = useState<SeoLinkCheck | null>(() => cache.links ?? null);
  const [checkedAt, setCheckedAt] = useState<number | null>(() => cache.checkedAt ?? null);
  const [stale, setStale] = useState(() => cache.checkedAt != null);

  const [metaLoading, setMetaLoading] = useState(false);
  const [sitemapLoading, setSitemapLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [metaError, setMetaError] = useState(false);
  const [sitemapError, setSitemapError] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const [linkView, setLinkView] = useState<'broken' | 'all'>('broken');

  const loadMeta = useCallback(async () => {
    try {
      setMetaLoading(true);
      const { data } = await getSeoArticleCheckAPI();
      setMeta(data);
      setMetaError(false);
      setStale(false);
      setCheckedAt(Date.now());
    } catch (error) {
      setMetaError(true);
      message.error('文章元信息检查失败');
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
      setSitemapError(false);
      setStale(false);
      setCheckedAt(Date.now());
    } catch (error) {
      setSitemapError(true);
      message.error('sitemap 检查失败');
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
      setLinkError(false);
      setStale(false);
      setCheckedAt(Date.now());
    } catch (error) {
      setLinkError(true);
      message.error('死链检测失败');
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

  // 任一检查有数据就把整份报告落盘
  useEffect(() => {
    if (!meta && !sitemap && !links) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ meta, sitemap, links, checkedAt }));
  }, [meta, sitemap, links, checkedAt]);

  const runAll = () => {
    void loadMeta();
    void loadSitemap();
    void loadLinks();
  };

  const runAllLoading = metaLoading || sitemapLoading || linkLoading;

  const hasSitemapIssue = (sitemap?.missingArticles?.length ?? 0) > 0 || (sitemap?.missingStaticPages?.length ?? 0) > 0;

  // 健康分：满分 100，按三类问题扣分（各项扣分同时用于报告头的扣分明细）
  const score = useMemo(() => {
    if (!meta && !sitemap && !links) return null;
    const metaDed = meta ? Math.min(30, meta.missingDescriptionTotal + meta.missingCoverTotal) : 0;
    const sitemapDed = !sitemap ? 0 : !sitemap.reachable ? 25 : Math.min(25, (sitemap.missingArticles.length + (sitemap.missingStaticPages?.length ?? 0)) * 2);
    const linkDed = links ? Math.min(30, links.brokenTotal * 2) : 0;
    return { total: Math.max(0, 100 - metaDed - sitemapDed - linkDed), metaDed, sitemapDed, linkDed };
  }, [meta, sitemap, links]);

  const band = useMemo(() => {
    if (!score) return { label: '待体检', color: '#94a3b8' };
    if (score.total >= 90) return { label: '优秀', color: '#10b981' };
    if (score.total >= 75) return { label: '良好', color: '#60a5fa' };
    if (score.total >= 60) return { label: '一般', color: '#f59e0b' };
    return { label: '较差', color: '#ef4444' };
  }, [score]);

  // 报告头汇总：三个问题类 chips 可点击下钻到对应卡片
  const sectionRefs = useRef<Record<'meta' | 'sitemap' | 'links', HTMLElement | null>>({ meta: null, sitemap: null, links: null });
  const scrollToSection = (key: 'meta' | 'sitemap' | 'links') => sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const summaryItems = [
    {
      key: 'meta' as const,
      label: '元信息待完善',
      count: meta?.articles.length,
      active: 'text-amber-600 dark:text-amber-400',
    },
    {
      key: 'sitemap' as const,
      label: '收录缺失',
      count: sitemap ? sitemap.missingArticles.length + (sitemap.missingStaticPages?.length ?? 0) : undefined,
      active: 'text-amber-600 dark:text-amber-400',
    },
    {
      key: 'links' as const,
      label: '正文死链',
      count: links?.brokenTotal,
      active: 'text-red-500',
    },
  ];
  const pendingTotal = summaryItems.reduce((sum, item) => sum + (item.count ?? 0), 0);

  const metaColumns: ColumnsType<SeoArticleIssue> = useMemo(
    () => [
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
            {row.missingDescription ? <Chip tone="warn">描述</Chip> : null}
            {row.missingCover ? <Chip tone="warn">封面</Chip> : null}
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
    ],
    [navigate],
  );

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
                  <ClickChip onClick={() => navigate(`/create?id=${article.id}`)}>{article.title}</ClickChip>
                </Tooltip>
              ))}
              {rest > 0 ? (
                <Tooltip title={row.articles.slice(2).map((a) => a.title).join('、')}>
                  <Chip>+{rest}</Chip>
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

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="SEO 优化">
        <Button type="primary" icon={<FiActivity />} loading={runAllLoading} onClick={runAll}>
          开始体检
        </Button>
      </Title>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-2">
        {/* 报告头：健康分 + 待处理汇总 */}
        <section className="rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <div className="flex flex-col items-center gap-5 p-4 lg:flex-row">
            <div className="flex shrink-0 flex-col items-center gap-1">
              <Progress
                type="circle"
                size={118}
                percent={score?.total ?? 0}
                strokeColor={band.color}
                trailColor="rgba(148, 163, 184, 0.18)"
                format={() => (
                  <div className="leading-tight">
                    <div className={`text-2xl font-bold ${score == null ? 'text-slate-300 dark:text-slate-600' : 'text-slate-800 dark:text-slate-100'}`}>
                      {score?.total ?? '—'}
                    </div>
                    <div className="text-[11px]" style={{ color: score == null ? undefined : band.color }}>
                      {band.label}
                    </div>
                  </div>
                )}
              />
              <span className="text-[11px] text-slate-400">
                {checkedAt
                  ? `上次体检 ${new Date(checkedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}${stale ? ' · 可能已过期' : ''}`
                  : '尚未体检（满分 100）'}
              </span>
              {score ? (
                <span className="text-[11px] text-slate-400">
                  扣分：元信息 -{score.metaDed} · 收录 -{score.sitemapDed} · 死链 {links ? `-${score.linkDed}` : '未检'}
                </span>
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-400">
                待处理 <b className="text-xl font-semibold text-slate-800 dark:text-slate-100">{pendingTotal}</b> 项
                {meta ? (
                  <>
                    {' '}
                    · 体检 <b className="text-slate-600 dark:text-slate-300">{meta.total}</b> 篇文章
                  </>
                ) : null}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {summaryItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => scrollToSection(item.key)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10"
                  >
                    {item.label}
                    <b
                      className={
                        item.count == null ? 'text-slate-400' : item.count > 0 ? item.active : 'text-emerald-600 dark:text-emerald-400'
                      }
                    >
                      {item.count ?? '未检'}
                    </b>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* sitemap 体检 */}
        <SectionCard
          ref={(el) => {
            sectionRefs.current.sitemap = el;
          }}
          icon={<FiMap size={15} />}
          title="Sitemap 生成情况"
          desc="检查 sitemap 可达性，以及文章与静态页面的收录情况"
          state={!sitemap ? (sitemapLoading ? 'loading' : sitemapError ? 'error' : 'idle') : hasSitemapIssue ? 'issue' : 'ok'}
          issueLabel={sitemap ? `${sitemap.missingArticles.length + (sitemap.missingStaticPages?.length ?? 0)} 项未收录` : undefined}
          extra={
            <Button size="small" icon={<FiRefreshCw />} loading={sitemapLoading} onClick={() => void loadSitemap()}>
              {sitemap ? '重新检查' : '开始检查'}
            </Button>
          }
        >
          {!sitemap ? (
            sitemapLoading ? (
              <Skeleton active title={false} paragraph={{ rows: 2 }} />
            ) : sitemapError ? (
              <FailHint icon={<FiAlertTriangle size={18} />} onRetry={() => void loadSitemap()} />
            ) : (
              <IdleHint icon={<FiMap size={18} />} text="尚未检查，点击右上角「开始检查」或顶部「开始体检」" />
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
                          <ClickChip key={article.id} title={`ID: ${article.id}`} onClick={() => navigate(`/create?id=${article.id}`)}>
                            {article.title}
                          </ClickChip>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {sitemap.missingStaticPages && sitemap.missingStaticPages.length > 0 ? (
                    <div>
                      <p className="mb-1.5 text-xs text-slate-400">未收录的静态页面</p>
                      <div className="flex flex-wrap gap-1.5">
                        {sitemap.missingStaticPages.map((page) => (
                          <Chip key={page} tone="warn">
                            {page}
                          </Chip>
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
          ref={(el) => {
            sectionRefs.current.meta = el;
          }}
          icon={<FiFileText size={15} />}
          title="文章元信息"
          desc="检查已发布文章是否缺失描述或封面，两者是搜索摘要与缩略图的关键来源"
          state={!meta ? (metaLoading ? 'loading' : metaError ? 'error' : 'idle') : meta.articles.length > 0 ? 'issue' : 'ok'}
          issueLabel={`${meta?.articles.length ?? 0} 篇需完善`}
          extra={
            <Button size="small" icon={<FiRefreshCw />} loading={metaLoading} onClick={() => void loadMeta()}>
              {meta ? '重新检查' : '开始检查'}
            </Button>
          }
        >
          {!meta ? (
            metaLoading ? (
              <Skeleton active title={false} paragraph={{ rows: 2 }} />
            ) : metaError ? (
              <FailHint icon={<FiAlertTriangle size={18} />} onRetry={() => void loadMeta()} />
            ) : (
              <IdleHint icon={<FiFileText size={18} />} text="尚未检查，点击右上角「开始检查」或顶部「开始体检」" />
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
          ref={(el) => {
            sectionRefs.current.links = el;
          }}
          icon={<FiLink2 size={15} />}
          title="正文死链检测"
          desc="提取正文中的 http(s) 链接并逐一探测，同一链接只检测一次"
          state={!links ? (linkLoading ? 'loading' : linkError ? 'error' : 'idle') : links.brokenTotal > 0 ? 'issue' : 'ok'}
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
              <Button size="small" icon={links ? <FiRefreshCw /> : <FiPlay />} loading={linkLoading} onClick={() => void loadLinks()}>
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
            linkError ? (
              <FailHint icon={<FiAlertTriangle size={18} />} onRetry={() => void loadLinks()} />
            ) : (
              <IdleHint icon={<FiLink2 size={18} />} text="尚未检测，点击右上角「开始检测」" />
            )
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
