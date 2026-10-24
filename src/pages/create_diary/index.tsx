import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, DatePicker, Dropdown, Image, Input, Modal, Tooltip, message } from 'antd';
import type { MenuProps } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { BiLink } from 'react-icons/bi';
import { FiCamera, FiLock, FiNavigation } from 'react-icons/fi';
import { LuImagePlus } from 'react-icons/lu';
import { RiDeleteBinLine, RiLoader4Line } from 'react-icons/ri';

import Material from '@/components/Material';
import { addDiaryDataAPI, editDiaryDataAPI, getDiaryDataAPI } from '@/api/diary';
import { MOOD_OPTIONS } from '@/constants/mood';
import { WEATHER_OPTIONS } from '@/constants/weather';
import { loadGaodeWebKey, resolveLocationAddress } from '@/utils/location';
import type { Diary } from '@/types/app/diary';

const MAX_IMAGES = 9;

export default function CreateDiaryPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = Number(params.get('id')) || undefined;

  const [diaryDate, setDiaryDate] = useState<Dayjs>(dayjs());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [weather, setWeather] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
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
        setImages(data.images ?? []);
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
        images,
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
  }, [content, diaryDate, id, images, location, mood, navigate, title, weather]);

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

  const addFromLink = () => {
    if (images.length >= MAX_IMAGES) {
      message.warning(`最多 ${MAX_IMAGES} 张`);
      return;
    }
    let inputUrl = '';
    Modal.confirm({
      title: '添加网络图片',
      content: (
        <Input
          className="mt-4"
          placeholder="https://example.com/image.png"
          onChange={(e) => {
            inputUrl = e.target.value;
          }}
        />
      ),
      okText: '添加',
      cancelText: '取消',
      centered: true,
      onOk: () => {
        if (!/^https?:\/\//.test(inputUrl.trim())) {
          message.error('请输入有效的 HTTP/HTTPS 链接');
          return Promise.reject();
        }
        setImages((prev) => [...prev, inputUrl.trim()].slice(0, MAX_IMAGES));
      },
    });
  };

  const imageMenuItems: MenuProps['items'] = [
    {
      key: 'material',
      label: <span>从素材库选择</span>,
      icon: <LuImagePlus className="text-base!" />,
      onClick: () => {
        if (images.length >= MAX_IMAGES) {
          message.warning(`最多 ${MAX_IMAGES} 张`);
          return;
        }
        setMaterialOpen(true);
      },
    },
    {
      key: 'link',
      label: <span>输入图片链接</span>,
      icon: <BiLink className="text-base!" />,
      onClick: addFromLink,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 pt-5 text-slate-600 dark:text-slate-300">
      <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <DatePicker
            value={diaryDate}
            onChange={(value) => value && setDiaryDate(value)}
            allowClear={false}
            className="w-40!"
            suffixIcon={<FiCamera size={14} className="text-slate-400" />}
          />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给这一天起个名字（也可以不）"
            maxLength={120}
            variant="borderless"
            className="max-w-sm text-lg font-medium! placeholder:text-slate-300 dark:placeholder:text-slate-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500 dark:bg-boxdark-2 dark:text-slate-400">
            <FiLock size={12} />
            只有答对密语的人能看到
          </span>
          <Button
            type="primary"
            size="large"
            loading={saving}
            onClick={() => void onSubmit()}
            className="cursor-pointer rounded-2xl"
          >
            {id ? '更新这一页' : '收进本子'}
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex min-h-0 flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark md:p-8">
          <div className="mb-4 flex items-baseline justify-between">
            <div className="font-mono text-xs tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
              {diaryDate.format('YYYY / MM / DD')}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500">{content.trim().length} 字</div>
          </div>
          <Input.TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今天发生了什么，想了什么，值得留下的那句话……"
            maxLength={10000}
            disabled={loadingDetail}
            variant="borderless"
            className="min-h-[420px] flex-1 resize-none !bg-transparent !p-0 text-lg leading-9 placeholder:text-slate-300 focus:!shadow-none dark:placeholder:text-slate-600"
          />
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-strokedark dark:bg-boxdark">
            <div className="mb-3 text-xs font-medium tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
              当天心情
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {MOOD_OPTIONS.map((item) => (
                <Tooltip key={item.emoji} title={item.label}>
                  <button
                    type="button"
                    onClick={() => setMood(mood === item.emoji ? '' : item.emoji)}
                    className={`grid size-9 cursor-pointer place-items-center rounded-xl text-lg transition-transform ${
                      mood === item.emoji
                        ? 'scale-105 bg-primary text-white shadow-md shadow-blue-500/25'
                        : 'bg-slate-100 hover:scale-105 dark:bg-boxdark-2'
                    }`}
                  >
                    {item.emoji}
                  </button>
                </Tooltip>
              ))}
            </div>

            <div className="mb-3 mt-5 text-xs font-medium tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
              当天天气
            </div>
            <div className="flex flex-wrap gap-1.5">
              {WEATHER_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setWeather(weather === item.value ? '' : item.value)}
                  className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors ${
                    weather === item.value
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-boxdark-2 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="mb-2 mt-5 flex items-center justify-between">
              <span className="text-xs font-medium tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
                在哪里
              </span>
              <button
                type="button"
                onClick={handleLocate}
                disabled={locating}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500 disabled:opacity-50 dark:bg-boxdark-2 dark:text-slate-400"
              >
                {locating ? <RiLoader4Line className="animate-spin" size={12} /> : <FiNavigation size={12} />}
                {locating ? '定位中' : '定位'}
              </button>
            </div>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="如：厦门市 · 环岛路"
              maxLength={255}
              allowClear
              className="rounded-xl"
            />
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-strokedark dark:bg-boxdark">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
                照片
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{images.length}/{MAX_IMAGES}</span>
            </div>
            <p className="mb-3 text-[11px] text-slate-400 dark:text-slate-500">最多 {MAX_IMAGES} 张，前台按格子铺开</p>

            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {images.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 dark:border-strokedark dark:bg-boxdark-2"
                  >
                    <Image src={url} alt="" className="size-full object-cover" classNames={{ root: '!size-full' }} />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute inset-0 grid cursor-pointer place-items-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"
                      title="移除这张"
                    >
                      <RiDeleteBinLine size={18} className="text-white" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES ? (
                  <Dropdown menu={{ items: imageMenuItems }} trigger={['click']} placement="bottomLeft">
                    <button
                      type="button"
                      className="grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed border-slate-200 text-slate-400 hover:border-primary hover:text-primary dark:border-strokedark dark:text-slate-500"
                      title="添加照片"
                    >
                      <LuImagePlus size={20} />
                    </button>
                  </Dropdown>
                ) : null}
              </div>
            ) : (
              <Dropdown menu={{ items: imageMenuItems }} trigger={['click']} placement="bottomLeft">
                <button
                  type="button"
                  className="flex min-h-24 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-slate-50 text-center transition-colors hover:border-primary/60 dark:border-strokedark dark:bg-boxdark-2"
                >
                  <LuImagePlus size={22} className="mb-2 text-primary" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">为这一天加照片</span>
                  <span className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">从素材库选择或输入链接</span>
                </button>
              </Dropdown>
            )}
          </section>
        </aside>
      </div>

      <Material
        multiple
        maxCount={MAX_IMAGES - images.length}
        open={materialOpen}
        onClose={() => setMaterialOpen(false)}
        onSelect={(urls) => {
          setImages((prev) => Array.from(new Set([...prev, ...urls])).slice(0, MAX_IMAGES));
          setMaterialOpen(false);
        }}
      />
    </div>
  );
}
