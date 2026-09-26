import Request from '@/utils/request'

export interface HotArticle {
  id: number
  title: string
  cover?: string | null
  view: number
  likeCount: number
  recentViews: number
}

export interface HotKeyword {
  keyword: string
  count: number
}

export interface ViewTrendItem {
  date: string
  count: number
}

// 热门文章排行（基于自建浏览日志）
export const getHotArticlesAPI = (days = 30, limit = 10) =>
  Request<HotArticle[]>('GET', '/analysis/hot-articles', { params: { days, limit } })

// 站内搜索热词
export const getHotKeywordsAPI = (days = 30, limit = 10) =>
  Request<HotKeyword[]>('GET', '/analysis/hot-keywords', { params: { days, limit } })

// 单篇文章按天浏览趋势
export const getArticleViewTrendAPI = (articleId: number, days = 30) =>
  Request<ViewTrendItem[]>('GET', '/analysis/view-trend', { params: { articleId, days } })
