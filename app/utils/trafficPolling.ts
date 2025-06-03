import { useEffect, useRef } from 'react';
import { Location } from '../types/location';
import { getTrafficInfo } from './api';
import { Route } from '../types/route';

export interface TrafficInfo {
  congestion: string;
  delay: number;
  lastUpdated: number;
  duration: {
    driving: number;
    walking: number;
  };
  traffic_level: string;
}

export const useTrafficPolling = (
  routeId: number,
  interval: number = 30000,
  onUpdate: (info: TrafficInfo) => void,
  startLocation?: Location,
  endLocation?: Location
) => {
  const timerRef = useRef<NodeJS.Timeout>();
  const lastInfoRef = useRef<TrafficInfo | null>(null);

  useEffect(() => {
    if (!routeId || !startLocation || !endLocation) {
      return;
    }

    const fetchTrafficInfo = async () => {
      try {
        const info = await getTrafficInfo(routeId, startLocation, endLocation);
        
        // 前回の情報と比較して変更がある場合のみ更新
        if (!lastInfoRef.current || 
            lastInfoRef.current.congestion !== info.congestion ||
            lastInfoRef.current.delay !== info.delay ||
            lastInfoRef.current.duration.driving !== info.duration.driving ||
            lastInfoRef.current.duration.walking !== info.duration.walking ||
            lastInfoRef.current.traffic_level !== info.traffic_level) {
          
          lastInfoRef.current = info;
          onUpdate(info);
          console.log('交通情報を更新:', info);
        }
      } catch (error) {
        console.error('交通情報の取得に失敗:', error);
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

let pollingInterval: NodeJS.Timeout | null = null;

export const startTrafficPolling = (
  route: Route,
  onUpdate: (updatedRoute: Route) => void
) => {
  // 既存のポーリングを停止
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  // 30秒ごとに交通情報を更新
  pollingInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/traffic/${route.routeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('交通情報の取得に失敗しました');
      }

      const updatedRoute = await response.json();
      onUpdate(updatedRoute);
    } catch (error) {
      console.error('交通情報の更新エラー:', error);
    }
  }, 30000);
};

export const stopTrafficPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}; 