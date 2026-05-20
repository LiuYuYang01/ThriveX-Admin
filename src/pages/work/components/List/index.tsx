import { useState, type ReactNode, type ComponentType } from 'react';

import { Button, message, Modal, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { BiBook, BiCheck, BiGlobe, BiLinkExternal, BiReply, BiTag, BiX } from 'react-icons/bi';
import { HiOutlineMail } from 'react-icons/hi';

import { auditCommentDataAPI, delCommentDataAPI, addCommentDataAPI } from '@/api/comment';
import { auditWallDataAPI, delWallDataAPI } from '@/api/wall';
import { delLinkDataAPI, auditWebDataAPI } from '@/api/web';
import { sendDismissEmailAPI, sendReplyWallEmailAPI } from '@/api/email';

import RandomAvatar from '@/components/RandomAvatar';
import { useUserStore, useWebStore } from '@/stores';
import TextArea from 'antd/es/input/TextArea';

type Menu = 'comment' | 'link' | 'wall';

interface ListItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  type: Menu;
  fetchData: (type: Menu) => void;
  setLoading: (loading: boolean) => void;
}

const ExternalLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="inline-flex min-w-0 items-center gap-1 text-primary hover:underline"
  >
    <span className="truncate">{children}</span>
    <BiLinkExternal size={13} className="shrink-0 opacity-60" />
  </a>
);

const MetaRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  children: ReactNode;
}) => (
  <div className="flex min-w-0 items-start gap-2.5 text-xs">
    <Icon size={14} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
    <span className="w-7 shrink-0 text-slate-400 dark:text-slate-500">{label}</span>
    <div className="min-w-0 flex-1 text-slate-600 dark:text-slate-300">{children}</div>
  </div>
);

