import { Image, Popover } from 'antd';

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

const IMAGE_BOX = { width: 60, height: 60 } as const;
const POPOVER_THUMB = { width: 56, height: 56 } as const;

export function RecordImagesCell({ imagesRaw }: { imagesRaw: string | string[] | undefined }) {
  const list = parseRecordImages(imagesRaw);
  if (list.length === 0) {
    return <span className="text-xs text-gray-300 dark:text-gray-500">无图片</span>;
  }

  const trigger = (
    <div className="record-images-collapse flex items-center gap-2">
      <div
        className="record-image-container group/img relative overflow-hidden rounded-lg border border-gray-100 shadow-xs dark:border-strokedark"
        style={IMAGE_BOX}
      >
        <Image
          src={list[0]}
          width={IMAGE_BOX.width}
          height={IMAGE_BOX.height}
          className="object-cover transition-transform duration-300 group-hover/img:scale-110"
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          preview={{ mask: '预览' }}
        />
      </div>
      {list.length > 1 && (
        <div
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-100 bg-gray-100 text-sm font-medium text-gray-500 dark:border-strokedark dark:bg-boxdark-2 dark:text-gray-400"
          style={IMAGE_BOX}
        >
          +
          {list.length - 1}
        </div>
      )}
    </div>
  );

  if (list.length <= 1) {
    return (
      <Image.PreviewGroup>
        {trigger}
      </Image.PreviewGroup>
    );
  }

  return (
    <Popover
      trigger="hover"
      placement="bottomLeft"
      overlayClassName="record-images-popover"
      content={(
        <Image.PreviewGroup>
          <div className="flex max-w-[280px] flex-wrap items-center gap-1.5">
            {list.map((src, idx) => (
              <div
                key={idx}
                className="record-image-container shrink-0 overflow-hidden rounded-sm border border-gray-100 dark:border-strokedark"
                style={POPOVER_THUMB}
              >
                <Image
                  src={src}
                  width={POPOVER_THUMB.width}
                  height={POPOVER_THUMB.height}
                  className="object-cover"
                  style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                  preview={{ mask: '预览' }}
                />
              </div>
            ))}
          </div>
        </Image.PreviewGroup>
      )}
    >
      <span className="inline-block">
        <Image.PreviewGroup>
          {trigger}
        </Image.PreviewGroup>
      </span>
    </Popover>
  );
}

export function RecordImageStyles() {
  return (
    <style>
      {`
        .record-image-container .ant-image,
        .record-image-container .ant-image-img,
        .record-image-container .ant-image-mask {
          width: 100% !important;
          height: 100% !important;
        }
        .record-image-container .ant-image {
          display: block !important;
        }
        .record-image-container .ant-image-img {
          object-fit: cover !important;
        }
        .record-images-popover.ant-popover .ant-popover-inner {
          padding: 10px;
          border-radius: 10px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }
      `}
    </style>
  );
}
