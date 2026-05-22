import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Button,
  Form,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Select,
  Spin,
  Tag,
  message,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import TextArea from 'antd/es/input/TextArea';
import {
  FiMessageSquare,
  FiSearch,
  FiTrash2,
  FiCornerUpRight,
  FiUser,
  FiMail,
  FiStar,
  FiRotateCcw,
  FiInbox,
  FiTag,
  FiClock,
} from 'react-icons/fi';

import { getWallListAPI, delWallDataAPI, getWallCateListAPI, updateChoiceAPI } from '@/api/wall';
import { sendReplyWallEmailAPI } from '@/api/email';
import Title from '@/components/Title';
import RangePicker from '@/components/RangePicker';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';
import { useWebStore } from '@/stores';
import type { Cate, Wall, WallFilterQueryParams } from '@/types/app/wall';
import Skeleton from './Skeleton';

interface WallFilterFormValues {
  content?: string;
  cateId?: number;
  createTime?: [dayjs.Dayjs, dayjs.Dayjs];
}

function CateBadge({ name, color }: { name: string; color?: string }) {
  return (
    <Tag
      bordered={false}
      color={color}
      className="m-0! shrink-0 text-xs! font-medium! text-slate-700! dark:text-slate-200!"
    >
      {name}
    </Tag>
  );
}

function WallAvatar({ name }: { name?: string }) {
  const letter = (name || '匿').slice(0, 1);
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-sm font-semibold text-slate-600 dark:border-strokedark dark:bg-boxdark-2 dark:text-slate-300">
      {letter}
    </span>
  );
}

interface WallCardProps {
  record: Wall;
  onToggleChoice: (id: number) => void;
  onReply: (record: Wall) => void;
  onDelete: (id: number) => void;
}

