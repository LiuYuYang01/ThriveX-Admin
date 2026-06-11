import { getWebConfigDataAPI } from '@/api/config';
import { DEFAULT_FILE_CONFIG, FileConfig, UploadCompressMode } from '@/types/app/config';

const VALID_MODES: UploadCompressMode[] = ['original', 'auto', 'light', 'medium', 'strong'];

export function normalizeFileConfig(value?: Partial<FileConfig>): FileConfig {
  const mode = value?.upload_compress_mode;
  return {
    upload_compress_mode: mode && VALID_MODES.includes(mode) ? mode : DEFAULT_FILE_CONFIG.upload_compress_mode,
  };
}

export async function fetchFileConfig(): Promise<FileConfig> {
  try {
    const { data } = await getWebConfigDataAPI('file');
    return normalizeFileConfig(data.value);
  } catch {
    return DEFAULT_FILE_CONFIG;
  }
}
