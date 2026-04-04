import { useCallback } from 'react';
import { Button, Dropdown, Popconfirm, Tooltip, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import type { Article } from '@/types/app/article';

// 文章 → Markdown
function articleToMarkdown(article: Article): string {
  const { title, description, content, cover, createTime, cateList, tagList } = article;
  const formatDate = (timestamp: number) => {
    const date = new Date(Number(timestamp));
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  const tags = (tagList || []).map((t) => t.name);
  const categories = (cateList || []).map((c) => c.name);
  const keywords = [...tags, ...categories].join(' ');
  return `---\ntitle: ${title}\ntags: ${tags.join(' ')}\ncategories: ${categories.join(' ')}\ncover: ${cover}\ndate: ${formatDate(createTime || Date.now())}\nkeywords: ${keywords}\ndescription: ${description}\n---\n\n${(content || '').trim()}`;
}

function safeFileName(title: string): string {
  return title.replace(/[\\/:*?"<>|]/g, '_');
}

function downloadBlob(content: string, fileName: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadArticlesZip(articles: Article[]) {
  const zip = new JSZip();
  const folder = zip.folder('data');
  for (const article of articles) {
    const markdown = articleToMarkdown(article);
    folder?.file(`${safeFileName(article.title)}.md`, markdown);
  }
  zip.file('articles.json', JSON.stringify(articles, null, 2));
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `导出文章_${Date.now()}.zip`);
}

// 单篇导出
interface ArticleExportSingleProps {
  article: Article;
}

export const ArticleExportSingle = ({ article }: ArticleExportSingleProps) => {
  const handleExport = useCallback(() => {
    const markdown = articleToMarkdown(article);
    downloadBlob(markdown, `${safeFileName(article.title)}.md`, 'text/markdown;charset=utf-8');
  }, [article]);

  return (
    <Tooltip title="导出文章">
      <Popconfirm
        title="提醒"
        description="确定要导出该文章吗？"
        okText="确定"
        cancelText="取消"
        onConfirm={handleExport}
      >
        <Button
          type="text"
          icon={<DownloadOutlined />}
          className="hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50"
        />
      </Popconfirm>
    </Tooltip>
  );
};


// 批量导出
export interface ArticleExportDropdownProps {
  selectedArticles: Article[];
  onLoadAll: () => Promise<Article[]>;
  /** 导出全部时的加载态（仅用于导出按钮，避免整表转圈） */
  exportLoading?: boolean;
  setExportLoading?: (loading: boolean) => void;
}

export const ArticleExportDropdown = ({
  selectedArticles,
  onLoadAll,
  exportLoading,
  setExportLoading,
}: ArticleExportDropdownProps) => {
  const handleExportSelected = useCallback(() => {
    if (!selectedArticles.length) {
      message.warning('请选择要导出的文章');
      return;
    }
    downloadArticlesZip(selectedArticles);
  }, [selectedArticles]);

  const handleExportAll = useCallback(async () => {
    try {
      setExportLoading?.(true);
      const all = await onLoadAll();
      await downloadArticlesZip(all);
    } catch (err) {
      console.error(err);
      message.error('导出全部失败');
    } finally {
      setExportLoading?.(false);
    }
  }, [onLoadAll, setExportLoading]);

  return (
    <Dropdown.Button
      icon={<DownloadOutlined />}
      className="w-[120px]"
      loading={exportLoading}
      menu={{
        items: [
          { label: '导出选中', key: 'selected', onClick: handleExportSelected },
          { label: '导出全部', key: 'all', onClick: () => handleExportAll() },
        ],
      }}
    >
      导出文章
    </Dropdown.Button>
  );
};

const ArticleExport = {
  Single: ArticleExportSingle,
  Dropdown: ArticleExportDropdown,
};

export default ArticleExport;