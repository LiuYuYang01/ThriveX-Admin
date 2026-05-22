import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Form, Input, Button, Select, DatePicker, Cascader, message, Switch, Radio, Tooltip } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { RuleObject } from 'antd/es/form';
import dayjs, { Dayjs } from 'dayjs';
import {
  FiType,
  FiImage,
  FiUploadCloud,
  FiFolder,
  FiTag,
  FiCalendar,
  FiEye,
  FiEyeOff,
  FiLock,
  FiSend,
  FiSave,
  FiSettings,
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
  { value: 1, label: '正常', hint: '全站可见', icon: <FiEye size={14} /> },
  { value: 2, label: '首页隐藏', hint: '列表仍可见', icon: <FiEyeOff size={14} /> },
  { value: 3, label: '全站隐藏', hint: '仅链接可访问', icon: <FiLock size={14} /> },
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

type FormSectionProps = {
  title: string;
  description?: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

function FormSection({ title, description, icon, action, children }: FormSectionProps) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 dark:border-strokedark dark:bg-boxdark-2/30 sm:p-5">
      <header className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-strokedark">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-slate-200/80 dark:bg-boxdark dark:ring-strokedark">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
            {description && (
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
        </div>
        {action}
      </header>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

const formItemClass = '[&_.ant-form-item-label>label]:text-slate-600! [&_.ant-form-item-label>label]:font-medium! dark:[&_.ant-form-item-label>label]:text-slate-300!';

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

    const formValues = {
      ...data,
      status: data.config.status,
      password: data.config.password,
      isEncrypt: data.config.isEncrypt,
      tagIds,
      createTime: dayjs(data.createTime!),
    };

    const fromCateIds = data?.cateIds?.filter((x): x is number => x != null);
    const rawCateIds =
      fromCateIds?.length ?? 0
        ? fromCateIds!
        : (data?.cateList?.map((item) => item.id).filter((cid): cid is number => cid !== undefined) ?? []);

    const catePaths =
      cateList.length > 0 && rawCateIds.length > 0
        ? rawCateIds.map((cid) => findCategoryPathInTree(cateList, cid)).filter((p): p is number[] => p != null)
        : undefined;

    form.setFieldsValue({
      ...formValues,
      ...(catePaths?.length ? { cateIds: catePaths } : {}),
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
          config: {
            isDraft: false,
            isDel: false,
            ...values.config,
          },
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
            config: {
              isDraft: false,
              isDel: false,
              ...values.config,
            },
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
            config: {
              isDraft: false,
              isDel: false,
              ...values.config,
            },
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

      const prompt = `请根据以下文章内容生成一个合适的标题和简短的简介：
文章内容：
${content}

要求：
1. 标题要简洁有力，不超过20个字
2. 简介要概括文章主要内容，不超过100字
3. 返回格式为JSON对象，包含title和description字段`;

      const response = await callAssistant(
        [
          {
            role: 'system',
            content:
              '你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。',
          },
          { role: 'user', content: prompt },
        ],
        { max_tokens: 200, temperature: 0.3 },
      );

      if (response) {
        const result = (response as AssistantResponse).choices?.[0]?.message?.content?.trim();
        if (result) {
          try {
            let jsonStr = result;
            if (jsonStr.startsWith('```json')) {
              jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
            }

            const { title, description } = JSON.parse(jsonStr);
            form.setFieldsValue({
              title: title || '',
              description: description || '',
            });
            message.success('标题和简介已生成');
          } catch (e) {
            console.error('Failed to parse response:', e);
            message.error('解析生成结果失败，请检查助手返回格式');
          }
        } else {
          message.error('生成失败，请重试');
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

  return (
    <div className="publish-form pb-2">
      <Form
        form={form}
        name="publish"
        size="middle"
        layout="vertical"
        onFinish={onSubmit}
        autoComplete="off"
        initialValues={initialValues}
        className="flex flex-col gap-5"
        requiredMark={false}
      >
        <FormSection
          title="基本信息"
          description="标题与简介将展示在列表与详情页"
          icon={<FiType size={18} />}
          action={
            <Tooltip title="根据正文自动生成标题与简介">
              <Button
                type="default"
                size="small"
                loading={generating}
                onClick={generateTitleAndDescription}
                className="inline-flex! shrink-0! items-center! gap-1.5! rounded-lg! border-slate-200/80! shadow-none! dark:border-strokedark!"
                icon={<HiOutlineSparkles className="text-primary" />}
              >
                AI 生成
              </Button>
            </Tooltip>
          }
        >
          <Form.Item
            className={formItemClass}
            label="文章标题"
            name="title"
            rules={[{ required: true, message: '请输入文章标题' }]}
          >
            <Input placeholder="请输入文章标题" allowClear />
          </Form.Item>

          <Form.Item className={formItemClass} label="文章简介" name="description">
            <TextArea autoSize={{ minRows: 3, maxRows: 6 }} showCount maxLength={200} placeholder="概括文章要点，用于 SEO 与列表摘要" />
          </Form.Item>
        </FormSection>

        <FormSection title="封面" description="支持外链或从素材库选择" icon={<FiImage size={18} />}>
          <Form.Item className={`${formItemClass} mb-2!`} label="封面地址">
            <div className="flex gap-2">
              <Form.Item name="cover" noStyle rules={[{ validator: validateURL }]}>
                <Input
                  placeholder="https:// 封面图片地址"
                  allowClear
                  prefix={<FiImage className="text-slate-400" />}
                  className="min-w-0 flex-1"
                />
              </Form.Item>
              <Tooltip title="从素材库选择">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(true)}
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200/80 text-slate-500 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:border-strokedark dark:hover:bg-primary/10"
                  aria-label="从素材库选择封面"
                >
                  <FiUploadCloud size={18} />
                </button>
              </Tooltip>
            </div>
          </Form.Item>

          {coverValue && /^(https?:\/\/)/.test(coverValue) && (
            <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
              <img
                src={coverValue}
                alt="封面预览"
                className="aspect-video w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </FormSection>

        <FormSection title="分类与标签" description="分类必选，标签可多选或输入新建" icon={<FiFolder size={18} />}>
          <Form.Item
            className={formItemClass}
            label="文章分类"
            name="cateIds"
            rules={[{ required: true, message: '请选择文章分类' }]}
          >
            <Cascader
              options={cateList}
              maxTagCount="responsive"
              multiple
              showCheckedStrategy={Cascader.SHOW_CHILD}
              fieldNames={{ label: 'name', value: 'id' }}
              placeholder="选择分类（可多选）"
              className="w-full"
            />
          </Form.Item>

          <Form.Item className={formItemClass} label="文章标签" name="tagIds">
            <Select
              allowClear
              mode="tags"
              options={tagList}
              fieldNames={{ label: 'name', value: 'id' }}
              filterOption={(input, option) => !!option?.name.includes(input)}
              placeholder="选择已有标签或输入新标签"
              className="w-full"
              suffixIcon={<FiTag className="text-slate-400" />}
            />
          </Form.Item>
        </FormSection>

        <FormSection title="发布设置" description="定时发布仅可选择当前及以前时间" icon={<FiCalendar size={18} />}>
          <Form.Item className={formItemClass} label="发布时间" name="createTime">
            <DatePicker
              showTime
              placeholder="选择发布时间"
              className="w-full"
              suffixIcon={<FiCalendar className="text-slate-400" />}
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
        </FormSection>

        <FormSection title="可见性与加密" description="控制文章展示范围与访问权限" icon={<FiSettings size={18} />}>
          <Form.Item className={formItemClass} label="展示状态" name={['config', 'status']}>
            <Radio.Group className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
              {STATUS_OPTIONS.map((opt) => (
                <Radio.Button
                  key={opt.value}
                  value={opt.value}
                  className="h-auto! rounded-xl! border-slate-200/80! mx-1! px-3! py-2.5! text-left! shadow-none! before:hidden! dark:border-strokedark! [&.ant-radio-button-wrapper-checked]:border-primary! [&.ant-radio-button-wrapper-checked]:bg-primary/5! [&.ant-radio-button-wrapper-checked]:text-primary!"
                >
                  <span className="flex items-center gap-2">
                    {opt.icon}
                    <span className="flex flex-col leading-tight">
                      <span className="text-sm font-medium">{opt.label}</span>
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">{opt.hint}</span>
                    </span>
                  </span>
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>

          <div className="mt-2 flex flex-col gap-3 rounded-lg border border-slate-200/60 bg-white px-4 py-3 dark:border-strokedark dark:bg-boxdark sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">加密访问</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">开启后需输入密码才能阅读全文</p>
            </div>
            <Form.Item name={['config', 'isEncrypt']} valuePropName="checked" className="mb-0! shrink-0">
              <Switch onChange={(checked: boolean) => setIsEncryptEnabled(checked)} />
            </Form.Item>
          </div>

          {isEncryptEnabled && (
            <Form.Item
              className={`${formItemClass} mt-3!`}
              label="访问密码"
              name={['config', 'password']}
              rules={[{ required: isEncryptEnabled, message: '请输入访问密码' }]}
            >
              <Input.Password placeholder="设置读者访问密码" prefix={<FiLock className="text-slate-400" />} />
            </Form.Item>
          )}
        </FormSection>

        <footer className="sticky bottom-0 z-10 -mx-1 flex flex-col gap-2 border-t border-slate-100 bg-white/95 px-1 pt-4 backdrop-blur-sm dark:border-strokedark dark:bg-boxdark/95">
          <Button
            type="primary"
            htmlType="submit"
            loading={btnLoading}
            className="inline-flex! h-11! items-center! justify-center! gap-2! rounded-xl! shadow-none!"
            icon={<FiSend size={16} />}
          >
            {primaryLabel}
          </Button>

          {showDraftActions && (
            <Button
              className="inline-flex! h-10! items-center! justify-center! gap-2! rounded-xl! border-slate-200/80! shadow-none! dark:border-strokedark!"
              loading={btnLoading}
              onClick={handleDraftSave}
              icon={<FiSave size={16} />}
            >
              {draftLabel}
            </Button>
          )}
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
