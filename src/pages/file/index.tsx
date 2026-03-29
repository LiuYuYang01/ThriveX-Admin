import { useEffect, useState, useRef } from 'react';
import { Image, Card, Space, Spin, message, Popconfirm, Button, Drawer, Divider, Skeleton } from 'antd';
import { PiKeyReturnFill } from 'react-icons/pi';
import { DeleteOutlined, DownloadOutlined, RotateLeftOutlined, RotateRightOutlined, SwapOutlined, UndoOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import Masonry from 'react-masonry-css';

import Title from '@/components/Title';
import FileUpload from '@/components/FileUpload';
import { delFileDataAPI, getDirListAPI, getFileListAPI } from '@/api/file';
import { File, FileDir } from '@/types/app/file';
import fileSvg from './image/file.svg';
import errorImg from './image/error.png';
import './index.scss';

// Masonry布局的响应式断点配置
const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,
};

export default () => {
  // 加载状态
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);
  // 按钮加载状态
  const [btnLoading, setBtnLoading] = useState(false);
  // 下载加载状态
  const [downloadLoading, setDownloadLoading] = useState(false);
  // 当前页码
  const [page, setPage] = useState(1);
  // 是否还有更多数据
  const [hasMore, setHasMore] = useState(true);
  // 防止重复加载的引用
  const loadingRef = useRef(false);

  // 弹窗状态
  const [openUploadModalOpen, setOpenUploadModalOpen] = useState(false);
  const [openFileInfoDrawer, setOpenFileInfoDrawer] = useState(false);
  const [openFilePreviewDrawer, setOpenFilePreviewDrawer] = useState(false);

  // 目录和文件列表数据
  const [dirList, setDirList] = useState<FileDir[]>([]);
  const [fileList, setFileList] = useState<File[]>([]);

  // 当前选中的目录和文件
  const [dirName, setDirName] = useState('');
  const [file, setFile] = useState<File>({} as File);

  /**
   * 获取目录列表
   */
  const getDirList = async () => {
    try {
      // 如果是第一次加载，使用 initialLoading
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const { data } = await getDirListAPI();

      const dirList = ['default', 'equipment', 'record', 'article', 'footprint', 'swiper', 'album'];
      dirList.forEach((dir) => {
        if (!data.some((item: FileDir) => item.name === dir)) {
          data.push({ name: dir, path: '' });
        }
      });

      setDirList(data);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  /**
   * 获取指定目录的文件列表
   * @param dir 目录名称
   * @param isLoadMore 是否为加载更多
   */
  const getFileList = async (dir: string, isLoadMore = false) => {
    // 防止重复加载
    if (loadingRef.current) return;
    try {
      loadingRef.current = true;
      setLoading(true);

      // 请求文件列表数据，如果是加载更多则页码+1
      const { data } = await getFileListAPI(dir, { pageNum: isLoadMore ? page + 1 : 1, pageSize: 15 });

      // 根据是否是加载更多来决定是替换还是追加数据
      if (!isLoadMore) {
        setFileList(data.result);
        setPage(1);
      } else {
        setFileList((prev) => [...prev, ...data.result]);
        setPage((prev) => prev + 1);
      }

      // 判断是否还有更多数据
      setHasMore(data.result.length === 15);

      setLoading(false);
      loadingRef.current = false;
    } catch (error) {
      console.error(error);
      setLoading(false);
      loadingRef.current = false;
    }
  };

  /**
   * 删除图片
   * @param data 要删除的文件数据
   */
  const onDeleteImage = async (data: File) => {
    try {
      setBtnLoading(true);
      await delFileDataAPI(data.url);
      await getFileList(dirName);
      message.success('🎉 删除图片成功');
      setFile({} as File);
      setOpenFileInfoDrawer(false);
      setOpenFilePreviewDrawer(false);
      setBtnLoading(false);
    } catch (error) {
      console.error(error);
      setBtnLoading(false);
    }
  };

  /**
   * 下载图片
   * @param data 要下载的文件数据
   */
  const onDownloadImage = (data: File) => {
    try {
      setDownloadLoading(true);
      fetch(data.url)
        .then((response) => response.blob())
        .then((blob) => {
          const url = URL.createObjectURL(new Blob([blob]));
          const link = document.createElement<'a'>('a');
          link.href = url;
          link.download = data.name;
          document.body.appendChild(link);
          link.click();
          URL.revokeObjectURL(url);
          link.remove();
        });
      setDownloadLoading(false);
    } catch (error) {
      console.error(error);
      setDownloadLoading(false);
    }
  };

  /**
   * 处理滚动事件，实现下拉加载更多
   * @param e 滚动事件对象
   */
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // 当滚动到底部（距离底部小于50px）且还有更多数据时，触发加载更多
    if (scrollHeight - scrollTop - clientHeight < 50 && hasMore && !loading) {
      getFileList(dirName, true);
    }
  };

  /**
   * 打开目录
   * @param dir 目录名称
   */
  const openDir = (dir: string) => {
    setDirName(dir);
    getFileList(dir);
  };

  // 组件挂载时获取目录列表
  useEffect(() => {
    getDirList();
  }, []);

  /**
   * 查看文件信息
   * @param record 文件数据
   */
  const viewOpenFileInfo = (record: File) => {
    setOpenFileInfoDrawer(true);
    setFile(record);
  };

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return (
      <div>
        {/* Title 骨架屏 */}
        <Card className="[&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5! mb-2">
          <Skeleton.Input active size="large" style={{ width: 150, height: 32 }} />
        </Card>

        <Card className="FilePage border-stroke mt-2 min-h-[calc(100vh-160px)] [&>.ant-card-body]:py-2! [&>.ant-card-body]:px-5!">
          {/* 操作栏骨架屏 */}
          <div className="flex justify-between my-4 px-4">
            <Skeleton.Button active size="default" style={{ width: 100, height: 32 }} />
          </div>

          {/* 目录/文件列表骨架屏 */}
          <div className="flex flex-wrap justify-start md:justify-normal">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="w-20 flex flex-col items-center mx-8 my-2">
                <Skeleton.Avatar active size={80} shape="square" />
                <Skeleton.Input active size="small" style={{ width: 50, height: 25, marginTop: 8 }} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Title value="文件管理" />

      <Card className="FilePage border-stroke mt-2 min-h-[calc(100vh-160px)]">
        <div className="flex justify-between mb-4 px-4">
          {!fileList.length && !dirName ? (
            <PiKeyReturnFill className="text-4xl text-[#E0DFDF] cursor-pointer" />
          ) : (
            <PiKeyReturnFill
              className="text-4xl text-primary cursor-pointer"
              onClick={() => {
                setFileList([]);
                setDirName('');
              }}
            />
          )}

          {dirName && (
            <Button type="primary" onClick={() => setOpenUploadModalOpen(true)}>
              上传文件
            </Button>
          )}
        </div>

        {/* 文件列表 */}
        <Spin spinning={loading}>
          <div className={`flex flex-wrap ${dirName ? 'justify-center!' : 'justify-start!'} md:justify-normal overflow-y-auto max-h-[calc(100vh-300px)]`} onScroll={handleScroll}>
            {fileList.length || (!fileList.length && dirName) ? (
              <Masonry breakpointCols={breakpointColumnsObj} className="masonry-grid" columnClassName="masonry-grid_column">
                {fileList.map((item, index) => (
                  <div key={index} className={`group relative overflow-hidden rounded-md cursor-pointer mb-4 border-2 border-stroke dark:border-transparent hover:border-primary! p-1 ${file.url === item.url ? 'border-primary' : 'border-gray-100'}`} onClick={() => viewOpenFileInfo(item)}>
                    <Image src={item.url} className="w-full rounded-md" loading="lazy" preview={false} fallback={errorImg} />
                  </div>
                ))}
              </Masonry>
            ) : (
              dirList.map((item, index) => (
                <div key={index} className="group w-20 flex flex-col items-center cursor-pointer mx-4 my-2" onClick={() => openDir(item.name)}>
                  <img src={fileSvg} alt="" />
                  <p className="group-hover:text-primary transition-colors">{item.name}</p>
                </div>
              ))
            )}
          </div>
        </Spin>
      </Card>

      {/* 文件上传弹窗 */}
      <FileUpload multiple dir={dirName} open={openUploadModalOpen} onSuccess={() => getFileList(dirName)} onCancel={() => setOpenUploadModalOpen(false)} />

      {/* 文件信息抽屉 */}
      <Drawer
        width={600}
        title="图片信息"
        placement="right"
        open={openFileInfoDrawer}
        onClose={() => {
          setOpenFileInfoDrawer(false);
          setFile({} as File);
        }}
      >
        <div className="flex flex-col">
          <div className="flex">
            <span className="min-w-20 font-bold">文件名称</span>
            <span className="text-[#333] dark:text-white">{file.name}</span>
          </div>

          <div className="flex">
            <span className="min-w-20 font-bold">文件类型</span>
            <span className="text-[#333] dark:text-white">{file.type}</span>
          </div>

          <div className="flex">
            <span className="min-w-20 font-bold">文件大小</span>
            <span className="text-[#333] dark:text-white">{(file.size / 1048576).toFixed(2)}MB</span>
          </div>

          <div className="flex">
            <span className="min-w-20  font-bold">文件链接</span>
            <span
              className="text-[#333] dark:text-white hover:text-primary cursor-pointer transition"
              onClick={async () => {
                await navigator.clipboard.writeText(file.url);
                message.success('🎉 复制成功');
              }}
            >
              {file.url}
            </span>
          </div>
        </div>

        <Divider>图片预览</Divider>
        <Image
          src={file.url}
          className="rounded-md object-cover object-center"
          fallback={errorImg}
          preview={{
            onVisibleChange: (visible) => setOpenFilePreviewDrawer(visible),
            visible: openFilePreviewDrawer,
            toolbarRender: (_, { transform: { scale }, actions: { onFlipY, onFlipX, onRotateLeft, onRotateRight, onZoomOut, onZoomIn, onReset } }) => (
              <Space className="toolbar-wrapper flex-col">
                <div className="customAntdPreviewsItem">
                  <Popconfirm title="警告" description="删除后无法恢复，确定要删除吗" onConfirm={() => onDeleteImage(file)} okText="删除" cancelText="取消">
                    <DeleteOutlined />
                  </Popconfirm>

                  <DownloadOutlined onClick={() => onDownloadImage(file)} />
                  <SwapOutlined rotate={90} onClick={onFlipY} />
                  <SwapOutlined onClick={onFlipX} />
                  <RotateLeftOutlined onClick={onRotateLeft} />
                  <RotateRightOutlined onClick={onRotateRight} />
                  <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
                  <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
                  <UndoOutlined onClick={onReset} />
                </div>
              </Space>
            ),
          }}
        />

        <Divider>图片操作</Divider>
        <Button type="primary" loading={downloadLoading} onClick={() => onDownloadImage(file)} className="w-full mb-2">
          下载图片
        </Button>
        <Popconfirm title="警告" description="删除后无法恢复，确定要删除吗" onConfirm={() => onDeleteImage(file)} okText="删除" cancelText="取消">
          <Button type="primary" danger loading={btnLoading} className="w-full">
            删除图片
          </Button>
        </Popconfirm>
      </Drawer>
    </div>
  );
};
