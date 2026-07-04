import axios from 'axios';
import { getEnvConfigDataAPI } from '@/api/config';

function formatProvinceCity(province: string, city: string) {
  if (province && city && province !== city) return `${province}${city}`;
  return province || city;
}

function formatAmapAddress(regeocode: {
  addressComponent?: {
    province?: string;
    city?: string | string[];
  };
}) {
  const comp = regeocode.addressComponent;
  if (!comp) return '';

  const province = comp.province || '';
  const city = (Array.isArray(comp.city) ? comp.city[0] : comp.city) || '';
  return formatProvinceCity(province, city);
}

async function reverseGeocodeByAmap(lng: number, lat: number, key: string) {
  const { data } = await axios.get('https://restapi.amap.com/v3/geocode/regeo', {
    params: {
      location: `${lng},${lat}`,
      key,
      extensions: 'base',
      coordsys: 'gps',
    },
  });

  if (data?.infocode === '10001') return null;
  if (data.status === '1' && data.regeocode) {
    const address = formatAmapAddress(data.regeocode);
    return address || null;
  }
  return null;
}

async function reverseGeocodeByBigDataCloud(lat: number, lng: number) {
  const { data } = await axios.get('https://api.bigdatacloud.net/data/reverse-geocode-client', {
    params: {
      latitude: lat,
      longitude: lng,
      localityLanguage: 'zh',
    },
  });

  const admin = data.localityInfo?.administrative as { order?: number; name?: string }[] | undefined;
  const province =
    data.principalSubdivision || admin?.find((item) => item.order === 3)?.name || '';
  const city = data.city || data.locality || admin?.find((item) => item.order === 4)?.name || '';

  return formatProvinceCity(province, city) || null;
}

export async function resolveLocationAddress(lng: number, lat: number, gaodeKey?: string) {
  if (gaodeKey) {
    try {
      const amapAddress = await reverseGeocodeByAmap(lng, lat, gaodeKey);
      if (amapAddress) return amapAddress;
    } catch (error) {
      console.warn('高德逆地理编码失败，尝试备用方案', error);
    }
  }

  return reverseGeocodeByBigDataCloud(lat, lng);
}

export async function loadGaodeWebKey() {
  try {
    const coordinate = await getEnvConfigDataAPI('gaode_coordinate');
    const coordinateKey = (coordinate.data.value as { key?: string })?.key?.trim();
    if (coordinateKey) return coordinateKey;

    const map = await getEnvConfigDataAPI('gaode_map');
    const mapKey = (map.data.value as { key_code?: string })?.key_code?.trim();
    return mapKey || '';
  } catch {
    return '';
  }
}
