import { useState, useEffect } from 'react';
import { Spin } from 'antd';
import axios from 'axios';

import { Editor } from '@bytemd/react';
import plugins from './plugins';
import 'highlight.js/styles/vs2015.css';
import 'bytemd/dist/index.css';
import zh from 'bytemd/lib/locales/zh_Hans.json';

import { getApiUrl } from '@/utils/config';
import { useUserStore } from '@/stores';
import Material from '@/components/Material';

import './index.scss';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const EditorMD = ({ value, onChange }: Props) => {
  const store = useUserStore();
  const [loading, setLoading] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [currentCtx, setCurrentCtx] = useState<{ appendBlock: (block: string) => void }>();

  useEffect(() => {
    const handleOpenMaterialModal = (event: CustomEvent) => {
      setCurrentCtx(event.detail.ctx);
      setIsMaterialModalOpen(true);
    };

    window.addEventListener('openMaterialModal', handleOpenMaterialModal as EventListener);

    return () => {
      window.removeEventListener('openMaterialModal', handleOpenMaterialModal as EventListener);
    };
  }, []);

  const uploadImages = async (files: File[]) => {
    try {
      setLoading(true);
      // 处理成后端需要的格式
      const formData = new FormData();
      formData.append('dir', 'article');
      for (let i = 0; i < files.length; i++) formData.append('files', files[i]);

      const {
        data: { data },
      } = await axios.post(`${getApiUrl()}/file`, formData, {
        headers: {
          Authorization: `Bearer ${store.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setLoading(false);

      // 返回图片信息数组
      return data.map((url: string) => ({ url }));
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <>
      <Spin spinning={loading} tip="图片上传中...">
        <Editor value={value} plugins={plugins} onChange={onChange} locale={zh} uploadImages={uploadImages} />
      </Spin>

      <Material
        open={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSelect={(urls) => {
          if (currentCtx) {
            // 在光标位置插入图片
            urls.forEach((url) => {
              currentCtx.appendBlock(`![图片](${url})`);
            });
          }
        }}
      />
    </>
  );
};

export default EditorMD;
