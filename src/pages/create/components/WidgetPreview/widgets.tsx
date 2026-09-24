import { useEffect, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import {
  HiOutlineChevronDown,
  HiOutlineExclamationTriangle,
  HiOutlineFire,
  HiOutlineInformationCircle,
  HiOutlineLightBulb,
  HiOutlineLink,
  HiOutlinePencil,
  HiStar,
} from 'react-icons/hi2';
import { FiExternalLink } from 'react-icons/fi';
import { getApiUrl } from '@/utils/config';

export type WidgetPayload = Record<string, unknown>;

interface TabItem {
  title?: unknown;
  content?: unknown;
}

interface TimelineItem {
  time?: unknown;
  title?: unknown;
  content?: unknown;
}

interface StepItem {
  title?: unknown;
  content?: unknown;
}

interface GalleryItem {
  src?: unknown;
  alt?: unknown;
}

interface RatingItem {
  label?: unknown;
  score?: unknown;
}

interface ComparisonItem {
  label?: unknown;
  left?: unknown;
  right?: unknown;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function WidgetShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx('tx-widget', className)}>{children}</div>;
}

export function BilibiliWidget({ data }: { data: WidgetPayload }) {
  const bvid = asString(data.bvid || data.id);
  if (!bvid) return null;
  const page = Number(data.page || 1) || 1;
  const src = `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bvid)}&page=${page}&high_quality=1&danmaku=0`;

  return (
    <WidgetShell className="tx-widget--media">
      <div className="tx-widget__ratio">
        <iframe
          src={src}
          title={`Bilibili ${bvid}`}
          allowFullScreen
          scrolling="no"
          frameBorder={0}
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
        />
      </div>
    </WidgetShell>
  );
}

