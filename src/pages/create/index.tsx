import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, Dropdown, MenuProps, message, Spin } from 'antd';
import { BiSave } from 'react-icons/bi';
import { AiOutlineEdit, AiOutlineSend } from 'react-icons/ai';

import Title from '@/components/Title';
import Drawer from '@/components/Drawer';
import useAssistant from '@/hooks/useAssistant';
import { Article } from '@/types/app/article';
import { getArticleDataAPI } from '@/api/article';
import { titleSty } from '@/styles/sty';

import Editor from './components/Editor';
import PublishForm from './components/PublishForm';

export default () => {
  const [loading, setLoading] = useState(false);

  const [params] = useSearchParams();
  const id = +params.get('id')!;
  const isDraftParams = Boolean(params.get('draft'));

  const [data, setData] = useState<Article>({} as Article);
  const [content, setContent] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);

  // 下一步
  const nextBtn = () => {
    if (content.trim().length >= 1) {
      setPublishOpen(true);
    } else {
      message.error('请输入文章内容');
    }
  };

  // 获取文章数据
  const getArticleData = async () => {
    try {
      setLoading(true);

      const { data } = await getArticleDataAPI(id);
      setData(data);
      setContent(data.content);

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // 回显数据
  useEffect(() => {
    setPublishOpen(false);

    // 有Id就回显指定的数据
    if (id) {
      getArticleData();
      return;
    }

    // 没有就回显本地保存的数据
    const content = localStorage.getItem('article_content');

    if (content) {
      setData({ ...data, content });
      setContent(content);
    }
  }, [id]);

  // 保存文章
  const saveBtn = () => {
    if (content.trim().length >= 1) {
      // 将文章内容持久化存储到本地
      localStorage.setItem('article_content', content);
      message.success('内容已保存');
    } else {
      message.error('请输入文章内容');
    }
  };

  useEffect(() => {
    setData({ ...data, content });

    // 点击快捷键保存文章
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // 阻止默认的保存行为
        saveBtn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [content]);

  const { list, assistant, callAssistant } = useAssistant();

  // 助手功能菜单
  const items: MenuProps['items'] = [
    {
      key: '1',
      label: '续写',
      onClick: async () => {
        try {
          setLoading(true);
          const reader = await callAssistant(
            [
              {
                role: 'system',
                content: '你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。',
              },
              {
                role: 'user',
                content: `帮我续写：${content}`,
              },
            ],
            { stream: true, temperature: 0.3 },
          );

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
                  const data = JSON.parse(line.replace('data: ', ''));
                  if (data.choices[0]?.delta?.content) {
                    fullResponse += data.choices[0].delta.content;
                    setContent(content + fullResponse);
                  }
                } catch (error) {
                  console.error(error);
                  message.error('调用助手失败');
                }
              }
            }
          }
        } catch (error) {
          console.error(error);
          message.error('调用助手失败');
        } finally {
          setLoading(false);
        }
      },
    },
    {
      key: '2',
      label: '优化',
      onClick: async () => {
        try {
          setLoading(true);
          const reader = await callAssistant(
            [
              {
                role: 'system',
                content: '你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。',
              },
              {
                role: 'user',
                content: `帮我优化该文章，意思不变：${content}`,
              },
            ],
            { stream: true, temperature: 0.3 },
          );

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
                  const data = JSON.parse(line.replace('data: ', ''));
                  if (data.choices[0]?.delta?.content) {
                    fullResponse += data.choices[0].delta.content;
                    setContent(fullResponse);
                  }
                } catch (error) {
                  console.error(error);
                  message.error('调用助手失败');
                }
              }
            }
          }
        } catch (error) {
          console.error(error);
          message.error('调用助手失败');
        } finally {
          setLoading(false);
        }
      },
    },
  ];

  return (
    <div>
      <Title value="创作">
        <div className="flex items-center space-x-4 w-[365px]">
          <Dropdown.Button
            menu={{ items }}
            onClick={() => {
              if (list.length === 0) {
                message.error('请先在助手管理中添加助手');
              }
            }}
          >
            <AiOutlineEdit className="text-base" />
            {assistant ? list.find((a) => a.id === Number(assistant))?.name || '选择助手' : '选择助手'}
          </Dropdown.Button>

          <Button className="w-full flex justify-between" onClick={saveBtn}>
            <BiSave className="text-base" /> 保存
          </Button>

          <Button size="large" type="primary" className="w-full flex justify-between" onClick={nextBtn}>
            <AiOutlineSend className="text-2xl" /> 发布
          </Button>
        </div>
      </Title>

      <Spin spinning={loading}>
        <Card className={`${titleSty} overflow-hidden rounded-2xl! min-h-[calc(100vh-150px)]`}>
          <Editor value={content} onChange={(value) => setContent(value)} />

          <Drawer title={id && !isDraftParams ? '编辑文章' : '发布文章'} open={publishOpen} onClose={() => setPublishOpen(false)}>
            <div className="max-w-5xl mx-auto">
              <PublishForm data={data} closeModel={() => setPublishOpen(false)} />
            </div>
          </Drawer>
        </Card>
      </Spin>
    </div>
  );
};
