import { Button, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  FiCheck,
  FiEdit2,
  FiInfo,
  FiLink,
  FiLoader,
  FiMoreVertical,
  FiTrash2,
  FiZap,
} from 'react-icons/fi';
import { ImSwitch } from 'react-icons/im';

import type { Assistant } from '@/types/app/assistant';

import { getAssistantDisplayLabel, getAssistantModelInfo, getAssistantModelTheme } from '../modelConfig';
import ModelIcon from './ModelIcon';

export type TestResult = { ok: boolean; at: number };

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

type AssistantCardProps = {
  item: Assistant;
  isTesting: boolean;
  testResult?: TestResult;
  onEdit: (record: Assistant) => void;
  onSetDefault: (id: number) => void;
  onDelete: (record: Assistant) => void;
  onTest: (record: Assistant) => void;
};

export default function AssistantCard({
  item,
  isTesting,
  testResult,
  onEdit,
  onSetDefault,
  onDelete,
  onTest,
}: AssistantCardProps) {
  const info = getAssistantModelInfo(item.model);
  const displayLabel = getAssistantDisplayLabel(item.model);
  const washClass = getAssistantModelTheme(item.model).washClass;
  const isDefault = !!item.isDefault;

  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: '编辑配置',
      icon: <FiEdit2 className="text-base" />,
      onClick: () => onEdit(item),
    },
    { type: 'divider' },
    {
      key: 'delete',
      label: '删除助手',
      danger: true,
      icon: <FiTrash2 className="text-base" />,
      onClick: () => onDelete(item),
    },
  ];

  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border-2 bg-white transition-shadow hover:shadow-default dark:bg-boxdark ${isDefault
        ? 'border-primary'
        : 'border-slate-200/80 hover:border-slate-300 dark:border-strokedark dark:hover:border-slate-600'
        }`}
    >
      {/* 服务商品牌色渗透 */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent ${washClass}`} />

      <header className="relative mb-3.5 flex items-start justify-between gap-2 p-5 pb-0">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <ModelIcon model={item.model} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-800 dark:text-slate-100">{displayLabel}</h3>
              {info && (
                <Tooltip title={info.desc}>
                  <button
                    type="button"
                    className="inline-flex shrink-0 cursor-pointer text-slate-400 hover:text-primary dark:text-slate-500"
                    aria-label="模型说明"
                  >
                    <FiInfo size={14} />
                  </button>
                </Tooltip>
              )}
            </div>
            <p className="mb-0 mt-1 truncate font-mono text-xs text-slate-500 dark:text-slate-400">{item.model}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isDefault && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium leading-none text-white">
              <FiCheck size={11} />
              当前使用
            </span>
          )}

          <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
            <button
              type="button"
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-200"
              aria-label="更多操作"
            >
              <FiMoreVertical size={18} />
            </button>
          </Dropdown>
        </div>
      </header>

      <div className="relative flex-1 px-5">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <FiLink size={12} />
          接入地址
        </div>
        <p className="m-0 break-all font-mono text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{item.url}</p>

        {testResult && (
          <p
            className={`mb-0 mt-3 inline-flex items-center gap-1.5 text-xs font-medium ${testResult.ok
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
              }`}
          >
            <span className={`size-1.5 rounded-full ${testResult.ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {testResult.ok ? `连接正常 · ${formatTime(testResult.at)}` : `连接失败 · ${formatTime(testResult.at)}`}
          </p>
        )}
      </div>

      <footer className="relative mt-4 flex gap-2 border-t border-slate-100 p-5 dark:border-strokedark">
        <Button
          type={isTesting ? 'default' : 'primary'}
          ghost={!isTesting}
          disabled={isTesting}
          className="h-9! flex-1 rounded-xl! text-sm! font-medium"
          icon={isTesting ? <FiLoader className="animate-spin" /> : <FiZap />}
          onClick={() => onTest(item)}
        >
          {isTesting ? '测试中…' : '测试连接'}
        </Button>
        <Button
          disabled={isDefault}
          icon={<ImSwitch />}
          className="h-9! flex-1 rounded-xl! text-sm! font-medium"
          onClick={() => onSetDefault(+item.id!)}
        >
          {isDefault ? '已是默认' : '设为默认'}
        </Button>
      </footer>
    </article>
  );
}