function WallCard({ record, onToggleChoice, onReply, onDelete }: WallCardProps) {
  const isChoice = record.isChoice === 1;

  return (
    <article
      className={`group flex flex-col rounded-2xl border bg-white transition-colors dark:bg-boxdark ${
        isChoice
          ? 'border-amber-200/80 dark:border-amber-500/30'
          : 'border-slate-200/80 dark:border-strokedark'
      }`}
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <WallAvatar name={record.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {record.name || '匿名'}
            </h3>
            {record.cate?.name && (
              <CateBadge name={record.cate.name} color={record.color} />
            )}
            {isChoice && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <FiStar size={10} className="fill-current" />
                精选
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center gap-1 tabular-nums">
              <FiClock size={11} />
              {dayjs(+record.createTime).format('YYYY-MM-DD HH:mm')}
            </span>
            <span className="font-mono">#{record.id}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3">
        <p className="line-clamp-4 text-[15px] leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-200">
          {record.content || (
            <span className="italic text-slate-400 dark:text-slate-500">暂无内容</span>
          )}
        </p>
      </div>

      {record.email && (
        <div className="mx-4 mb-3 flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-500 dark:border-strokedark dark:bg-boxdark-2/50 dark:text-slate-400">
          <FiMail size={12} className="shrink-0" />
          <span className="truncate">{record.email}</span>
        </div>
      )}

      <footer className="mt-auto flex items-center gap-1 border-t border-slate-100 px-2 py-2 dark:border-strokedark">
        <Tooltip title={isChoice ? '取消精选' : '设为精选'}>
          <button
            type="button"
            onClick={() => onToggleChoice(record.id)}
            aria-label={isChoice ? '取消精选' : '设为精选'}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors cursor-pointer ${
              isChoice
                ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10'
                : 'text-slate-500 hover:bg-slate-50 hover:text-amber-600 dark:hover:bg-white/5 dark:hover:text-amber-400'
            }`}
          >
            <FiStar size={14} className={isChoice ? 'fill-current' : ''} />
            {isChoice ? '已精选' : '精选'}
          </button>
        </Tooltip>
        <span className="h-4 w-px bg-slate-200 dark:bg-strokedark" />
        <Tooltip title={record.email ? '邮件回复' : '未留邮箱，无法回复'}>
          <button
            type="button"
            onClick={() => onReply(record)}
            disabled={!record.email}
            aria-label="邮件回复"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-sky-500/10 dark:hover:text-sky-400 cursor-pointer"
          >
            <FiCornerUpRight size={14} />
            回复
          </button>
        </Tooltip>
        <span className="h-4 w-px bg-slate-200 dark:bg-strokedark" />
        <Popconfirm
          title="删除留言"
          description={`确定删除「${record.name || '该用户'}」的留言吗？`}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete(record.id)}
        >
          <Tooltip title="删除">
            <button
              type="button"
              aria-label="删除留言"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 cursor-pointer"
            >
              <FiTrash2 size={14} />
              删除
            </button>
          </Tooltip>
        </Popconfirm>
      </footer>
    </article>
  );
}

export default function WallPage() {
  const web = useWebStore((state) => state.web);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const isFirstLoadRef = useRef(true);

  const [total, setTotal] = useState(0);
  const [filterParams, setFilterParams] = useState<WallFilterQueryParams>({
    status: 0,
    pageNum: 1,
    pageSize: 8,
  });

  const [replyTarget, setReplyTarget] = useState<Wall | null>(null);
  const [list, setList] = useState<Wall[]>([]);
  const [replyInfo, setReplyInfo] = useState('');
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [cateList, setCateList] = useState<Cate[]>([]);

  const fetchWallCateList = useCallback(async () => {
    const { data } = await getWallCateListAPI();
    setCateList(data.filter((item) => item.id !== 1));
  }, []);

  const fetchWallList = useCallback(async () => {
    try {
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getWallListAPI(filterParams);
      setList(data.result);
      setTotal(data.total ?? data.result.length);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, [filterParams]);

  const deleteWallItem = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        await delWallDataAPI(id);
        await fetchWallList();
        message.success('🎉 删除留言成功');
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    },
    [fetchWallList],
  );

  const handleToggleChoice = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        await updateChoiceAPI(id);
        message.success('🎉 操作成功');
        await fetchWallList();
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    },
    [fetchWallList],
  );

  useEffect(() => {
    void fetchWallCateList();
  }, [fetchWallCateList]);

  useEffect(() => {
    void fetchWallList();
  }, [fetchWallList]);

  const [filterForm] = Form.useForm<WallFilterFormValues>();

  const hasActiveFilters = Boolean(
    filterParams.content?.trim() ||
      filterParams.cateId ||
      filterParams.startDate ||
      filterParams.endDate,
  );

  const pageStats = useMemo(() => {
    const choiceCount = list.filter((item) => item.isChoice === 1).length;
    const withEmail = list.filter((item) => item.email).length;
    return { choiceCount, withEmail };
  }, [list]);

  const { onValuesChange: onFilterValuesChange } = useDebouncedChange<WallFilterFormValues>({
    debouncedKeys: ['content'],
    debounceMs: 400,
    getValues: () => filterForm.getFieldsValue() as WallFilterFormValues,
    onApply: (values) => {
      setFilterParams((prev) => ({
        ...prev,
        pageNum: 1,
        content: values.content,
        cateId: values.cateId,
        startDate: values.createTime?.[0]?.valueOf(),
        endDate: values.createTime?.[1]?.valueOf(),
      }));
    },
  });

  const resetFilters = () => {
    filterForm.resetFields();
    setFilterParams((prev) => ({
      status: prev.status ?? 0,
      pageNum: 1,
      pageSize: prev.pageSize ?? 8,
    }));
  };

  const openReply = useCallback((record: Wall) => {
    setReplyTarget(record);
    setReplyInfo('');
    setIsReplyModalOpen(true);
  }, []);

  const onHandleReply = async () => {
    if (!replyTarget?.id) return;
    if (!replyInfo.trim()) {
      message.warning('请输入回复内容');
      return;
    }
    if (!replyTarget.email) {
      message.warning('该留言未留下邮箱，无法发送邮件回复');
      return;
    }

    try {
      setBtnLoading(true);
      await sendReplyWallEmailAPI({
        to: replyTarget.email,
        recipient: replyTarget.name,
        your_content: replyTarget.content,
        reply_content: replyInfo,
        time: dayjs(+replyTarget.createTime).format('YYYY-MM-DD HH:mm:ss'),
        url: web.url + '/wall/all',
      });
      message.success('🎉 回复留言成功');
      setIsReplyModalOpen(false);
      setReplyInfo('');
      setReplyTarget(null);
      await fetchWallList();
    } catch (error) {
      console.error(error);
    } finally {
      setBtnLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Skeleton />
      </div>
    );
  }

  const pageSize = filterParams.pageSize ?? 8;
  const pageNum = filterParams.pageNum ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const statItems = [
    {
      label: '留言总数',
      value: total,
      icon: FiMessageSquare,
      accent: 'text-primary bg-primary/10 dark:bg-primary/20',
    },
    {
      label: '本页精选',
      value: pageStats.choiceCount,
      icon: FiStar,
      accent: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
    },
    {
      label: '本页可回复',
      value: pageStats.withEmail,
      icon: FiMail,
      accent: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-300',
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="留言管理" />

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3">
          {statItems.map(({ label, value, icon: Icon, accent }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-strokedark dark:bg-boxdark sm:gap-3 sm:px-4 sm:py-3"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10 ${accent}`}
              >
                <Icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] text-slate-400 sm:text-xs">{label}</p>
                <p className="text-lg font-semibold tabular-nums text-slate-800 dark:text-slate-100 sm:text-xl">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <header className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
            <Form form={filterForm} onValuesChange={onFilterValuesChange}>
              <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
                <Form.Item name="content" className="mb-0! w-full sm:min-w-[200px] sm:flex-1 sm:max-w-xs">
                  <Input
                    allowClear
                    placeholder="搜索留言内容…"
                    prefix={<FiSearch className="text-slate-400" size={15} />}
                  />
                </Form.Item>
                <Form.Item name="cateId" className="mb-0! w-full sm:w-32">
                  <Select
                    allowClear
                    options={cateList}
                    fieldNames={{ label: 'name', value: 'id' }}
                    placeholder="分类"
                    suffixIcon={<FiTag className="text-slate-400" size={14} />}
                    className="w-full!"
                  />
                </Form.Item>
                <Form.Item name="createTime" className="mb-0! w-full sm:w-auto">
                  <RangePicker
                    className="w-full sm:w-52!"
                    placeholder={['开始', '结束']}
                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                  />
                </Form.Item>
                <Tooltip title="重置筛选">
                  <Button
                    type="text"
                    icon={<FiRotateCcw size={15} />}
                    onClick={resetFilters}
                    disabled={!hasActiveFilters}
                    className="shrink-0 text-slate-400 hover:text-slate-600 disabled:opacity-40 dark:hover:text-slate-200"
                  />
                </Tooltip>
              </div>
            </Form>
          </header>

          <Spin spinning={loading} wrapperClassName="min-h-0 flex-1 [&>.ant-spin-container]:flex [&>.ant-spin-container]:min-h-0 [&>.ant-spin-container]:flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {list.length > 0 ? (
                <ul className="grid list-none gap-3 p-0 m-0 sm:grid-cols-2 2xl:grid-cols-3">
                  {list.map((record) => (
                    <li key={record.id}>
                      <WallCard
                        record={record}
                        onToggleChoice={(id) => void handleToggleChoice(id)}
                        onReply={openReply}
                        onDelete={(id) => void deleteWallItem(id)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2 dark:text-slate-500">
                    <FiInbox size={22} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {hasActiveFilters
                      ? '没有匹配的留言，试试调整筛选条件'
                      : '暂无留言，访客在前台留言后会显示在这里'}
                  </p>
                </div>
              )}
            </div>

            {total > 0 && (
              <footer className="flex shrink-0 flex-col gap-2 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-strokedark">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  第 {pageNum} / {totalPages} 页 · 共 {total} 条
                </span>
                <Pagination
                  size="small"
                  current={pageNum}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger
                  pageSizeOptions={[8, 12, 16, 24]}
                  onChange={(page, size) =>
                    setFilterParams((prev) => ({
                      ...prev,
                      pageNum: page,
                      pageSize: size ?? prev.pageSize ?? 8,
                    }))
                  }
                />
              </footer>
            )}
          </Spin>
        </section>
      </div>

      <Modal
        title={
          <span className="inline-flex items-center gap-2">
            <FiCornerUpRight className="text-primary" />
            邮件回复留言
          </span>
        }
        open={isReplyModalOpen}
        footer={null}
        onCancel={() => {
          setIsReplyModalOpen(false);
          setReplyTarget(null);
        }}
        destroyOnClose
        classNames={{ body: 'pt-2!' }}
      >
        {replyTarget && (
          <div className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-3 dark:border-strokedark dark:bg-boxdark-2/60">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <FiUser size={14} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {replyTarget.name || '匿名'}
              </span>
              {replyTarget.cate?.name && (
                <CateBadge name={replyTarget.cate.name} color={replyTarget.color} />
              )}
            </div>
            <p className="line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {replyTarget.content}
            </p>
            {replyTarget.email && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <FiMail size={12} />
                将发送至 {replyTarget.email}
              </p>
            )}
          </div>
        )}

        <TextArea
          value={replyInfo}
          onChange={(e) => setReplyInfo(e.target.value)}
          placeholder="写下回复内容，将以邮件形式发送给留言者…"
          autoSize={{ minRows: 4, maxRows: 8 }}
          className="rounded-lg!"
        />

        <div className="mt-4 flex gap-3">
          <Button
            className="h-10! flex-1"
            onClick={() => {
              setIsReplyModalOpen(false);
              setReplyTarget(null);
            }}
          >
            取消
          </Button>
          <Button
            type="primary"
            loading={btnLoading}
            onClick={() => void onHandleReply()}
            icon={<FiCornerUpRight />}
            className="h-10! flex-1"
          >
            发送邮件
          </Button>
        </div>
      </Modal>
    </div>
  );
}
