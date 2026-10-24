import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Popconfirm, Table, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { FiEdit2, FiImage, FiLock, FiPlus, FiRotateCcw, FiSearch, FiTrash2 } from 'react-icons/fi';

import RangePicker from '@/components/RangePicker';
import Title from '@/components/Title';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';
import { delDiaryDataAPI, getDiaryCredentialListAPI, getDiaryListAPI } from '@/api/diary';
import { getWeatherMeta } from '@/constants/weather';
import type { Diary, DiaryFilterQueryParams } from '@/types/app/diary';

import DiaryCredentialDrawer from './DiaryCredentialDrawer';

const DEFAULT_PAGE_SIZE = 8;

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

interface DiaryFilterForm {
  keyword?: string;
  range?: [Dayjs, Dayjs] | null;
}

export default function DiaryPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [credentialOpen, setCredentialOpen] = useState(false);
  const [credentialCount, setCredentialCount] = useState<number | null>(null);

  const [list, setList] = useState<Diary[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<DiaryFilterQueryParams>({ pageNum: 1, pageSize: DEFAULT_PAGE_SIZE });

  const [form] = Form.useForm<DiaryFilterForm>();
  const hasActiveFilters = Boolean(filter.keyword?.trim() || filter.startDate || filter.endDate);

  const getList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getDiaryListAPI({
        keyword: filter.keyword,
        startDate: filter.startDate,
        endDate: filter.endDate,
        pageNum: filter.pageNum ?? 1,
        pageSize: filter.pageSize ?? DEFAULT_PAGE_SIZE,
      });
      if (data.result.length === 0 && (filter.pageNum ?? 1) > 1) {
        setFilter((prev) => ({ ...prev, pageNum: (prev.pageNum ?? 1) - 1 }));
        return;
      }
      setList(data.result);
      setTotal(data.total);
    } catch (error) {
      console.error('获取日记列表失败：', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void getList();
  }, [getList]);

  useEffect(() => {
    getDiaryCredentialListAPI()
      .then(({ data }) => setCredentialCount(data?.length ?? 0))
      .catch((error) => console.error('获取密语数量失败：', error));
  }, [credentialOpen]);

  const { onValuesChange: onFilterChange, cancelPending } = useDebouncedChange<DiaryFilterForm>({
    debouncedKeys: ['keyword'],
    debounceMs: 400,
    getValues: () => form.getFieldsValue(),
    onApply: (values) => {
      setFilter((prev) => ({
        ...prev,
        pageNum: 1,
        keyword: values.keyword?.trim() || undefined,
        startDate: values.range?.[0] ? values.range[0].format('YYYY-MM-DD') : undefined,
        endDate: values.range?.[1] ? values.range[1].format('YYYY-MM-DD') : undefined,
      }));
    },
  });

  const resetFilters = useCallback(() => {
    cancelPending();
    form.resetFields();
    setFilter((prev) => ({ pageNum: 1, pageSize: prev.pageSize ?? DEFAULT_PAGE_SIZE }));
  }, [cancelPending, form]);

  const delDiaryData = useCallback(
    async (id: number) => {
      try {
        setRemovingId(id);
        await delDiaryDataAPI(id);
        message.success('这一页已经撕掉了');
        await getList();
      } catch (error) {
        console.error('删除日记失败：', error);
      } finally {
        setRemovingId(null);
      }
    },
    [getList],
  );

  const footnote = (diary: Diary) => {
    const weather = getWeatherMeta(diary.weather);
    const chips: string[] = [];
    if (diary.mood) chips.push(diary.mood);
    if (weather) chips.push(`${weather.emoji} ${weather.label}`);
    if (diary.location) chips.push(diary.location);
    return chips;
  };

  const columns: ColumnsType<Diary> = [
    {
      title: '日子',
      dataIndex: 'diaryDate',
      key: 'diaryDate',
      width: 150,
      render: (date: string) => {
        const day = dayjs(date);
        return (
          <div className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 leading-none dark:bg-boxdark-2">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{day.format('M')}月</span>
              <span className="mt-0.5 text-base font-semibold text-slate-700 dark:text-slate-200">
                {day.format('D')}
              </span>
            </div>
            <div className="text-xs leading-5 text-slate-400 dark:text-slate-500">
              <div>{day.format('YYYY')}</div>
              <div>周{WEEKDAYS[day.day()]}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: '内容',
      key: 'content',
      render: (_: unknown, row: Diary) => (
        <div className="max-w-xl">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            {row.title?.trim() || <span className="text-slate-400 dark:text-slate-500">无题</span>}
          </p>
          <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {row.content}
          </p>
        </div>
      ),
    },
    {
      title: '注脚',
      key: 'footnote',
      width: 240,
      render: (_: unknown, row: Diary) => {
        const chips = footnote(row);
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip}
                className="max-w-[120px] truncate rounded-full border border-slate-200/80 px-2 py-0.5 text-[11px] text-slate-500 dark:border-strokedark dark:text-slate-400"
              >
                {chip}
              </span>
            ))}
            {row.images?.length ? (
              <Tooltip title={row.images[0]}>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-boxdark-2 dark:text-slate-400">
                  <FiImage size={11} />
                  {row.images.length}
                </span>
              </Tooltip>
            ) : null}
            {chips.length === 0 && !row.images?.length ? <span className="text-slate-300">—</span> : null}
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 96,
      align: 'center',
      fixed: 'right',
      render: (_: unknown, row: Diary) => (
        <div className="flex items-center justify-center gap-0.5">
          <Tooltip title="改写这一页">
            <button
              type="button"
              onClick={() => navigate(`/create_diary?id=${row.id}`)}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-white/5"
            >
              <FiEdit2 size={15} />
            </button>
          </Tooltip>
          <Popconfirm
            title="删除这篇日记？"
            description="删除后前台立刻读不到，无法恢复"
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={() => delDiaryData(row.id!)}
          >
            <Tooltip title="删除">
              <button
                type="button"
                disabled={removingId === row.id}
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-red-500/80 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <FiTrash2 size={15} />
              </button>
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="日记管理">
        <div className="flex items-center gap-2">
          <Button
            icon={<FiLock size={14} />}
            onClick={() => setCredentialOpen(true)}
            className="cursor-pointer rounded-xl"
          >
            访问密语{credentialCount !== null ? `（${credentialCount}）` : ''}
          </Button>
          <Button
            type="primary"
            icon={<FiPlus />}
            onClick={() => navigate('/create_diary')}
            className="cursor-pointer rounded-xl"
          >
            写一篇日记
          </Button>
        </div>
      </Title>

      <div className="mb-3 flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-[13px] leading-6 text-slate-600 dark:border-blue-900/40 dark:bg-blue-950/25 dark:text-slate-300">
        <FiLock className="mt-1 shrink-0 text-primary" size={15} />
        <p>
          日记不会出现在文章列表、RSS、站点地图或搜索里。访客必须先答对
          <button
            type="button"
            onClick={() => setCredentialOpen(true)}
            className="mx-1 cursor-pointer font-medium text-primary underline decoration-blue-300 underline-offset-2"
          >
            后台密语
          </button>
          才能翻开，解锁状态只保留 7 天。
        </p>
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <header className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
          <Form form={form} layout="inline" onValuesChange={onFilterChange}>
            <Form.Item name="keyword" className="mb-0! min-w-[200px] flex-1">
              <Input prefix={<FiSearch className="text-slate-400" />} placeholder="搜索标题或正文" allowClear />
            </Form.Item>
            <Form.Item name="range" className="mb-0!">
              <RangePicker />
            </Form.Item>
            {hasActiveFilters ? (
              <Button icon={<FiRotateCcw />} onClick={resetFilters} className="cursor-pointer">
                重置
              </Button>
            ) : null}
          </Form>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={list}
            scroll={{ x: 860 }}
            locale={{
              emptyText: hasActiveFilters ? (
                <div className="py-14 text-center">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">没有匹配的日记</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">换个关键词，或者把日期范围放宽一点</p>
                  <Button icon={<FiRotateCcw size={14} />} onClick={resetFilters} className="mt-4 cursor-pointer">
                    清除筛选条件
                  </Button>
                </div>
              ) : (
                <div className="py-14 text-center">
                  <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2">
                    <FiLock size={21} />
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">日记本还是空的</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    写下第一篇，再去「访问密语」放一句只有你知道的话，这本日记就锁好了
                  </p>
                  <Button
                    type="primary"
                    icon={<FiPlus size={14} />}
                    onClick={() => navigate('/create_diary')}
                    className="mt-4 cursor-pointer"
                  >
                    写一篇日记
                  </Button>
                </div>
              ),
            }}
            pagination={{
              position: ['bottomRight'],
              current: filter.pageNum,
              pageSize: filter.pageSize,
              total,
              showSizeChanger: false,
              showTotal: (t) => `共 ${t} 篇`,
              onChange: (current, pageSize) => setFilter((prev) => ({ ...prev, pageNum: current, pageSize })),
              className: 'px-5! py-3!',
            }}
          />
        </div>
      </section>

      <DiaryCredentialDrawer
        open={credentialOpen}
        onClose={() => setCredentialOpen(false)}
        onCountChange={setCredentialCount}
      />
    </div>
  );
}
