import { useState, useEffect } from 'react';
import { Route } from '@/types/route';

type RouteChangeReason = 'congestion' | 'accident' | 'clear';

type RouteChange = {
  suggestedRoute: Route;
  reason: RouteChangeReason;
};

export const useRouteChangeDetection = (
  currentRoute: Route | null,
  trafficInfo: any
) => {
  const [routeChange, setRouteChange] = useState<RouteChange | null>(null);

  useEffect(() => {
    if (!currentRoute || !trafficInfo) return;

    // 渋滞が発生した場合
    if (trafficInfo.congestion === 'high' && currentRoute.isTollRoad === false) {
      // 有料ルートを提案
      const suggestedRoute: Route = {
        ...currentRoute,
        routeId: 2,
        isTollRoad: true,
        tollFee: 1000,
        estimatedTime: currentRoute.estimatedTime - 5, // 5分早いと仮定
      };
      setRouteChange({
        suggestedRoute,
        reason: 'congestion',
      });
    }
    // 事故が発生した場合
    else if (trafficInfo.congestion === 'high' && trafficInfo.delay > 15) {
      // 代替ルートを提案
      const suggestedRoute: Route = {
        ...currentRoute,
        routeId: 3,
        estimatedTime: currentRoute.estimatedTime - 10, // 10分早いと仮定
      };
      setRouteChange({
        suggestedRoute,
        reason: 'accident',
      });
    }
    // 渋滞が解消された場合
    else if (
      trafficInfo.congestion === 'low' &&
      currentRoute.isTollRoad === true
    ) {
      // 無料ルートに戻すことを提案
      const suggestedRoute: Route = {
        ...currentRoute,
        routeId: 1,
        isTollRoad: false,
        tollFee: 0,
        estimatedTime: currentRoute.estimatedTime + 5, // 5分遅いと仮定
      };
      setRouteChange({
        suggestedRoute,
        reason: 'clear',
      });
    }
  }, [currentRoute, trafficInfo]);

  const clearRouteChange = () => {
    setRouteChange(null);
  };

  return {
    routeChange,
    clearRouteChange,
  };
}; 