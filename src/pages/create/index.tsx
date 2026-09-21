import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Dropdown, MenuProps, message, Spin, Tooltip } from 'antd';
import {
  FiSave,
  FiSend,
  FiPenTool,
  FiZap,
  FiImage,
  FiEye,
  FiMaximize2,
  FiMinimize2,
} from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';

import { getAssistantDisplayLabel } from '@/pages/assistant/modelConfig';
import Drawer from '@/components/Drawer';
import useAssistant from '@/hooks/useAssistant';
import { Article } from '@/types/app/article';
import { getArticleDataAPI } from '@/api/article';

import Editor, { type MuyaEditorHandle } from './components/Editor';
import PublishForm from './components/PublishForm';

function countChars(text: string) {
  return text.replace(/\s/g, '').length;
}

const iconBtnClass =
  'inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-boxdark-2';

export default function CreatePage() {
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<MuyaEditorHandle>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [focusMode, setFocusMode] = useState(false);

  const toggleFocusMode = () => {
    const next = !focusMode;
    setFocusMode(next);
    editorRef.current?.setFocusMode(next);
  };

  // 沉浸写作：编辑卡片铺满视口盖住侧边栏/顶栏，进入时自动开启专注模式，
  // 退出时恢复进入前的专注状态；Esc 退出（浮层打开时先让 muya 关闭浮层）
  const [immersive, setImmersive] = useState(false);
  const prevFocusRef = useRef(false);

  const exitImmersive = () => {
    if (!prevFocusRef.current && focusMode) toggleFocusMode();
    setImmersive(false);
  };

  const toggleImmersive = () => {
    if (immersive) {
      exitImmersive();
      return;
    }
    prevFocusRef.current = focusMode;
    if (!focusMode) toggleFocusMode();
    setChromeVisible(true);
    setImmersive(true);
  };

  // 沉浸工具条：编辑器内打字时自动淡出，鼠标移动 / 点按 / 键盘聚焦时恢复
  const [chromeVisible, setChromeVisible] = useState(true);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const hide = () => setChromeVisible(false);
    const show = () => setChromeVisible(true);
    section.addEventListener('keydown', hide, true);
    section.addEventListener('mousemove', show);
    section.addEventListener('pointerdown', show);
    section.addEventListener('focusin', show);
    return () => {
      section.removeEventListener('keydown', hide, true);
      section.removeEventListener('mousemove', show);
      section.removeEventListener('pointerdown', show);
      section.removeEventListener('focusin', show);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('immersive-writing', immersive);
    return () => document.body.classList.remove('immersive-writing');
  }, [immersive]);

  useEffect(() => {
    if (!immersive) return;
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const floatOpen = Array.from(document.querySelectorAll<HTMLElement>('.mu-float-wrapper')).some((f) => {
        const rect = f.getBoundingClientRect();
        return getComputedStyle(f).opacity === '1' && rect.y > -100;
      });
      if (!floatOpen) exitImmersive();
    };
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [immersive]);

  const [params] = useSearchParams();
  const id = +params.get('id')!;
  const isDraftParams = Boolean(params.get('draft'));

  const [data, setData] = useState<Article>({} as Article);
  const [content, setContent] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);

  const { list, assistant, callAssistant } = useAssistant();

  const assistantName = useMemo(() => {
    if (!assistant) return '选择助手';
    const item = list.find((a) => a.id === Number(assistant));
    return item ? getAssistantDisplayLabel(item.model) : '选择助手';
  }, [assistant, list]);

  const charCount = useMemo(() => countChars(content), [content]);

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

    if (id) {
      getArticleData();
      return;
    }

    const saved = localStorage.getItem('article_content');
    if (saved) {
      setData((prev) => ({ ...prev, content: saved }));
      setContent(saved);
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
      <section
        ref={sectionRef}
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-clip rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark ${immersive ? 'immersive-editor' : ''}`}
      >
        {/* 单行工具栏：左侧标题/字数，右侧编辑工具与主操作，沉浸写作时随输入自动淡出 */}
        <header
          className={`flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-100 px-4 py-2.5 transition-opacity duration-300 dark:border-strokedark sm:px-5 ${
            chromeVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">创作</h2>
            <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">{charCount} 字</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Tooltip title="从素材库插入图片">
              <button
                type="button"
                onClick={() => editorRef.current?.openMaterial()}
                className={`${iconBtnClass} text-slate-500 hover:text-primary dark:text-slate-400`}
              >
                <FiImage size={14} />
              </button>
            </Tooltip>
            <Tooltip title={focusMode ? '退出专注模式' : '专注模式（淡化非当前段落）'}>
              <button
                type="button"
                onClick={toggleFocusMode}
                className={`${iconBtnClass} ${
                  focusMode ? 'text-primary' : 'text-slate-500 hover:text-primary dark:text-slate-400'
                }`}
              >
                <FiEye size={14} />
              </button>
            </Tooltip>
            <Tooltip title={immersive ? '退出沉浸写作（Esc）' : '沉浸写作'}>
              <button
                type="button"
                onClick={toggleImmersive}
                className={`${iconBtnClass} ${
                  immersive ? 'text-primary' : 'text-slate-500 hover:text-primary dark:text-slate-400'
                }`}
              >
                {immersive ? <FiMinimize2 size={14} /> : <FiMaximize2 size={14} />}
              </button>
            </Tooltip>

            <span className="mx-1.5 h-4 w-px bg-slate-200 dark:bg-strokedark" aria-hidden />

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
        </header>

        <div className="create-editor-shell min-h-0 flex-1">
          <Spin spinning={loading} className="h-full [&_.ant-spin-container]:h-full">
            <Editor
              ref={editorRef}
              value={content}
              onChange={(value) => setContent(value)}
            />
          </Spin>
        </div>
      </section>

      <Drawer
        title={id && !isDraftParams ? '编辑文章' : '发布文章'}
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
      >
        <div className="mx-auto max-w-6xl px-4 pb-2 sm:px-6">
          <PublishForm data={data} closeModel={() => setPublishOpen(false)} />
        </div>
      </Drawer>
    </div>
  );
};
