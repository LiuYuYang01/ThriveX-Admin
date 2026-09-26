import { useEffect, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { useCommandPaletteStore } from '../../stores';

// 顶栏搜索入口：点击打开全局命令面板，常驻快捷键提示
const CommandEntry = () => {
  const openPalette = useCommandPaletteStore((state) => state.openModal);

  // 客户端再渲染快捷键文案，避免水合不一致
  const [shortcut, setShortcut] = useState('');
  useEffect(() => {
    setShortcut(/mac|iphone|ipad/i.test(navigator.userAgent) ? '⌘ K' : 'Ctrl K');
  }, []);

  return (
    <li className="ml-4">
      <button
        type="button"
        onClick={openPalette}
        aria-label="搜索"
        title="搜索"
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-stroke bg-white px-2.5 py-1.5 text-xs text-gray-500 shadow-xs hover:text-primary dark:border-strokedark dark:bg-boxdark dark:text-gray-400"
      >
        <FiSearch size={14} />
        搜索
        {shortcut && (
          <kbd className="rounded border border-stroke px-1 py-0.5 text-[10px] leading-none dark:border-strokedark">{shortcut}</kbd>
        )}
      </button>
    </li>
  );
};

export default CommandEntry;
