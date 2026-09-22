import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCode, FiEye, FiTrash2 } from 'react-icons/fi';
import WidgetRenderer, { type WidgetPayload } from './widgets';
import './index.scss';

const LAYER_CLASS = 'tx-widget-preview-layer';
const PREVIEWING_CLASS = 'tx-widget-previewing';

interface BlockInfo {
  pre: HTMLElement;
  layer: HTMLElement;
  payload: WidgetPayload | null;
}

/**
 * 编辑器内 tx-widget 小组件的实时预览：
 * 扫描编辑器 DOM 中的 tx-widget 代码块，往块内挂一个 React 预览层（portal），
 * 右上角按钮可在「实时预览 / 编辑源码」之间切换，源码变更时预览即时刷新。
 */
export default function WidgetPreview({ container, onDelete }: { container: HTMLElement; onDelete?: (pre: HTMLElement) => void }) {
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  // 各代码块的预览开关，按 DOM 元素弱引用存储，默认开启预览
  const previewModes = useRef(new WeakMap<HTMLElement, boolean>());

  useEffect(() => {
    let signature = '';

    const ensureLayer = (pre: HTMLElement) => {
      let layer = pre.querySelector(`:scope > .${LAYER_CLASS}`) as HTMLElement | null;
      if (!layer) {
        layer = document.createElement('div');
        layer.className = LAYER_CLASS;
        pre.appendChild(layer);
      }
      return layer;
    };

    const scan = () => {
      const next: BlockInfo[] = [];
      const parts: string[] = [];

      for (const pre of Array.from(container.querySelectorAll<HTMLElement>('pre.mu-code-block'))) {
        const lang = pre.querySelector('.mu-language-input')?.textContent?.trim();
        if (lang !== 'tx-widget') continue;

        const raw = pre.querySelector('.mu-codeblock-content')?.textContent ?? '';
        let payload: WidgetPayload | null = null;
        if (raw.trim()) {
          try {
            const parsed: unknown = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
              payload = parsed as WidgetPayload;
          } catch {
            // JSON 解析失败时在预览层展示错误提示
          }
        }

        const layer = ensureLayer(pre);
        next.push({ pre, layer, payload });
        parts.push(raw, previewModes.current.get(pre) === false ? '0' : '1');
      }

      const sig = parts.join('\u0000');
      if (sig !== signature) {
        signature = sig;
        setBlocks(next);
      }
    };

    const observer = new MutationObserver((mutations) => {
      // 预览层自身的 DOM 变化不触发重扫，避免循环
      if (mutations.every((m) => (m.target as HTMLElement).closest?.(`.${LAYER_CLASS}`)))
        return;
      scan();
    });

    observer.observe(container, { childList: true, subtree: true, characterData: true });
    scan();

    return () => observer.disconnect();
  }, [container]);

  // 把预览态同步到代码块 DOM 上（驱动 CSS 隐藏源码区域）
  useEffect(() => {
    blocks.forEach(({ pre }) => {
      pre.classList.toggle(PREVIEWING_CLASS, previewModes.current.get(pre) !== false);
    });
  }, [blocks]);

  const toggle = (pre: HTMLElement) => {
    const current = previewModes.current.get(pre) !== false;
    previewModes.current.set(pre, !current);
    setBlocks((prev) => [...prev]);
  };

  return blocks.map(({ pre, layer, payload }) => {
    const previewing = previewModes.current.get(pre) !== false;
    return createPortal(
      <div className={`tx-widget-preview ${previewing ? 'is-previewing' : ''}`}>
        <div className="tx-widget-preview__actions">
          <button
            type="button"
            className="tx-widget-preview__toggle"
            title={previewing ? '编辑源码' : '预览组件'}
            onClick={() => toggle(pre)}
          >
            {previewing ? <FiCode size={12} /> : <FiEye size={12} />}
          </button>
          {onDelete && (
            <button
              type="button"
              className="tx-widget-preview__delete"
              title="删除组件"
              onClick={() => onDelete(pre)}
            >
              <FiTrash2 size={12} />
            </button>
          )}
        </div>
        {previewing && (
          <div className="tx-widget-preview__body">
            {payload ? (
              <WidgetRenderer data={payload} />
            ) : (
              <div className="tx-widget tx-widget--unknown">
                JSON 解析失败，请检查格式，否则发布后无法渲染为小组件
              </div>
            )}
          </div>
        )}
      </div>,
      layer,
    );
  });
}
