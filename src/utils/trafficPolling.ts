import { useEffect, useRef } from 'react';
import { Location } from '@/types/location';
import { api } from '@/utils/api';

export interface TrafficInfo {
  duration_in_traffic: number;
  traffic_level: string;
}

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
        if (!startLocation || !endLocation) {
          console.warn('出発地または目的地が設定されていません');
          return;
        }

        // 座標の範囲チェック
        const isValidCoordinate = (lat: number, lng: number) => {
          return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        };

        if (!isValidCoordinate(startLocation.lat, startLocation.lng) || 
            !isValidCoordinate(endLocation.lat, endLocation.lng)) {
          console.error('座標が範囲外です:', { startLocation, endLocation });
          return;
        }

        const start = [startLocation.lat, startLocation.lng] as [number, number];
        const end = [endLocation.lat, endLocation.lng] as [number, number];

        console.log('交通情報取得開始:', {
          routeId,
          start,
          end
        });

        const info = await api.getTrafficInfo(routeId);
        onUpdate(info);
      } catch (error) {
        console.error('交通情報の取得に失敗しました:', {
          error,
          routeId,
          startLocation,
          endLocation
        });
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