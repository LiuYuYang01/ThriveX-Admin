import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Dropdown, MenuProps, message, Spin, Tooltip } from 'antd';
import {
  FiSave,
  FiSend,
  FiPenTool,
  FiZap,
  FiFileText,
  FiEdit3,
  FiCommand,
} from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';

import Title from '@/components/Title';
import Drawer from '@/components/Drawer';
import useAssistant from '@/hooks/useAssistant';
import { Article } from '@/types/app/article';
import { getArticleDataAPI } from '@/api/article';

import Editor from './components/Editor';
import PublishForm from './components/PublishForm';

function countChars(text: string) {
  return text.replace(/\s/g, '').length;
}

export default function CreatePage() {
  const [loading, setLoading] = useState(false);

  const [params] = useSearchParams();
  const id = +params.get('id')!;
  const isDraftParams = Boolean(params.get('draft'));

  const [data, setData] = useState<Article>({} as Article);
  const [content, setContent] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);
  const [restoredLocalDraft, setRestoredLocalDraft] = useState(false);

  const { list, assistant, callAssistant } = useAssistant();

  const assistantName = useMemo(() => {
    if (!assistant) return '选择助手';
    return list.find((a) => a.id === Number(assistant))?.name || '选择助手';
  }, [assistant, list]);

  const charCount = useMemo(() => countChars(content), [content]);

  const modeMeta = useMemo(() => {
    if (id && !isDraftParams) {
      return { label: '编辑文章', hint: '修改后将通过发布面板更新', tone: 'text-primary bg-primary/10' };
    }
    if (id && isDraftParams) {
      return { label: '编辑草稿', hint: '草稿内容可随时保存到本地', tone: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' };
    }
    return { label: '新建创作', hint: '支持 Markdown，Ctrl / ⌘ + S 快速保存', tone: 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-boxdark-2' };
  }, [id, isDraftParams]);

  const nextBtn = () => {
    if (content.trim().length >= 1) {
      setPublishOpen(true);
    } else {
      message.error('请输入文章内容');
    }
  };

  const getArticleData = async () => {
    try {
      setLoading(true);
      const { data } = await getArticleDataAPI(id);
      setData(data);
      setContent(data.content);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPublishOpen(false);

    setRestoredLocalDraft(false);

    if (id) {
      getArticleData();
      return;
    }

    const saved = localStorage.getItem('article_content');
    if (saved) {
      setData((prev) => ({ ...prev, content: saved }));
      setContent(saved);
      setRestoredLocalDraft(true);
    }
  }, [id]);

  const saveBtn = () => {
    if (content.trim().length >= 1) {
      localStorage.setItem('article_content', content);
      message.success('内容已保存');
    } else {
      message.error('请输入文章内容');
    }
  };

  useEffect(() => {
    setData((prev) => ({ ...prev, content }));

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveBtn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content]);

  const streamAssistant = async (
    messages: { role: string; content: string }[],
    onChunk: (full: string) => void,
    replaceContent: boolean,
  ) => {
    const reader = await callAssistant(messages, { stream: true, temperature: 0.3 });
    if (!reader) return;

    let fullResponse = '';
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const parsed = JSON.parse(line.replace('data: ', ''));
            if (parsed.choices[0]?.delta?.content) {
              fullResponse += parsed.choices[0].delta.content;
              onChunk(replaceContent ? fullResponse : content + fullResponse);
            }
          } catch (error) {
            console.error(error);
            message.error('调用助手失败');
          }
        }
      }
    }
  };

  const runAssistantTask = async (prompt: string, replaceContent: boolean) => {
    if (list.length === 0) {
      message.error('请先在助手管理中添加助手');
      return;
    }

    try {
      setLoading(true);
      await streamAssistant(
        [
          {
            role: 'system',
            content:
              '你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。',
          },
          { role: 'user', content: prompt },
        ],
        (result) => setContent(result),
        replaceContent,
      );
    } catch (error) {
      console.error(error);
      message.error('调用助手失败');
    } finally {
      setLoading(false);
    }
  };

  const assistantMenuItems: MenuProps['items'] = [
    {
      key: 'continue',
      icon: <FiPenTool className="text-base" />,
      label: '续写正文',
      onClick: () => runAssistantTask(`帮我续写：${content}`, false),
    },
    {
      key: 'optimize',
      icon: <FiZap className="text-base" />,
      label: '优化全文',
      onClick: () => runAssistantTask(`帮我优化该文章，意思不变：${content}`, true),
    },
  ];

  const handleAssistantMainClick = () => {
    if (list.length === 0) {
      message.error('请先在助手管理中添加助手');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Title value="创作">
        <div className="flex w-full max-w-2xl flex-wrap items-center justify-end gap-2 sm:max-w-none">
          <Dropdown menu={{ items: assistantMenuItems }} trigger={['click']} placement="bottomRight">
            <Button
              className="inline-flex! h-10! items-center! gap-2! rounded-xl! border-slate-200/80! px-4! shadow-none! dark:border-strokedark!"
              icon={<HiOutlineSparkles className="text-lg text-primary" />}
              onClick={handleAssistantMainClick}
            >
              <span className="max-w-32 truncate sm:max-w-40">{assistantName}</span>
            </Button>
          </Dropdown>

          <Tooltip title="保存到本地草稿（Ctrl / ⌘ + S）">
            <Button
              className="inline-flex! h-10! items-center! gap-2! rounded-xl! border-slate-200/80! px-4! shadow-none! dark:border-strokedark!"
              icon={<FiSave className="text-base" />}
              onClick={saveBtn}
            >
              保存
            </Button>
          </Tooltip>

          <Button
            type="primary"
            className="inline-flex! h-10! items-center! gap-2! rounded-xl! px-5! shadow-none!"
            icon={<FiSend className="text-base" />}
            onClick={nextBtn}
          >
            发布
          </Button>
        </div>
      </Title>

      <div className="flex min-h-0 flex-1 flex-col">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
          <header className="flex shrink-0 flex-col gap-2 border-b border-slate-100 px-4 py-3 dark:border-strokedark sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${modeMeta.tone}`}
              >
                {id ? <FiEdit3 size={12} /> : <FiFileText size={12} />}
                {modeMeta.label}
              </span>
              {restoredLocalDraft && !id && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  已恢复本地草稿
                </span>
              )}
              <p className="hidden text-xs text-slate-400 sm:inline dark:text-slate-500">{modeMeta.hint}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <span className="font-medium text-slate-700 dark:text-slate-200">{charCount}</span>
                字
              </span>
              <span className="hidden h-3 w-px bg-slate-200 sm:inline dark:bg-strokedark" aria-hidden />
              <span className="hidden items-center gap-1 sm:inline-flex">
                <FiCommand size={12} className="opacity-70" />
                + S 保存
              </span>
            </div>
          </header>

          <div className="create-editor-shell min-h-0 flex-1">
            <Spin spinning={loading} className="h-full [&_.ant-spin-container]:h-full">
              <Editor value={content} onChange={(value) => setContent(value)} />
            </Spin>
          </div>
        </section>
      </div>

      <Drawer
        title={id && !isDraftParams ? '编辑文章' : '发布文章'}
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
      >
        <div className="mx-auto max-w-5xl">
          <PublishForm data={data} closeModel={() => setPublishOpen(false)} />
        </div>
      </Drawer>
    </div>
  );
};
