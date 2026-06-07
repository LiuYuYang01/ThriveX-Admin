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
