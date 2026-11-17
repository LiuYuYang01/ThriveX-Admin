import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Calendar, Input, Popover, Skeleton, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import { FiCalendar, FiCheck, FiImage, FiMapPin, FiNavigation, FiSend } from 'react-icons/fi';
import { RiLoader4Line } from 'react-icons/ri';

import MuyaEditor, { type MuyaEditorHandle } from '@/components/MuyaEditor';
import { addDiaryDataAPI, editDiaryDataAPI, getDiaryDataAPI } from '@/api/diary';
import { loadGaodeWebKey, resolveLocationAddress } from '@/utils/location';
import type { Diary } from '@/types/app/diary';


const CN_MONTHS = ['', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

// 正文是 Markdown，字数要按读者看到的文字算，不能把语法记号算进去
const countWords = (markdown: string) =>
  markdown
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/[`*_~#>|]/g, '')
    .replace(/\s+/g, '')
    .length;

// 工具栏上的小按钮，跟文章编辑页那排图标按钮同一套长相：
// 默认没有底色，鼠标经过才浮出浅底；「已设置」用主色表示，不铺底色
const toolBtnClass =
  'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-boxdark-2';
const toolBtnIdle = 'text-slate-500 dark:text-slate-400';
const toolBtnOn = 'text-primary';

export default function CreateDiaryPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = Number(params.get('id')) || undefined;
  const editorRef = useRef<MuyaEditorHandle>(null);

  const [diaryDate, setDiaryDate] = useState<Dayjs>(dayjs());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [weather, setWeather] = useState('');
  const [location, setLocation] = useState('');

  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(Boolean(id));
  const [dateOpen, setDateOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gaodeKey, setGaodeKey] = useState('');

  useEffect(() => {
    loadGaodeWebKey()
      .then(setGaodeKey)
      .catch((error) => console.error('获取高德配置失败:', error));
  }, []);

  useEffect(() => {
    if (!id) return;
    const run = async () => {
      try {
        setLoadingDetail(true);
        const { data } = await getDiaryDataAPI(id);
        setDiaryDate(dayjs(data.diaryDate));
        setTitle(data.title ?? '');
        setContent(data.content ?? '');
        setMood(data.mood ?? '');
        setWeather(data.weather ?? '');
        setLocation(data.location ?? '');
      } catch (error) {
        console.error('获取日记详情失败：', error);
      } finally {
        setLoadingDetail(false);
      }
    };
    void run();
  }, [id]);

  const onSubmit = useCallback(async () => {
    if (!content.trim()) {
      message.warning('哪怕只有一行，也先写下来');
      return;
    }
    try {
      setSaving(true);
      const payload: Diary = {
        diaryDate: diaryDate.format('YYYY-MM-DD'),
        title: title.trim() || undefined,
        content: content.trim(),
        mood: mood || undefined,
        weather: weather || undefined,
        location: location.trim() || undefined,
      };
      if (id) {
        await editDiaryDataAPI({ ...payload, id });
        message.success('这一页已经改写');
      } else {
        await addDiaryDataAPI(payload);
        message.success('日记已收进本子里');
      }
      navigate('/diary');
    } catch (error) {
      console.error('保存日记失败：', error);
    } finally {
      setSaving(false);
    }
  }, [content, diaryDate, id, location, mood, navigate, title, weather]);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      message.warning('当前浏览器不支持定位');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const address = await resolveLocationAddress(pos.coords.longitude, pos.coords.latitude, gaodeKey);
          if (address) setLocation(address);
          else message.warning('未能解析当前位置，请手动输入');
        } catch (error) {
          console.error(error);
          message.error('定位失败，请手动输入');
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        message.warning(error.code === error.PERMISSION_DENIED ? '请允许浏览器获取位置权限' : '定位失败，请手动输入');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, [gaodeKey]);

  const weekday = diaryDate.locale('zh-cn').format('ddd');
  // 和本地笔记一致：年 / 月 / MMDD.md
  const archivePath = `${diaryDate.format('YYYY')} / ${CN_MONTHS[diaryDate.month() + 1]} / ${diaryDate.format('MMDD')}.md`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-clip rounded-2xl border border-slate-200/80 bg-white dark:border-strokedark dark:bg-boxdark">
        {/* 单行工具栏：左侧标题/字数，右侧当天注脚与主操作 */}
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-100 px-4 py-2.5 dark:border-strokedark sm:px-5">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{id ? '改写这一页' : '写一页日记'}</h2>
            <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">{countWords(content)} 字</span>
            <span className="hidden text-xs text-slate-400 dark:text-slate-500 sm:inline" title="归档位置">
              归档到 {archivePath}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Popover
              open={dateOpen}
              onOpenChange={setDateOpen}
              trigger="click"
              placement="bottomLeft"
              arrow={false}
              content={
                <div className="w-64">
                  <Calendar
                    value={diaryDate}
                    onSelect={(value) => {
                      setDiaryDate(value);
                      setDateOpen(false);
                    }}
                    fullscreen={false}
                  />
                </div>
              }
            >
              <button
                type="button"
                title={`${diaryDate.format('YYYY年M月D日')} ${weekday}`}
                aria-label="日记日期"
                className={`${toolBtnClass} ${toolBtnIdle}`}
              >
                <FiCalendar size={16} />
              </button>
            </Popover>

            <Popover
              open={locationOpen}
              onOpenChange={setLocationOpen}
              trigger="click"
              placement="bottomLeft"
              arrow={false}
              content={
                <div className="w-72">
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="如：厦门市 · 环岛路"
                    maxLength={255}
                    allowClear
                    autoFocus
                    aria-label="所在位置"
                    prefix={<FiMapPin size={14} className="text-slate-400" />}
                    className="rounded-xl! placeholder:text-slate-500!"
                  />
                  <button
                    type="button"
                    onClick={handleLocate}
                    disabled={locating}
                    className="mt-2 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-xs text-slate-500 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:bg-boxdark-2 dark:text-slate-400"
                  >
                    {locating ? <RiLoader4Line className="animate-spin" size={13} /> : <FiNavigation size={13} />}
                    {locating ? '定位中' : '定位'}
                  </button>
                </div>
              }
            >
              <button
                type="button"
                title={location ? `所在位置 · ${location}` : '在哪里'}
                aria-label={location ? `所在位置 ${location}` : '在哪里'}
                className={`${toolBtnClass} ${location ? toolBtnOn : toolBtnIdle}`}
              >
                <FiMapPin size={16} />
              </button>
            </Popover>

            <button
              type="button"
              title="从素材库插入图片"
              aria-label="从素材库插入图片"
              onClick={() => editorRef.current?.openMaterial()}
              className={`${toolBtnClass} ${toolBtnIdle}`}
            >
              <FiImage size={16} />
            </button>

            <span className="mx-1.5 h-4 w-px bg-slate-200 dark:bg-strokedark" aria-hidden />

            <Button
              type="primary"
              loading={saving}
              onClick={() => void onSubmit()}
              icon={id ? <FiCheck size={15} /> : <FiSend size={15} />}
              className="cursor-pointer rounded-xl"
            >
              {id ? '更新' : '发布'}
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 px-4 sm:px-5" aria-busy={loadingDetail}>
          {loadingDetail ? (
            <Skeleton active paragraph={{ rows: 8 }} title={false} />
          ) : (
            <MuyaEditor ref={editorRef} value={content} onChange={setContent} />
          )}
        </div>
      </section>
    </div>
  );
}
