import type { FormInstance } from 'antd';
import { Button, Form, Input, Tooltip } from 'antd';
import { FiCalendar, FiGrid, FiList, FiRotateCcw, FiSearch } from 'react-icons/fi';

import RangePicker from '@/components/RangePicker';
import type { RecordFilterDataForm } from '@/types/app/record';

export type RecordView = 'feed' | 'list';

const VIEW_OPTIONS: { key: RecordView; label: string; icon: typeof FiList }[] = [
  { key: 'feed', label: '卡片', icon: FiGrid },
  { key: 'list', label: '列表', icon: FiList },
];

export function RecordToolbar({
  form,
  onValuesChange,
  view,
  onViewChange,
  hasActiveFilters,
  onReset,
  summary,
}: {
  form: FormInstance<RecordFilterDataForm>;
  onValuesChange: (changedValues: Partial<RecordFilterDataForm>, allValues: RecordFilterDataForm) => void;
  view: RecordView;
  onViewChange: (view: RecordView) => void;
  hasActiveFilters: boolean;
  onReset: () => void;
  summary: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-strokedark dark:bg-boxdark">
      <Form
        form={form}
        onValuesChange={onValuesChange}
        className="flex flex-wrap items-center gap-2"
      >
        <Form.Item name="content" className="mb-0! w-full sm:w-52">
          <Input
            allowClear
            placeholder="搜索闪念内容…"
            aria-label="搜索闪念内容"
            prefix={<FiSearch className="text-slate-400" size={15} />}
          />
        </Form.Item>

        <Form.Item name="createTime" className="mb-0! w-full sm:w-auto">
          <RangePicker
            className="w-full sm:w-60!"
            placeholder={['开始日期', '结束日期']}
            suffixIcon={<FiCalendar className="text-slate-400" size={15} />}
          />
        </Form.Item>
      </Form>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className="hidden text-xs tabular-nums text-slate-500 dark:text-slate-400 sm:inline">
          {summary}
        </span>

        <div
          className="flex items-center gap-0.5 rounded-lg border border-slate-200/80 bg-slate-100 p-0.5 dark:border-strokedark dark:bg-boxdark-2"
          role="group"
          aria-label="切换视图"
        >
          {VIEW_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = view === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onViewChange(option.key)}
                aria-pressed={isActive}
                aria-label={`切换为${option.label}视图`}
                className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
                  isActive
                    ? 'bg-white text-slate-800 dark:bg-[#1f2838] dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={13} />
                <span className="hidden lg:inline">{option.label}</span>
              </button>
            );
          })}
        </div>

        <Tooltip title="清除筛选条件">
          <Button
            type="text"
            icon={<FiRotateCcw size={15} />}
            onClick={onReset}
            disabled={!hasActiveFilters}
            aria-label="清除筛选条件"
            className="shrink-0 cursor-pointer text-slate-500 hover:text-slate-700 disabled:opacity-40 dark:text-slate-400 dark:hover:text-slate-200"
          />
        </Tooltip>
      </div>
    </div>
  );
}
