import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Dropdown, Image, Input, message, Modal, Spin, Tabs, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { BiLogoTelegram, BiLink } from 'react-icons/bi';
import { FiNavigation } from 'react-icons/fi';
import { LuImagePlus, LuVideo } from 'react-icons/lu';
import { RiDeleteBinLine, RiLoader4Line, RiTiktokLine } from 'react-icons/ri';
import Material from '@/components/Material';
import { addRecordDataAPI, editRecordDataAPI, getRecordDataAPI } from '@/api/record';
import { MOOD_OPTIONS } from '@/constants/mood';
import { getDouyinEmbedUrl } from '@/utils';
import { loadGaodeWebKey, resolveLocationAddress } from '@/utils/location';
import './index.scss';

export default () => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const [params] = useSearchParams();
  const id = +params.get('id')!;
  const navigate = useNavigate();

  const [imageList, setImageList] = useState<string[]>([]);
  const [video, setVideo] = useState('');
  const [mood, setMood] = useState('');
  const [location, setLocation] = useState('');
  const [locating, setLocating] = useState(false);
  const [gaodeApKey, setGaodeApKey] = useState('');
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [materialTab, setMaterialTab] = useState('image');

  const douyinEmbedUrl = getDouyinEmbedUrl(video);

  // 删除图片
  const handleDelImage = (data: string) => {
    setImageList((prev) => prev.filter((item) => item !== data));
  };

  const onSubmit = async () => {
    try {
      if (!content.trim().length) {
        message.warning('写点什么再发布吧...');
        return;
      }
      setLoading(true);

      const data = {
        content: content,
        // 图片与视频互斥，优先保留视频
        images: JSON.stringify(video.trim() ? [] : imageList),
        video: video.trim() || undefined,
        mood: mood || undefined,
        location: location.trim() || undefined,
        createTime: new Date().getTime().toString(),
      };

      if (id) {
        await editRecordDataAPI({ id, content: data.content, images: data.images, video: data.video, mood: data.mood, location: data.location });
        message.success('想法已更新');
      } else {
        await addRecordDataAPI(data);
        message.success('闪念已发布');
      }

      setLoading(false);
      navigate('/record');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const getRecordData = async () => {
    try {
      setLoading(true);
      const { data } = await getRecordDataAPI(id);
      setContent(data.content);
      // 图片与视频互斥，编辑时只回填其中一种
      if (data.video) {
        setVideo(data.video);
        setImageList([]);
        setMaterialTab('video');
      } else {
        setImageList(JSON.parse(data.images as string));
      }
      setMood(data.mood || '');
      setLocation(data.location || '');
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) getRecordData();
  }, [id]);

  const reverseGeocode = useCallback(async (lng: number, lat: number) => resolveLocationAddress(lng, lat, gaodeApKey), [gaodeApKey]);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      message.warning('当前浏览器不支持定位');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const address = await reverseGeocode(pos.coords.longitude, pos.coords.latitude);
          if (address) {
            setLocation(address);
          } else {
            message.warning('未能解析当前位置，请手动输入');
          }
        } catch (error) {
          console.error(error);
          message.error('定位失败，请手动输入');
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          message.warning('请允许浏览器获取位置权限');
        } else {
          message.error('定位失败，请手动输入');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, [reverseGeocode]);

  useEffect(() => {
    loadGaodeWebKey()
      .then(setGaodeApKey)
      .catch((error) => console.error('获取高德配置失败:', error));
  }, []);

  //处理链接输入
  const handleLinkInput = () => {
    if (imageList.length >= 4) {
      message.warning('最多只能上传4 张图片');
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
        if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
          message.error('请输入有效的 HTTP/HTTPS 链接');
          return Promise.reject();
        }
        setImageList((prev) => [...prev, inputUrl]);
        return Promise.resolve();
      },
    });
  };

  // 处理视频链接输入
  const handleVideoLinkInput = () => {
    let inputUrl = '';
    Modal.confirm({
      title: '添加网络视频',
      content: (
        <Input
          className="mt-4"
          placeholder="https://example.com/video.mp4"
          onChange={(e) => {
            inputUrl = e.target.value;
          }}
        />
      ),
      okText: '添加',
      cancelText: '取消',
      centered: true,
      onOk: () => {
        if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
          message.error('请输入有效的 HTTP/HTTPS 链接');
          return Promise.reject();
        }
        setVideo(inputUrl);
        return Promise.resolve();
      },
    });
  };

  // 处理抖音视频链接输入
  const handleDouyinInput = () => {
    if (imageList.length) {
      message.warning('图片与视频不能同时存在，请先移除图片');
      return;
    }
    let inputValue = '';
    Modal.confirm({
      title: '添加抖音视频',
      content: (
        <Input
          className="mt-4"
          placeholder="请输入抖音视频地址"
          onChange={(e) => {
            inputValue = e.target.value;
          }}
        />
      ),
      okText: '确定',
      cancelText: '取消',
      centered: true,
      onOk: () => {
        if (!inputValue.trim()) {
          message.warning('请输入抖音视频地址');
          return Promise.reject();
        }
        setVideo(inputValue.trim());
      },
    });
  };

  // 视频下拉菜单配置
  const videoDropdownItems: MenuProps = {
    items: [
      {
        key: 'upload',
        label: <span>从素材库选择</span>,
        icon: <LuVideo className="text-base!" />,
        onClick: () => {
          if (imageList.length) {
            message.warning('图片与视频不能同时存在，请先移除图片');
            return;
          }
          setIsVideoModalOpen(true);
        },
      },
      {
        key: 'douyin',
        label: <span>抖音视频链接</span>,
        icon: <RiTiktokLine className="text-base!" />,
        onClick: handleDouyinInput,
      },
      {
        key: 'input',
        label: <span>输入视频链接</span>,
        icon: <BiLink className="text-base!" />,
        onClick: () => {
          if (imageList.length) {
            message.warning('图片与视频不能同时存在，请先移除图片');
            return;
          }
          handleVideoLinkInput();
        },
      },
    ],
  };

  // 下拉菜单配置
  const dropdownItems: MenuProps = {
    items: [
      {
        key: 'upload',
        label: <span>从素材库选择</span>,
        icon: <LuImagePlus className="text-base!" />,
        onClick: () => {
          if (imageList.length >= 4) return message.warning('最多只能上传4 张图片');
          if (video) {
            message.warning('图片与视频不能同时存在，请先移除视频');
            return;
          }
          setIsMaterialModalOpen(true);
        },
      },
      {
        key: 'input',
        label: <span>输入图片链接</span>,
        icon: <BiLink className="text-base!" />,
        onClick: () => {
          if (video) {
            message.warning('图片与视频不能同时存在，请先移除视频');
            return;
          }
          handleLinkInput();
        },
      },
    ],
  };

  return (
    <div className="create_record_page shrink-0 pt-6 transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 -z-10" />

      <div>
        <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between ml-4">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-4xl">此刻你在想什么？</h1>
          <Button type="primary" size="large" onClick={onSubmit} loading={loading} icon={!loading && <BiLogoTelegram size={18} />} className="rounded-2xl border-none bg-blue-500 px-6! font-medium shadow-xl shadow-blue-500/25 hover:bg-blue-600">
            {id ? '更新' : '发布'}
          </Button>
        </div>

        <Spin spinning={loading} indicator={<RiLoader4Line className="text-3xl animate-spin text-blue-500" />}>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="overflow-hidden rounded-4xl border border-slate-200/80 bg-linear-to-br from-white via-white to-slate-50/80 backdrop-blur-xl transition-all duration-300 dark:border-strokedark dark:from-boxdark dark:via-boxdark dark:to-boxdark-2/80 dark:shadow-black/20">
              <div className="border-b border-slate-100 px-5 py-4 dark:border-strokedark md:px-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">内容正文</div>
                    <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">先写下来，不需要组织得很完整</div>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-gray-500 dark:bg-boxdark-2 dark:text-gray-400">{content.trim().length} 字</div>
                </div>
              </div>

              <div className="p-5 md:p-7">
                <Input.TextArea value={content} onChange={(e) => setContent(e.target.value)} placeholder="写下一个念头、一段感受，或今天值得记录的小事..." autoSize={{ minRows: 10, maxRows: 18 }} variant="filled" className="min-h-[320px] resize-none border-none! bg-transparent! px-0! text-xl leading-9 text-gray-800 shadow-none! outline-none placeholder:text-gray-300 focus:shadow-none dark:bg-transparent! dark:text-gray-100 dark:placeholder:text-gray-600 md:text-2xl" />
              </div>
            </section>

            <aside className="space-y-5">
              <section className="rounded-4xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl dark:border-strokedark dark:bg-boxdark dark:shadow-black/20">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">发布设置</div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">此刻心情</div>
                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-6">
                      {MOOD_OPTIONS.map((item) => (
                        <Tooltip key={item.emoji} title={item.label}>
                          <button type="button" onClick={() => setMood(mood === item.emoji ? '' : item.emoji)} className={`grid h-11 w-11 place-items-center rounded-2xl text-xl transition-all duration-200 cursor-pointer ${mood === item.emoji ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100 scale-105 dark:ring-blue-900/50' : 'bg-slate-100 hover:bg-slate-200 hover:scale-105 dark:bg-boxdark-2 dark:hover:bg-slate-700'}`}>
                            {item.emoji}
                          </button>
                        </Tooltip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                      <span>此刻位置</span>
                      <Tooltip title="获取当前位置">
                        <button type="button" onClick={handleLocate} disabled={locating} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs normal-case tracking-normal text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60 cursor-pointer">
                          {locating ? <RiLoader4Line className="animate-spin" /> : <FiNavigation />}
                          <span>{locating ? '定位中' : '自动定位'}</span>
                        </button>
                      </Tooltip>
                    </div>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="如：厦门市 · 环岛路" allowClear className="h-12 rounded-2xl border-slate-200/80 bg-slate-50 px-4 dark:border-strokedark dark:bg-boxdark-2" />
                  </div>
                </div>
              </section>

              <section className="rounded-4xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl dark:border-strokedark dark:bg-boxdark dark:shadow-black/20">
                <Tabs
                  activeKey={materialTab}
                  onChange={setMaterialTab}
                  className="material-tabs"
                  items={[
                    {
                      key: 'image',
                      label: (
                        <span className="inline-flex items-center gap-1.5">
                          <LuImagePlus size={16} />
                          图片素材
                        </span>
                      ),
                      children: (
                        <>
                          <div className="mb-4 text-xs text-gray-400 dark:text-gray-500">最多添加4 张，建议保持统一风格</div>
                          {imageList.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                              {imageList.map((item, index) => (
                                <div key={`${item}-${index}`} className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-sm image-container dark:border-strokedark dark:bg-boxdark-2">
                                  <Image src={item} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" classNames={{ root: '!w-full !h-full' }} preview={true} />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                                    <Tooltip title="移除图片">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelImage(item);
                                        }}
                                        className="rounded-full bg-white/20 p-2.5 text-white backdrop-blur-md transition-all duration-200 hover:rotate-90 hover:bg-red-500 cursor-pointer"
                                      >
                                        <RiDeleteBinLine size={20} />
                                      </button>
                                    </Tooltip>
                                  </div>
                                </div>
                              ))}
                              {imageList.length < 4 && !video && (
                                <Dropdown menu={dropdownItems} placement="bottom" trigger={['click']}>
                                  <button type="button" className="flex aspect-square w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-slate-50 text-center transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-strokedark dark:bg-boxdark-2 dark:hover:bg-blue-950/35 cursor-pointer">
                                    <span className="mb-2 grid h-10 w-10 place-items-center text-blue-500">
                                      <LuImagePlus size={22} />
                                    </span>
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">继续添加</span>
                                    <span className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">还可加 {4 - imageList.length} 张</span>
                                  </button>
                                </Dropdown>
                              )}
                            </div>
                          ) : video ? (
                            <div className="flex min-h-36 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/60 bg-slate-50/60 px-6 text-center dark:border-strokedark dark:bg-boxdark-2/60">
                              <span className="mb-3 grid h-12 w-12 place-items-center text-gray-400 dark:text-gray-500">
                                <LuImagePlus size={23} />
                              </span>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">已添加视频</span>
                              <span className="mt-1 text-xs text-gray-400 dark:text-gray-500">图片与视频不能同时存在，移除视频后可添加图片</span>
                            </div>
                          ) : (
                            <Dropdown menu={dropdownItems} placement="bottom" trigger={['click']}>
                              <button type="button" className="flex min-h-36 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-slate-50 px-6 text-center transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-strokedark dark:bg-boxdark-2 dark:hover:bg-blue-950/35 cursor-pointer">
                                <span className="mb-3 grid h-12 w-12 place-items-center text-blue-500">
                                  <LuImagePlus size={23} />
                                </span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">为这条闪念添加图片</span>
                                <span className="mt-1 text-xs text-gray-400 dark:text-gray-500">从素材库选择或输入图片链接</span>
                              </button>
                            </Dropdown>
                          )}
                        </>
                      ),
                    },
                    {
                      key: 'video',
                      label: (
                        <span className="inline-flex items-center gap-1.5">
                          <LuVideo size={16} />
                          视频素材
                        </span>
                      ),
                      children: (
                        <>
                          <div className="mb-4 text-xs text-gray-400 dark:text-gray-500">最多添加1 个，可从素材库选择、输入链接或添加抖音视频</div>
                          {video ? (
                            <div className="group relative aspect-video overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-sm dark:border-strokedark dark:bg-boxdark-2">
                              {douyinEmbedUrl ? (
                                <iframe src={douyinEmbedUrl} title="抖音视频" allow="fullscreen" className="h-full w-full border-0" />
                              ) : (
                                <video src={video} controls className="h-full w-full object-contain" />
                              )}
                              <div className="absolute inset-x-0 top-0 flex justify-end p-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <Tooltip title="移除视频">
                                  <button
                                    onClick={() => setVideo('')}
                                    className="rounded-full bg-black/45 p-2 text-white backdrop-blur-md transition-all duration-200 hover:rotate-90 hover:bg-red-500 cursor-pointer"
                                  >
                                    <RiDeleteBinLine size={18} />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          ) : imageList.length ? (
                            <div className="flex min-h-36 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/60 bg-slate-50/60 px-6 text-center dark:border-strokedark dark:bg-boxdark-2/60">
                              <span className="mb-3 grid h-12 w-12 place-items-center text-gray-400 dark:text-gray-500">
                                <LuVideo size={23} />
                              </span>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">已添加图片</span>
                              <span className="mt-1 text-xs text-gray-400 dark:text-gray-500">图片与视频不能同时存在，移除图片后可添加视频</span>
                            </div>
                          ) : (
                            <Dropdown menu={videoDropdownItems} placement="bottom" trigger={['click']}>
                              <button type="button" className="flex min-h-36 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-slate-50 px-6 text-center transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-strokedark dark:bg-boxdark-2 dark:hover:bg-blue-950/35 cursor-pointer">
                                <span className="mb-3 grid h-12 w-12 place-items-center text-blue-500">
                                  <LuVideo size={23} />
                                </span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">为这条闪念添加视频</span>
                                <span className="mt-1 text-xs text-gray-400 dark:text-gray-500">从素材库选择或输入视频链接</span>
                              </button>
                            </Dropdown>
                          )}
                        </>
                      ),
                    },
                  ]}
                />
              </section>
            </aside>
          </div>
        </Spin>
      </div>

      <Material
        maxCount={4 - imageList.length}
        open={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSelect={(url) => {
          if (video || !url.length) return;
          setImageList((prev) => [...prev, ...url].slice(0, 4));
        }}
      />

      <Material
        maxCount={1}
        open={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSelect={(url) => {
          if (imageList.length || !url.length) return;
          setVideo(url[0]);
        }}
      />
    </div>
  );
};
