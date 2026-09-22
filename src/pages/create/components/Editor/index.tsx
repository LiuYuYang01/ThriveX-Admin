import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Spin } from 'antd';
import axios from 'axios';
import { CodeBlockLanguageSelector, EmojiSelector, FootnoteTool, ImageEditTool, ImagePathPicker, ImageResizeBar, ImageToolBar, InlineFormatToolbar, LinkTools, Muya, ParagraphFrontButton, ParagraphFrontMenu, ParagraphQuickInsertMenu, PreviewToolBar, TableChessboard, TableColumnToolbar, TableDragBar, TableRowColumMenu, zhCN } from '@/vendor/muya';
import type { IMuyaPluginConstructor } from '@/vendor/muya/muya';

import { getApiUrl } from '@/utils/config';
import { useUserStore, useFileStore } from '@/stores';
import { compressImageFile } from '@/utils/imageCompress';
import Material from '@/components/Material';
import WidgetPreview from '../WidgetPreview';

import { WIDGET_TEMPLATES, type WidgetType } from '../WidgetMenu';

import 'katex/dist/katex.css';
import './theme.scss';

export interface MuyaEditorHandle {
  /** 在光标处插入图片（素材库选择后调用） */
  insertImages: (urls: string[]) => void;
  /** 打开素材库弹窗 */
  openMaterial: () => void;
  /** 切换专注模式（打字机式高亮当前块） */
  setFocusMode: (enabled: boolean) => void;
  /** 在光标处插入小组件（tx-widget 代码块，博客端渲染成组件） */
  insertWidget: (type: WidgetType) => void;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
}

// 与 marktext 桌面端一致：`Muya.use` 是进程级全局注册，HMR / 组件重挂载时只注册一次，
// 否则会生成重复的浮动 UI 插件实例。
let muyaPluginsRegistered = false;

