import { useEffect, useRef } from 'react';
import { Location } from '@/types/location';
import { api } from '@/utils/api';

export interface TrafficInfo {
  duration_in_traffic: number;
  traffic_level: string;
}

export const useTrafficPolling = (
  routeId: number,
  interval: number = 30000, // デフォルトで30秒
  onUpdate: (info: TrafficInfo) => void,
  startLocation?: Location,
  endLocation?: Location
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!routeId || !startLocation || !endLocation) return;

    const fetchTrafficInfo = async () => {
      try {
        console.log('交通情報取得開始:', { routeId, start: startLocation, end: endLocation });
        const info = await api.getTrafficInfo(routeId);
        onUpdate(info);
      } catch (error) {
        console.error('交通情報の取得に失敗しました:', error);
      }
    };

    // 初回実行
    fetchTrafficInfo();

    // 定期的な更新
    const timer = setInterval(fetchTrafficInfo, interval);

    return () => clearInterval(timer);
  }, [routeId, interval, onUpdate, startLocation, endLocation]);
}; 