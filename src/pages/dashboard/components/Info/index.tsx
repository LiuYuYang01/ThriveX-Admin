import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getCommentListAPI } from '@/api/comment';
import { getWallListAPI } from '@/api/wall';
import { getLinkListAPI } from '@/api/web';

export default function InfoCard() {
  const navigate = useNavigate()
  const [commentCount, setCommentCount] = useState<number>(0);
  const [linkCount, setLinkCount] = useState<number>(0);
  const [wallCount, setWallCount] = useState<number>(0);

  const getData = async () => {
    const { data: commentList } = await getCommentListAPI({ status: 0, pattern: 'list' });
    const { data: linkList } = await getLinkListAPI({ status: 0, pageNum: 1, pageSize: 9999 });
    const { data: wallList } = await getWallListAPI({ query: { status: 0 } });

    setCommentCount(commentList.total);
    setLinkCount(linkList.total);
    setWallCount(wallList.length);
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div className="bg-primary rounded-md p-6 sm:p-10 flex flex-col justify-center h-[170px] relative overflow-hidden mb-4">
      {/* 右侧弧形背景装饰 */}
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

        <button className="bg-white text-blue-400 font-bold py-1 px-4 rounded-sm transition-transform hover:scale-105 cursor-pointer" onClick={() => navigate('/work')}>
          去处理
        </button>
      </div>
    </div>
  );
}