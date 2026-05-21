import { Image, Popover } from 'antd';
import { FiImage } from 'react-icons/fi';

export function parseRecordImages(raw: string | string[] | undefined): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === 'string' && x.length > 0);
  }
  if (!raw || typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && x.length > 0);
  } catch {
    return [];
  }
}

const imageCellClass =
  '[&_.ant-image]:block! [&_.ant-image]:size-full! [&_.ant-image-img]:size-full! [&_.ant-image-img]:object-cover! [&_.ant-image-mask]:size-full!';

export function RecordImagesCell({ imagesRaw }: { imagesRaw: string | string[] | undefined }) {
  const list = parseRecordImages(imagesRaw);

  if (list.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <FiImage size={13} />
        无图片
      </span>
    );
  }

  const trigger = (
    <div className="flex items-center gap-2">
      <div
        className={`group/img relative size-14 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 dark:border-strokedark ${imageCellClass}`}
      >
        <Image
          src={list[0]}
          width={56}
          height={56}
          className="object-cover transition-transform duration-200 group-hover/img:scale-105"
          preview={{ mask: '预览' }}
        />
      </div>
      {list.length > 1 && (
        <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 dark:border-strokedark dark:bg-boxdark-2 dark:text-slate-400">
          +{list.length - 1}
        </span>
      )}
    </div>
  );

  if (list.length <= 1) {
    return <Image.PreviewGroup>{trigger}</Image.PreviewGroup>;
  }

  return (
    <Popover
      trigger="hover"
      placement="bottomLeft"
      overlayClassName="[&_.ant-popover-inner]:rounded-xl! [&_.ant-popover-inner]:border! [&_.ant-popover-inner]:border-slate-200/80! [&_.ant-popover-inner]:p-2.5! [&_.ant-popover-inner]:shadow-sm! dark:[&_.ant-popover-inner]:border-strokedark!"
      content={(
        <Image.PreviewGroup>
          <div className="flex max-w-[280px] flex-wrap gap-1.5">
            {list.map((src, idx) => (
              <div
                key={idx}
                className={`size-14 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 dark:border-strokedark ${imageCellClass}`}
              >
                <Image
                  src={src}
                  width={56}
                  height={56}
                  className="object-cover"
                  preview={{ mask: '预览' }}
                />
              </div>
            ))}
          </div>
        </Image.PreviewGroup>
      )}
    >
      <span className="inline-block cursor-default">
        <Image.PreviewGroup>{trigger}</Image.PreviewGroup>
      </span>
    </Popover>
  );
}
