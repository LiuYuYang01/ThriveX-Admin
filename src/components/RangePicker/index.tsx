import { DatePicker, TimeRangePickerProps } from 'antd';
import { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default ({ onChange, ...props }: RangePickerProps) => {
  const currentDateInShop = dayjs();

  const rangePresets: TimeRangePickerProps['presets'] = [
    { label: '今天', value: [currentDateInShop.clone().startOf('day'), currentDateInShop.clone().endOf('day')] },
    {
      label: '昨天',
      value: [
        currentDateInShop.clone().subtract(1, 'day').startOf('day'),
        currentDateInShop.clone().subtract(1, 'day').endOf('day'),
      ],
    },
    { label: '最近7天', value: [currentDateInShop.clone().add(-7, 'd'), currentDateInShop.clone()] },
    { label: '最近15天', value: [currentDateInShop.clone().add(-14, 'd'), currentDateInShop.clone()] },
    { label: '最近30天', value: [currentDateInShop.clone().add(-30, 'd'), currentDateInShop.clone()] },
    { label: '最近90天', value: [currentDateInShop.clone().add(-90, 'd'), currentDateInShop.clone()] },
    { label: '最近半年', value: [currentDateInShop.clone().add(-180, 'd'), currentDateInShop.clone()] },
    { label: '最近一年', value: [currentDateInShop.clone().add(-365, 'd'), currentDateInShop.clone()] },
  ];

  return (
    <RangePicker
      presets={rangePresets}
      placeholder={['开始日期', '结束日期']}
      disabledDate={(current) => current && current > dayjs().endOf('day')}
      className="w-[260px]!"
      onChange={onChange}
      {...props}
    />
  )
}