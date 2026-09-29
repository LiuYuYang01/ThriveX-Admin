import dayjs from 'dayjs';
import { MOOD_OPTIONS } from '@/constants/mood';
import type { Record } from '@/types/app/record';

/** 心情 emoji → 中文标签。MOOD_OPTIONS 里没登记的 emoji 返回 undefined，只显示 emoji 本身。 */
const MOOD_LABEL_MAP = new Map<string, string>(
  MOOD_OPTIONS.map((item) => [item.emoji, item.label]),
);

export const getMoodLabel = (mood?: string): string | undefined =>
  mood ? MOOD_LABEL_MAP.get(mood) : undefined;

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 日分组标签沿用前台闪念时间轴的措辞：今天 / 昨天 / 6月29日，跨年补年份。 */
export const getDayLabelParts = (date: dayjs.Dayjs) => {
  const now = dayjs();
  const weekday = WEEKDAYS[date.day()];

  if (date.isSame(now, 'day')) return { main: '今天', sub: weekday, isToday: true };
  if (date.isSame(now.subtract(1, 'day'), 'day')) return { main: '昨天', sub: weekday, isToday: false };

  const main = `${date.month() + 1}月${date.date()}日`;
  if (date.isSame(now, 'year')) return { main, sub: weekday, isToday: false };
  return { main, sub: `${date.format('YYYY')} · ${weekday}`, isToday: false };
};

export interface DayGroup {
  key: string;
  main: string;
  sub: string;
  isToday: boolean;
  items: Record[];
}

/**
 * 列表接口已按 create_time 倒序返回，这里仅做稳定的按天归组。
 * 翻页可能把同一天切到两页上，标题会重复出现一次 —— 这是真实边界信息，不是重复渲染的 bug。
 */
export const groupRecordsByDay = (list: Record[]): DayGroup[] => {
  const groups: DayGroup[] = [];

  for (const item of list) {
    const date = dayjs(+(item.createTime ?? 0));
    if (!date.isValid()) continue;

    const key = date.format('YYYY-MM-DD');
    const last = groups[groups.length - 1];

    if (last && last.key === key) {
      last.items.push(item);
    } else {
      const { main, sub, isToday } = getDayLabelParts(date);
      groups.push({ key, main, sub, isToday, items: [item] });
    }
  }

  return groups;
};

/** 把毫秒时间戳格式化为 `09-21 13:15`，跨年时补上年份。 */
export const formatRecordTime = (createTime?: string | number): string => {
  if (createTime === undefined || createTime === null || createTime === '') return '—';
  const date = dayjs(+createTime);
  if (!date.isValid()) return '—';
  return date.isSame(dayjs(), 'year')
    ? date.format('MM-DD HH:mm')
    : date.format('YYYY-MM-DD HH:mm');
};
