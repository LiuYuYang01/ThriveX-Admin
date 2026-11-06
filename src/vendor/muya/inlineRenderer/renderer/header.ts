import type { BeginRuleToken, ISyntaxRenderOptions } from '../types';
import type Renderer from './index';
import { CLASS_NAMES } from '../../config';

export default function header(
    this: Renderer,
    {
        h,
        cursor,
        block,
        token,
        outerClass,
    }: ISyntaxRenderOptions & { token: BeginRuleToken },
) {
    const { content } = token;
    const { start, end } = token.range;
    // 光标在标题行内时始终显示 `#` 标记（与 Typora 一致），而不是只在光标
    // 紧挨标记时才显示。标题的可编辑文字从标记（含其后空格）之后开始，
    // 但用户点击文字最左端时光标落在标记之后的 offset 上，旧的区间判断
    // 会让标记保持隐藏，导致第一次退格只是删掉隐藏的空格、退格两次后才
    // 能看到 `#`。
    const className
        = cursor.block === block
            ? CLASS_NAMES.MU_GRAY
            : this.getClassName(
                outerClass,
                block,
                {
                    range: {
                        start,
                        end: end - content.length,
                    },
                } as BeginRuleToken,
                cursor,
            );
    const markerVnode = this.highlight(
        h,
        block,
        start,
        end - content.length,
        token,
    );
    const contentVnode = this.highlight(
        h,
        block,
        end - content.length,
        end,
        token,
    );
    const spaceSelector
        = className === CLASS_NAMES.MU_HIDE
            ? `span.${CLASS_NAMES.MU_HEADER_TIGHT_SPACE}.${CLASS_NAMES.MU_REMOVE}`
            : `span.${CLASS_NAMES.MU_GRAY}.${CLASS_NAMES.MU_REMOVE}`;

    return [
        h(`span.${className}.${CLASS_NAMES.MU_REMOVE}`, markerVnode),
        h(spaceSelector, contentVnode),
    ];
}
