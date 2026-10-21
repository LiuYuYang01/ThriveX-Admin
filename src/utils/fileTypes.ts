/**
 * 上传允许的文件类型，需与后端白名单保持一致：
 * ThriveX-Server/model/.../enums/file/FileImageExtensionEnum.java、FileVideoExtensionEnum.java
 */
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/** 视频只允许 mp4：浏览器能在线播放的格式里只有 MP4(H.264) 做到了全平台覆盖 */
export const VIDEO_EXTENSIONS = ['.mp4'];

export const UPLOAD_ACCEPT = [
  ...IMAGE_EXTENSIONS,
  ...VIDEO_EXTENSIONS,
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
].join(',');
