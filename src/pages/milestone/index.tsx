import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Form,
  Image,
  Input,
  message,
  Modal,
  notification,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FiAlignLeft,
  FiCalendar,
  FiEdit2,
  FiHash,
  FiImage,
  FiPlus,
  FiRotateCcw,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
} from 'react-icons/fi';

import {
  addMilestoneDataAPI,
  delMilestoneDataAPI,
  editMilestoneDataAPI,
  getMilestoneDataAPI,
  getMilestoneListAPI,
} from '@/api/milestone';
import Material from '@/components/Material';
import Title from '@/components/Title';
import { useDebouncedChange } from '@/hooks/useDebouncedChange';
import type { Milestone } from '@/types/app/milestone';

import Skeleton from './Skeleton';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import DatePicker from 'antd/lib/date-picker';
import zhCN from 'antd/es/date-picker/locale/zh_CN';

const DEFAULT_PAGE_SIZE = 8;

dayjs.locale('zh-cn');

const imageCellClass =
  '[&_.ant-image]:block! [&_.ant-image]:size-full! [&_.ant-image-img]:size-full! [&_.ant-image-img]:object-cover! [&_.ant-image-mask]:size-full!';

interface FilterFormValues {
  title?: string;
  year?: string;
}

function toTimestamp(value: number | Dayjs) {
  return typeof value === 'number' ? value : value.valueOf();
}

function formatEventDate(value?: number | Dayjs) {
  if (!value) return '';
  return dayjs(toTimestamp(value)).format('YYYY.MM.DD');
}

function extractYear(eventDate?: number | Dayjs) {
  if (!eventDate) return '';
  return String(dayjs(toTimestamp(eventDate)).year());
}

function sortByEventDateDesc(a: Milestone, b: Milestone) {
  return toTimestamp(b.eventDate) - toTimestamp(a.eventDate) || (b.id ?? 0) - (a.id ?? 0);
}

