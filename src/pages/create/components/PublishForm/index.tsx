import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Form, Input, Button, Select, DatePicker, Cascader, message, Switch, Radio, Tooltip } from 'antd';

const { SHOW_CHILD } = Cascader;
import TextArea from 'antd/es/input/TextArea';
import { RuleObject } from 'antd/es/form';
import dayjs, { Dayjs } from 'dayjs';
import {
  FiImage,
  FiUploadCloud,
  FiCalendar,
  FiEye,
  FiEyeOff,
  FiLock,
  FiSend,
  FiSave,
  FiLayers,
  FiType,
  FiAlignLeft,
  FiTag,
  FiClock,
  FiShield,
  FiArrowUp,
  FiEdit3,
  FiFilePlus,
} from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';

import { addArticleDataAPI, editArticleDataAPI } from '@/api/article';
import { getCateListAPI } from '@/api/cate';
import useAssistant from '@/hooks/useAssistant';
import { addTagDataAPI, getTagListAPI } from '@/api/tag';

import { Cate } from '@/types/app/cate';
import { Tag } from '@/types/app/tag';
import { Article } from '@/types/app/article';

import Material from '@/components/Material';

interface Props {
  data: Article;
  closeModel: () => void;
}

interface FieldType {
  title: string;
  createTime: Dayjs;
  cateIds: number[] | number[][];
  tagIds: (number | string)[];
  cover: string;
  description: string;
  config: {
    top: boolean;
    status: 1 | 2 | 3;
    password: string;
    isEncrypt: boolean;
  };
}

interface AssistantResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const STATUS_OPTIONS: { value: 1 | 2 | 3; label: string; hint: string; icon: ReactNode }[] = [
  { value: 1, label: '公开', hint: '全站可见', icon: <FiEye size={15} /> },
  { value: 2, label: '首页隐藏', hint: '首页不显示', icon: <FiEyeOff size={15} /> },
  { value: 3, label: '全站隐藏', hint: '全站不显示', icon: <FiLock size={15} /> },
];

function findCategoryPathInTree(nodes: Cate[], targetId: number, prefix: number[] = []): number[] | null {
  for (const node of nodes) {
    const nid = node.id;
    if (nid === undefined) continue;
    const next = [...prefix, nid];
    if (nid === targetId) return next;
    if (node.children?.length) {
      const found = findCategoryPathInTree(node.children, targetId, next);
      if (found) return found;
    }
  }
  return null;
}

function resolveArticleCateIds(data: Article): number[] {
  const fromCateIds = data.cateIds?.filter((id): id is number => id != null);
  if (fromCateIds?.length) return fromCateIds;
  return (data.cateList ?? []).map((item) => item.id).filter((id): id is number => id !== undefined);
}

function toCascaderPaths(ids: number[], tree: Cate[]): number[][] {
  if (!ids.length || !tree.length) return [];
  return ids.map((id) => findCategoryPathInTree(tree, id)).filter((path): path is number[] => path != null);
}

