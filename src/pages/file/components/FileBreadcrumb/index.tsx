import { ArrowLeftOutlined } from '@ant-design/icons';
import { Breadcrumb, Button } from 'antd';
import React from 'react';

interface FileBreadcrumbProps {
  rootPath: string;
  currentPath: string;
  breadcrumbs: { label: string; path: string }[];
  onNavigate: (path: string) => void;
  onGoBack: () => void;
}

const FileBreadcrumb: React.FC<FileBreadcrumbProps> = ({
  rootPath,
  currentPath,
  breadcrumbs,
  onNavigate,
  onGoBack,
}) => {
  const isAtRoot = (!rootPath && currentPath === '') || (Boolean(rootPath) && currentPath === rootPath);

  return (
    <div className="mb-4 flex min-w-0 items-center gap-2 sm:gap-3">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        disabled={isAtRoot}
        onClick={onGoBack}
        className={`shrink-0 ${isAtRoot ? 'bg-gray-50! dark:bg-gray-700!' : 'bg-gray-100! hover:bg-gray-200! dark:bg-gray-700! hover:dark:bg-gray-800!'}`}
      />

      <nav className="min-w-0 flex-1 rounded-md bg-gray-100/50 px-4 py-1 leading-normal dark:bg-gray-700!" aria-label="当前路径">
        <Breadcrumb
          className="text-sm [&.ant-breadcrumb]:text-inherit [&_ol]:flex [&_ol]:flex-wrap [&_ol]:items-center [&_ol]:gap-y-1 [&_.ant-breadcrumb-separator]:mx-1"
          separator={<span className="select-none text-black/22 dark:text-white/25">/</span>}
          items={breadcrumbs.map((item, index) => {
            const isCurrent = index === breadcrumbs.length - 1;
            return {
              key: `${index}-${item.path}`,
              title: (
                <button
                  type="button"
                  className={
                    isCurrent
                      ? 'max-w-full cursor-default rounded border-0 bg-transparent p-0 text-left font-inherit font-semibold text-primary focus-visible:outline focus-visible:outline-primary focus-visible:outline-offset-2 dark:text-white/92'
                      : 'max-w-full cursor-pointer rounded border-0 bg-transparent p-0 text-left font-inherit text-black/55 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 dark:text-white/55 dark:hover:text-primary'
                  }
                  onClick={() => onNavigate(item.path)}
                >
                  {item.label}
                </button>
              ),
            };
          })}
        />
      </nav>
    </div>
  );
};

export default FileBreadcrumb;
