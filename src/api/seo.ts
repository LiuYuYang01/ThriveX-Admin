import Request from '@/utils/request';
import { SeoArticleCheck, SeoLinkCheck, SeoSitemapCheck } from '@/types/app/seo';

// 文章元信息体检（缺失描述/封面）
export const getSeoArticleCheckAPI = () => Request<SeoArticleCheck>('GET', '/seo/article_check');

// sitemap 生成情况体检
export const getSeoSitemapCheckAPI = () => Request<SeoSitemapCheck>('GET', '/seo/sitemap_check');

// 正文死链检测（服务端逐个探测链接，耗时较长）
export const getSeoLinkCheckAPI = () => Request<SeoLinkCheck>('POST', '/seo/link_check', { timeout: 300000 });
