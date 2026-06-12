import Request from '@/utils/request';
import { Article, ArticleFilterQueryParams } from '@/types/app/article';

// 新增文章
export const addArticleDataAPI = (data: Article) =>
  Request('POST', '/article', { data });

// 删除文章
export const delArticleDataAPI = (id: number, isDel?: boolean) =>
  Request('DELETE', isDel ? `/article/${id}/1` : `/article/${id}/0`);

// 批量删除文章
export const delBatchArticleDataAPI = (ids: number[]) =>
  Request('DELETE', '/article/batch', { data: ids });
// 还原被删除的文章
export const reductionArticleDataAPI = (id: number) =>
  Request('PATCH', `/article/reduction/${id}`);

// 编辑文章
export const editArticleDataAPI = (data: Article) =>
  Request('PATCH', '/article', { data });

// 获取文章
export const getArticleDataAPI = (id?: number) => Request<Article>('GET', `/article/${id}`)

// 获取文章列表
export const getArticlePagingAPI = (params?: ArticleFilterQueryParams) =>
  Request<Paginate<Article[]>>('GET', `/article`, {
    params,
    paramsSerializer: (queryParams: ArticleFilterQueryParams) => {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
          value.forEach((item) => searchParams.append(key, String(item)));
          return;
        }
        searchParams.append(key, String(value));
      });
      return searchParams.toString();
    },
  });

// 导入文章
export const importArticleDataAPI = (list: File[]) => {
  const formData = new FormData();

  list.forEach((file) => {
    formData.append(`list`, file);
  });

  return Request('POST', '/article/import', {
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}