declare module '*.png';
declare module '*.webp';
declare module '*.svg';
declare module '*.jpeg';
declare module '*.jpg';

declare module '*.svg?raw' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

// vite 提供的类型（import.meta.glob 等）
/// <reference types="vite/client" />

// 引入 vendored muya 引擎的环境模块声明（snapsvg / flowchart.js / prism 插件等）
/// <reference path="../vendor/muya/types/index.d.ts" />

declare module 'prismjs/components.js';
