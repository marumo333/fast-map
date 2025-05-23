import { useEffect, useRef } from 'react';
import { Location } from '@/types/location';
import { api } from '@/utils/api';

export interface TrafficInfo {
  duration_in_traffic: number;
  traffic_level: string;
  duration: {
    driving: number;
    walking: number;
  };
}

export const useTrafficPolling = (
  routeId: number,
  interval: number = 30000, // デフォルトで30秒
  onUpdate: (info: TrafficInfo) => void,
  startLocation?: Location,
  endLocation?: Location
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInfoRef = useRef<TrafficInfo | null>(null);

  useEffect(() => {
    if (!routeId || !startLocation || !endLocation) return;

    const fetchTrafficInfo = async () => {
      try {
        console.log('交通情報取得開始:', { routeId, start: startLocation, end: endLocation });
        const info = await api.getTrafficInfo(routeId);
        
        // 前回の情報と比較して、変化がある場合のみ更新
        if (!lastInfoRef.current || 
            lastInfoRef.current.duration_in_traffic !== info.duration_in_traffic ||
            lastInfoRef.current.traffic_level !== info.traffic_level) {
          console.log('交通情報が更新されました:', info);
          lastInfoRef.current = info;
          onUpdate(info);
        } else {
          console.log('交通情報に変化なし');
        }
      } catch (error) {
        console.error('交通情報の取得に失敗しました:', error);
      }
    };

    // 初回実行
    fetchTrafficInfo();

    // 定期的な更新
    timerRef.current = setInterval(fetchTrafficInfo, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [routeId, interval, onUpdate, startLocation, endLocation]);
}; 