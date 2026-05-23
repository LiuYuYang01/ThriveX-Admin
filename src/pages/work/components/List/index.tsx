import { useState, type ReactNode, type ComponentType } from 'react';

import { Button, message, Modal, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { BiBook, BiCheck, BiGlobe, BiLinkExternal, BiReply, BiTag, BiX } from 'react-icons/bi';
import { HiOutlineMail } from 'react-icons/hi';
import { IoTimeOutline } from 'react-icons/io5';

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
    <BiLinkExternal size={11} className="shrink-0 opacity-50" />
  </a>
);

const MetaChip = ({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  children: ReactNode;
}) => (
  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-500 dark:bg-boxdark-2 dark:text-slate-400">
    <Icon size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
    <span className="min-w-0 truncate">{children}</span>
  </span>
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

  const Avatar = () =>
    item.avatar || item.image ? (
      <img
        src={item.avatar || item.image}
        alt=""
        className="size-10 shrink-0 rounded-full border-2 border-white object-cover dark:border-boxdark"
      />
    ) : (
      <RandomAvatar className="size-10 shrink-0 rounded-full border-2 border-white dark:border-boxdark" />
    );

  const actionBtnBase = "flex size-8 cursor-pointer items-center justify-center rounded-lg transition-all duration-150";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white transition-all duration-200 hover:border-slate-300/80 dark:border-strokedark dark:bg-boxdark dark:hover:border-slate-600">
      <div className="flex gap-4 px-5 py-4">
        <div className="relative mt-0.5">
          <Avatar />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h4 className="truncate text-[15px] font-semibold text-slate-800 dark:text-slate-100">
                  {displayName || '匿名'}
                </h4>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-boxdark-2 dark:text-slate-400">
                  <IoTimeOutline size={10} />
                  {dayjs(+item.createTime!).format('MM/DD HH:mm')}
                </span>
              </div>
              {(item.email || (type !== 'link' && !item.email)) && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                  <HiOutlineMail size={12} className="shrink-0" />
                  <span className="truncate">{item.email || '暂无邮箱'}</span>
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
              <Tooltip title="通过">
                <button
                  type="button"
                  onClick={handleApproval}
                  aria-label="通过"
                  className={`${actionBtnBase} text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400`}
                >
                  <BiCheck size={20} />
                </button>
              </Tooltip>
              {canReply && (
                <Tooltip title="回复">
                  <button
                    type="button"
                    onClick={() => openModal('reply')}
                    aria-label="回复"
                    className={`${actionBtnBase} text-slate-400 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/30 dark:hover:text-sky-400`}
                  >
                    <BiReply size={20} />
                  </button>
                </Tooltip>
              )}
              <Tooltip title="驳回">
                <button
                  type="button"
                  onClick={() => openModal('dismiss')}
                  aria-label="驳回"
                  className={`${actionBtnBase} text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400`}
                >
                  <BiX size={20} />
                </button>
              </Tooltip>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-slate-50/80 px-4 py-3 dark:bg-boxdark-2/50">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 break-words dark:text-slate-200">
              {type === 'link' ? (item.description || '—') : (item.content || '—')}
            </p>
          </div>

          {((type === 'comment' && (item?.url || item.articleId)) ||
            (type === 'link' && (item?.url || item.type?.name))) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {type === 'link' && item.type?.name && (
                  <MetaChip icon={BiTag}>{item.type.name}</MetaChip>
                )}
                {type === 'link' && item?.url && (
                  <MetaChip icon={BiGlobe}>
                    <ExternalLink href={item.url}>{item.url}</ExternalLink>
                  </MetaChip>
                )}
                {type === 'comment' && item?.url && (
                  <MetaChip icon={BiGlobe}>
                    <ExternalLink href={item.url}>{item.url}</ExternalLink>
                  </MetaChip>
                )}
                {type === 'comment' && item.articleId && (
                  <MetaChip icon={BiBook}>
                    <ExternalLink href={`${web.url}/article/${item.articleId}`}>
                      {item.articleTitle || '暂无'}
                    </ExternalLink>
                  </MetaChip>
                )}
              </div>
            )}
        </div>
      </div>

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
