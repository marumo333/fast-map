import { useEffect, useRef } from 'react';
import { api } from './api';
import { Location } from '@/types/location';

export type TrafficInfo = {
  routeId: number;
  congestion: string;
  delay: number;
  lastUpdated: string;
};

export const useTrafficPolling = (
  routeId: number,
  interval: number = 30000, // デフォルト30秒
  onUpdate: (info: TrafficInfo) => void,
  startLocation?: Location,
  endLocation?: Location
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchTrafficInfo = async () => {
      try {
        const start = startLocation ? [startLocation.lat, startLocation.lng] as [number, number] : undefined;
        const end = endLocation ? [endLocation.lat, endLocation.lng] as [number, number] : undefined;
        const info = await api.getTrafficInfo(routeId, start, end);
        onUpdate(info);
      } catch (error) {
        console.error('交通情報の取得に失敗しました:', error);
      }
    };

    // 初回実行
    if (routeId > 0) {
      fetchTrafficInfo();
    }

    // 定期的なポーリングを開始
    if (routeId > 0) {
      timerRef.current = setInterval(fetchTrafficInfo, interval);
    }

    // クリーンアップ
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [routeId, interval, onUpdate, startLocation, endLocation]);
}; 