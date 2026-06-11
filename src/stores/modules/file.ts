import { create } from 'zustand';
import { DEFAULT_FILE_CONFIG, FileConfig } from '@/types/app/config';

interface FileStore {
  file: FileConfig;
  setFile: (data: FileConfig) => void;
}

export default create<FileStore>((set) => ({
  file: DEFAULT_FILE_CONFIG,
  setFile: (data: FileConfig) => set(() => ({ file: data })),
}));
