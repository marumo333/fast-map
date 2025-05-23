import { useEffect, useState } from 'react';
import { Route } from '@/types/route';
import { TrafficInfo } from '@/utils/trafficPolling';
import { api } from '@/utils/api';

export const useRouteChangeDetection = (
  currentRoute: Route | undefined,
  trafficInfo: TrafficInfo | null,
  onRouteChange: (newRoute: Route) => void
) => {
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkRouteChange = async () => {
      if (isChecking || !currentRoute || !trafficInfo) return;
      setIsChecking(true);

      try {
        // 渋滞が発生した場合
        if (trafficInfo.traffic_level === '混雑' && currentRoute.isTollRoad === false) {
          // 有料ルートを提案
          const suggestedRoute: Route = {
            ...currentRoute,
            isTollRoad: true,
            duration_in_traffic: Math.floor(currentRoute.duration_in_traffic * 0.8), // 20%短縮を想定
            trafficInfo: [{
              duration_in_traffic: Math.floor(currentRoute.duration_in_traffic * 0.8),
              traffic_level: '通常'
            }]
          };

          // 所要時間が20%以上短縮される場合のみ提案
          if (suggestedRoute.duration_in_traffic < currentRoute.duration_in_traffic * 0.8) {
            onRouteChange(suggestedRoute);
          }
        }
      } catch (error) {
        console.error('ルート変更の確認中にエラーが発生しました:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkRouteChange();
  }, [currentRoute, trafficInfo, onRouteChange, isChecking]);
}; 