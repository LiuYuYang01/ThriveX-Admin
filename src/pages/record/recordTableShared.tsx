import { Image, Popover } from 'antd';
import { FiImage, FiVideo } from 'react-icons/fi';
import { getDouyinEmbedUrl } from '@/utils';

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

export function RecordVideoCell({ video }: { video?: string | null }) {
  if (!video) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <FiVideo size={13} />
        无视频
      </span>
    );
  }

  // 抖音视频没有本地缩略帧，用图标占位 + 弹层内嵌播放器
  const douyinEmbedUrl = getDouyinEmbedUrl(video);

  return (
    <Popover
      trigger="hover"
      placement="bottomLeft"
      overlayClassName="[&_.ant-popover-inner]:rounded-xl! [&_.ant-popover-inner]:p-2.5! [&_.ant-popover-inner]:shadow-sm!"
      content={douyinEmbedUrl
        ? <iframe src={douyinEmbedUrl} title="抖音视频" allow="fullscreen" className="h-56 w-96 rounded-lg border-0 bg-black" />
        : <video src={video} controls className="h-56 w-96 rounded-lg bg-black" />}
    >
      <div className="group/vid relative size-14 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-black dark:border-strokedark cursor-pointer">
        {douyinEmbedUrl ? (
          <span className="flex h-full w-full items-center justify-center text-white/80 transition-transform duration-200 group-hover/vid:scale-105">
            <FiVideo size={16} />
          </span>
        ) : (
          <video src={video} muted className="h-full w-full object-cover transition-transform duration-200 group-hover/vid:scale-105" />
        )}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 text-white opacity-0 transition-opacity group-hover/vid:opacity-100">
          <FiVideo size={16} />
        </span>
      </div>
    </Popover>
  );
}

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