type PanelProps = {
  title: string;
  description?: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

function Panel({ title, description, icon, action, children, className = '' }: PanelProps) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark ${className}`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-strokedark">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-boxdark-2 dark:text-slate-400">
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
            {description && (
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
        </div>
        {action}
      </header>
      <div className="space-y-4 px-5 py-5">{children}</div>
    </section>
  );
}

const formItemClass =
  '[&.ant-form-item]:mb-4! [&_.ant-form-item-label>label]:text-slate-500! [&_.ant-form-item-label>label]:text-xs! [&_.ant-form-item-label>label]:font-medium! dark:[&_.ant-form-item-label>label]:text-slate-400! [&_.ant-form-item-explain]:mt-1! [&_.ant-form-item-explain]:text-xs!';

const inputBaseClass =
  'rounded-xl! border-slate-200/80! bg-white! shadow-none! transition-colors! placeholder:text-slate-400! hover:border-slate-300! focus:border-primary! dark:border-strokedark! dark:bg-boxdark-2! dark:placeholder:text-slate-500! dark:hover:border-slate-600!';

const formControlClass =
  'w-full rounded-xl! border-slate-200/80! bg-white! shadow-none! hover:border-slate-300! dark:border-strokedark! dark:bg-boxdark-2! dark:hover:border-slate-600!';

const tagChipClass =
  '[&_.ant-select-selector]:py-2! [&_.ant-select-selection-placeholder]:text-slate-400! dark:[&_.ant-select-selection-placeholder]:text-slate-500! [&_.ant-select-selection-item]:mx-0.5! [&_.ant-select-selection-item]:my-0.5! [&_.ant-select-selection-item]:max-w-full! [&_.ant-select-selection-item]:truncate! [&_.ant-select-selection-item]:rounded-md! [&_.ant-select-selection-item]:border-0! [&_.ant-select-selection-item]:bg-primary/10! [&_.ant-select-selection-item]:px-2! [&_.ant-select-selection-item]:py-0.5! [&_.ant-select-selection-item]:text-xs! [&_.ant-select-selection-item]:font-medium! [&_.ant-select-selection-item]:text-primary! dark:[&_.ant-select-selection-item]:bg-primary/15! dark:[&_.ant-select-selection-item]:text-primary-400! [&_.ant-select-selection-item-remove]:text-primary/50! [&_.ant-select-selection-item-remove]:hover:text-primary! dark:[&_.ant-select-selection-item-remove]:text-primary-400/60! [&_.ant-select-selection-overflow-item]:rounded-md! [&_.ant-select-selection-overflow-item]:border-0! [&_.ant-select-selection-overflow-item]:bg-primary/10! [&_.ant-select-selection-overflow-item]:px-2! [&_.ant-select-selection-overflow-item]:py-0.5! [&_.ant-select-selection-overflow-item]:text-xs! [&_.ant-select-selection-overflow-item]:font-medium! [&_.ant-select-selection-overflow-item]:text-primary! dark:[&_.ant-select-selection-overflow-item]:bg-primary/15! dark:[&_.ant-select-selection-overflow-item]:text-primary-400!';

const multiSelectControlClass = `${formControlClass} ${tagChipClass}`;

const selectControlClass = multiSelectControlClass;

const STATUS_RADIO_GROUP_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
  width: '100%',
} as const;

const statusRadioClass =
  'relative! h-auto! w-full! rounded-xl! border! border-slate-200/80! bg-white! p-3! text-center! shadow-none! before:content-none! hover:border-slate-300! dark:border-strokedark! dark:bg-boxdark-2! dark:hover:border-slate-600! [&_.ant-radio-button]:hidden! [&.ant-radio-button-wrapper-checked]:z-auto! [&.ant-radio-button-wrapper-checked]:border-primary! [&.ant-radio-button-wrapper-checked]:bg-primary/5! [&.ant-radio-button-wrapper-checked]:text-primary! dark:[&.ant-radio-button-wrapper-checked]:bg-primary/10! [&.ant-radio-button-wrapper-checked_.status-icon]:bg-primary/10! [&.ant-radio-button-wrapper-checked_.status-icon]:text-primary! dark:[&.ant-radio-button-wrapper-checked_.status-icon]:bg-primary/20!';

const PublishForm = ({ data, closeModel }: Props) => {
  const [params] = useSearchParams();
  const id = +params.get('id')!;
  const isDraftParams = Boolean(params.get('draft'));

  const [btnLoading, setBtnLoading] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  const [form] = Form.useForm<FieldType>();
  const navigate = useNavigate();
  const coverValue = Form.useWatch('cover', form);

  const [cateList, setCateList] = useState<Cate[]>([]);
  const [tagList, setTagList] = useState<Tag[]>([]);
  const [isEncryptEnabled, setIsEncryptEnabled] = useState(false);

  const isEditing = Boolean(id && !isDraftParams);
  const showDraftActions = (isDraftParams && id) || !id;
  const primaryLabel = isEditing ? '保存修改' : '发布文章';
  const draftLabel = isDraftParams ? '保存草稿' : '存为草稿';

  useEffect(() => {
    if (!id) return form.resetFields();

    const tagIds = (data?.tagList ?? []).map((item: Tag) => item.id);
    const rawCateIds = resolveArticleCateIds(data);
    const catePaths = toCascaderPaths(rawCateIds, cateList);

    const formValues = {
      title: data.title,
      description: data.description,
      cover: data.cover,
      config: data.config,
      status: data.config.status,
      password: data.config.password,
      isEncrypt: data.config.isEncrypt,
      tagIds,
      createTime: dayjs(data.createTime!),
    };

    form.setFieldsValue({
      ...formValues,
      ...(cateList.length > 0 ? { cateIds: catePaths } : {}),
      tagIds: formValues.tagIds?.filter((id): id is number => id !== undefined),
    });
    setIsEncryptEnabled(formValues.isEncrypt);
  }, [data, id, cateList, form]);

  const getCateList = async () => {
    const { data } = await getCateListAPI();
    setCateList(data.result.filter((item: Cate) => item.type === 'cate'));
  };

  const getTagList = async () => {
    const { data } = await getTagListAPI();
    setTagList(data.result);
  };

  useEffect(() => {
    getCateList();
    getTagList();
  }, []);

  const validateURL = (_: RuleObject, value: string) => {
    return !value || /^(https?:\/\/)/.test(value) ? Promise.resolve() : Promise.reject(new Error('请输入有效的封面链接'));
  };

  const onSubmit = async (values: FieldType, isDraft?: boolean) => {
    setBtnLoading(true);
    try {
      const tagIds: number[] = [];
      for (const item of values.tagIds ? values.tagIds : []) {
        if (typeof item === 'string') {
          const tag1 = tagList.find((t) => t.name.toUpperCase() === item.toUpperCase())?.id;
          if (tag1) {
            tagIds.push(tag1);
            continue;
          }
          await addTagDataAPI({ name: item });
          const { data: list } = await getTagListAPI();
          const tag2 = list.result.find((t) => t.name === item)?.id;
          if (tag2) tagIds.push(tag2);
        } else {
          tagIds.push(item);
        }
      }

      const createTime = values.createTime.valueOf();
      const cateIds = [
        ...new Set((values.cateIds ?? []).map((path) => (Array.isArray(path) ? path[path.length - 1] : path))),
      ];

      if (id && !isDraftParams) {
        await editArticleDataAPI({
          id,
          ...values,
          content: data.content,
          tagIds,
          cateIds,
          createTime,
          config: { isDraft: false, isDel: false, ...values.config },
        });
        message.success('编辑成功');
      } else {
        if (!isDraftParams) {
          await addArticleDataAPI({
            id,
            ...values,
            content: data.content,
            tagIds,
            cateIds,
            config: { isDraft: false, isDel: false, ...values.config },
            createTime,
          });
          message.success(isDraft ? '已保存为草稿' : '发布成功');
        } else {
          await editArticleDataAPI({
            id,
            ...values,
            content: data.content,
            tagIds,
            cateIds,
            createTime,
            config: { isDraft: false, isDel: false, ...values.config },
          });
          message.success('发布成功');
        }
      }

      closeModel();
      localStorage.removeItem('article_content');
      navigate(isDraft ? '/draft' : '/article');
      form.resetFields();
    } catch (error) {
      console.error(error);
    } finally {
      setBtnLoading(false);
    }
  };

  const initialValues = {
    config: {
      top: false,
      status: 1 as const,
      password: '',
      isEncrypt: false,
    },
    createTime: dayjs(new Date()),
  };

  const { callAssistant } = useAssistant();
  const [generating, setGenerating] = useState(false);

  const generateTitleAndDescription = async () => {
    try {
      setGenerating(true);
      const content = data.content || '';
      if (!content) {
        message.error('请先输入文章内容');
        return;
      }
      const prompt = `请根据以下文章内容生成一个合适的标题和简短的简介：\n文章内容：\n${content}\n\n要求：\n1. 标题要简洁有力，不超过20个字\n2. 简介要概括文章主要内容，不超过100字\n3. 返回格式为JSON对象，包含title和description字段`;
      const response = await callAssistant(
        [
          { role: 'system', content: '你是 Kimi，由 Moonshot AI 提供的人工智能助手。' },
          { role: 'user', content: prompt },
        ],
        { max_tokens: 200, temperature: 0.3 }
      );
      if (response) {
        const result = (response as AssistantResponse).choices?.[0]?.message?.content?.trim();
        if (result) {
          try {
            let jsonStr = result;
            if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
            const { title, description } = JSON.parse(jsonStr);
            form.setFieldsValue({ title: title || '', description: description || '' });
            message.success('标题和简介已生成');
          } catch (e) {
            console.error('Failed to parse response:', e);
            message.error('解析生成结果失败');
          }
        }
      }
    } catch (error) {
      console.error(error);
      message.error('调用助手失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleDraftSave = () => {
    form.validateFields().then((values) => onSubmit(values, true));
  };

  const hasCoverPreview = Boolean(coverValue && /^(https?:\/\/)/.test(coverValue));

  const modeMeta = isEditing
    ? { label: '编辑文章', hint: '修改后将立即生效', icon: <FiEdit3 size={14} />, tone: 'text-primary bg-primary/10' }
    : isDraftParams
      ? { label: '发布草稿', hint: '完善信息后正式发布', icon: <FiFilePlus size={14} />, tone: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' }
      : { label: '新建发布', hint: '填写元信息后即可上线', icon: <FiSend size={14} />, tone: 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-boxdark-2' };

  return (
    <div className="publish-form flex min-h-full flex-col">
      <Form
        form={form}
        name="publish"
        size="large"
        layout="vertical"
        onFinish={onSubmit}
        autoComplete="off"
        initialValues={initialValues}
        className="flex min-h-0 flex-1 flex-col"
        requiredMark={false}
      >
        <div className="min-h-0 flex-1 overflow-y-auto pb-28 pt-2">
          <div className="mx-auto max-w-5xl space-y-5">
            {/* 上下文条 */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-strokedark dark:bg-boxdark-2/50">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${modeMeta.tone}`}>
                  {modeMeta.icon}
                  {modeMeta.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{modeMeta.hint}</span>
              </div>
              <Tooltip title="基于正文内容自动提炼标题与摘要">
                <Button
                  type="text"
                  loading={generating}
                  onClick={generateTitleAndDescription}
                  className="inline-flex! h-8! items-center! gap-1.5! rounded-lg! border! border-slate-200/80! bg-white! px-3! text-xs! font-medium! text-slate-600! shadow-none! hover:border-primary/40! hover:text-primary! dark:border-strokedark! dark:bg-boxdark! dark:text-slate-300! dark:hover:text-primary-400!"
                  icon={<HiOutlineSparkles size={14} className="text-primary" />}
                >
                  AI 填充
                </Button>
              </Tooltip>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start">
              {/* 主内容区 */}
              <div className="space-y-5">
                <Panel
                  title="标题与摘要"
                  description="读者第一眼看到的信息，直接影响点击率与搜索收录"
                  icon={<FiType size={16} />}
                >
                  <Form.Item
                    className={formItemClass}
                    label="文章标题"
                    name="title"
                    rules={[{ required: true, message: '请输入文章标题' }]}
                  >
                    <Input
                      placeholder="输入清晰、有吸引力的标题"
                      allowClear
                      className={`${inputBaseClass} h-auto! px-3.5! py-2.5! text-base! leading-snug!`}
                    />
                  </Form.Item>

                  <Form.Item className={`${formItemClass} mb-0!`} label="文章摘要" name="description">
                    <TextArea
                      autoSize={{ minRows: 3, maxRows: 5 }}
                      showCount
                      maxLength={200}
                      placeholder="一两句话概括核心内容，便于列表展示与 SEO"
                      className={`${inputBaseClass} px-3.5! py-2.5! text-sm! leading-relaxed!`}
                    />
                  </Form.Item>
                </Panel>

                <Panel
                  title="封面配图"
                  description="可选。建议 16:9 比例，用于列表与社交分享展示"
                  icon={<FiImage size={16} />}
                >
                  <div className="flex flex-col gap-4">
                    {/* 链接输入 */}
                    <div className="flex w-full flex-col gap-3">
                      <Form.Item
                        name="cover"
                        noStyle
                        rules={[{ validator: validateURL }]}
                        className="mb-0! min-w-0! flex-1!"
                      >
                        <Input
                          placeholder="请输入图片地址"
                          allowClear
                          prefix={<FiAlignLeft className="text-slate-400" size={15} />}
                          className={`${inputBaseClass} h-10! text-sm!`}
                        />
                      </Form.Item>
                      <Button
                        type="default"
                        onClick={() => setIsMaterialModalOpen(true)}
                        className="inline-flex! h-10! w-full! items-center! justify-center! gap-2! rounded-xl! border-slate-200/80! bg-white! text-sm! font-medium! text-slate-600! shadow-none! hover:border-primary/40! hover:text-primary! dark:border-strokedark! dark:bg-boxdark-2! dark:text-slate-300! dark:hover:text-primary-400!"
                        icon={<FiUploadCloud size={16} />}
                      >
                        从素材库选择
                      </Button>
                    </div>

                    {/* 缩略预览 */}
                    <button
                      type="button"
                      onClick={() => setIsMaterialModalOpen(true)}
                      className={`group relative flex w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-primary/50 dark:border-strokedark dark:bg-boxdark-2/60 dark:hover:border-primary/40 ${hasCoverPreview ? 'aspect-video' : 'h-28'
                        }`}
                    >
                      {hasCoverPreview ? (
                        <>
                          <img
                            src={coverValue}
                            alt="封面预览"
                            className="size-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                            <FiUploadCloud size={20} className="text-white" />
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 px-3 text-slate-400">
                          <FiImage size={22} />
                          <span className="text-center text-xs leading-snug">点击选择素材</span>
                        </div>
                      )}
                    </button>
                  </div>
                </Panel>
              </div>

              {/* 侧边配置区 */}
              <aside className="space-y-5 lg:sticky lg:top-2 lg:self-start">
                <Panel
                  title="分类与标签"
                  description="帮助读者发现内容，至少选择一个分类"
                  icon={<FiLayers size={16} />}
                >
                  <Form.Item
                    className={formItemClass}
                    label="归属分类"
                    name="cateIds"
                    rules={[{ required: true, message: '请选择文章分类' }]}
                  >
                    <Cascader
                      style={{ width: '100%' }}
                      options={cateList}
                      multiple
                      maxTagCount="responsive"
                      showCheckedStrategy={SHOW_CHILD}
                      fieldNames={{ label: 'name', value: 'id' }}
                      placeholder="选择分类（可多选）"
                      allowClear
                      className={multiSelectControlClass}
                    />
                  </Form.Item>

                  <Form.Item className={`${formItemClass} [&.ant-form-item]:mb-0!`} label="关联标签" name="tagIds">
                    <Select
                      allowClear
                      mode="tags"
                      maxTagCount="responsive"
                      options={tagList}
                      fieldNames={{ label: 'name', value: 'id' }}
                      filterOption={(input, option) => !!option?.name.includes(input)}
                      placeholder="选择或输入，回车创建"
                      suffixIcon={<FiTag className="text-slate-400" size={14} />}
                      className={selectControlClass}
                    />
                  </Form.Item>
                </Panel>

                <Panel
                  title="发布设置"
                  description="控制上线时间与可见范围"
                  icon={<FiCalendar size={16} />}
                >
                  <Form.Item className={formItemClass} label="发布时间" name="createTime">
                    <DatePicker
                      showTime
                      placeholder="默认立即发布"
                      className={`${formControlClass} py-1.5!`}
                      suffixIcon={<FiClock className="text-slate-400" size={15} />}
                      disabledDate={(current) => Boolean(current && current.isAfter(dayjs().endOf('day')))}
                      disabledTime={(current) => {
                        if (!current) return {};
                        const now = dayjs();
                        if (!current.isSame(now, 'day')) return {};
                        return {
                          disabledHours: () => Array.from({ length: 24 }, (_, i) => i).filter((h) => h > now.hour()),
                          disabledMinutes: (selectedHour) =>
                            selectedHour === now.hour()
                              ? Array.from({ length: 60 }, (_, i) => i).filter((m) => m > now.minute())
                              : [],
                          disabledSeconds: (selectedHour, selectedMinute) =>
                            selectedHour === now.hour() && selectedMinute === now.minute()
                              ? Array.from({ length: 60 }, (_, i) => i).filter((s) => s > now.second())
                              : [],
                        };
                      }}
                    />
                  </Form.Item>

                  <Form.Item className={formItemClass} label="可见性" name={['config', 'status']}>
                    <Radio.Group
                      style={STATUS_RADIO_GROUP_STYLE}
                      className="[&_.ant-radio-button-wrapper]:relative! [&_.ant-radio-button-wrapper]:m-0! [&_.ant-radio-button-wrapper:not(:last-child)]:me-0! [&_.ant-radio-button-wrapper]:h-auto! [&_.ant-radio-button-wrapper]:rounded-xl! [&_.ant-radio-button-wrapper]:transition-none! [&_.ant-radio-button-wrapper::before]:hidden!"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <Radio.Button key={opt.value} value={opt.value} className={statusRadioClass}>
                          <span className="flex flex-col items-center gap-1.5">
                            <span className="status-icon flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-boxdark dark:text-slate-400">
                              {opt.icon}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{opt.label}</span>
                            <span className="text-[10px] leading-tight text-slate-400 dark:text-slate-500">{opt.hint}</span>
                          </span>
                        </Radio.Button>
                      ))}
                    </Radio.Group>
                  </Form.Item>

                  <div className="space-y-3 rounded-xl border border-slate-200/80 p-3.5 dark:border-strokedark">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-boxdark dark:text-slate-400">
                          <FiArrowUp size={14} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200">置顶文章</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">在列表顶部优先展示</p>
                        </div>
                      </div>
                      <Form.Item name={['config', 'top']} valuePropName="checked" className="mb-0! shrink-0">
                        <Switch size="small" />
                      </Form.Item>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-strokedark" />

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-boxdark dark:text-slate-400">
                          <FiShield size={14} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200">访问加密</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">访客需输入密码阅读</p>
                        </div>
                      </div>
                      <Form.Item name={['config', 'isEncrypt']} valuePropName="checked" className="mb-0! shrink-0">
                        <Switch size="small" onChange={(checked: boolean) => setIsEncryptEnabled(checked)} />
                      </Form.Item>
                    </div>

                    {isEncryptEnabled && (
                      <Form.Item
                        className="mb-0! pt-1"
                        name={['config', 'password']}
                        rules={[{ required: isEncryptEnabled, message: '请输入访问密码' }]}
                      >
                        <Input.Password
                          placeholder="设置访问密码"
                          prefix={<FiLock className="text-slate-400" size={14} />}
                          className={`${inputBaseClass} h-10! text-sm!`}
                        />
                      </Form.Item>
                    )}
                  </div>
                </Panel>
              </aside>
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-strokedark dark:bg-boxdark/95 sm:px-6">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
              {isEditing ? '保存后将更新线上版本' : '确认信息无误后发布'}
            </p>
            <div className="ml-auto flex items-center gap-2.5">
              {showDraftActions && (
                <Button
                  className="inline-flex! h-10! items-center! gap-2! rounded-xl! border-slate-200/80! px-5! text-sm! font-medium! shadow-none! hover:border-slate-300! hover:bg-slate-50! dark:border-strokedark! dark:hover:bg-boxdark-2!"
                  loading={btnLoading}
                  onClick={handleDraftSave}
                  icon={<FiSave size={16} />}
                >
                  {draftLabel}
                </Button>
              )}
              <Button
                type="primary"
                htmlType="submit"
                loading={btnLoading}
                className="inline-flex! h-10! min-w-32! items-center! gap-2! rounded-xl! px-6! text-sm! font-semibold! shadow-none!"
                icon={<FiSend size={16} />}
              >
                {primaryLabel}
              </Button>
            </div>
          </div>
        </footer>
      </Form>

      <Material
        open={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSelect={(url) => {
          form.setFieldValue('cover', url[0]);
          form.validateFields(['cover']);
        }}
      />
    </div>
  );
};

export default PublishForm;
