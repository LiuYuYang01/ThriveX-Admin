import { ReactNode } from 'react';

interface Props {
  title: string;
  total: string;
  children: ReactNode;
}

export default ({ title, total, children }: Props) => {
  return (
    <div className="rounded-xl border border-stroke py-6 px-7 shadow-default dark:border-transparent bg-light-gradient dark:bg-dark-gradient">
      <h3 className="text-sm text-slate-700 dark:text-white">{title}</h3>

      <div className="flex items-center justify-between">
        <h4 className="font-bold text-2xl my-2 text-black dark:text-white">{total}</h4>

        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#e7f2fe] dark:bg-[#4e5969]">
          {children}
        </div>
      </div>
    </div>
  );
};
