let configCache: Record<string, string> | null = null;

export const getApiUrl = (): string =>
  configCache?.VITE_PROJECT_API || import.meta.env.VITE_PROJECT_API || '';

export const loadRuntimeConfig = async (): Promise<void> => {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (res.ok) configCache = await res.json();
  } catch {}
};
