import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Modal } from 'antd';
import type { InputRef } from 'antd';
import { FiEdit3, FiFileText, FiSearch } from 'react-icons/fi';
import { getSearchAPI } from '@/api/search';
import { SearchResult } from '@/types/app/search';
import { getFlatRoutes } from '@/config/routes';
import { useCommandPaletteStore } from '@/stores';

interface PaletteItem {
  key: string;
  icon: React.ReactNode;
  // 展示文本（闪念为命中片段，其余为名称）
  text: string;
  path: string;
}

// 内置页面导航项：来自侧边栏路由配置
const PAGE_ITEMS: PaletteItem[] = getFlatRoutes().map((route) => ({
  key: route.path,
  icon: route.icon,
  text: route.title,
  path: route.path,
}));

const kbdClass =
  'inline-block rounded border border-slate-300 px-1.5 py-0.5 text-[10px] leading-none dark:border-strokedark';

// 关键词命中高亮（字符串 split 而非正则，避免关键词被当作正则解析）
const highlight = (text: string, key: string) => {
  const parts = text.split(key);
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && <span className="text-primary">{key}</span>}
    </Fragment>
  ));
};

// 全局命令面板：Ctrl/Cmd + K 唤起，页面跳转 + 内容搜索直达编辑
export default () => {
  const navigate = useNavigate();
  const { open, closeModal } = useCommandPaletteStore();

  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState<SearchResult>();
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<InputRef>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 全局快捷键 Ctrl/Cmd + K 唤起或关闭
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'k') return;
      e.preventDefault();
      const { open, openModal, closeModal } = useCommandPaletteStore.getState();
      if (open) closeModal();
      else openModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // 打开时聚焦输入框，关闭时重置搜索状态
  useEffect(() => {
    if (!open) {
      setKeyword('');
      setData(undefined);
      setActiveIndex(0);
      return;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  // 关键词变化时防抖请求；清理函数取消过期请求，避免清空后再搜被旧响应覆盖
  useEffect(() => {
    if (!open) return;

    const key = keyword.trim();
    if (!key) {
      setData(undefined);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const { data: result } = await getSearchAPI({ keyword: key, limit: 5 });
        if (!cancelled) setData(result);
      } catch {
        // 请求失败时静默，拦截器已统一提示
        if (!cancelled) setData(undefined);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [keyword, open]);

  // 页面导航：有关键词时按名称过滤
  const pageItems = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    return PAGE_ITEMS.filter((item) => !key || item.text.toLowerCase().includes(key));
  }, [keyword]);

  const sections = useMemo(() => {
    const result: { label: string; items: PaletteItem[] }[] = [{ label: '页面', items: pageItems }];
    if (data) {
      // 文章/闪念直达编辑页
      result.push({
        label: '文章',
        items: data.articles.map((item) => ({ key: `article-${item.id}`, icon: <FiFileText />, text: item.title, path: `/create?id=${item.id}` })),
      });
      result.push({
        label: '闪念',
        items: data.records.map((item) => ({ key: `record-${item.id}`, icon: <FiEdit3 />, text: item.snippet, path: `/create_record?id=${item.id}` })),
      });
    }
    return result;
  }, [pageItems, data]);

  // 展平列表供键盘上下选择，同时计算各分组在其中的起始下标
  const flatItems = useMemo(() => sections.flatMap((section) => section.items), [sections]);
  const sectionStarts = useMemo(() => {
    let offset = 0;
    return sections.map((section) => {
      const start = offset;
      offset += section.items.length;
      return { label: section.label, items: section.items, start };
    });
  }, [sections]);

  // 关键词有搜索结果支撑且页面也无命中时才展示空状态，避免防抖期间闪烁
  const showEmpty = !!keyword.trim() && !!data && !data.articles?.length && !data.records?.length && !pageItems.length;

  useEffect(() => setActiveIndex(0), [keyword, data]);

  // 键盘选中项滚动到可视区域
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const select = (item: PaletteItem) => {
    closeModal();
    navigate(item.path);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const total = flatItems.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (total ? (i + 1) % total : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (total ? (i - 1 + total) % total : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (item) select(item);
    }
  };

  return (
    <Modal open={open} onCancel={closeModal} footer={null} closable={false} width={560}>
      <div onKeyDown={onKeyDown}>
        <Input
          ref={inputRef}
          allowClear
          size="large"
          variant="borderless"
          placeholder="搜索文章、闪念，或输入页面名称跳转"
          prefix={<FiSearch className="text-slate-400" size={16} />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <div ref={listRef} className="mt-2 max-h-[50vh] overflow-y-auto border-t border-slate-100 pt-3 dark:border-strokedark">
          {sectionStarts.map((section, si) =>
            section.items.length ? (
              <div key={section.label} className={si ? 'mt-3' : ''}>
                <div className="mb-1 px-3 text-xs text-slate-400">{section.label}</div>
                {section.items.map((item, i) => {
                  const index = section.start + i;
                  const active = index === activeIndex;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      data-active={active}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => select(item)}
                      className={`mb-0.5 flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-slate-600 dark:text-slate-300 ${
                        active ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      <span className="flex w-4 shrink-0 justify-center text-sm">{item.icon}</span>
                      <span className={`min-w-0 flex-1 ${item.key.startsWith('record-') ? 'line-clamp-2' : 'truncate'}`}>
                        {highlight(item.text, keyword.trim())}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null,
          )}

          {showEmpty && <div className="py-10 text-center text-sm text-slate-400">暂无相关内容</div>}
        </div>

        <div className="mt-3 flex items-center justify-end gap-4 border-t border-slate-100 pt-3 pb-1 text-xs text-slate-400 dark:border-strokedark">
          <span className="flex items-center gap-1">
            <kbd className={kbdClass}>↑</kbd>
            <kbd className={kbdClass}>↓</kbd> 切换
          </span>
          <span className="flex items-center gap-1">
            <kbd className={kbdClass}>↵</kbd> 打开
          </span>
          <span className="flex items-center gap-1">
            <kbd className={kbdClass}>Esc</kbd> 关闭
          </span>
        </div>
      </div>
    </Modal>
  );
};
