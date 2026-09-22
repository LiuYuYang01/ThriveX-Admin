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
} from 'react-icons/hi2';
import { FiLayers, FiList, FiArrowRightCircle } from 'react-icons/fi';

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
      menu={{ items: menuItems, onClick: ({ key }) => onSelect(key as WidgetType) }}
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
