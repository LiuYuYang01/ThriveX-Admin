export const revalidateFrontendCacheAPI = async (baseUrl: string, tags?: string[]) => {
  const url = `${baseUrl.replace(/\/$/, '')}/api/revalidate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // 不传 tags 时前台会清空全部标签
    body: tags?.length ? JSON.stringify({ tags }) : undefined,
  });

  if (!res.ok) {
    throw new Error(`请求失败: ${res.status}`);
  }

  return res.json().catch(() => ({}));
};
