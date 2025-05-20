import { useEffect, useRef } from 'react';

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
        const response = await fetch(`/api/traffic/${routeId}`);
        const data = await response.json();
        onUpdate(data);
      } catch (error) {
        console.error('交通情報の取得に失敗しました:', error);
      }
    };

    // 初回実行
    fetchTrafficInfo();

    // 定期的なポーリングを開始
    timerRef.current = setInterval(fetchTrafficInfo, interval);

    // クリーンアップ
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [routeId, interval, onUpdate]);
}; 