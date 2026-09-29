import { Image, Popover, Tooltip } from 'antd';
import { FiPlay } from 'react-icons/fi';
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

/** 缩略图外框：只在亮色下补一条发丝边，照片在白底上才不会散掉。 */
const thumbFrame = 'border border-slate-200/80 dark:border-strokedark';

const previewsOverlay =
  '[&_.ant-popover-inner]:rounded-xl! [&_.ant-popover-inner]:border! [&_.ant-popover-inner]:border-slate-200/80! [&_.ant-popover-inner]:p-2.5! [&_.ant-popover-inner]:shadow-sm! dark:[&_.ant-popover-inner]:border-strokedark!';

function VideoPopover({ video, tile }: { video: string; tile: React.ReactNode }) {
  const douyinEmbedUrl = getDouyinEmbedUrl(video);

  return (
    <Popover
      trigger="hover"
      placement="bottomLeft"
      overlayClassName={previewsOverlay}
      content={
        douyinEmbedUrl ? (
          <iframe
            src={douyinEmbedUrl}
            title="抖音视频"
            allow="fullscreen"
            className="h-56 w-96 rounded-lg border-0 bg-black"
          />
        ) : (
          <video src={video} controls className="h-56 w-96 rounded-lg bg-black" />
        )
      }
    >
      <div className="cursor-pointer">{tile}</div>
    </Popover>
  );
}

/** 视频方块：抖音链接没有本地封面帧，用播放角标占位；其余直接用首帧。 */
function VideoTile({ video, size }: { video: string; size: string }) {
  const douyinEmbedUrl = getDouyinEmbedUrl(video);

  const tile = (
    <div
      className={`group/vid relative shrink-0 overflow-hidden rounded-lg bg-black ${thumbFrame} ${size}`}
    >
      {douyinEmbedUrl ? (
        <span className="flex h-full w-full items-center justify-center text-white/75">
          <FiPlay size={14} />
        </span>
      ) : (
        <video
          src={video}
          muted
          preload="metadata"
          className="h-full w-full object-cover transition-transform duration-200 group-hover/vid:scale-105"
        />
      )}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 text-white opacity-0 transition-opacity group-hover/vid:opacity-100">
        <FiPlay size={14} />
      </span>
    </div>
  );

  return <VideoPopover video={video} tile={tile} />;
}

function ImageTile({ src, size }: { src: string; size: string }) {
  return (
    <div
      className={`group/img relative shrink-0 overflow-hidden rounded-lg ${thumbFrame} ${imageCellClass} ${size}`}
    >
      <Image
        src={src}
        width={56}
        height={56}
        className="object-cover transition-transform duration-200 group-hover/img:scale-105"
        preview={{ mask: '预览' }}
      />
    </div>
  );
}

function OverflowTile({ count, size }: { count: number; size: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-300 ${size}`}
    >
      +{count}
    </div>
  );
}

function AllImagesPopover({
  images,
  trigger,
  wrapperClassName = '',
}: {
  images: string[];
  trigger: React.ReactNode;
  wrapperClassName?: string;
}) {
  return (
    <Popover
      trigger="hover"
      placement="bottomLeft"
      overlayClassName={previewsOverlay}
      content={
        <Image.PreviewGroup>
          <div className="flex max-w-[280px] flex-wrap gap-1.5">
            {images.map((src, idx) => (
              <ImageTile key={idx} src={src} size="size-14" />
            ))}
          </div>
        </Image.PreviewGroup>
      }
    >
      <span className={`inline-block cursor-default ${wrapperClassName}`}>
        <Image.PreviewGroup>{trigger}</Image.PreviewGroup>
      </span>
    </Popover>
  );
}

/**
 * 闪念的附件条：图片与视频合并成一条，而不是各占一个表格列。
 * 没有任何附件时返回 null —— 用沉默代替「无图片 / 无视频」两列占位噪声。
 */
export function RecordMediaStrip({
  imagesRaw,
  video,
  max = 3,
  size = 'size-12 sm:size-14',
  className = '',
}: {
  imagesRaw: string | string[] | undefined;
  video?: string | null;
  max?: number;
  size?: string;
  className?: string;
}) {
  const images = parseRecordImages(imagesRaw);
  if (images.length === 0 && !video) return null;

  const tiles: React.ReactNode[] = [];

  images.slice(0, max).forEach((src, idx) => {
    tiles.push(<ImageTile key={`img-${idx}`} src={src} size={size} />);
  });

  if (images.length > max) {
    tiles.push(<OverflowTile key="more" count={images.length - max} size={size} />);
  }

  if (video) {
    tiles.push(<VideoTile key="video" video={video} size={size} />);
  }

  // 外层负责在卡片正文行里的定位（宽屏靠右），内层只排缩略图
  const inner = <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">{tiles}</div>;
  const outer = `shrink-0 ${className}`;

  if (images.length > max) {
    return <AllImagesPopover images={images} trigger={inner} wrapperClassName={outer} />;
  }

  return <div className={outer}>{inner}</div>;
}

/** 列表视图的附件列：有图给缩略图，只有视频给播放块，确实没有才留一个短横线。 */
export function RecordMediaCell({
  imagesRaw,
  video,
}: {
  imagesRaw: string | string[] | undefined;
  video?: string | null;
}) {
  const images = parseRecordImages(imagesRaw);

  if (images.length > 0) {
    return (
      <AllImagesPopover
        images={images}
        trigger={
          <div className="flex items-center gap-1.5">
            <ImageTile src={images[0]} size="size-11" />
            {images.length > 1 && <OverflowTile count={images.length - 1} size="size-11" />}
          </div>
        }
      />
    );
  }

  if (video) {
    return <VideoTile video={video} size="size-11" />;
  }

  return (
    <Tooltip title="这条闪念没有附件">
      <span className="text-slate-300 dark:text-slate-600">—</span>
    </Tooltip>
  );
}