const MuyaEditor = forwardRef<MuyaEditorHandle, Props>(({ value, onChange }, ref) => {
  const store = useUserStore();
  const uploadCompressMode = useFileStore((state) => state.file.upload_compress_mode);

  const containerRef = useRef<HTMLDivElement>(null);
  const muyaRef = useRef<Muya | null>(null);
  // 记录最近一次输出给外层的 markdown，用于区分"外部传入的内容"与"编辑器自身产生的内容"，
  // 避免把光标重置回开头。
  const lastEmittedRef = useRef<string>(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [uploading, setUploading] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  // Muya 初始化时会把传入容器替换成新的根节点，这里保存替换后的 domNode 供预览层挂载
  const [editorEl, setEditorEl] = useState<HTMLElement | null>(null);

  const uploadImageFile = async (file: File): Promise<string> => {
    const compressed = await compressImageFile(file, uploadCompressMode);
    const formData = new FormData();
    formData.append('dir', 'article');
    formData.append('files', compressed);

    const {
      data: { data },
    } = await axios.post(`${getApiUrl()}/file`, formData, {
      headers: {
        Authorization: `Bearer ${store.token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    const urls = Array.isArray(data) ? data : (data?.urls ?? []);
    if (!urls.length) throw new Error('上传失败');
    return urls[0] as string;
  };

  /**
   * marktext 的 imageAction 契约：粘贴位图（data: URL）、拖拽本地图片
   * （getPathForFile 转成 blob: URL）、图片工具栏"上传"都会走到这里，
   * 由宿主负责持久化并返回最终写进文档的 src。
   */
  const imageAction = async (state: { src: string; alt?: string; title?: string }) => {
    const { src } = state;
    // 已经是可访问的 http(s) 图片，直接使用
    if (/^https?:\/\//.test(src)) return src;

    setUploading(true);
    try {
      const blob = await (await fetch(src)).blob();
      const ext = (blob.type.split('/')[1] || 'png').replace('+xml', '');
      const file = new File([blob], `image-${Date.now()}.${ext}`, { type: blob.type || 'image/png' });
      return await uploadImageFile(file);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!muyaPluginsRegistered) {
      muyaPluginsRegistered = true;

      // 与 marktext 桌面端 editor.vue 相同的插件清单与注册顺序
      const use = (plugin: unknown, options: Record<string, unknown> = {}) => Muya.use(plugin as IMuyaPluginConstructor, options);

      use(TableChessboard);
      use(ParagraphQuickInsertMenu);
      use(CodeBlockLanguageSelector);
      use(EmojiSelector);
      use(ImagePathPicker);
      use(ImageEditTool, {
        imageAction,
      });
      use(ImageResizeBar);
      use(ImageToolBar);
      use(InlineFormatToolbar);
      use(ParagraphFrontButton);
      use(ParagraphFrontMenu);
      use(PreviewToolBar);
      use(LinkTools, {
        jumpClick: (linkInfo: { href?: string | null } | null) => {
          const href = linkInfo?.href;
          if (href) window.open(href, '_blank', 'noopener,noreferrer');
        },
      });
      use(FootnoteTool);
      use(TableColumnToolbar);
      use(TableDragBar);
      use(TableRowColumMenu);
    }

    const isDark = document.body.classList.contains('dark');

    const muya = new Muya(container, {
      markdown: value,
      locale: zhCN,
      focusMode: false,
      fontSize: 16,
      lineHeight: 1.6,
      editorFontFamily: "'Open Sans', -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
      codeFontSize: 14,
      codeFontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      wrapCodeBlocks: true,
      listIndentation: 1,
      mermaidTheme: isDark ? 'dark' : 'default',
      vegaTheme: isDark ? 'dark' : 'latimes',
      spellcheckEnabled: false,
      // 浏览器里没有文件系统路径可取：把拖入的图片文件转成 blob URL，
      // 让引擎把它当作图片交给 imageAction 上传。
      getPathForFile: (file: File) => (file.type.startsWith('image/') ? URL.createObjectURL(file) : ''),
      // 粘贴 / 拖拽 / 截图插入的图片都走引擎 options 的 imageAction
      // （见 vendor/muya/clipboard/pasteImage.ts），由宿主负责上传并返回最终 src。
      imageAction,
    });

    muya.init();
    muyaRef.current = muya;
    // getContainer 会替换掉原容器，domNode 才是真正挂在页面上的编辑器根节点
    setEditorEl(muya.domNode);

    // 文档任何变更（打字、删除、粘贴）都会派发 json-change，
    // 与 marktext 桌面端一致，从引擎序列化回 markdown。
    muya.on('json-change', () => {
      const muyaInstance = muyaRef.current;
      if (!muyaInstance) return;
      const markdown = muyaInstance.getMarkdown();
      lastEmittedRef.current = markdown;
      onChangeRef.current(markdown);
    });

    // 图片预览：在浏览器中新标签页打开
    muya.on('preview-image', ({ data }: { data: string }) => {
      if (data) window.open(data, '_blank', 'noopener,noreferrer');
    });

    // 暗色模式切换时同步 mermaid / vega 图表主题并强制重渲染
    const observer = new MutationObserver(() => {
      const muyaInstance = muyaRef.current;
      if (!muyaInstance) return;
      const dark = document.body.classList.contains('dark');
      muyaInstance.setOptions({ mermaidTheme: dark ? 'dark' : 'default', vegaTheme: dark ? 'dark' : 'latimes' }, true);
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
      muya.destroy();
      muyaRef.current = null;
      setEditorEl(null);
    };
  }, []);

  // 外部内容变化（载入文章 / AI 续写优化）时同步进编辑器
  useEffect(() => {
    const muya = muyaRef.current;
    if (!muya) return;
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    muya.setContent(value);
  }, [value]);

  const insertImagesAtCursor = (urls: string[]) => {
    const muya = muyaRef.current;
    if (!muya) return;
    muya.focus();
    urls.forEach((url) => muya.insertImage({ src: url, alt: '' }));
  };

  // 小组件以 tx-widget 代码块形式写入 markdown，博客端解析渲染
  const insertWidget = (type: WidgetType) => {
    const muya = muyaRef.current;
    if (!muya) return;
    muya.focus();
    const payload = WIDGET_TEMPLATES[type];
    muya.insertCodeBlock({ lang: 'tx-widget', text: payload ? JSON.stringify(payload, null, 2) : '' });
  };

  // 从编辑器文档树中删除 tx-widget 代码块（走 json1 op，可撤销）
  const removeWidgetBlock = (pre: HTMLElement) => {
    muyaRef.current?.removeBlockByDom(pre);
  };

  useImperativeHandle(ref, () => ({
    insertImages: insertImagesAtCursor,
    openMaterial: () => setMaterialOpen(true),
    setFocusMode: (enabled: boolean) => muyaRef.current?.setFocusMode(enabled),
    insertWidget,
  }));

  return (
    <>
      <Spin spinning={uploading} className="h-full [&_.ant-spin-nested-loading]:h-full [&_.ant-spin-container]:h-full">
        <div
          ref={containerRef}
          className="create-muya-editor"
        />
      </Spin>

      {editorEl && <WidgetPreview container={editorEl} onDelete={removeWidgetBlock} />}

      <Material
        open={materialOpen}
        onClose={() => setMaterialOpen(false)}
        onSelect={(urls) => {
          setMaterialOpen(false);
          insertImagesAtCursor(urls);
        }}
      />
    </>
  );
});

MuyaEditor.displayName = 'MuyaEditor';

export default MuyaEditor;
