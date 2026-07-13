import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoubleRightOutlined, ReloadOutlined } from '@ant-design/icons';
import { message } from 'antd';

import { getCommentListAPI } from '@/api/comment';
import { getRecordCommentListAPI } from '@/api/recordComment';
import { revalidateFrontendCacheAPI } from '@/api/revalidate';
import { getWallListAPI } from '@/api/wall';
import { getLinkListAPI } from '@/api/web';
import { useWebStore } from '@/stores';

export default function InfoCard() {
  const navigate = useNavigate();
  const web = useWebStore((state) => state.web);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [linkCount, setLinkCount] = useState<number>(0);
  const [wallCount, setWallCount] = useState<number>(0);
  const [revalidating, setRevalidating] = useState(false);

  const getData = async () => {
    const [{ data: commentList }, { data: recordCommentList }, { data: linkList }, { data: wallList }] =
      await Promise.all([
        getCommentListAPI({ status: 0, pattern: 'list' }),
        getRecordCommentListAPI({ status: 0, pageNum: 1, pageSize: 9999 }),
        getLinkListAPI({ status: 0, pageNum: 1, pageSize: 9999 }),
        getWallListAPI({ status: 0 }),
      ]);

    setCommentCount(commentList.total + (recordCommentList.total ?? recordCommentList.result?.length ?? 0));
    setLinkCount(linkList.total);
    setWallCount(wallList.total);
  };

  useEffect(() => {
    getData();
  }, []);

  const handleRevalidate = async () => {
    const baseUrl = web.url || 'http://localhost:3000';

    setRevalidating(true);
    try {
      await revalidateFrontendCacheAPI(baseUrl);
      message.success('前端缓存已清空');
    } catch (error) {
      console.error(error);
      message.error('清空缓存失败，请检查前端服务是否运行');
    } finally {
      setRevalidating(false);
    }
  };

  return (
    <div className="bg-primary rounded-xl p-6 sm:p-10 flex flex-col justify-center h-[170px] relative overflow-hidden mb-3">
      <div
        className="absolute right-[-60px] top-[-40px] w-[300px] h-[300px] bg-blue-300 opacity-40 z-0"
        style={{
          borderRadius: '60% 40% 60% 40% / 60% 60% 40% 40%',
        }}
      />

      <div className="relative z-10">
        <h1 className="text-white text-xl font-bold sm:text-2xl">
          欢迎使用 ThriveX 现代化博客管理系统
        </h1>

        <p className="text-white text-sm mt-2 mb-3">
          当前有 <span className="text-white text-2xl font-bold">{commentCount}</span> 条评论，<span className="text-white text-2xl font-bold">{linkCount}</span> 条友链，<span className="text-white text-2xl font-bold">{wallCount}</span> 条留言。
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="bg-white text-blue-400 font-bold py-1 px-4 rounded-sm transition-transform hover:scale-105 cursor-pointer flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            onClick={() => navigate('/work')}
          >
            去处理 <DoubleRightOutlined />
          </button>

          <button
            className="bg-white/20 text-white font-bold py-1 px-4 rounded-sm border border-white/40 transition-transform hover:scale-105 cursor-pointer flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            onClick={handleRevalidate}
            disabled={revalidating}
          >
            {revalidating ? '清空中...' : '清空前端缓存'} <ReloadOutlined spin={revalidating} />
          </button>
        </div>
      </div>
    </div>
  );
}