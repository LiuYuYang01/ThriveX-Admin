import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Dropdown, Image, Input, message, Modal, Spin, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { BiLogoTelegram, BiLink } from 'react-icons/bi';
import { FiNavigation } from 'react-icons/fi';
import { LuImagePlus } from 'react-icons/lu';
import { RiDeleteBinLine, RiLoader4Line } from 'react-icons/ri';
import Material from '@/components/Material';
import { addRecordDataAPI, editRecordDataAPI, getRecordDataAPI } from '@/api/record';
import { MOOD_OPTIONS } from '@/constants/mood';
import { loadGaodeWebKey, resolveLocationAddress } from '@/utils/location';
import './index.scss';

export default () => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const [params] = useSearchParams();
  const id = +params.get('id')!;
  const navigate = useNavigate();

  const [imageList, setImageList] = useState<string[]>([]);
  const [mood, setMood] = useState('');
  const [location, setLocation] = useState('');
  const [locating, setLocating] = useState(false);
  const [gaodeApKey, setGaodeApKey] = useState('');
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  // 删除图片
  const handleDelImage = (data: string) => {
    setImageList(imageList.filter((item) => item !== data));
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
        images: JSON.stringify(imageList),
        mood: mood || undefined,
        location: location.trim() || undefined,
        createTime: new Date().getTime().toString(),
      };

      if (id) {
        await editRecordDataAPI({ id, content: data.content, images: data.images, mood: data.mood, location: data.location });
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
      setImageList(JSON.parse(data.images as string));
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

  const reverseGeocode = useCallback(
    async (lng: number, lat: number) => resolveLocationAddress(lng, lat, gaodeApKey),
    [gaodeApKey],
  );

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
    loadGaodeWebKey().then(setGaodeApKey).catch((error) => console.error('获取高德配置失败:', error));
  }, []);

  // 处理链接输入
  const handleLinkInput = () => {
    if (imageList.length >= 4) {
      message.warning('最多只能上传 4 张图片');
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
        setImageList([...imageList, inputUrl]);
        return Promise.resolve();
      },
    });
  };

  // 下拉菜单配置
  const dropdownItems: MenuProps = {
    items: [
      {
        key: 'upload',
        label: <span>从素材库选择</span>,
        icon: <LuImagePlus className="text-base!" />,
        onClick: () => {
          if (imageList.length >= 4) return message.warning('最多只能上传 4 张图片');
          setIsMaterialModalOpen(true);
        },
      },
      {
        key: 'input',
        label: <span>输入图片链接</span>,
        icon: <BiLink className="text-base!" />,
        onClick: handleLinkInput,
      },
    ],
  };

  return (
    <div className="create_record_page min-h-screen p-4 md:p-6 lg:p-10 transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-6">
        <Spin spinning={loading} indicator={<RiLoader4Line className="text-3xl animate-spin text-blue-500" />}>
          {/* 主编辑器卡片 */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 overflow-hidden border dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
            <div className="p-3 md:p-6">
              <Input.TextArea value={content} onChange={(e) => setContent(e.target.value)} placeholder="此刻你在想什么？..." autoSize={{ minRows: 3, maxRows: 10 }} variant="filled" className="text-lg md:text-xl px-0! text-gray-700 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-600 resize-none bg-transparent! dark:bg-transparent! border-none! shadow-none! focus:shadow-none" />

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div>
                  <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">此刻心情</div>
                  <div className="flex flex-wrap gap-2">
                    {MOOD_OPTIONS.map((item) => (
                      <Tooltip key={item.emoji} title={item.label}>
                        <button
                          type="button"
                          onClick={() => setMood(mood === item.emoji ? '' : item.emoji)}
                          className={`grid h-10 w-10 place-items-center rounded-lg text-xl transition-all cursor-pointer ${mood === item.emoji ? 'bg-blue-100 ring-2 ring-blue-400 dark:bg-blue-900/40' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'}`}
                        >
                          {item.emoji}
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                </div>
                <div className="min-w-[200px] flex-1">
                  <div className="mb-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>当前位置</span>
                    <Tooltip title="获取当前位置">
                      <button
                        type="button"
                        onClick={handleLocate}
                        disabled={locating}
                        className="inline-flex items-center gap-1 text-blue-500 transition-colors hover:text-blue-600 disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                      >
                        {locating ? <RiLoader4Line className="animate-spin" /> : <FiNavigation />}
                        <span>{locating ? '定位中' : '定位'}</span>
                      </button>
                    </Tooltip>
                  </div>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="如：厦门市 · 环岛路"
                    allowClear
                  />
                </div>
              </div>
            </div>

            {/* 图片预览网格区*/}
            {imageList.length > 0 && (
              <div className="px-6 md:px-8 pb-6 animate-fade-in">
                {imageList.length === 3 ? (
                  // 微信朋友圈风格的三图布局：左大右小双排
                  <div className="grid grid-cols-3 gap-2">
                    <div key={0} className="group relative aspect-auto col-span-2 row-span-1 min-h-0 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 image-container">
                      <Image src={imageList[0]} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" classNames={{ root: '!w-full !h-full' }} preview={true} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                        <Tooltip title="移除图片">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelImage(imageList[0]);
                            }}
                            className="bg-white/20 hover:bg-red-500 text-white p-2.5 rounded-full backdrop-blur-md transition-all duration-200 transform scale-90 group-hover:scale-100 hover:rotate-90"
                          >
                            <RiDeleteBinLine size={20} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div key={1} className="group relative aspect-square min-h-0 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 image-container">
                        <Image src={imageList[1]} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" classNames={{ root: '!w-full !h-full' }} preview={true} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                          <Tooltip title="移除图片">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelImage(imageList[1]);
                              }}
                              className="bg-white/20 hover:bg-red-500 text-white p-2.5 rounded-full backdrop-blur-md transition-all duration-200 transform scale-90 group-hover:scale-100 hover:rotate-90"
                            >
                              <RiDeleteBinLine size={20} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                      <div key={2} className="group relative aspect-square min-h-0 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 image-container">
                        <Image src={imageList[2]} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" classNames={{ root: '!w-full !h-full' }} preview={true} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                          <Tooltip title="移除图片">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelImage(imageList[2]);
                              }}
                              className="bg-white/20 hover:bg-red-500 text-white p-2.5 rounded-full backdrop-blur-md transition-all duration-200 transform scale-90 group-hover:scale-100 hover:rotate-90"
                            >
                              <RiDeleteBinLine size={20} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`grid gap-4 ${imageList.length === 1 ? 'grid-cols-1' : imageList.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                    {imageList.map((item, index) => (
                      <div key={index} className="group relative aspect-square min-h-0 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 image-container">
                        {/* 图片主体 */}
                        <Image src={item} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" classNames={{ root: '!w-full !h-full' }} preview={true} />

                        {/* 删除遮罩层 */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                          <Tooltip title="移除图片">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelImage(item);
                              }}
                              className="bg-white/20 hover:bg-red-500 text-white p-2.5 rounded-full backdrop-blur-md transition-all duration-200 transform scale-90 group-hover:scale-100 hover:rotate-90"
                            >
                              <RiDeleteBinLine size={20} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 底部工具栏 */}
            <div className="bg-gray-50/80 dark:bg-gray-700/30 backdrop-blur-xs px-6 py-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
              {/* 左侧：功能按钮 */}
              <div className="flex items-center space-x-2">
                <Dropdown menu={dropdownItems} placement="topLeft" trigger={['click']}>
                  <Button type="text" icon={<LuImagePlus size={22} />} className="flex items-center text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl h-12 px-4 border-none transition-all">
                    <span className="ml-1 hidden sm:inline">添加图片</span>
                    <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-md text-gray-500 dark:text-gray-300">{imageList.length}/4</span>
                  </Button>
                </Dropdown>
              </div>

              {/* 右侧：提交按钮 */}
              <Button type="primary" size="large" onClick={onSubmit} loading={loading} icon={!loading && <BiLogoTelegram size={20} />} className="h-12 px-5 rounded-xl bg-blue-400 hover:bg-blue-500 shadow-lg shadow-blue-500/30 border-none font-medium text-base flex items-center gap-2 transition-all hover:-translate-y-0.5">
                {id ? '更新' : '发布'}
              </Button>
            </div>
          </div>
        </Spin>
      </div>

      {/* 素材库弹窗 */}
      <Material
        maxCount={4 - imageList.length}
        open={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSelect={(url) => {
          setImageList([...imageList, ...url]);
        }}
      />
    </div>
  );
};
