import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Dropdown, Image, Input, message, Modal, Spin, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { BiLogoTelegram, BiLink } from 'react-icons/bi';
import { LuImagePlus } from 'react-icons/lu';
import { RiDeleteBinLine, RiLoader4Line } from 'react-icons/ri';
import Material from '@/components/Material';
import { addRecordDataAPI, editRecordDataAPI, getRecordDataAPI } from '@/api/record';
import './index.scss';

export default () => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const [params] = useSearchParams();
  const id = +params.get('id')!;
  const navigate = useNavigate();

  const [imageList, setImageList] = useState<string[]>([]);
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
        createTime: new Date().getTime().toString(),
      };

      if (id) {
        await editRecordDataAPI({ id, content: data.content, images: data.images });
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
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) getRecordData();
  }, [id]);

  // 处理链接输入
  const handleLinkInput = () => {
    if (imageList.length >= 4) {
      message.warning('最多只能上传 4 张图片');
      return;
    }
    let inputUrl = '';
    Modal.confirm({
      title: '添加网络图片',
      icon: <BiLink className="text-blue-500 mr-2" />,
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
              <Input.TextArea value={content} onChange={(e) => setContent(e.target.value)} placeholder="此刻你在想什么？..." autoSize={{ minRows: 3, maxRows: 10 }} variant="filled" className="p-4! text-lg md:text-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-600 px-0 resize-none bg-transparent! dark:bg-transparent! border-none! shadow-none! focus:shadow-none" />
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
