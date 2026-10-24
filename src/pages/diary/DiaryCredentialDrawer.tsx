import { useCallback, useEffect, useState } from 'react';
import { Button, Drawer, Input, Modal, Popconfirm, Spin, message } from 'antd';
import { FiCheck, FiEdit2, FiLock, FiPlus, FiTrash2, FiX } from 'react-icons/fi';

import {
  addDiaryCredentialAPI,
  delDiaryCredentialAPI,
  editDiaryCredentialAPI,
  getDiaryCredentialListAPI,
} from '@/api/diary';
import type { DiaryCredential } from '@/types/app/diary';

interface EditingState {
  id: number;
  question: string;
  answer: string;
}

const formatDay = (timestamp?: number) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

export default function DiaryCredentialDrawer({
  open,
  onClose,
  onCountChange,
}: {
  open: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [list, setList] = useState<DiaryCredential[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const getList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getDiaryCredentialListAPI();
      setList(data ?? []);
      onCountChange?.(data?.length ?? 0);
    } catch (error) {
      console.error('获取密语列表失败：', error);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    if (open) void getList();
  }, [getList, open]);

  const submit = useCallback(
    async (payload: DiaryCredential, isEdit: boolean) => {
      try {
        setSaving(true);
        if (isEdit) {
          await editDiaryCredentialAPI(payload);
          message.success('密语已更新');
        } else {
          await addDiaryCredentialAPI(payload);
          message.success('密语已添加，现在有人能翻开这本日记了');
        }
        await getList();
      } catch (error) {
        console.error('保存密语失败：', error);
      } finally {
        setSaving(false);
      }
    },
    [getList],
  );

  const handleAdd = useCallback(() => {
    const question = newQuestion.trim();
    const answer = newAnswer.trim();
    if (!question) return message.warning('先写下问题');
    if (!answer) return message.warning('先写下答案');
    setNewQuestion('');
    setNewAnswer('');
    void submit({ question, answer }, false);
  }, [newAnswer, newQuestion, submit]);

  const handleRemove = useCallback(
    async (id: number) => {
      try {
        setRemovingId(id);
        await delDiaryCredentialAPI(id);
        message.success('这条密语已删除');
        if (editing?.id === id) setEditing(null);
        await getList();
      } catch (error) {
        console.error('删除密语失败：', error);
      } finally {
        setRemovingId(null);
      }
    },
    [editing, getList],
  );

  const confirmRemove = useCallback(
    (item: DiaryCredential) => {
      const id = item.id!;
      if (list.length <= 1) {
        Modal.confirm({
          title: '这是最后一条密语',
          content: '删除后没有人能打开日记本，直到你再加一条密语。确定删除吗？',
          okText: '仍然删除',
          okButtonProps: { danger: true },
          cancelText: '取消',
          centered: true,
          onOk: () => handleRemove(id),
        });
        return;
      }
      void handleRemove(id);
    },
    [handleRemove, list.length],
  );

  return (
    <Drawer
      title="访问密语"
      placement="right"
      width={460}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: '20px 22px 28px' } }}
    >
      <p className="mb-5 text-[13px] leading-6 text-slate-500 dark:text-slate-400">
        日记本对所有人上锁，只有答对问题的人才能翻开。答案会以密文保存，保存后任何人都看不到原文，包括你。
      </p>

      <Spin spinning={loading}>
        <div className="space-y-2.5">
          {list.length === 0 && !loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-center dark:border-strokedark">
              <div className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-400 dark:bg-boxdark-2">
                <FiLock size={19} />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">还没有密语</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                在下方添加第一组问答，别人才有机会翻开这本日记
              </p>
            </div>
          ) : (
            list.map((item) => {
              const draft = editing?.id === item.id ? editing : null;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 dark:border-strokedark dark:bg-boxdark"
                >
                  {draft ? (
                    <div className="space-y-2.5">
                      <Input
                        value={draft.question}
                        onChange={(e) => setEditing({ ...draft, question: e.target.value })}
                        placeholder="问题"
                        maxLength={120}
                      />
                      <Input
                        value={draft.answer}
                        onChange={(e) => setEditing({ ...draft, answer: e.target.value })}
                        placeholder="新答案，留空表示保持不变"
                        maxLength={120}
                      />
                      <div className="flex items-center justify-end gap-2 pt-0.5">
                        <Button
                          size="small"
                          icon={<FiX size={13} />}
                          className="cursor-pointer"
                          onClick={() => setEditing(null)}
                        >
                          取消
                        </Button>
                        <Button
                          size="small"
                          type="primary"
                          loading={saving}
                          icon={<FiCheck size={13} />}
                          className="cursor-pointer"
                          onClick={() => {
                            const question = draft.question.trim();
                            if (!question) return message.warning('问题不能为空');
                            const answer = draft.answer.trim();
                            setEditing(null);
                            void submit({ id: item.id, question, answer: answer || undefined }, true);
                          }}
                        >
                          保存
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {item.question}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                          答案已加密{formatDay(item.createTime) ? ` · ${formatDay(item.createTime)}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          className="grid size-7 cursor-pointer place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200"
                          title="编辑这条密语"
                          onClick={() => setEditing({ id: item.id!, question: item.question, answer: '' })}
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <Popconfirm
                          title="删除这条密语？"
                          description="用过这个问题的人，之后将无法再翻开日记本"
                          okText="删除"
                          okButtonProps={{ danger: true }}
                          cancelText="取消"
                          onConfirm={() => confirmRemove(item)}
                        >
                          <button
                            type="button"
                            disabled={removingId === item.id}
                            className="grid size-7 cursor-pointer place-items-center rounded-lg text-red-500/80 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10"
                            title="删除"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </Popconfirm>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Spin>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-boxdark-2">
        <div className="mb-3 text-xs font-medium tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
          添加一组问答
        </div>
        <div className="space-y-2.5">
          <Input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="问题，例如：我们第一次见面是在哪条路？"
            maxLength={120}
            showCount
            classNames={{ input: 'rounded-xl' }}
          />
          <Input
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            onPressEnter={handleAdd}
            placeholder="答案，例如：环岛路的那家咖啡店"
            maxLength={120}
            showCount
            classNames={{ input: 'rounded-xl' }}
          />
          <Button
            type="primary"
            block
            icon={<FiPlus size={14} />}
            loading={saving}
            onClick={handleAdd}
            className="cursor-pointer rounded-xl"
          >
            添加密语
          </Button>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-400 dark:text-slate-500">
          答案按原文比对，只忽略首尾空格。建议写成只有对方才知道的一句话，而不是一个词。
        </p>
      </div>
    </Drawer>
  );
}
