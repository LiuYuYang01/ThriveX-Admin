// 对象转url参数
export const ObjectToUrlParam = (obj: object): string => {
    return obj && new URLSearchParams(
        Object.keys(obj).reduce((acc, key) => {
            acc[key] = String(obj[key as keyof object]);
            return acc;
        }, {} as Record<string, string>)
    ).toString();
}

// 抖音视频的站内播放地址，非抖音链接返回 null
export const getDouyinEmbedUrl = (url?: string | null): string | null => {
    const match = url?.match(/douyin\.com\/(?:share\/)?video\/(\d+)/);
    return match ? `https://www.douyin.com/player/${match[1]}?autoplay=0` : null;
}
