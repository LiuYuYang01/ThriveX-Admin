import Compressor from 'compressorjs';
import { UploadCompressMode } from '@/types/app/config';

const QUALITY_MAP: Record<Exclude<UploadCompressMode, 'original' | 'auto'>, number> = {
  light: 0.92,
  medium: 0.75,
  strong: 0.5,
};

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

function blobToFile(blob: Blob, source: File): File {
  return new File([blob], source.name, {
    type: blob.type || source.type,
    lastModified: Date.now(),
  });
}

export function compressImageFile(file: File, mode: UploadCompressMode): Promise<File> {
  if (mode === 'original' || !isImageFile(file)) {
    return Promise.resolve(file);
  }

  return new Promise((resolve, reject) => {
    const options: Compressor.Options = {
      success: (blob) => resolve(blobToFile(blob, file)),
      error: reject,
    };

    if (mode !== 'auto') {
      options.quality = QUALITY_MAP[mode];
    }

    new Compressor(file, options);
  });
}

export async function compressImageFiles(files: File[], mode: UploadCompressMode): Promise<File[]> {
  return Promise.all(files.map((file) => compressImageFile(file, mode)));
}

export function getUploadCompressModeLabel(mode: UploadCompressMode): string {
  const labels: Record<UploadCompressMode, string> = {
    original: '原图',
    auto: '自适应',
    light: '高清',
    medium: '均衡',
    strong: '强力',
  };
  return labels[mode] ?? '自适应';
}
