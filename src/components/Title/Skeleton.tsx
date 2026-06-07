interface TitleSkeletonProps {
  className?: string;
  titleWidth?: number | string;
  /** 右侧占位类型 */
  action?: 'none' | 'button' | 'buttons' | 'text' | 'select';
  /** action 为 buttons 时的按钮数量 */
  buttonCount?: number;
  actionWidth?: number | string;
}

export default function TitleSkeleton({
  className = '',
  titleWidth = 120,
  action = 'none',
  buttonCount = 3,
  actionWidth = 100,
}: TitleSkeletonProps) {
  const renderAction = () => {
    switch (action) {
      case 'button':
        return <div className="skeleton h-9 shrink-0 rounded-xl" style={{ width: actionWidth }} />;
      case 'buttons':
        return (
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: buttonCount }).map((_, i) => (
              <div key={i} className="skeleton h-9 rounded-lg" style={{ width: i === buttonCount - 1 ? 100 : 88 }} />
            ))}
          </div>
        );
      case 'text':
        return <div className="skeleton h-4 shrink-0 rounded-md" style={{ width: actionWidth }} />;
      case 'select':
        return <div className="skeleton h-9 shrink-0 rounded-xl" style={{ width: actionWidth }} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`mb-2 rounded-2xl border border-slate-200/80 bg-white px-5 py-3.5 dark:border-strokedark dark:bg-boxdark ${className}`}
    >
      <div className="flex items-center justify-between gap-4 overflow-auto">
        <div className="skeleton h-7 min-w-24 shrink-0 rounded-md" style={{ width: titleWidth }} />
        {renderAction()}
      </div>
    </div>
  );
}
