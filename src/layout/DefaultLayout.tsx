import { useState, useEffect } from 'react';
import Header from '../components/Header/index';
import Sidebar from '../components/Sidebar/index';
import { useConfigStore } from '@/stores';

export default ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const colorMode = useConfigStore((state) => state.colorMode);

  useEffect(() => {
    const className = 'dark';
    const bodyClass = window.document.body.classList;

    if (colorMode === 'dark') {
      bodyClass.add(className);
    } else {
      bodyClass.remove(className);
    }
  }, [colorMode]);

  return (
    <div className="dark:bg-[#1A222C] dark:text-[#AEB7C0]">
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          <main>
            <div className="mx-auto p-4">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};
