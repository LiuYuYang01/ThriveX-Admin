import { BiEditAlt, BiFolderOpen, BiHomeSmile, BiSliderAlt, BiCategoryAlt, BiBug, BiBook, BiTrash, BiChip, BiMessageSquareDetail, BiCommentDetail, BiGlobe, BiImage, BiMapPin, BiCog, BiPlug } from 'react-icons/bi';
import { TbBrandAirtable, TbWriting } from 'react-icons/tb';
import { FaRegComments, FaInstagram } from 'react-icons/fa';
import { MdOutlineArticle } from 'react-icons/md';
import { AiOutlineTags } from 'react-icons/ai';
import React from 'react';

export interface SubMenuConfig {
  path: string;
  name: string;
  title?: string;
  icon: React.ReactNode;
}

export interface MenuItemConfig {
  path: string;
  name: string | React.ReactNode;
  title?: string;
  icon: React.ReactNode;
  subMenu?: SubMenuConfig[];
}

export interface RouteGroupConfig {
  group: string;
  list: MenuItemConfig[];
}

export const sidebarRoutes: RouteGroupConfig[] = [
  {
    group: '',
    list: [
      {
        path: '/',
        name: '仪表盘',
        icon: <BiHomeSmile className="text-lg" />,
      },
      {
        path: 'write',
        name: '创作',
        icon: <BiEditAlt className="text-lg" />,
        subMenu: [
          { path: '/create', name: '谱写', title: '发挥灵感', icon: <TbWriting className="text-base" /> },
          { path: '/create_record', name: '闪念', icon: <FaInstagram className="text-base" /> },
          { path: '/draft', name: '草稿箱', icon: <BiBook className="text-base" /> },
          { path: '/recycle', name: '回收站', icon: <BiTrash className="text-base" /> },
        ],
      },
      {
        path: 'manage',
        name: '管理',
        icon: <BiCategoryAlt className="text-lg" />,
        subMenu: [
          { path: '/article', name: '文章管理', icon: <MdOutlineArticle className="text-base" /> },
          { path: '/assistant', name: '助手管理', icon: <BiChip className="text-base" /> },
          { path: '/record', name: '说说管理', icon: <BiMessageSquareDetail className="text-base" /> },
          { path: '/tag', name: '标签管理', icon: <AiOutlineTags className="text-base" /> },
          { path: '/comment', name: '评论管理', icon: <FaRegComments className="text-base" /> },
          { path: '/wall', name: '留言管理', icon: <BiCommentDetail className="text-base" /> },
          { path: '/cate', name: '分类管理', icon: <BiCategoryAlt className="text-base" /> },
          { path: '/web', name: '网站管理', icon: <BiGlobe className="text-base" /> },
          { path: '/swiper', name: '轮播图管理', icon: <BiImage className="text-base" /> },
          { path: '/footprint', name: '足迹管理', icon: <BiMapPin className="text-base" /> },
          { path: '/page_config', name: '页面配置', icon: <BiCog className="text-base" /> },
        ],
      },
      {
        path: 'system',
        name: '系统',
        icon: <BiSliderAlt className="text-lg" />,
        subMenu: [
          { path: '/setup/system', name: '系统配置', icon: <BiCog className="text-base" /> },
          { path: '/setup/third_party', name: '第三方配置', icon: <BiPlug className="text-base" /> },
        ],
      },
    ],
  },
  {
    group: 'New',
    list: [
      { path: '/work', name: '工作台', icon: <TbBrandAirtable className="text-lg" /> },
      { path: '/file', name: '文件系统', icon: <BiFolderOpen className="text-lg" /> },
      {
        path: '/iter',
        name: (
          <div className="flex items-center w-full justify-between">
            <span>更新日志</span>
            <div className="flex items-center gap-1" />
          </div>
        ),
        icon: <BiBug className="text-lg" />,
      },
    ],
  },
];

export const getFlatRoutes = (): { path: string; name: string; title: string; icon: React.ReactNode }[] => {
  const result: { path: string; name: string; title: string; icon: React.ReactNode }[] = [];

  const extractRoutes = (items: MenuItemConfig[]) => {
    items.forEach((item) => {
      if (item.subMenu) {
        item.subMenu.forEach((sub) => {
          result.push({
            path: sub.path,
            name: sub.name,
            title: sub.title || sub.name,
            icon: sub.icon
          });
        });
      } else {
        const name = typeof item.name === 'string' ? item.name : '';
        result.push({
          path: item.path,
          name,
          title: item.title || name,
          icon: item.icon
        });
      }
    });
  };

  sidebarRoutes.forEach((group) => {
    extractRoutes(group.list);
  });

  return result;
};