export default function MilestonePage() {
  const [loading, setLoading] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState<number | null>(null);
  const [modalSubmitLoading, setModalSubmitLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailRequestSeqRef = useRef(0);

  const [milestoneList, setMilestoneList] = useState<Milestone[]>([]);
  const [searchTitle, setSearchTitle] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: DEFAULT_PAGE_SIZE });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  const [form] = Form.useForm<Milestone>();
  const [filterForm] = Form.useForm<FilterFormValues>();

  const isEditing = modalMode === 'edit' && editingId != null;
  const imagePreview = Form.useWatch('image', form) as string | undefined;
  const hasActiveFilters = Boolean(searchTitle.trim() || searchYear.trim());

  const filteredList = useMemo(() => {
    const titleKey = searchTitle.trim().toLowerCase();
    const yearKey = searchYear.trim();
    return milestoneList.filter((item) => {
      const matchTitle = !titleKey || item.title.toLowerCase().includes(titleKey);
      const matchYear = !yearKey || extractYear(item.eventDate) === yearKey;
      return matchTitle && matchYear;
    });
  }, [milestoneList, searchTitle, searchYear]);

  const yearOptions = useMemo(
    () =>
      Array.from(new Set(milestoneList.map((item) => extractYear(item.eventDate)).filter(Boolean)))
        .sort((a, b) => Number(b) - Number(a))
        .map((year) => ({ label: year, value: year })),
    [milestoneList],
  );

  const pagedList = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    return filteredList.slice(start, start + pagination.pageSize);
  }, [filteredList, pagination]);

  const getMilestoneList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getMilestoneListAPI();
      const rows = [...(data.result ?? [])].sort(sortByEventDateDesc);
      setMilestoneList(rows);
    } catch (error) {
      console.error('获取里程碑列表失败：', error);
    } finally {
      setSkeletonLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void getMilestoneList();
  }, [getMilestoneList]);

  const closeModal = useCallback(() => {
    detailRequestSeqRef.current += 1;
    setIsModalOpen(false);
    setModalMode('create');
    setEditingId(null);
    setDetailLoading(false);
    form.resetFields();
  }, [form]);

  const openCreate = useCallback(() => {
    detailRequestSeqRef.current += 1;
    setModalMode('create');
    setEditingId(null);
    setIsModalOpen(true);
    setDetailLoading(false);
    form.resetFields();
  }, [form]);

  const openEdit = useCallback(
    (id: number) => {
      detailRequestSeqRef.current += 1;
      setModalMode('edit');
      setEditingId(id);
      setIsModalOpen(true);
      setDetailLoading(true);
      form.resetFields();
    },
    [form],
  );

  useEffect(() => {
    const run = async () => {
      if (!isModalOpen || modalMode !== 'edit' || !editingId) return;
      const reqSeq = (detailRequestSeqRef.current += 1);
      try {
        setDetailLoading(true);
        const { data } = await getMilestoneDataAPI(editingId);
        if (reqSeq !== detailRequestSeqRef.current) return;
        form.setFieldsValue({
          ...data,
          eventDate: dayjs(data.eventDate),
          tags: data.tags ?? [],
        });
      } catch (error) {
        console.error(error);
      } finally {
        if (reqSeq === detailRequestSeqRef.current) setDetailLoading(false);
      }
    };

    void run();
  }, [editingId, form, isModalOpen, modalMode]);

  const { onValuesChange: onFilterValuesChange } = useDebouncedChange<FilterFormValues>({
    debouncedKeys: ['title', 'year'],
    debounceMs: 400,
    getValues: () => filterForm.getFieldsValue(),
    onApply: (values) => {
      setSearchTitle(values.title ?? '');
      setSearchYear(values.year ?? '');
      setPagination((prev) => ({ ...prev, current: 1 }));
    },
  });

  const resetFilters = () => {
    filterForm.resetFields();
    setSearchTitle('');
    setSearchYear('');
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const delMilestoneData = useCallback(
    async (id: number) => {
      try {
        setBtnLoading(id);
        await delMilestoneDataAPI(id);
        notification.success({ message: '删除成功' });
        if (editingId === id) closeModal();
        await getMilestoneList();
      } catch (error) {
        console.error('删除里程碑失败：', error);
      } finally {
        setBtnLoading(null);
      }
    },
    [closeModal, editingId, getMilestoneList],
  );

  const onSubmit = useCallback(async () => {
    try {
      setModalSubmitLoading(true);
      const values = await form.validateFields();
      const payload: Milestone = {
        ...values,
        eventDate: toTimestamp(values.eventDate),
        tags: values.tags ?? [],
      };

      if (modalMode === 'edit') {
        if (!editingId) throw new Error('缺少 editingId');
        await editMilestoneDataAPI({ ...payload, id: editingId });
        message.success('修改里程碑成功');
      } else {
        await addMilestoneDataAPI(payload);
        message.success('新增里程碑成功');
      }

      await getMilestoneList();
      closeModal();
    } catch (error) {
      console.error(error);
    } finally {
      setModalSubmitLoading(false);
    }
  }, [closeModal, editingId, form, getMilestoneList, modalMode]);

  const columns: ColumnsType<Milestone> = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 72,
        align: 'center',
        render: (id: number) => (
          <span className="inline-flex items-center gap-0.5 font-mono text-xs text-slate-400">
            <FiHash size={11} />
            {id}
          </span>
        ),
      },
      {
        title: '封面',
        dataIndex: 'image',
        key: 'image',
        width: 120,
        render: (url: string) =>
          url ? (
            <div
              className={`relative aspect-video w-[100px] overflow-hidden rounded-lg border border-slate-200/80 dark:border-strokedark ${imageCellClass}`}
            >
              <Image src={url} alt="" preview={{ mask: '预览' }} />
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <FiImage size={13} />
              无封面
            </span>
          ),
      },
      {
        title: '事件',
        key: 'event',
        width: 500,
        render: (_: unknown, row: Milestone) => (
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-amber-600/80 dark:text-amber-400/80">
                {formatEventDate(row.eventDate)}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{row.title}</p>
            {row.description ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{row.description}</p>
            ) : null}
          </div>
        ),
      },
      {
        title: '标签',
        dataIndex: 'tags',
        key: 'tags',
        render: (tags: string[]) =>
          tags?.length ? (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200/80 px-2 py-0.5 text-[10px] text-slate-500 dark:border-strokedark"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        align: 'center',
        width: 100,
        render: (_: unknown, record: Milestone) => (
          <div className="flex items-center justify-center gap-0.5">
            <Tooltip title="编辑">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(record.id!);
                }}
                className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-white/5 cursor-pointer"
              >
                <FiEdit2 size={15} />
              </button>
            </Tooltip>

            <Popconfirm title="确定删除该里程碑？" onConfirm={() => delMilestoneData(record.id!)}>
              <Tooltip title="删除">
                <button
                  type="button"
                  disabled={btnLoading === record.id}
                  onClick={(e) => e.stopPropagation()}
                  className="flex size-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 cursor-pointer"
                >
                  <FiTrash2 size={15} />
                </button>
              </Tooltip>
            </Popconfirm>
          </div>
        ),
      },
    ],
    [btnLoading, delMilestoneData, openEdit],
  );

  if (skeletonLoading) return <Skeleton />;

  return (
    <div className="flex min-h-0 flex-1 flex-col text-slate-600 dark:text-slate-300">
      <Title value="里程碑管理">
        <Button type="primary" icon={<FiPlus />} onClick={openCreate}>
          新增里程碑
        </Button>
      </Title>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        <header className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-strokedark">
          <Form form={filterForm} layout="inline" onValuesChange={onFilterValuesChange}>
            <Form.Item name="title" className="mb-0! min-w-[180px] flex-1">
              <Input prefix={<FiSearch className="text-slate-400" />} placeholder="搜索标题" allowClear />
            </Form.Item>
            <Form.Item name="year" className="mb-0! w-32">
              <Select
                allowClear
                placeholder="选择年份"
                options={yearOptions}
                suffixIcon={<FiCalendar className="text-slate-400" />}
              />
            </Form.Item>
            {hasActiveFilters ? (
              <Button icon={<FiRotateCcw />} onClick={resetFilters}>
                重置
              </Button>
            ) : null}
          </Form>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Spin spinning={loading}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={pagedList}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: filteredList.length,
                showSizeChanger: true,
                onChange: (current, pageSize) => setPagination({ current, pageSize }),
              }}
              scroll={{ x: 960 }}
            />
          </Spin>
        </div>
      </section>

      <Modal
        title={isEditing ? '编辑里程碑' : '新增里程碑'}
        open={isModalOpen}
        onCancel={closeModal}
        onOk={() => void onSubmit()}
        confirmLoading={modalSubmitLoading}
        width={640}
        destroyOnHidden
      >
        <Spin spinning={detailLoading}>
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item
              name="eventDate"
              label="日期"
              rules={[{ required: true, message: '请选择事件日期' }]}
            >
              <DatePicker className="w-full" locale={zhCN} />
            </Form.Item>

            <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
              <Input prefix={<FiAlignLeft className="text-slate-400" />} placeholder="事件标题" />
            </Form.Item>

            <Form.Item name="description" label="描述">
              <Input.TextArea className="min-h-[90px]!" rows={8} placeholder="描述" showCount />
            </Form.Item>

            <Form.Item name="tags" label="标签">
              <Select
                mode="tags"
                placeholder="输入后回车添加标签"
                tokenSeparators={[',']}
              />
            </Form.Item>

            <Form.Item label="封面图">
              <div className="space-y-3">
                <Space.Compact block className="image-url-compact">
                  <Form.Item name="image" noStyle>
                    <Input
                      prefix={<FiImage className="text-slate-400" />}
                      placeholder="请输入图片地址"
                      allowClear
                    />
                  </Form.Item>
                  <Button icon={<FiUploadCloud />} onClick={() => setIsMaterialModalOpen(true)}>
                    选择
                  </Button>
                </Space.Compact>
                {imagePreview ? (
                  <div
                    className={`group relative aspect-video w-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-strokedark dark:bg-boxdark ${imageCellClass}`}
                  >
                    <Image src={imagePreview} alt="" preview={{ mask: '预览' }} />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        form.setFieldValue('image', undefined);
                        void form.validateFields(['image']);
                      }}
                      className="absolute right-1 top-1 z-10 flex size-6 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-all group-hover:opacity-100"
                    >
                      <FiTrash2 size={13} className="relative -top-px left-[-0.5px]" />
                    </button>
                  </div>
                ) : null}
              </div>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Material
        open={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSelect={(urls) => {
          const url = urls[0];
          if (url) {
            form.setFieldValue('image', url);
            void form.validateFields(['image']);
          }
          setIsMaterialModalOpen(false);
        }}
      />
    </div>
  );
}
