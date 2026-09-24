import { useState, useEffect, useCallback } from 'react';
import { Modal, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FiEye, FiCalendar, FiExternalLink, FiFileText } from 'react-icons/fi';
import dayjs from 'dayjs';

import { getArticlePagingAPI } from '@/api/article';
import type { Article } from '@/types/app/article';
import type { Tag } from '@/types/app/tag';
import { useWebStore } from '@/stores';

const PAGE_SIZE = 5;

interface TagArticleModalProps {
  tag: Tag;
  onClose: () => void;
}

export default function TagArticleModal({ tag, onClose }: TagArticleModalProps) {
  const [loading, setLoading] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [total, setTotal] = useState(0);
  const [list, setList] = useState<Article[]>([]);

  const web = useWebStore((state) => state.web);

  const getArticleList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getArticlePagingAPI({ tagId: tag.id, pageNum, pageSize: PAGE_SIZE });
      setList(data.result);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [tag.id, pageNum]);

  useEffect(() => {
    void getArticleList();
  }, [getArticleList]);

  const columns: ColumnsType<Article> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Article) => (
        <a
          href={`${web.url}/article/${record.id}`}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex max-w-[300px] items-center gap-1.5 truncate"
        >
          <span className="truncate font-medium text-slate-700 group-hover:text-primary dark:text-slate-200">
            {text || '暂无标题'}
          </span>
          <FiExternalLink
            size={12}
            className="shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 dark:text-slate-500"
          />
        </a>
      ),
    },
    {
      title: '浏览',
      dataIndex: 'view',
      key: 'view',
      width: 90,
      render: (v: number) => (
        <span className="inline-flex items-center gap-1.5 tabular-nums text-slate-600 dark:text-slate-300">
          <FiEye size={13} className="text-slate-400" />
          <span className="text-sm font-medium">{v ?? 0}</span>
        </span>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 170,
      render: (date: number) => (
        <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-slate-600 dark:text-slate-300">
          <FiCalendar size={13} className="shrink-0 text-slate-400" />
          {dayjs(date).format('YYYY-MM-DD HH:mm')}
        </span>
      ),
    },
  ];

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      width={640}
      title={
        <span className="flex items-center gap-2">
          <span className="text-base font-semibold text-slate-800 dark:text-slate-100">
            关联文章
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-boxdark-2 dark:text-slate-300">
            {total}
          </span>
        </span>
      }
    >
      <Table
        rowKey="id"
        dataSource={list}
        columns={columns}
        loading={loading}
        pagination={{
          position: ['bottomRight'],
          current: pageNum,
          pageSize: PAGE_SIZE,
          total,
          showSizeChanger: false,
          showTotal: (totalCount) => (
            <span className="text-xs text-slate-500 dark:text-slate-400">共 {totalCount} 篇</span>
          ),
          onChange: (page) => setPageNum(page),
        }}
        className="[&_.ant-table-thead>tr>th]:bg-slate-50! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-slate-500! dark:[&_.ant-table-thead>tr>th]:bg-[#1f2838]! dark:[&_.ant-table-thead>tr>th]:text-slate-400!"
        locale={{
          emptyText: (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2 dark:text-slate-500">
                <FiFileText size={22} />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">该标签下暂无文章</p>
            </div>
          ),
        }}
      />
    </Modal>
  );
}
