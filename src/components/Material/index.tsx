import { useEffect, useState, useRef } from 'react';
import { Image, Spin, message, Button } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import Masonry from 'react-masonry-css';
import { getFileListAPI, getDirListAPI } from '@/api/file';
import { File, FileDir } from '@/types/app/file';
import errorImg from '@/pages/file/image/error.png';
import fileSvg from '@/pages/file/image/file.svg';
import { PiKeyReturnFill } from 'react-icons/pi';
import FileUpload from '@/components/FileUpload';
import './index.scss';

interface Props {
  multiple?: boolean;
  maxCount?: number;
  open: boolean;
  onClose: () => void;
  onSelect?: (files: string[]) => void;
}

// Masonry 布局的响应式断点配置
const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,
};

export default ({ multiple, open, onClose, onSelect, maxCount }: Props) => {
  // 加载状态
  const [loading, setLoading] = useState(false);
  // 当前页码
  const [page, setPage] = useState(1);
  // 是否还有更多数据
  const [hasMore, setHasMore] = useState(true);
  // 防止重复加载的引用
  const loadingRef = useRef(false);
  // 文件列表数据
  const [fileList, setFileList] = useState<File[]>([]);
  // 目录列表数据
  const [dirList, setDirList] = useState<FileDir[]>([]);
  // 当前选中的目录
  const [dirName, setDirName] = useState('');
  // 选中的文件列表
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // 上传文件弹窗
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // 获取目录列表
  const getDirList = async () => {
    try {
      setLoading(true);
      const { data } = await getDirListAPI();

      const dirList = ['default', 'equipment', 'record', 'article', 'footprint', 'swiper', 'album'];
      dirList.forEach((dir) => {
        if (!data.some((item: FileDir) => item.name === dir)) {
          data.push({ name: dir, path: '' });
        }
      });

      setDirList(data);

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getDirList();
  }, []);

  // 获取文件列表
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

  // 处理滚动事件，实现下拉加载更多
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // 当滚动到底部（距离底部小于50px）且还有更多数据时，触发加载更多
    if (scrollHeight - scrollTop - clientHeight < 50 && hasMore && !loading) {
      getFileList(dirName, true);
    }
  };

  // 取消选择
  const onCancelSelect = () => {
    reset();
    onClose();
  };

  // 打开目录
  const openDir = (dir: string) => {
    setDirName(dir);
    getFileList(dir);
  };

  // 处理选中的图片
  const onHandleSelectImage = (item: File) => {
    setSelectedFiles((prev) => {
      // 如果 maxCount 不为 1，则开启多选
      const isMultiple = multiple || (maxCount !== undefined && maxCount !== 1);

      if (isMultiple) {
        // 多选模式
        const isSelected = prev.some((file) => file.url === item.url);
        if (isSelected) {
          return prev.filter((file) => file.url !== item.url);
        } else {
          // 检查是否超过最大数量限制
          if (maxCount && prev.length >= maxCount) {
            message.warning(`最多只能选择 ${maxCount} 个文件`);
            return prev;
          }

          return [...prev, item];
        }
      } else {
        // 单选模式
        return [item];
      }
    });
  };

  // 处理文件上传成功做的事情
  const onUpdateSuccess = (urls: string[]) => {
    setIsUploadModalOpen(false);
    if (onSelect) onSelect(urls);
    reset();
    onClose();
  };

  // 确认选择
  const onHandleSelect = () => {
    const list = selectedFiles.map((item) => item.url);
    if (onSelect) onSelect(list);
    reset();
    onClose();
  };

  const reset = () => {
    setFileList([]);
    setSelectedFiles([]);
    setDirName('');
  };

  return (
    <Modal
      title="素材库"
      width={1200}
      open={open}
      onCancel={onCancelSelect}
      destroyOnHidden
      footer={
        dirName
          ? [
            <Button key="cancel" onClick={onCancelSelect}>
              取消
            </Button>,
            <Button key="confirm" type="primary" onClick={onHandleSelect} disabled={selectedFiles.length === 0}>
              选择 ({selectedFiles.length})
            </Button>,
          ]
          : null
      }
      zIndex={1100}
    >
      <div className="flex justify-between mb-4 px-4">
        {!fileList.length && !dirName ? <PiKeyReturnFill className="text-4xl text-[#E0DFDF] cursor-pointer" /> : <PiKeyReturnFill className="text-4xl text-primary cursor-pointer" onClick={reset} />}

        {dirName && (
          <Button type="primary" onClick={() => setIsUploadModalOpen(true)}>
            上传文件
          </Button>
        )}
      </div>

      <Spin spinning={loading}>
        <div className={`flex flex-wrap ${dirName ? 'justify-center!' : 'justify-start'} md:justify-normal overflow-y-auto max-h-[calc(100vh-300px)]`} onScroll={handleScroll}>
          {fileList.length || (!fileList.length && dirName) ? (
            <Masonry breakpointCols={breakpointColumnsObj} className="masonry-grid" columnClassName="masonry-grid_column">
              {fileList.map((item, index) => (
                <div key={index} className={`group relative overflow-hidden rounded-md cursor-pointer mb-4 border-2 border-stroke dark:border-transparent hover:border-primary! p-1 ${selectedFiles.some((file) => file.url === item.url) ? 'border-primary' : 'border-gray-100'}`} onClick={() => onHandleSelectImage(item)}>
                  <div className="relative">
                    <Image src={item.url} className="w-full rounded-md" loading="lazy" fallback={errorImg} preview={false} />

                    {selectedFiles.some((file) => file.url === item.url) && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                        <CheckOutlined />
                      </div>
                    )}
                  </div>
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

      {/* 文件上传弹窗 */}
      <FileUpload multiple={multiple || (maxCount !== undefined && maxCount !== 1)} dir={dirName} open={isUploadModalOpen} onSuccess={onUpdateSuccess} onCancel={() => setIsUploadModalOpen(false)} />
    </Modal>
  );
};
