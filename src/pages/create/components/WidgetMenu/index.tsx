import { Dropdown, MenuProps, Tooltip } from 'antd';
import {
  SiBilibili,
  SiYoutube,
  SiTiktok,
} from 'react-icons/si';
import {
  HiOutlineSquares2X2,
  HiOutlineMusicalNote,
  HiOutlineSpeakerWave,
  HiOutlineClock,
  HiOutlinePhoto,
  HiOutlineCodeBracket,
  HiOutlineChevronDown,
  HiOutlineLightBulb,
  HiOutlineStar,
  HiOutlineScale,
  HiOutlineLink,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import { FiLayers, FiList, FiArrowRightCircle } from 'react-icons/fi';
import { VscDiff } from 'react-icons/vsc';

export type WidgetType =
  | 'bilibili'
  | 'youtube'
  | 'netease'
  | 'douyin'
  | 'audio'
  | 'tabs'
  | 'timeline'
  | 'steps'
  | 'gallery'
  | 'cta'
  | 'callout'
  | 'link-card'
  | 'collapse'
  | 'diff'
  | 'rating'
  | 'comparison'
  | 'article-ref'
  | 'custom';

/** 各小组件插入时的 JSON 模板，custom 为空块由用户自行编写 */
export const WIDGET_TEMPLATES: Partial<Record<WidgetType, Record<string, unknown>>> = {
  bilibili: { type: 'bilibili', bvid: 'BV1GJ411x7h7' },
  youtube: { type: 'youtube', id: 'dQw4w9WgXcQ' },
  netease: { type: 'netease', id: '1824045033' },
  douyin: { type: 'douyin', id: '7234567890123456789' },
  audio: {
    type: 'audio',
    title: '音频标题',
    artist: '作者',
    src: 'https://example.com/audio.mp3',
  },
  tabs: {
    type: 'tabs',
    items: [
      { title: '标签一', content: '标签一的内容' },
      { title: '标签二', content: '标签二的内容' },
    ],
  },
  timeline: {
    type: 'timeline',
    items: [
      { time: '2025', title: '事件标题', content: '事件描述' },
      { time: '2026', title: '事件标题', content: '事件描述' },
    ],
  },
  steps: {
    type: 'steps',
    items: [
      { title: '第一步', content: '第一步说明' },
      { title: '第二步', content: '第二步说明' },
    ],
  },
  gallery: {
    type: 'gallery',
    items: [
      { src: 'https://example.com/1.jpg', alt: '图片一' },
      { src: 'https://example.com/2.jpg', alt: '图片二' },
    ],
  },
  cta: {
    type: 'cta',
    title: 'CTA 标题',
    description: 'CTA 描述文案',
    primaryText: '查看更多',
    primaryUrl: 'https://example.com',
  },
  callout: {
    type: 'callout',
    variant: 'note',
    title: '小贴士',
    content: '在这里填写提示内容，variant 可选 note / tip / info / warning / danger',
  },
  'link-card': {
    type: 'link-card',
    title: '网站名称',
    description: '一句话介绍这个网站',
    cover: 'https://example.com/cover.jpg',
    url: 'https://example.com',
  },
  collapse: {
    type: 'collapse',
    title: '点击展开',
    content: '被折叠的内容，适合收纳长代码、配置或剧透',
    open: false,
  },
  diff: {
    type: 'diff',
    title: 'example.ts',
    code: '- const version = 1;\n+ const version = 2;',
  },
  rating: {
    type: 'rating',
    title: '整体评分',
    items: [
      { label: '性能', score: 5 },
      { label: '外观', score: 4 },
      { label: '性价比', score: 3 },
    ],
    summary: '一句话总结这款产品',
  },
  comparison: {
    type: 'comparison',
    leftTitle: '方案 A',
    rightTitle: '方案 B',
    items: [
      { label: '上手难度', left: '低', right: '高' },
      { label: '性能', left: '一般', right: '强' },
      { label: '价格', left: '便宜', right: '较贵' },
    ],
  },
  'article-ref': {
    type: 'article-ref',
    ids: [1],
  },
};

const menuItems: MenuProps['items'] = [
  {
    key: 'media',
    type: 'group',
    label: '媒体嵌入',
    children: [
      { key: 'bilibili', icon: <SiBilibili className="text-base" />, label: 'Bilibili' },
      { key: 'youtube', icon: <SiYoutube className="text-base" />, label: 'YouTube' },
      { key: 'netease', icon: <HiOutlineMusicalNote className="text-base" />, label: '网易云' },
      { key: 'douyin', icon: <SiTiktok className="text-base" />, label: '抖音' },
      { key: 'audio', icon: <HiOutlineSpeakerWave className="text-base" />, label: '音频' },
    ],
  },
  {
    key: 'content',
    type: 'group',
    label: '内容结构',
    children: [
      { key: 'tabs', icon: <FiLayers className="text-base" />, label: 'Tabs' },
      { key: 'timeline', icon: <HiOutlineClock className="text-base" />, label: '时间线' },
      { key: 'steps', icon: <FiList className="text-base" />, label: '步骤条' },
      { key: 'collapse', icon: <HiOutlineChevronDown className="text-base" />, label: '折叠面板' },
    ],
  },
  {
    key: 'express',
    type: 'group',
    label: '创作表达',
    children: [
      { key: 'callout', icon: <HiOutlineLightBulb className="text-base" />, label: '提示块' },
      { key: 'diff', icon: <VscDiff className="text-base" />, label: '代码对比' },
      { key: 'rating', icon: <HiOutlineStar className="text-base" />, label: '评分卡' },
      { key: 'comparison', icon: <HiOutlineScale className="text-base" />, label: '双栏对比' },
      { key: 'link-card', icon: <HiOutlineLink className="text-base" />, label: '网址卡片' },
    ],
  },
  {
    key: 'site',
    type: 'group',
    label: '站内数据',
    children: [
      { key: 'article-ref', icon: <HiOutlineDocumentText className="text-base" />, label: '文章引用' },
    ],
  },
  {
    key: 'more',
    type: 'group',
    label: '更多',
    children: [
      { key: 'gallery', icon: <HiOutlinePhoto className="text-base" />, label: '画廊' },
      { key: 'cta', icon: <FiArrowRightCircle className="text-base" />, label: 'CTA 卡片' },
    ],
  },
  {
    key: 'custom',
    type: 'group',
    label: '自定义',
    children: [
      { key: 'custom', icon: <HiOutlineCodeBracket className="text-base" />, label: '自定义 JSON' },
    ],
  },
];

interface Props {
  onSelect: (type: WidgetType) => void;
}

export default function WidgetMenu({ onSelect }: Props) {
  return (
    <Dropdown
      menu={{
        items: menuItems,
        onClick: ({ key }) => onSelect(key as WidgetType),
        // 菜单项较多，限制高度可滚动
        style: { maxHeight: '65vh', overflowY: 'auto' },
      }}
      trigger={['click']}
      placement="bottomLeft"
    >
      <Tooltip title="插入小组件">
        <button
          type="button"
          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-boxdark-2"
        >
          <HiOutlineSquares2X2 size={16} />
        </button>
      </Tooltip>
    </Dropdown>
  );
}
