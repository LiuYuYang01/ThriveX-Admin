import type { ComponentType, ReactNode } from 'react';
import dayjs from 'dayjs';
import { Popconfirm, Tooltip } from 'antd';
import { FiCornerUpRight, FiExternalLink, FiTrash2 } from 'react-icons/fi';

import RandomAvatar from '@/components/RandomAvatar';

/** 文章/闪念评论卡片共用的字段（两种评论类型的公共子集） */
export interface CommentCardItem {
  id?: number;
  name: string;
  avatar?: string | null;
  content: string;
  replyName?: string;
  createTime: number;
  articleId?: number;
  articleTitle?: string;
  recordId?: number;
  recordContent?: string;
  children?: CommentCardItem[];
}

export function CommentAvatar({ avatar, small }: { avatar?: string | null; small?: boolean }) {
  const size = small ? 'size-7' : 'size-10';
  if (avatar) {
    return (
      <img
        src={avatar}
        alt=""
        className={`${size} shrink-0 rounded-full border border-slate-200/80 object-cover dark:border-strokedark`}
      />
    );
  }
  return (
    <RandomAvatar
      className={`${size} shrink-0 rounded-full border border-slate-200/80 dark:border-strokedark`}
    />
  );
}

const MetaLink = ({
  icon: Icon,
  href,
  children,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  href: string;
  children: ReactNode;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="inline-flex min-w-0 items-center gap-1 text-xs text-slate-400 hover:text-primary dark:text-slate-500"
  >
    <Icon size={12} className="shrink-0" />
    <span className="truncate">{children}</span>
    <FiExternalLink size={10} className="shrink-0 opacity-60" />
  </a>
);

const CardActions = ({
  item,
  onReply,
  onDelete,
  small,
}: {
  item: CommentCardItem;
  onReply: (item: CommentCardItem) => void;
  onDelete: (item: CommentCardItem) => void;
  small?: boolean;
}) => {
  const size = small ? 'size-7' : 'size-8';
  const iconSize = small ? 14 : 16;

  return (
    <div className="flex shrink-0 items-center gap-0.5 opacity-60 group-hover/card:opacity-100">
      <Tooltip title="回复">
        <button
          type="button"
          onClick={() => onReply(item)}
          aria-label={`回复 ${item.name || '该用户'}`}
          className={`flex ${size} cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/30 dark:hover:text-sky-400`}
        >
          <FiCornerUpRight size={iconSize} />
        </button>
      </Tooltip>
      <Popconfirm
        title="删除评论"
        description={`确定删除「${item.name || '该用户'}」的这条评论吗？`}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        onConfirm={() => onDelete(item)}
      >
        <Tooltip title="删除">
          <button
            type="button"
            aria-label="删除评论"
            className={`flex ${size} cursor-pointer items-center justify-center rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300`}
          >
            <FiTrash2 size={iconSize} />
          </button>
        </Tooltip>
      </Popconfirm>
    </div>
  );
};

interface ReplyItemProps {
  item: CommentCardItem;
  onReply: (item: CommentCardItem) => void;
  onDelete: (item: CommentCardItem) => void;
}

/** 回复采用轻量行式展示，来源等信息在父卡片已体现，这里不重复 */
function ReplyItem({ item, onReply, onDelete }: ReplyItemProps) {
  return (
    <div className="group/card flex gap-2.5">
      <CommentAvatar avatar={item.avatar} small />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate text-[13px] font-medium text-slate-700 dark:text-slate-200">
              {item.name || '匿名'}
            </span>
            {item.replyName && (
              <span className="truncate text-xs text-slate-400 dark:text-slate-500">
                回复 {item.replyName}
              </span>
            )}
            <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
              {dayjs(+item.createTime).format('MM/DD HH:mm')}
            </span>
          </div>
          <CardActions item={item} onReply={onReply} onDelete={onDelete} small />
        </div>

        <p className="mt-0.5 text-sm leading-relaxed break-words whitespace-pre-wrap text-slate-600 dark:text-slate-300">
          {item.content}
        </p>

        {item.children?.length ? (
          <div className="mt-2 space-y-2 border-l border-slate-200/70 pl-3 dark:border-strokedark/70">
            {item.children.map((child) => (
              <ReplyItem key={child.id} item={child} onReply={onReply} onDelete={onDelete} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface CommentCardProps {
  item: CommentCardItem;
  sourceIcon: ComponentType<{ size?: number; className?: string }>;
  getSource: (item: CommentCardItem) => { label: string; href: string } | null;
  onReply: (item: CommentCardItem) => void;
  onDelete: (item: CommentCardItem) => void;
}

/** 工作台风格的评论卡片，children 作为嵌套回复渲染在下方 */
export function CommentCard({
  item,
  sourceIcon,
  getSource,
  onReply,
  onDelete,
}: CommentCardProps) {
  const source = getSource(item);

  return (
    <article className="group/card rounded-2xl border border-slate-200/60 bg-white hover:border-slate-300/80 dark:border-strokedark dark:bg-boxdark dark:hover:border-slate-600">
      <div className="flex gap-4 px-5 py-4">
        <CommentAvatar avatar={item.avatar} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h4 className="truncate text-[15px] font-semibold text-slate-800 dark:text-slate-100">
                  {item.name || '匿名'}
                </h4>
                <time className="shrink-0 text-xs tabular-nums text-slate-400 dark:text-slate-500">
                  {dayjs(+item.createTime).format('MM/DD HH:mm')}
                </time>
              </div>

              {source && (
                <div className="mt-1">
                  <MetaLink icon={sourceIcon} href={source.href}>
                    {source.label}
                  </MetaLink>
                </div>
              )}
            </div>
            <CardActions item={item} onReply={onReply} onDelete={onDelete} />
          </div>

          <div className="mt-3 rounded-xl bg-slate-50/80 px-4 py-3 dark:bg-boxdark-2/50">
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-slate-700 dark:text-slate-200">
              {item.content || '—'}
            </p>
          </div>

          {item.children?.length ? (
            <div className="mt-3 space-y-3 border-l border-slate-200/70 pl-3.5 dark:border-strokedark/70">
              {item.children.map((child) => (
                <ReplyItem key={child.id} item={child} onReply={onReply} onDelete={onDelete} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
