import type { Muya } from '../muya';
import type Content from '../block/base/content';
import { replaceBlockByLabel } from '../block/blockTransforms';
import { isKeyboardEvent } from '../utils';

/**
 * Typora 风格的编辑器快捷键层：
 * - Ctrl/Cmd+Z 撤销、Ctrl/Cmd+Y 或 Ctrl/Cmd+Shift+Z 重做（必须拦截原生撤销，
 *   否则浏览器直接改 DOM 会与 muya 的 OT 历史脱节）
 * - 非空段落的块转换（保留文字）：Ctrl+0 段落 / Ctrl+1~6 标题 /
 *   Ctrl+Shift+Q 引用 / Ctrl+Shift+O 有序列表 / Ctrl+Shift+U 无序列表 /
 *   Ctrl+Shift+X 任务列表。空段落的转换由快捷插入菜单的快捷键处理。
 */

/** 非空段落的块转换表：event.code → 快捷插入菜单的 label */
const BLOCK_TRANSFORMS: Record<string, string> = {
    Digit0: 'paragraph',
    Digit1: 'atx-heading 1',
    Digit2: 'atx-heading 2',
    Digit3: 'atx-heading 3',
    Digit4: 'atx-heading 4',
    Digit5: 'atx-heading 5',
    Digit6: 'atx-heading 6',
    KeyQ: 'block-quote',
    KeyO: 'order-list',
    KeyU: 'bullet-list',
    KeyX: 'task-list',
};

export function handleEditorShortcuts(muya: Muya, event: Event): boolean {
    if (!isKeyboardEvent(event))
        return false;
    if (!(event.metaKey || event.ctrlKey))
        return false;
    if (event.defaultPrevented)
        return false;

    // ---- 撤销 / 重做 ----
    if (event.code === 'KeyZ' || event.code === 'KeyY') {
        event.preventDefault();
        const isRedo = event.code === 'KeyY' || event.shiftKey;
        if (isRedo)
            muya.redo();
        else
            muya.undo();
        return true;
    }

    if (event.altKey || event.key === 'Shift')
        return false;

    // ---- 非空段落的块转换（空段落交给快捷插入菜单的同款快捷键） ----
    const label = BLOCK_TRANSFORMS[event.code];
    if (!label)
        return false;

    const selection = muya.editor.selection.getSelection();
    const anchorBlock = selection?.anchor.block as Content | undefined;
    if (!selection?.isSelectionInSameBlock || !anchorBlock?.text)
        return false;

    const parent = anchorBlock.parent;
    // 仅支持段落 / ATX 标题内的转换（标题内 Ctrl+0 回退段落、Ctrl+1~6 切换级别）
    if (!parent || (parent.blockName !== 'paragraph' && parent.blockName !== 'atx-heading'))
        return false;

    // 普通段落上 Ctrl+0 无意义
    if (label === 'paragraph' && parent.blockName === 'paragraph')
        return false;

    // 标题内容文字自带 "# " 标记，转换前剥掉
    const text = anchorBlock.text.replace(/^#{1,6}\s+/, '');

    event.preventDefault();
    replaceBlockByLabel({ block: parent, muya, label, text });
    return true;
}
