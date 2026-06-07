let configCache: Record<string, string> | null = null;

export const getApiUrl = (): string =>
  configCache?.VITE_PROJECT_API || import.meta.env.VITE_PROJECT_API || '';

export const loadRuntimeConfig = async (): Promise<void> => {
  // 本地开发使用 .env / .env.local，线上使用 public/config.json
  if (import.meta.env.DEV) return;

  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (res.ok) configCache = await res.json();
  } catch {
    console.error('加载配置失败');
  }
};
