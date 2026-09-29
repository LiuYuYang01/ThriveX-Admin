import { getAssistantModelLogo, getAssistantModelTheme } from '../modelConfig';

type ModelIconProps = {
  model: string;
  size?: 'sm' | 'md';
};

/** 服务商图标：有 logo 时置于白底瓷片，无 logo 时渲染品牌色首字母 */
export default function ModelIcon({ model, size = 'md' }: ModelIconProps) {
  const theme = getAssistantModelTheme(model);
  const logo = getAssistantModelLogo(model);
  const isSm = size === 'sm';
  const boxClass = isSm ? 'size-7 rounded-lg' : 'size-12 rounded-xl';
  const imgClass = isSm ? 'size-4.5' : 'size-8';
  const isAvatar = theme.logoShape === 'avatar';

  if (logo) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center border border-slate-100 bg-white shadow-sm dark:border-strokedark dark:bg-white/95 ${boxClass}`}
      >
        <img
          src={logo}
          alt=""
          className={`${imgClass} object-contain ${isAvatar ? 'rounded-full' : ''}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${boxClass} shrink-0 items-center justify-center text-xs font-bold tracking-tight ${theme.bgClass} ${theme.textClass}`}
    >
      {theme.icon}
    </div>
  );
}
