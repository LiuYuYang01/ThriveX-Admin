export const revalidateFrontendCacheAPI = async (baseUrl: string) => {
  const url = `${baseUrl.replace(/\/$/, '')}/api/revalidate`;
  const res = await fetch(url, { method: 'POST' });

  if (!res.ok) {
    throw new Error(`请求失败: ${res.status}`);
  }

  return res.json().catch(() => ({}));
};
