import { useEffect, useState, useRef } from 'react';

import { Card, Spin, Skeleton } from 'antd';

import { getCommentListAPI } from '@/api/comment';
import { getLinkListAPI } from '@/api/web';
import { getWallListAPI } from '@/api/wall';

import { Wall } from '@/types/app/wall';
import { Web } from '@/types/app/web';
import { Comment as CommentType } from '@/types/app/comment';

import Empty from '@/components/Empty';
import Title from '@/components/Title';
import List from './components/List';

import comment from './image/comment.svg';
import info from './image/message.svg';
import link from './image/link.svg';

type Menu = 'comment' | 'link' | 'wall';

export default () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);

  const activeSty = 'bg-[#f9f9ff] dark:bg-[#3c5370] text-primary';
  const [active, setActive] = useState<Menu>('comment');
  const [commentList, setCommentList] = useState<CommentType[]>([]);
  const [linkList, setLinkList] = useState<Web[]>([]);
  const [wallList, setWallList] = useState<Wall[]>([]);

  // 重新获取最新数据
  const fetchData = async (type: Menu) => {
    try {
      // 如果是第一次加载，使用 initialLoading
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      if (type === 'comment') {
        const { data } = await getCommentListAPI({ status: 0, pattern: 'list' });
        setCommentList(data.result);
      } else if (type === 'link') {
        const { data } = await getLinkListAPI({ status: 0, pageNum: 1, pageSize: 9999 });
        setLinkList(data.result);
      } else if (type === 'wall') {
        const { data } = await getWallListAPI({ status: 0 });
        setWallList(data.result);
      }

      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(active);
  }, [active]);

  const renderList = (list: CommentType[] | Web[] | Wall[], type: Menu) => {
    if (list.length === 0) {
      return <Empty />;
    }
    return list.map((item) => <List key={item.id} item={item} type={type} fetchData={(type) => fetchData(type)} setLoading={setLoading} />);
  };

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return (
      <div>
        {/* Title 骨架屏 */}
        <Card className="[&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5! mb-2">
          <Skeleton.Input active size="large" style={{ width: 150, height: 32 }} />
        </Card>

        <Card className="border-stroke mt-2 min-h-[calc(100vh-160px)] [&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5!">
          <div className="flex flex-col md:flex-row w-full">
            {/* 左侧菜单骨架屏 */}
            <div className="w-full min-w-[200px] md:w-2/12 md:min-h-96 mb-5 md:mb-0 pr-4 md:border-b-transparent md:border-r border-stroke dark:border-strokedark">
              <ul className="space-y-1">
                {[1, 2, 3].map((item) => (
                  <li key={item} className="flex items-center w-full py-3 px-4">
                    <Skeleton.Avatar active size={32} shape="square" style={{ marginRight: 16 }} />
                    <Skeleton.Input active size="small" style={{ width: 60, height: 20 }} />
                  </li>
                ))}
              </ul>
            </div>

            {/* 右侧内容骨架屏 */}
            <div className="w-full md:w-10/12 md:pl-6 py-4 space-y-10">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="border-b border-gray-100 pb-4">
                  <Skeleton active paragraph={{ rows: 2 }} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Title value="工作台" />

      <Card className="border-stroke mt-2 min-h-[calc(100vh-160px)]">
        <div className="flex flex-col md:flex-row w-full">
          <div className="w-full min-w-[200px] md:w-2/12 md:min-h-96 mb-5 md:mb-0 pr-4 md:border-b-transparent md:border-r border-stroke dark:border-strokedark">
            <ul className="space-y-1">
              {(['comment', 'link', 'wall'] as Menu[]).map((menu) => (
                <li key={menu} className={`flex items-center w-full py-3 px-4 hover:bg-[#f9f9ff] dark:hover:bg-[#3c5370] hover:text-primary ${active === menu ? activeSty : ''} rounded-md text-base cursor-pointer transition-colors`} onClick={() => setActive(menu)}>
                  <img src={menu === 'comment' ? comment : menu === 'link' ? link : info} alt="" className="w-8 mr-4" />
                  <span>{menu === 'comment' ? '评论' : menu === 'link' ? '友联' : '留言'}</span>
                </li>
              ))}
            </ul>
          </div>

          <Spin spinning={loading}>
            <div className="w-full md:w-10/12 md:pl-6 py-4 space-y-10">
              {active === 'link' && renderList(linkList, 'link')}
              {active === 'comment' && renderList(commentList, 'comment')}
              {active === 'wall' && renderList(wallList, 'wall')}
            </div>
          </Spin>
        </div>
      </Card>
    </div>
  );
};
