// SEO 体检相关类型

export interface SeoArticleIssue {
  id: number;
  title: string;
  missingDescription: boolean;
  missingCover: boolean;
}

export interface SeoArticleCheck {
  total: number;
  missingDescriptionTotal: number;
  missingCoverTotal: number;
  articles: SeoArticleIssue[];
}

export interface SeoSitemapCheck {
  reachable: boolean;
  url: string;
  message?: string;
  sitemapTotal?: number;
  articleTotal?: number;
  sitemapArticleCount?: number;
  missingArticles: SeoArticleIssue[];
  missingStaticPages?: string[];
}

export interface SeoLinkArticle {
  id: number;
  title: string;
}

export interface SeoLinkResult {
  url: string;
  ok: boolean;
  status?: number;
  message?: string;
  articles: SeoLinkArticle[];
}

export interface SeoLinkCheck {
  articleTotal: number;
  linkTotal: number;
  checkedTotal: number;
  brokenTotal: number;
  truncated: boolean;
  links: SeoLinkResult[];
}