export default ({ item, type, fetchData, setLoading }: ListItemProps) => {
  const [btnLoading, setBtnLoading] = useState<boolean>(false);

  const web = useWebStore((state) => state.web);
  const user = useUserStore((state) => state.user);

  const [btnType, setBtnType] = useState<'reply' | 'dismiss' | string>('');

  const handleApproval = async () => {
    setLoading(true);

    try {
      if (type === 'link') {
        await auditWebDataAPI(item.id);
      } else if (type === 'comment') {
        await auditCommentDataAPI(item.id);
      } else if (type === 'wall') {
        await auditWallDataAPI(item.id);
      }

      await fetchData(type);
      if (btnType !== 'reply') message.success('🎉 审核成功');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replyInfo, setReplyInfo] = useState('');

  const handleReply = async () => {
    setBtnLoading(true);

    try {
      await handleApproval();

      if (type === 'comment') {
        await addCommentDataAPI({
          avatar: user.avatar,
          url: web.url,
          content: replyInfo,
          commentId: item.id!,
          status: 1,
          email: user.email ? user.email : null,
          name: user.name,
          articleId: item.articleId!,
          createTime: new Date().getTime(),
        });
      }

      if (type === 'wall') {
        await sendReplyWallEmailAPI({
          to: item.email!,
          recipient: item.name!,
          your_content: item.content!,
          reply_content: replyInfo,
          time: dayjs(+item.createTime!).format('YYYY-MM-DD HH:mm:ss'),
          url: web.url + '/wall/all',
        });
      }

      await fetchData(type);
      message.success('🎉 回复成功');
      setReplyInfo('');
      setBtnType('');
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      setBtnLoading(false);
    }

    setBtnLoading(false);
  };

  const [dismissInfo, setDismissInfo] = useState('');

  const handleDismiss = async () => {
    setBtnLoading(true);

    try {
      if (type === 'link') {
        await delLinkDataAPI(item.id);
      } else if (type === 'comment') {
        await delCommentDataAPI(item.id);
      } else if (type === 'wall') {
        await delWallDataAPI(item.id);
      }

      if (dismissInfo.trim().length) await sendDismissEmail();

      await fetchData(type);
      message.success('🎉 驳回成功');
      setDismissInfo('');
      setBtnType('');
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      setBtnLoading(false);
    }

    setBtnLoading(false);
  };

  const sendDismissEmail = async () => {
    let email_info = {
      name: '',
      type: '',
      url: '',
    };

    switch (type) {
      case 'link':
        email_info = {
          name: item.title,
          type: '友链',
          url: `${web.url}/friend`,
        };
        break;
      case 'comment':
        email_info = {
          name: item.name,
          type: '评论',
          url: `${web.url}/article/${item.articleId}`,
        };
        break;
      case 'wall':
        email_info = {
          name: item.name,
          type: '留言',
          url: `${web.url}/wall/all`,
        };
        break;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    item.email != null &&
      (await sendDismissEmailAPI({
        to: item.email,
        content: dismissInfo,
        recipient: email_info.name,
        subject: `${email_info.type}驳回通知`,
        time: dayjs(Date.now()).format('YYYY年MM月DD日 HH:mm'),
        type: email_info.type,
        url: email_info.url,
      }));
  };

  const displayName = type === 'link' ? item.title : item.name;
  const canReply = type === 'comment' || type === 'wall';

  const openModal = (mode: 'reply' | 'dismiss') => {
    setBtnType(mode);
    setIsModalOpen(true);
  };

  const actionBtnClass =
    'flex size-8 items-center justify-center rounded-md text-slate-500 transition-colors disabled:pointer-events-none disabled:opacity-40';

  const ActionToolbar = () => (
    <div
      role="toolbar"
      aria-label="审核操作"
      className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200/70 bg-slate-50/80 p-0.5 dark:border-strokedark dark:bg-boxdark-2"
    >
      <Tooltip title="通过">
        <button
          type="button"
          onClick={handleApproval}
          aria-label="通过"
          className={`${actionBtnClass} hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 cursor-pointer`}
        >
          <BiCheck size={18} />
        </button>
      </Tooltip>
      {canReply && (
        <>
          <span className="h-4 w-px bg-slate-200/80 dark:bg-strokedark" aria-hidden />
          <Tooltip title="回复">
            <button
              type="button"
              onClick={() => openModal('reply')}
              aria-label="回复"
              className={`${actionBtnClass} hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/30 dark:hover:text-sky-400 cursor-pointer`}
            >
              <BiReply size={18} />
            </button>
          </Tooltip>
        </>
      )}
      <span className="h-4 w-px bg-slate-200/80 dark:bg-strokedark" aria-hidden />
      <Tooltip title="驳回">
        <button
          type="button"
          onClick={() => openModal('dismiss')}
          aria-label="驳回"
          className={`${actionBtnClass} hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 cursor-pointer`}
        >
          <BiX size={18} />
        </button>
      </Tooltip>
    </div>
  );

  const hasMetaFooter =
    (type === 'comment' && (item?.url || item.articleId)) ||
    (type === 'link' && (item?.url || item.type?.name));

  const Avatar = () =>
    item.avatar || item.image ? (
      <img
        src={item.avatar || item.image}
        alt=""
        className="size-9 shrink-0 rounded-full border border-slate-200/80 object-cover dark:border-strokedark"
      />
    ) : (
      <RandomAvatar className="size-9 shrink-0 rounded-full border border-slate-200/80 dark:border-strokedark" />
    );

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
      {/* 顶栏：身份 · 时间 · 操作 */}
      <header className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-strokedark dark:bg-boxdark-2/60">
        <Avatar />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3">
            <h4 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {displayName || '匿名'}
            </h4>
            <time className="shrink-0 text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
              {dayjs(+item.createTime!).format('MM-DD HH:mm')}
            </time>
          </div>
          {(item.email || (type !== 'link' && !item.email)) && (
            <p className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-xs text-slate-400 dark:text-slate-500">
              <HiOutlineMail size={11} className="shrink-0" />
              <span className="truncate">{item.email || '暂无邮箱'}</span>
            </p>
          )}
        </div>
        <ActionToolbar />
      </header>

      {/* 正文 */}
      <div className="px-4 py-3.5">
        {type === 'link' ? (
          <p className="border-l-2 border-slate-200 pl-3 text-[15px] leading-relaxed whitespace-pre-wrap text-slate-700 break-words dark:border-strokedark dark:text-slate-200">
            {item.description || '—'}
          </p>
        ) : (
          <p className="border-l-2 border-primary/40 pl-3 text-[15px] leading-relaxed whitespace-pre-wrap text-slate-800 break-words dark:text-slate-100">
            {item.content || '—'}
          </p>
        )}
      </div>

      {/* 附加信息 */}
      {hasMetaFooter && (
        <footer className="space-y-2 border-t border-slate-100 bg-slate-50/40 px-4 py-3 dark:border-strokedark dark:bg-boxdark-2/30">
          {type === 'link' && item.type?.name && (
            <MetaRow icon={BiTag} label="类型">
              {item.type.name}
            </MetaRow>
          )}
          {type === 'link' && item?.url && (
            <MetaRow icon={BiGlobe} label="网站">
              <ExternalLink href={item.url}>{item.url}</ExternalLink>
            </MetaRow>
          )}
          {type === 'comment' && item?.url && (
            <MetaRow icon={BiGlobe} label="网站">
              <ExternalLink href={item.url}>{item.url}</ExternalLink>
            </MetaRow>
          )}
          {type === 'comment' && item.articleId && (
            <MetaRow icon={BiBook} label="文章">
              <ExternalLink href={`${web.url}/article/${item.articleId}`}>
                {item.articleTitle || '暂无'}
              </ExternalLink>
            </MetaRow>
          )}
        </footer>
      )}

      <Modal
        title={btnType === 'reply' ? '回复内容' : '驳回原因'}
        open={isModalOpen}
        footer={null}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <TextArea
          value={btnType === 'reply' ? replyInfo : dismissInfo}
          onChange={(e) =>
            btnType === 'reply' ? setReplyInfo(e.target.value) : setDismissInfo(e.target.value)
          }
          placeholder={btnType === 'reply' ? '请输入回复内容' : '请输入驳回原因（可选，将邮件通知对方）'}
          autoSize={{ minRows: 4, maxRows: 8 }}
          className="!rounded-lg"
        />

        <div className="mt-4 flex gap-3">
          <Button className="flex-1" onClick={() => setIsModalOpen(false)}>
            取消
          </Button>
          <Button
            type="primary"
            danger={btnType === 'dismiss'}
            onClick={btnType === 'reply' ? handleReply : handleDismiss}
            loading={btnLoading}
            className="flex-1"
          >
            确定
          </Button>
        </div>
      </Modal>
    </article>
  );
};
