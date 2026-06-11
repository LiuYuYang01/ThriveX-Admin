import { useEffect, useState } from 'react';

import { Alert, Button, Checkbox, Divider, Form, Input, notification, Space } from 'antd';
import { CloudUploadOutlined, PictureOutlined } from '@ant-design/icons';

import { Theme } from '@/types/app/config';
import { editWebConfigDataAPI, getWebConfigDataAPI } from '@/api/config';
import Material from '@/components/Material';
import { ThemeFormValues } from './type';

interface ImageUrlInputProps {
  type: string;
  placeholder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPick: (type: string) => void;
}

function ImageUrlInput({ type, placeholder, value, onChange, onPick }: ImageUrlInputProps) {
  return (
    <Space.Compact block className="image-url-compact">
      <Input
        value={value}
        onChange={onChange}
        prefix={<PictureOutlined className="text-slate-400" />}
        allowClear
        placeholder={placeholder}
      />
      <Button type="default" icon={<CloudUploadOutlined />} onClick={() => onPick(type)}>
        选择
      </Button>
    </Space.Compact>
  );
}

export default () => {
  const [loading, setLoading] = useState<boolean>(false);

  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>({} as Theme);

  const [form] = Form.useForm();

  const [currentUploadType, setCurrentUploadType] = useState<string>('');

  const getLayoutData = async () => {
    try {
      setLoading(true);

      const { data } = await getWebConfigDataAPI('theme');

      const theme = data.value;

      setTheme(theme);

      form.setFieldsValue({
        ...theme,
        social: theme.social.map((item) => JSON.stringify(item)).join('\n'),
        swiper_text: theme.swiper_text.join('\n'),
        covers: theme.covers.join('\n'),
        reco_article: theme.reco_article.join('\n'),
      });

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getLayoutData();
  }, []);

  const editThemeData = async (values: ThemeFormValues) => {
    try {
      setLoading(true);

      const updatedLayout = {
        ...theme,
        ...values,
        social: values.social.split('\n').map((item: string) => JSON.parse(item)),
        swiper_text: values.swiper_text.split('\n'),
        covers: values.covers.split('\n'),
        reco_article: values.reco_article.split('\n').map((item: string) => Number(item)),
      };

      await editWebConfigDataAPI('theme', updatedLayout);

      notification.success({
        message: '成功',
        description: '🎉 修改主题成功',
      });

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const getFile = (name: string) => {
    return new URL(`../../image/${name}.png`, import.meta.url).href;
  };

  const openMaterialPicker = (type: string) => {
    setCurrentUploadType(type);
    setIsMaterialModalOpen(true);
  };

  const lightLogo = Form.useWatch('light_logo', form);
  const darkLogo = Form.useWatch('dark_logo', form);
  const swiperImage = Form.useWatch('swiper_image', form);

  return (
    <div>
      <h2 className="text-xl py-4">综合配置</h2>

      <div className="w-full lg:w-[500px]">
        <Form form={form} onFinish={editThemeData} layout="vertical">
          <Divider>亮色主题 Logo</Divider>
          <Form.Item name="light_logo" label="亮色主题 Logo">
            <ImageUrlInput type="light_logo" placeholder="请输入亮色Logo地址" onPick={openMaterialPicker} />
          </Form.Item>
          {lightLogo && <img src={lightLogo} alt="" className="mt-4 w-1/3 rounded-sm" />}

          <Divider>暗色主题 Logo</Divider>
          <Form.Item name="dark_logo" label="暗色主题 Logo">
            <ImageUrlInput type="dark_logo" placeholder="请输入暗色Logo地址" onPick={openMaterialPicker} />
          </Form.Item>
          {darkLogo && <img src={darkLogo} alt="" className="mt-4 w-1/3 rounded-sm" />}

          <Divider>首页背景图</Divider>
          <Form.Item name="swiper_image" label="首页背景图">
            <ImageUrlInput type="swiper_image" placeholder="请输入背景图地址" onPick={openMaterialPicker} />
          </Form.Item>
          {swiperImage && <img src={swiperImage} alt="" className="mt-4 w-1/3 rounded-sm" />}

          <Divider>打字机文本</Divider>
          <Form.Item name="swiper_text" label="打字机文本">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} size="large" placeholder="请输入打字机文本" />
          </Form.Item>
          <Alert message="以换行分隔，每行表示一段文本" type="info" className="mt-2" />

          <Divider>社交网站</Divider>
          <Form.Item name="social" label="社交网站">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} size="large" placeholder="请输入社交网站" />
          </Form.Item>
          <Alert message="请务必确保每一项格式正确，否则会导致网站无法访问" type="info" className="mt-2" />

          <Divider>文章随机封面</Divider>
          <Form.Item name="covers" label="文章随机封面">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} size="large" placeholder="请输入文章随机封面" />
          </Form.Item>
          <Alert message="以换行分隔，每行表示一段文本" type="info" className="mt-2" />

          <Divider>作者推荐文章</Divider>
          <Form.Item name="reco_article" label="作者推荐文章">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} size="large" placeholder="请输入作者推荐文章ID" />
          </Form.Item>
          <Alert message="以换行分隔，每行表示一段文本" type="info" className="mt-2" />

          <Divider>侧边栏</Divider>
          <Checkbox.Group
            value={theme.right_sidebar}
            onChange={(right_sidebar) => {
              setTheme({ ...theme, right_sidebar });
            }}
          >
            <div className="grid grid-cols-4 gap-2">
              <Checkbox value="author">作者信息模块</Checkbox>
              <Checkbox value="runTime">站点时间模块</Checkbox>
              <Checkbox value="randomArticle">随机推荐模块</Checkbox>
              <Checkbox value="newComments">最新评论模块</Checkbox>
              <Checkbox value="hotArticle">作者推荐模块</Checkbox>
              <Checkbox value="study">装饰模块</Checkbox>
            </div>
          </Checkbox.Group>

          <Divider>文章布局</Divider>
          <div className="overflow-auto w-full">
            <div className="article flex w-[650px]">
              {['classics', 'card', 'waterfall'].map((item) => (
                <div key={item} onClick={() => setTheme({ ...theme, is_article_layout: item })} className={`item flex flex-col items-center p-4 m-4 border-2 rounded-sm cursor-pointer ${theme.is_article_layout === item ? 'border-primary' : 'border-stroke'}`}>
                  <p className={`text-center ${theme.is_article_layout === item ? 'text-primary' : ''}`}>{item === 'classics' ? '经典布局' : item === 'card' ? '卡片布局' : '瀑布流布局'}</p>

                  <img src={`${getFile(item)}`} alt="" className="w-[200px] mt-4 rounded-sm" />
                </div>
              ))}
            </div>
          </div>

          <Button type="primary" size="large" className="w-full mt-4 mb-6" htmlType="submit" loading={loading}>
            确定
          </Button>
        </Form>
      </div>

      <Material
        open={isMaterialModalOpen}
        onClose={() => {
          setIsMaterialModalOpen(false);
          setCurrentUploadType('');
        }}
        onSelect={(url: string[]) => {
          if (currentUploadType) {
            form.setFieldValue(currentUploadType, url[0]);
            form.validateFields([currentUploadType]);
            setTheme({ ...theme, [currentUploadType]: url[0] });
          }
        }}
      />
    </div>
  );
};
