export const WEATHER_OPTIONS = [
  { value: 'sunny', emoji: '☀️', label: '晴' },
  { value: 'cloudy', emoji: '⛅', label: '多云' },
  { value: 'overcast', emoji: '☁️', label: '阴' },
  { value: 'rainy', emoji: '🌧️', label: '雨' },
  { value: 'snowy', emoji: '❄️', label: '雪' },
  { value: 'windy', emoji: '🌬️', label: '风' },
  { value: 'foggy', emoji: '🌫️', label: '雾' },
  { value: 'thunder', emoji: '⛈️', label: '雷阵雨' },
  { value: 'night', emoji: '🌙', label: '夜' },
] as const;

export type WeatherValue = (typeof WEATHER_OPTIONS)[number]['value'];

export const getWeatherMeta = (value?: string) =>
  WEATHER_OPTIONS.find((item) => item.value === value);
