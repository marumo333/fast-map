import { useEffect, useState } from 'react';
import { Route } from '../types/route';
import { TrafficInfo } from '../utils/trafficPolling';
import { api } from '../utils/api';

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
        if (trafficInfo.traffic_level === '混雑') {
          // 代替ルートを検索
          const alternativeRoutes = await api.searchRoute(
            [currentRoute.path[0][0], currentRoute.path[0][1]],
            [currentRoute.path[currentRoute.path.length - 1][0], currentRoute.path[currentRoute.path.length - 1][1]]
          );

          // 現在のルートより所要時間が短い代替ルートを探す
          const betterRoute = alternativeRoutes.find(route => 
            route.routeId !== currentRoute.routeId && 
            route.duration_in_traffic < currentRoute.duration_in_traffic * 0.9 // 10%以上短縮される場合
          );

          if (betterRoute) {
            onRouteChange(betterRoute);
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