import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Table,
  Tag,
  message,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import TextArea from 'antd/es/input/TextArea';
import {
  FiSearch,
  FiTrash2,
  FiCornerUpRight,
  FiUser,
  FiMail,
  FiStar,
  FiRotateCcw,
  FiInbox,
  FiTag,
  FiMessageSquare,
  FiX,
  FiHash,
  FiCalendar,
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

function WallAvatar({ name, featured }: { name?: string; featured?: boolean }) {
  const letter = (name || '匿').slice(0, 1);
  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${featured
          ? 'border-amber-300/90 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300'
          : 'border-slate-200/80 bg-slate-50 text-slate-600 dark:border-strokedark dark:bg-boxdark-2 dark:text-slate-300'
        }`}
    >
      {letter}
    </span>
  );
}

interface WallDetailPanelProps {
  record: Wall;
  onClose: () => void;
  onToggleChoice: (id: number) => void;
  onReply: (record: Wall) => void;
  onDelete: (id: number) => void;
}

function WallDetailPanel({
  record,
  onClose,
  onToggleChoice,
  onReply,
  onDelete,
}: WallDetailPanelProps) {
  const isChoice = record.isChoice === 1;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">留言详情</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭详情"
          className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-200"
        >
          <FiX size={16} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-strokedark">
          <WallAvatar name={record.name} featured={isChoice} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {record.name || '匿名'}
              </p>
              {isChoice && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  <FiStar size={9} className="fill-current" />
                  精选
                </span>
              )}
            </div>
            <time className="mt-0.5 block font-mono text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
              {dayjs(+record.createTime).format('YYYY-MM-DD HH:mm:ss')}
            </time>
          </div>
        </div>

        <div className="px-4 py-3.5">
          <p className="border-l-2 border-primary/40 pl-3 text-[15px] leading-relaxed whitespace-pre-wrap wrap-break-word text-slate-800 dark:text-slate-100">
            {record.content || '—'}
          </p>
        </div>

        <footer className="space-y-2.5 border-t border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-strokedark dark:bg-boxdark-2/40">
          <div className="flex min-w-0 items-start gap-2.5 text-xs">
            <FiMail size={14} className="mt-0.5 shrink-0 text-slate-400" />
            <span className="w-8 shrink-0 text-slate-400">邮箱</span>
            <span className="min-w-0 flex-1 break-all text-slate-600 dark:text-slate-300">
              {record.email || '暂无'}
            </span>
          </div>
          <div className="flex min-w-0 items-start gap-2.5 text-xs">
            <FiTag size={14} className="mt-0.5 shrink-0 text-slate-400" />
            <span className="w-8 shrink-0 text-slate-400">分类</span>
            <div className="min-w-0 flex-1">
              {record.cate?.name ? (
                <CateBadge name={record.cate.name} color={record.color} />
              ) : (
                <span className="text-slate-400">未分类</span>
              )}
            </div>
          </div>
          <div className="flex min-w-0 items-start gap-2.5 text-xs">
            <FiHash size={14} className="mt-0.5 shrink-0 text-slate-400" />
            <span className="w-8 shrink-0 text-slate-400">编号</span>
            <span className="min-w-0 flex-1 font-mono tabular-nums text-slate-600 dark:text-slate-300">
              #{record.id}
            </span>
          </div>
        </footer>
      </div>

      <div className="shrink-0 space-y-2 border-t border-slate-100 p-4 dark:border-strokedark">
        <Tooltip title={record.email ? undefined : '留言者未留下邮箱'}>
          <Button
            type="primary"
            block
            icon={<FiCornerUpRight />}
            disabled={!record.email}
            onClick={() => onReply(record)}
            className="h-10!"
          >
            邮件回复这条留言
          </Button>
        </Tooltip>
        <div className="flex gap-2">
          <Tooltip title={isChoice ? '取消精选' : '设为精选'}>
            <Button
              type={isChoice ? 'primary' : 'default'}
              icon={<FiStar className={isChoice ? 'fill-current' : ''} />}
              onClick={() => onToggleChoice(record.id)}
              className="h-10! min-w-0 flex-1"
            >
              {isChoice ? '已精选' : '设为精选'}
            </Button>
          </Tooltip>
          <Popconfirm
            title="删除留言"
            description={`确定删除「${record.name || '该用户'}」的留言吗？`}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(record.id)}
          >
            <Button danger type="default" icon={<FiTrash2 />} className="h-10! shrink-0 px-3!">
              删除
            </Button>
          </Popconfirm>
        </div>
      </div>
    </div>
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
    status: 1,
    pageNum: 1,
    pageSize: 8,
  });

  const [selected, setSelected] = useState<Wall | null>(null);
  const [list, setList] = useState<Wall[]>([]);
  const [replyInfo, setReplyInfo] = useState('');
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<Wall | null>(null);
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
      setSelected((prev) => {
        if (!prev?.id) return prev;
        return data.result.find((item) => item.id === prev.id) ?? null;
      });
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
        if (selected?.id === id) setSelected(null);
        await fetchWallList();
        message.success('🎉 删除留言成功');
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    },
    [fetchWallList, selected?.id],
  );

  const handleToggleChoice = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        await updateChoiceAPI(id);
        message.success('操作成功');
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

  const columns: ColumnsType<Wall> = useMemo(
    () => [
      {
        title: '留言者',
        dataIndex: 'name',
        key: 'name',
        width: 168,
        render: (_: string, record: Wall) => {
          const isChoice = record.isChoice === 1;
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelected(record);
              }}
              className="flex w-full min-w-0 items-center gap-2.5 text-left transition-opacity hover:opacity-80 cursor-pointer"
            >
              <WallAvatar name={record.name} featured={isChoice} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {record.name || '匿名'}
                  </p>
                  {isChoice && (
                    <FiStar
                      size={12}
                      className="shrink-0 fill-amber-400 text-amber-400"
                      aria-hidden
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                  {record.email || '暂无邮箱'}
                </p>
              </div>
            </button>
          );
        },
      },
      {
        title: '留言内容',
        dataIndex: 'content',
        key: 'content',
        ellipsis: true,
        render: (text: string, record: Wall) =>
          text ? (
            <Tooltip placement="topLeft" title={text}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(record);
                }}
                className={`line-clamp-2 text-left text-sm leading-relaxed transition-colors cursor-pointer ${selected?.id === record.id
                    ? 'text-primary'
                    : 'text-slate-700 hover:text-primary dark:text-slate-200'
                  }`}
              >
                {text}
              </button>
            </Tooltip>
          ) : (
            <span className="text-xs italic text-slate-400 dark:text-slate-500">暂无内容</span>
          ),
      },
      {
        title: '分类',
        dataIndex: ['cate', 'name'],
        key: 'cate',
        width: 100,
        render: (_: string, record: Wall) =>
          record.cate?.name ? (
            <CateBadge name={record.cate.name} color={record.color} />
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500">未分类</span>
          ),
      },
      {
        title: '留言时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 120,
        render: (date: number) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium tabular-nums text-slate-700 dark:text-slate-200">
              {dayjs(+date).format('YYYY-MM-DD')}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
              {dayjs(+date).format('HH:mm')}
            </span>
          </div>
        ),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        align: 'center',
        width: 100,
        render: (_: string, record: Wall) => {
          const isChoice = record.isChoice === 1;
          return (
            <div className="flex items-center justify-center gap-0.5">
              <Tooltip title={isChoice ? '取消精选' : '设为精选'}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleToggleChoice(record.id);
                  }}
                  aria-label={isChoice ? '取消精选' : '设为精选'}
                  className={`flex size-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${isChoice
                      ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:text-amber-400 dark:hover:bg-amber-500/10'
                      : 'text-slate-400! hover:bg-slate-100! hover:text-amber-500! dark:hover:bg-white/5!'
                    }`}
                >
                  <FiStar size={16} className={isChoice ? 'fill-current' : ''} />
                </button>
              </Tooltip>
              <Tooltip title={record.email ? '邮件回复' : '未留邮箱'}>
                <button
                  type="button"
                  disabled={!record.email}
                  onClick={(e) => {
                    e.stopPropagation();
                    openReply(record);
                  }}
                  aria-label="邮件回复"
                  className="flex size-8 items-center justify-center rounded-lg text-slate-400! transition-colors hover:bg-slate-100! hover:text-primary! disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5! dark:hover:text-primary! cursor-pointer"
                >
                  <FiCornerUpRight size={16} />
                </button>
              </Tooltip>
              <Popconfirm
                title="删除留言"
                description={`确定删除「${record.name || '该用户'}」的留言吗？`}
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                onConfirm={() => deleteWallItem(record.id)}
              >
                <Tooltip title="删除">
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="删除留言"
                    className="flex size-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 cursor-pointer"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </Tooltip>
              </Popconfirm>
            </div>
          );
        },
      },
    ],
    [deleteWallItem, handleToggleChoice, openReply, selected?.id],
  );

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

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="留言管理" />

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <header className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
            <Form form={filterForm} onValuesChange={onFilterValuesChange}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <Form.Item name="content" className="mb-0! w-full sm:w-52">
                    <Input
                      allowClear
                      placeholder="搜索留言内容…"
                      prefix={<FiSearch className="text-slate-400" size={15} />}
                    />
                  </Form.Item>
                  <Form.Item name="cateId" className="mb-0! w-full sm:w-28">
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
                      className="w-full sm:w-56!"
                      placeholder={['开始', '结束']}
                      disabledDate={(current) => current && current > dayjs().endOf('day')}
                    />
                  </Form.Item>
                  <Tooltip title="重置筛选">
                    <Button
                      type="text"
                      icon={<FiRotateCcw size={15} />}
                      onClick={resetFilters}
                      className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    />
                  </Tooltip>
                </div>
                <p className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                  <FiCalendar className="mr-1 inline -mt-px" size={12} />
                  点击行或内容可查看详情
                </p>
              </div>
            </Form>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
          <Table
            rowKey="id"
            dataSource={list}
            columns={columns}
            loading={loading}
            scroll={{ x: 'max-content' }}
            onRow={(record) => ({
              onClick: () => setSelected(record),
              className: `cursor-pointer transition-colors ${selected?.id === record.id
                  ? '[&>td]:bg-primary/5! dark:[&>td]:bg-primary/10!'
                  : 'hover:[&>td]:bg-slate-50/80! dark:hover:[&>td]:bg-boxdark-2/50!'
                }`,
            })}
            pagination={{
              current: pageNum,
              pageSize,
              total,
              position: ['bottomRight'],
              showSizeChanger: true,
              pageSizeOptions: [8, 12, 16, 24],
              onChange: (page, size) =>
                setFilterParams((prev) => ({
                  ...prev,
                  pageNum: page,
                  pageSize: size ?? prev.pageSize ?? 8,
                })),
              className: 'px-4! py-3!',
              showTotal: (t) => (
                <span className="text-xs text-slate-500 dark:text-slate-400">共 {t} 条</span>
              ),
            }}
            className="min-h-0 flex-1 [&_.ant-table-thead>tr>th]:bg-slate-50! [&_.ant-table-thead>tr>th]:font-medium! [&_.ant-table-thead>tr>th]:text-slate-500! dark:[&_.ant-table-thead>tr>th]:bg-boxdark-2! dark:[&_.ant-table-thead>tr>th]:text-slate-400!"
            locale={{
              emptyText: (
                <div className="py-14 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2 dark:text-slate-500">
                    <FiInbox size={22} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    暂无留言，访客在前台留言后会显示在这里
                  </p>
                </div>
              ),
            }}
          />
          </div>
        </section>

        <aside
          className={`w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark lg:w-[320px] xl:w-[360px] ${selected
              ? 'flex min-h-[280px] flex-col lg:min-h-0'
              : 'hidden lg:flex lg:min-h-0 lg:flex-col'
            }`}
        >
          {selected ? (
            <WallDetailPanel
              record={selected}
              onClose={() => setSelected(null)}
              onToggleChoice={(id) => void handleToggleChoice(id)}
              onReply={openReply}
              onDelete={(id) => void deleteWallItem(id)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2 dark:text-slate-500">
                <FiMessageSquare size={22} />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">选择一条留言</p>
              <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                在左侧列表点击任意行，可在此查看完整内容与联系方式
              </p>
            </div>
          )}
        </aside>
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
            <div className="mb-1.5 flex items-center gap-2">
              <FiUser size={14} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {replyTarget.name || '匿名'}
              </span>
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
