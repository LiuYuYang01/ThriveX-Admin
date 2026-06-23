import Request from '@/utils/request';
import { RecordComment, RecordCommentFilterQueryParams } from '@/types/app/recordComment';

// 删除说说评论
export const delRecordCommentDataAPI = (id: number) => Request('DELETE', `/record/comment/${id}`);

// 审核说说评论
export const auditRecordCommentDataAPI = (id: number) => Request('PATCH', `/record/comment/audit/${id}`);

// 获取说说评论列表
export const getRecordCommentListAPI = (params?: RecordCommentFilterQueryParams) =>
  Request<Paginate<RecordComment[]>>('GET', '/record/comment', { params });
