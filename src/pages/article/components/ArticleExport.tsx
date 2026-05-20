import { useCallback } from 'react';
import { Button, Dropdown, Popconfirm, Tooltip, message } from 'antd';
import { FiDownload, FiChevronDown } from 'react-icons/fi';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import type { Article } from '@/types/app/article';

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

interface ArticleExportSingleProps {
  article: Article;
}

export const ArticleExportSingle = ({ article }: ArticleExportSingleProps) => {
  const handleExport = useCallback(() => {
    const markdown = articleToMarkdown(article);
    downloadBlob(markdown, `${safeFileName(article.title)}.md`, 'text/markdown;charset=utf-8');
  }, [article]);

  return (
    <Tooltip title="导出 Markdown">
      <Popconfirm
        title="导出文章"
        description="确定要导出该文章为 Markdown 文件吗？"
        okText="导出"
        cancelText="取消"
        onConfirm={handleExport}
      >
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-200 cursor-pointer"
          aria-label={`导出 ${article.title}`}
        >
          <FiDownload size={16} />
        </button>
      </Popconfirm>
    </Tooltip>
  );
};

export interface ArticleExportDropdownProps {
  selectedArticles: Article[];
  onLoadAll: () => Promise<Article[]>;
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
      message.warning('请先勾选要导出的文章');
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
    <Dropdown
      menu={{
        items: [
          { label: '导出选中', key: 'selected', onClick: handleExportSelected },
          { label: '导出全部', key: 'all', onClick: () => void handleExportAll() },
        ],
      }}
      trigger={['click']}
    >
      <Button loading={exportLoading} icon={<FiDownload />} className="inline-flex items-center gap-1">
        导出
        <FiChevronDown size={14} className="opacity-60" />
      </Button>
    </Dropdown>
  );
};

const ArticleExport = {
  Single: ArticleExportSingle,
  Dropdown: ArticleExportDropdown,
};

export default ArticleExport;
