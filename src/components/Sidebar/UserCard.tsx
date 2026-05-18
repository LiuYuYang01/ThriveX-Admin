import { Link } from 'react-router-dom';
import { Dropdown, MenuProps } from 'antd';
import { useUserStore } from '@/stores';
import { BiUser, BiGlobe, BiLogOut } from 'react-icons/bi';

interface UserCardProps {
  isSideBarTheme: 'dark' | 'light';
}

export default ({ isSideBarTheme }: UserCardProps) => {
  const store = useUserStore();
  const { user } = store;

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <Link to="/setup/system?tab=my" className="flex items-center gap-2">
          <BiUser className="text-lg" />
          我的资料
        </Link>
      ),
    },
    {
      key: 'setup',
      label: (
        <Link to="/setup/system?tab=web" className="flex items-center gap-2">
          <BiGlobe className="text-lg" />
          网站配置
        </Link>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <button className="flex items-center gap-2 w-full cursor-pointer" onClick={store.quitLogin}>
          <BiLogOut className="text-lg" />
          退出登录
        </button>
      ),
    },
  ];

  return (
    <div className="p-2">
      <Dropdown menu={{ items: dropdownItems }} placement="topRight" trigger={['click']}>
        <div className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isSideBarTheme === 'dark' ? 'bg-[#313D4A] hover:bg-[#3d4b5c]' : 'bg-white/60 dark:bg-[#313D4A] backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-[#3d4b5c]'}`}>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-lg shrink-0">
            {user?.name?.charAt(0) || 'T'}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold truncate ${isSideBarTheme === 'dark' ? 'text-white' : 'text-[#444] dark:text-white'}`}>
              {user?.name || '未命名'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              超级管理员
            </div>
          </div>
          <svg className="shrink-0 w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="4" r="1.5" />
            <circle cx="10" cy="10" r="1.5" />
            <circle cx="10" cy="16" r="1.5" />
          </svg>
        </div>
      </Dropdown>
    </div>
  );
};
