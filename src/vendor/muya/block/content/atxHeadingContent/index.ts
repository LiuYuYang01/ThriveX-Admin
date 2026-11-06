import type { Muya } from '../../../muya';
import type { IRenderCursor } from '../../../selection/types';
import type AtxHeading from '../../commonMark/atxHeading';
import { isKeyboardEvent } from '../../../utils';
import Format from '../../base/format';
import { ScrollPage } from '../../scrollPage';

class AtxHeadingContent extends Format {
    public override parent: AtxHeading | null = null;

    static override blockName = 'atxheading.content';

    static create(muya: Muya, text: string) {
        const content = new AtxHeadingContent(muya, text);

        return content;
    }

    constructor(muya: Muya, text: string) {
        super(muya, text);
        this.classList = [...this.classList, 'mu-atxheading-content'];
        this.createDomNode();
    }

    override getAnchor() {
        return this.parent;
    }

    override update(cursor?: IRenderCursor, highlights = []) {
        return this.inlineRenderer.patch(this, cursor, highlights);
    }

    // 只要光标在标题行内就需要重渲染，这样点击/移动光标到标题任意位置时
    // 都能立即把行首的 `#` 标记显示出来（见 inlineRenderer/renderer/header.ts）。
    override checkNeedRender() {
        return true;
    }

    override enterHandler(event: Event) {
        const { start, end } = this.getCursor()!;
        const { level } = this.parent!.meta;

        if (start.offset === end.offset && start.offset <= level + 1) {
            // Without preventDefault the browser still runs its native
            // Enter behavior on the contenteditable after we insert the
            // new paragraph, which can split or clone the heading's
            // `mu-content` span. Orphaned spans lack BLOCK_DOM_PROPERTY,
            // so a later click crashes Selection.getSelection at
            // `anchorBlock.path`.
            event.preventDefault();
            event.stopPropagation();

            const newNodeState = {
                name: 'paragraph',
                text: '',
            };

            const newParagraphBlock = ScrollPage.loadBlock(newNodeState.name).create(
                this.muya,
                newNodeState,
            );
            this.parent!.parent!.insertBefore(newParagraphBlock, this.parent);
            this.setCursor(start.offset, end.offset, true);
        }
        else if (isKeyboardEvent(event)) {
            super.enterHandler(event);
        }
    }

    override backspaceHandler(event: Event) {
        const { start, end } = this.getCursor()!;
        // 标题的文本把行首标记（如 `# `）也算在内，而用户看到的可编辑文字
        // 从标记之后开始。点击标题文字最左端时光标落在 `# ` 之后（offset 2），
        // 而不是 offset 0；若只判断 offset 0，第一次退格会去删隐藏标记里的
        // 空格（界面上表现为只冒出 `#`），必须再退格一次才能删掉标记。
        // 因此只要光标还在行首标记范围内，一次退格就整体去掉标记并转成普通段落。
        const marker = this.text.match(/^ {0,3}#{1,6} */);
        const markerLength = marker ? marker[0].length : this.parent!.meta.level + 1;

        if (start.offset === end.offset && start.offset <= markerLength) {
            event.preventDefault();
            this.text = this.text.slice(markerLength);
            // 让 convertToParagraph 把新段落的光标落在可见文字开头
            this.setCursor(0, 0);
            this.convertToParagraph();
        }
        else {
            super.backspaceHandler(event);
        }
    }
}

export default AtxHeadingContent;
