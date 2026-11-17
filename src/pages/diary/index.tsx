import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Popconfirm, Table, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { FiChevronRight, FiEdit2, FiLock, FiPlus, FiRotateCcw, FiSearch, FiTrash2 } from 'react-icons/fi';

import RangePicker from '@/components/RangePicker';
import Title from '@/components/Title';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';
import { delDiaryDataAPI, getDiaryArchiveAPI, getDiaryListAPI } from '@/api/diary';
import type { Diary, DiaryArchiveYear, DiaryFilterQueryParams } from '@/types/app/diary';

import DiaryCredentialDrawer from './DiaryCredentialDrawer';

const DEFAULT_PAGE_SIZE = 8;

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

// 正文是 Markdown，列表里只给读者看字，去掉语法记号
const plainText = (markdown: string) =>
  markdown
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/[`*_~#>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

interface DiaryFilterForm {
  keyword?: string;
  range?: [Dayjs, Dayjs] | null;
}

export default function DiaryPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [credentialOpen, setCredentialOpen] = useState(false);

  const [list, setList] = useState<Diary[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<DiaryFilterQueryParams>({ pageNum: 1, pageSize: DEFAULT_PAGE_SIZE });
  const [archive, setArchive] = useState<DiaryArchiveYear[]>([]);
  const [archiveKey, setArchiveKey] = useState('archive:all');
  const [expandedYears, setExpandedYears] = useState<number[]>([]);

  const [form] = Form.useForm<DiaryFilterForm>();
  const hasActiveFilters = Boolean(filter.keyword?.trim() || filter.startDate || filter.endDate || filter.year);

  const getArchive = useCallback(async () => {
    try {
      const { data } = await getDiaryArchiveAPI();
      setArchive(data ?? []);
    } catch (error) {
      console.error('获取日记归档目录失败：', error);
    }
  }, []);

  useEffect(() => {
    void getArchive();
  }, [getArchive]);

  // 首次拿到归档后默认展开最近一年
  useEffect(() => {
    if (!archive.length) return;
    setExpandedYears((prev) => (prev.length ? prev : [archive[0].year]));
  }, [archive]);

  const getList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getDiaryListAPI({
        keyword: filter.keyword,
        startDate: filter.startDate,
        endDate: filter.endDate,
        year: filter.year,
        month: filter.month,
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

  const { onValuesChange: onFilterChange, cancelPending } = useDebouncedChange<DiaryFilterForm>({
    debouncedKeys: ['keyword'],
    debounceMs: 400,
    getValues: () => form.getFieldsValue(),
    onApply: (values) => {
      setArchiveKey('');
      setFilter((prev) => ({
        ...prev,
        pageNum: 1,
        keyword: values.keyword?.trim() || undefined,
        startDate: values.range?.[0] ? values.range[0].format('YYYY-MM-DD') : undefined,
        endDate: values.range?.[1] ? values.range[1].format('YYYY-MM-DD') : undefined,
        year: undefined,
        month: undefined,
      }));
    },
  });

  const resetFilters = useCallback(() => {
    cancelPending();
    form.resetFields();
    setArchiveKey('archive:all');
    setFilter((prev) => ({ pageNum: 1, pageSize: prev.pageSize ?? DEFAULT_PAGE_SIZE }));
  }, [cancelPending, form]);

  // 点目录里的年 / 月，逐级收窄列表
  const selectArchive = useCallback((key: string) => {
    if (!key) return;
    setArchiveKey(key);

    if (key === 'archive:all') {
      setFilter((prev) => ({
        ...prev,
        pageNum: 1,
        startDate: undefined,
        endDate: undefined,
        year: undefined,
        month: undefined,
      }));
      return;
    }

    const [type, ...parts] = key.split('-');
    const [year, month] = parts.map(Number);
    setFilter((prev) => ({
      ...prev,
      pageNum: 1,
      startDate: undefined,
      endDate: undefined,
      year,
      month: type === 'y' ? undefined : month,
    }));
  }, []);

  const delDiaryData = useCallback(
    async (id: number) => {
      try {
        setRemovingId(id);
        await delDiaryDataAPI(id);
        message.success('这一页已经撕掉了');
        await Promise.all([getList(), getArchive()]);
      } catch (error) {
        console.error('删除日记失败：', error);
      } finally {
        setRemovingId(null);
      }
    },
    [getArchive, getList],
  );

  const footnote = (diary: Diary) => {
    const chips: string[] = [];
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
        <div className="max-w-2xl">
          {row.title?.trim() ? (
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{row.title}</p>
          ) : null}
          <p className={`line-clamp-2 leading-relaxed text-slate-600 dark:text-slate-300 ${row.title?.trim() ? 'mt-1 text-sm' : 'text-sm'}`}>
            {plainText(row.content)}
          </p>
        </div>
      ),
    },
    {
      title: '注脚',
      key: 'footnote',
      width: 200,
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
            {chips.length === 0 ? <span className="text-slate-300">—</span> : null}
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
            访问密语
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

      <section className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <aside className="hidden w-[228px] shrink-0 flex-col border-r border-slate-100 bg-slate-50/70 dark:border-strokedark dark:bg-boxdark-2/40 md:flex">
          <header className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">归档目录</p>
            <p className="mt-0.5 text-[11px] tracking-wide text-slate-400 dark:text-slate-500">年 / 月</p>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {archive.length ? (
              <nav className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => selectArchive('archive:all')}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                    archiveKey === 'archive:all'
                      ? 'bg-primary/10 text-primary dark:bg-primary/15'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm font-medium">全部日记</span>
                  <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                    {archive.reduce((sum, year) => sum + year.total, 0)}
                  </span>
                </button>

                {archive.map((year) => {
                  const open = expandedYears.includes(year.year);
                  const yearActive = archiveKey === `y-${year.year}`;
                  return (
                    <div key={year.year} className="mt-0.5">
                      <div
                        className={`flex items-center rounded-lg transition-colors ${
                          yearActive ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <button
                          type="button"
                          aria-label={open ? `收起 ${year.year} 年` : `展开 ${year.year} 年`}
                          aria-expanded={open}
                          onClick={() =>
                            setExpandedYears((prev) =>
                              prev.includes(year.year)
                                ? prev.filter((item) => item !== year.year)
                                : [...prev, year.year],
                            )
                          }
                          className="ml-0.5 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <FiChevronRight
                            size={13}
                            className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => selectArchive(`y-${year.year}`)}
                          className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 py-1.5 pr-2.5 text-left"
                        >
                          <span
                            className={`truncate text-sm font-medium ${
                              yearActive ? 'text-primary' : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {year.year} 年
                          </span>
                          <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                            {year.total}
                          </span>
                        </button>
                      </div>

                      <div
                        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="relative mt-0.5 flex flex-col gap-0.5 pb-1 pl-7">
                            <span
                              aria-hidden
                              className="absolute bottom-3 left-3.5 top-1 w-px bg-slate-200 dark:bg-strokedark"
                            />
                            {year.months.map((month) => {
                              const active = archiveKey === `m-${year.year}-${month.month}`;
                              return (
                                <button
                                  key={month.month}
                                  type="button"
                                  onClick={() => selectArchive(`m-${year.year}-${month.month}`)}
                                  className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                                    active
                                      ? 'bg-primary/10 text-primary dark:bg-primary/15'
                                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                                  }`}
                                >
                                  <span className="truncate">{month.name}</span>
                                  <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                                    {month.total}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </nav>
            ) : (
              <p className="px-2 py-6 text-center text-xs text-slate-400 dark:text-slate-500">还没有可归档的日记</p>
            )}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
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
        </div>
      </section>

      <DiaryCredentialDrawer open={credentialOpen} onClose={() => setCredentialOpen(false)} />
    </div>
  );
}