export function YoutubeWidget({ data }: { data: WidgetPayload }) {
  const id = asString(data.id || data.videoId);
  if (!id) return null;
  return (
    <WidgetShell className="tx-widget--media">
      <div className="tx-widget__ratio">
        <iframe
          src={`https://www.youtube.com/embed/${encodeURIComponent(id)}`}
          title={`YouTube ${id}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </WidgetShell>
  );
}

export function NeteaseWidget({ data }: { data: WidgetPayload }) {
  const id = asString(data.id);
  const auto = data.auto === true || data.autoplay === true ? 1 : 0;
  if (!id) return null;
  return (
    <WidgetShell className="tx-widget--embed">
      <iframe
        className="tx-widget__netease"
        src={`https://music.163.com/outchain/player?type=2&id=${encodeURIComponent(id)}&auto=${auto}&height=66`}
        title={`Netease ${id}`}
      />
    </WidgetShell>
  );
}

export function DouyinWidget({ data }: { data: WidgetPayload }) {
  const id = asString(data.id || data.vid);
  if (!id) return null;
  return (
    <WidgetShell className="tx-widget--media">
      <div className="tx-widget__ratio tx-widget__ratio--portrait">
        <iframe
          src={`https://open.douyin.com/player/video?vid=${encodeURIComponent(id)}&autoplay=0`}
          title={`Douyin ${id}`}
          allowFullScreen
        />
      </div>
    </WidgetShell>
  );
}

export function AudioWidget({ data }: { data: WidgetPayload }) {
  const src = asString(data.src || data.url);
  const title = asString(data.title, '音频');
  if (!src) return null;
  return (
    <WidgetShell className="tx-widget--card">
      <div className="tx-widget__audio">
        <div className="tx-widget__audio-meta">
          <strong>{title}</strong>
          {asString(data.artist) && <span>{asString(data.artist)}</span>}
        </div>
        <audio controls preload="none" src={src}>
          你的浏览器不支持音频播放
        </audio>
      </div>
    </WidgetShell>
  );
}

export function TabsWidget({ data }: { data: WidgetPayload }) {
  const items = asArray<TabItem>(data.items).filter((item) => item?.title);
  const [active, setActive] = useState(0);
  if (!items.length) return null;
  const current = items[Math.min(active, items.length - 1)];

  return (
    <WidgetShell className="tx-widget--card">
      <div className="tx-widget__tabs" role="tablist">
        {items.map((item, index) => (
          <button
            key={`${item.title}-${index}`}
            type="button"
            role="tab"
            aria-selected={index === active}
            className={cx(index === active && 'is-active')}
            onClick={() => setActive(index)}
          >
            {item.title as string}
          </button>
        ))}
      </div>
      <div className="tx-widget__tab-panel whitespace-pre-wrap" role="tabpanel">
        {(current?.content as string) || ''}
      </div>
    </WidgetShell>
  );
}

export function TimelineWidget({ data }: { data: WidgetPayload }) {
  const items = asArray<TimelineItem>(data.items);
  if (!items.length) return null;
  return (
    <WidgetShell className="tx-widget--card">
      <div className="tx-widget__timeline">
        {items.map((item, index) => (
          <div className="tx-widget__timeline-item" key={`${item.title}-${index}`}>
            <span className="tx-widget__dot" aria-hidden />
            <div className="tx-widget__timeline-body">
              {item.time ? <time>{item.time as string}</time> : null}
              <strong>{item.title as string}</strong>
              {item.content ? <p className="whitespace-pre-wrap">{item.content as string}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

export function StepsWidget({ data }: { data: WidgetPayload }) {
  const items = asArray<StepItem>(data.items);
  if (!items.length) return null;
  return (
    <WidgetShell className="tx-widget--card">
      <div className="tx-widget__steps">
        {items.map((item, index) => (
          <div className="tx-widget__step-item" key={`${item.title}-${index}`}>
            <span className="tx-widget__step-index">{index + 1}</span>
            <div className="tx-widget__step-body">
              <strong>{item.title as string}</strong>
              {item.content ? <p className="whitespace-pre-wrap">{item.content as string}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

export function CtaWidget({ data }: { data: WidgetPayload }) {
  const title = asString(data.title, '立刻行动');
  const description = asString(data.description);
  const primaryText = asString(data.primaryText || data.buttonText, '了解更多');
  const primaryUrl = asString(data.primaryUrl || data.url || data.href, '#');
  const secondaryText = asString(data.secondaryText);
  const secondaryUrl = asString(data.secondaryUrl);

  return (
    <WidgetShell className="tx-widget--cta">
      <div>
        <strong>{title}</strong>
        {description && <p>{description}</p>}
      </div>
      <div className="tx-widget__cta-actions">
        <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className="is-primary">
          {primaryText}
        </a>
        {secondaryText && secondaryUrl && (
          <a href={secondaryUrl} target="_blank" rel="noopener noreferrer">
            {secondaryText}
          </a>
        )}
      </div>
    </WidgetShell>
  );
}

export function GalleryWidget({ data }: { data: WidgetPayload }) {
  const items = asArray<GalleryItem>(data.items).filter((item) => item?.src);
  if (!items.length) return null;

  return (
    <WidgetShell className="tx-widget--card">
      <div className={cx('tx-widget__gallery', items.length === 1 && 'is-single')}>
        {items.map((item, index) => (
          <img
            key={`${String(item.src)}-${index}`}
            className="tx-widget__gallery-item"
            src={item.src as string}
            alt={(item.alt as string) || `gallery-${index + 1}`}
          />
        ))}
      </div>
    </WidgetShell>
  );
}

const CALLOUT_META: Record<string, { icon: typeof HiOutlineInformationCircle; label: string }> = {
  note: { icon: HiOutlinePencil, label: '笔记' },
  tip: { icon: HiOutlineLightBulb, label: '小贴士' },
  info: { icon: HiOutlineInformationCircle, label: '信息' },
  warning: { icon: HiOutlineExclamationTriangle, label: '注意' },
  danger: { icon: HiOutlineFire, label: '警告' },
};

export function CalloutWidget({ data }: { data: WidgetPayload }) {
  const variant = asString(data.variant, 'note');
  const meta = CALLOUT_META[variant] ?? CALLOUT_META['note'];
  const title = asString(data.title, meta.label);
  const content = asString(data.content);
  const Icon = meta.icon;

  return (
    <WidgetShell className={`tx-widget--callout is-${variant}`}>
      <Icon aria-hidden />
      <div>
        <strong>{title}</strong>
        {content && <p className="whitespace-pre-wrap">{content}</p>}
      </div>
    </WidgetShell>
  );
}

export function LinkCardWidget({ data }: { data: WidgetPayload }) {
  const url = asString(data.url || data.href);
  const title = asString(data.title, url);
  const cover = asString(data.cover);
  if (!url && !title) return null;
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    host = '';
  }

  const body = (
    <>
      {cover ? (
        <img className="tx-widget__info-cover" src={cover} alt={title} loading="lazy" />
      ) : (
        <span className="tx-widget__info-cover tx-widget__info-cover--empty" aria-hidden>
          <HiOutlineLink />
        </span>
      )}
      <div className="tx-widget__info-body">
        <strong>{title}</strong>
        {asString(data.description) && <p>{asString(data.description)}</p>}
        <span className="tx-widget__link">
          {host || url}
          <FiExternalLink aria-hidden />
        </span>
      </div>
    </>
  );

  return (
    <WidgetShell className="tx-widget--card">
      {url ? (
        <a className="tx-widget__info" href={url} target="_blank" rel="noopener noreferrer">
          {body}
        </a>
      ) : (
        <div className="tx-widget__info">{body}</div>
      )}
    </WidgetShell>
  );
}

export function CollapseWidget({ data }: { data: WidgetPayload }) {
  const [open, setOpen] = useState(data.open === true);
  const title = asString(data.title, '展开查看');
  const content = asString(data.content);
  if (!title && !content) return null;

  return (
    <WidgetShell className="tx-widget--card">
      <button
        type="button"
        className={cx('tx-widget__collapse-trigger', open && 'is-open')}
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <HiOutlineChevronDown aria-hidden />
      </button>
      {open && <div className="tx-widget__collapse-body whitespace-pre-wrap">{content}</div>}
    </WidgetShell>
  );
}

export function DiffWidget({ data }: { data: WidgetPayload }) {
  const code = asString(data.code || data.content);
  if (!code) return null;

  return (
    <WidgetShell className="tx-widget--card">
      <div className="tx-widget__diff">
        <div className="tx-widget__diff-head">{asString(data.title, '差异对比')}</div>
        <pre>
          {code.split('\n').map((line, index) => {
            const isAdd = line.startsWith('+');
            const isDel = line.startsWith('-');
            return (
              <span
                key={index}
                className={cx('tx-widget__diff-line', isAdd && 'is-add', isDel && 'is-del')}
              >
                <code>{isAdd ? '+' : isDel ? '-' : ' '}</code>
                <code>{isAdd || isDel ? line.slice(1) : line}</code>
              </span>
            );
          })}
        </pre>
      </div>
    </WidgetShell>
  );
}

export function RatingWidget({ data }: { data: WidgetPayload }) {
  const items = asArray<RatingItem>(data.items).filter(
    (item) => item && typeof item.score === 'number'
  );
  const max = Number(data.max) > 0 ? Number(data.max) : 5;
  const summary = asString(data.summary);
  if (!items.length) return null;

  return (
    <WidgetShell className="tx-widget--card">
      <div className="tx-widget__rating">
        {asString(data.title) && <strong>{asString(data.title)}</strong>}
        {items.map((item, index) => (
          <div className="tx-widget__rating-row" key={`${String(item.label)}-${index}`}>
            <span>{asString(item.label) || `维度 ${index + 1}`}</span>
            <span
              className="tx-widget__rating-stars"
              aria-label={`${item.score as number} / ${max}`}
            >
              {Array.from({ length: max }, (_, i) => (
                <HiStar key={i} className={cx(i < (item.score as number) && 'is-on')} aria-hidden />
              ))}
            </span>
            <span className="tx-widget__rating-score">
              {item.score as number} / {max}
            </span>
          </div>
        ))}
        {summary && <p className="tx-widget__rating-summary">{summary}</p>}
      </div>
    </WidgetShell>
  );
}

export function ComparisonWidget({ data }: { data: WidgetPayload }) {
  const items = asArray<ComparisonItem>(data.items);
  const leftTitle = asString(data.leftTitle, '方案 A');
  const rightTitle = asString(data.rightTitle, '方案 B');
  if (!items.length) return null;

  return (
    <WidgetShell className="tx-widget--card">
      <div className="tx-widget__versus">
        <div className="tx-widget__versus-head">
          <em>VS</em>
          <span>{leftTitle}</span>
          <span>{rightTitle}</span>
        </div>
        {items.map((item, index) => (
          <div className="tx-widget__versus-row" key={`${String(item.label)}-${index}`}>
            <span>{asString(item.label)}</span>
            <span>{asString(item.left) || '-'}</span>
            <span>{asString(item.right) || '-'}</span>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

// 预览端拉取文章标题/摘要做示意展示，模块级缓存避免编辑 JSON 时反复请求
const refArticleCache = new Map<number, RefArticle | null>();

interface RefArticle {
  id?: number;
  title?: string;
  description?: string;
  cover?: string;
}

async function fetchRefArticle(id: number): Promise<RefArticle | null> {
  if (refArticleCache.has(id)) return refArticleCache.get(id) ?? null;
  try {
    const { data: res } = await axios.get(`${getApiUrl()}/article/${id}`);
    const article = res?.data as RefArticle | undefined;
    const value = article?.title ? article : null;
    refArticleCache.set(id, value);
    return value;
  } catch {
    refArticleCache.set(id, null);
    return null;
  }
}

export function ArticleRefWidget({ data }: { data: WidgetPayload }) {
  const idsKey = JSON.stringify(data.ids ?? data.id);
  const ids = useMemo(() => {
    const list = Array.isArray(data.ids) ? data.ids : [data.id];
    return list.map(Number).filter((id) => Number.isInteger(id) && id > 0);
  }, [idsKey]);
  const [articles, setArticles] = useState<RefArticle[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!ids.length) {
      setArticles([]);
      return;
    }
    setArticles(null);
    Promise.all(ids.map((id) => fetchRefArticle(id))).then((list) => {
      if (!cancelled) setArticles(list.filter(Boolean) as RefArticle[]);
    });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return (
    <WidgetShell className="tx-widget--card">
      <div className="tx-widget__section-title">{asString(data.title, '相关文章')}</div>
      {articles === null ? (
        <div className="tx-widget__related-empty">加载中…</div>
      ) : articles.length ? (
        <ul className="tx-widget__related">
          {articles.map((article) => (
            <li key={article.id}>
              <div className={cx(article.cover && 'is-cover')}>
                {article.cover && (
                  <img
                    className="tx-widget__related-cover"
                    src={article.cover}
                    alt={article.title ?? ''}
                    loading="lazy"
                  />
                )}
                <span>
                  <strong>{article.title}</strong>
                  {article.description && <p>{article.description}</p>}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="tx-widget__related-empty">未找到文章，发布后博客端展示真实卡片</div>
      )}
    </WidgetShell>
  );
}

export default function WidgetRenderer({ data }: { data: WidgetPayload }) {
  switch (data.type) {
    case 'bilibili':
      return <BilibiliWidget data={data} />;
    case 'youtube':
      return <YoutubeWidget data={data} />;
    case 'netease':
      return <NeteaseWidget data={data} />;
    case 'douyin':
      return <DouyinWidget data={data} />;
    case 'audio':
      return <AudioWidget data={data} />;
    case 'tabs':
      return <TabsWidget data={data} />;
    case 'timeline':
      return <TimelineWidget data={data} />;
    case 'steps':
      return <StepsWidget data={data} />;
    case 'gallery':
      return <GalleryWidget data={data} />;
    case 'cta':
      return <CtaWidget data={data} />;
    case 'callout':
      return <CalloutWidget data={data} />;
    case 'link-card':
      return <LinkCardWidget data={data} />;
    case 'collapse':
      return <CollapseWidget data={data} />;
    case 'diff':
      return <DiffWidget data={data} />;
    case 'rating':
      return <RatingWidget data={data} />;
    case 'comparison':
      return <ComparisonWidget data={data} />;
    case 'article-ref':
      return <ArticleRefWidget data={data} />;
    default:
      return (
        <div className="tx-widget tx-widget--unknown">
          {data.type
            ? `未知小组件类型「${String(data.type)}」，请检查 type 字段`
            : '缺少 type 字段，请补充小组件类型'}
        </div>
      );
  }
}
