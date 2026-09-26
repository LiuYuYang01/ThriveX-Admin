import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button, Card, Cascader, DatePicker, Form, Input, message, Radio, Select, Space, Switch, Tag, Typography } from 'antd';
import { RuleObject } from 'antd/es/form';
import dayjs, { Dayjs } from 'dayjs';
import { FiImage, FiLink, FiSave, FiSend, FiUploadCloud } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';

import { addArticleDataAPI, editArticleDataAPI } from '@/api/article';
import { getCateListAPI } from '@/api/cate';
import useAssistant from '@/hooks/useAssistant';
import { addTagDataAPI, getTagListAPI } from '@/api/tag';

import { Cate } from '@/types/app/cate';
import { Tag as TagItem } from '@/types/app/tag';
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
  isTop: boolean;
  config: {
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

const STATUS_OPTIONS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: '公开' },
  { value: 2, label: '首页隐藏' },
  { value: 3, label: '全站隐藏' },
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

// Card 标题：主标题 + 次级说明
function cardTitle(title: string, description?: string) {
  return (
    <div className="min-w-0">
      <Typography.Text strong>{title}</Typography.Text>
      {description && (
        <Typography.Paragraph type="secondary" className="mb-0! mt-0.5! text-xs!">
          {description}
        </Typography.Paragraph>
      )}
    </div>
  );
}

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
  const [tagList, setTagList] = useState<TagItem[]>([]);
  const [isEncryptEnabled, setIsEncryptEnabled] = useState(false);

  const isEditing = Boolean(id && !isDraftParams);
  const showDraftActions = (isDraftParams && id) || !id;
  const primaryLabel = isEditing ? '保存修改' : '发布文章';
  const draftLabel = isDraftParams ? '保存草稿' : '存为草稿';
  const modeTagColor = isEditing ? 'processing' : isDraftParams ? 'gold' : 'default';
  const modeLabel = isEditing ? '编辑文章' : isDraftParams ? '发布草稿' : '新建发布';

  useEffect(() => {
    if (!id) return form.resetFields();

    const tagIds = (data?.tagList ?? []).map((item: TagItem) => item.id);
    const rawCateIds = resolveArticleCateIds(data);
    const catePaths = toCascaderPaths(rawCateIds, cateList);

    const formValues = {
      title: data.title,
      description: data.description,
      cover: data.cover,
      isTop: data.isTop ?? false,
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
    isTop: false,
    config: {
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

  return (
    <div className="publish-form flex min-h-full flex-col">
      <Form
        form={form}
        name="publish"
        layout="vertical"
        onFinish={onSubmit}
        autoComplete="off"
        initialValues={initialValues}
        className="flex min-h-0 flex-1 flex-col"
        requiredMark={false}
      >
        <div className="min-h-0 flex-1 overflow-y-auto pb-28 pt-2">
          <div className="mx-auto max-w-5xl px-1">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start">
              {/* 主内容区 */}
              <div className="flex flex-col gap-5">
                <Card
                  title={cardTitle('标题与摘要', '读者第一眼看到的信息，直接影响点击率与搜索收录')}
                  extra={
                    <Button
                      type="text"
                      size="small"
                      loading={generating}
                      onClick={generateTitleAndDescription}
                      icon={<HiOutlineSparkles />}
                    >
                      AI 填充
                    </Button>
                  }
                >
                  <Form.Item
                    label="文章标题"
                    name="title"
                    rules={[{ required: true, message: '请输入文章标题' }]}
                  >
                    <Input placeholder="输入清晰、有吸引力的标题" allowClear />
                  </Form.Item>

                  <Form.Item label="文章摘要" name="description" className="mb-0!">
                    <Input.TextArea
                      autoSize={{ minRows: 3, maxRows: 5 }}
                      showCount
                      maxLength={200}
                      placeholder="一两句话概括核心内容，便于列表展示与 SEO"
                    />
                  </Form.Item>
                </Card>

                <Card title={cardTitle('封面配图', '可选。建议 16:9 比例，用于列表与社交分享展示')}>
                  <Form.Item label="封面地址">
                    <Space.Compact block>
                      <Form.Item name="cover" noStyle rules={[{ validator: validateURL }]}>
                        <Input
                          placeholder="请输入图片地址"
                          allowClear
                          prefix={<FiLink className="text-slate-400" size={15} />}
                        />
                      </Form.Item>
                      <Button type="default" onClick={() => setIsMaterialModalOpen(true)} icon={<FiUploadCloud />}>
                        素材库
                      </Button>
                    </Space.Compact>
                  </Form.Item>

                  {/* 缩略预览 */}
                  <button
                    type="button"
                    onClick={() => setIsMaterialModalOpen(true)}
                    className={`group relative flex w-full shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50 hover:border-primary/50 dark:border-strokedark dark:bg-boxdark-2/60 dark:hover:border-primary/40 ${
                      hasCoverPreview ? 'aspect-video' : 'h-28'
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
                </Card>
              </div>

              {/* 侧边配置区 */}
              <aside className="flex flex-col gap-5">
                <Card title={cardTitle('分类与标签', '帮助读者发现内容，至少选择一个分类')}>
                  <Form.Item
                    label="归属分类"
                    name="cateIds"
                    rules={[{ required: true, message: '请选择文章分类' }]}
                  >
                    <Cascader
                      style={{ width: '100%' }}
                      options={cateList}
                      multiple
                      maxTagCount="responsive"
                      showCheckedStrategy={Cascader.SHOW_CHILD}
                      fieldNames={{ label: 'name', value: 'id' }}
                      placeholder="选择分类（可多选）"
                      allowClear
                    />
                  </Form.Item>

                  <Form.Item label="关联标签" name="tagIds" className="mb-0!">
                    <Select
                      allowClear
                      mode="tags"
                      maxTagCount="responsive"
                      options={tagList}
                      fieldNames={{ label: 'name', value: 'id' }}
                      filterOption={(input, option) => !!option?.name.includes(input)}
                      placeholder="选择或输入，回车创建"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Card>

                <Card title={cardTitle('发布设置', '控制上线时间与可见范围')}>
                  <Form.Item label="发布时间" name="createTime">
                    <DatePicker
                      showTime
                      placeholder="默认立即发布"
                      className="w-full"
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

                  <Form.Item label="可见性" name={['config', 'status']}>
                    <Radio.Group optionType="button" buttonStyle="solid" className="w-full!">
                      {STATUS_OPTIONS.map((opt) => (
                        <Radio.Button key={opt.value} value={opt.value}>
                          {opt.label}
                        </Radio.Button>
                      ))}
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item label="置顶文章" name="isTop" valuePropName="checked" extra="在列表顶部优先展示">
                    <Switch />
                  </Form.Item>

                  <Form.Item
                    label="访问加密"
                    name={['config', 'isEncrypt']}
                    valuePropName="checked"
                    extra="访客需输入密码阅读"
                    className="mb-2!"
                  >
                    <Switch onChange={(checked: boolean) => setIsEncryptEnabled(checked)} />
                  </Form.Item>

                  {isEncryptEnabled && (
                    <Form.Item
                      label="访问密码"
                      name={['config', 'password']}
                      rules={[{ required: isEncryptEnabled, message: '请输入访问密码' }]}
                      className="mb-0!"
                    >
                      <Input.Password placeholder="设置访问密码" />
                    </Form.Item>
                  )}
                </Card>
              </aside>
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-strokedark dark:bg-boxdark/95 sm:px-6">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div className="hidden min-w-0 items-center gap-2 sm:flex">
              <Tag color={modeTagColor} className="m-0!">
                {modeLabel}
              </Tag>
              <Typography.Text type="secondary" className="text-xs!">
                {isEditing ? '保存后将更新线上版本' : '确认信息无误后发布'}
              </Typography.Text>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              {showDraftActions && (
                <Button loading={btnLoading} onClick={handleDraftSave} icon={<FiSave />}>
                  {draftLabel}
                </Button>
              )}
              <Button type="primary" htmlType="submit" loading={btnLoading} icon={<FiSend />}>
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
