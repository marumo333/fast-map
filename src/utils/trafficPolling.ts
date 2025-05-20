import { useEffect, useRef } from 'react';
import { api } from './api';

export type TrafficInfo = {
  routeId: number;
  congestion: 'low' | 'medium' | 'high';
  delay: number; // 分単位の遅延
  lastUpdated: Date;
};

export const useTrafficPolling = (
  routeId: number,
  interval: number = 30000, // デフォルト30秒
  onUpdate: (info: TrafficInfo) => void
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchTrafficInfo = async () => {
      try {
        const info = await api.getTrafficInfo(routeId);
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
  }, [routeId, interval, onUpdate]);
}; 