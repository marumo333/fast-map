import { useEffect, useState, useRef } from 'react';
import { Route } from '../types/route';
import { TrafficInfo } from '../utils/trafficPolling';
import { api } from '../utils/api';

export const useRouteChangeDetection = (
  currentRoute: Route | undefined,
  trafficInfo: TrafficInfo | null,
  onRouteChange: (newRoute: Route) => void
) => {
  const [isChecking, setIsChecking] = useState(false);
  const errorCountRef = useRef(0);
  const lastCheckTimeRef = useRef(0);
  const MAX_ERROR_COUNT = 3;
  const MIN_CHECK_INTERVAL = 60000; // 1分間隔

  useEffect(() => {
    const checkRouteChange = async () => {
      if (isChecking || !currentRoute || !trafficInfo) return;
      
      // エラー回数が上限に達している場合は処理を中断
      if (errorCountRef.current >= MAX_ERROR_COUNT) {
        console.log('エラー回数が上限に達したため、ルート変更の確認を停止します');
        return;
      }

      // 前回のチェックから一定時間経過していない場合はスキップ
      const now = Date.now();
      if (now - lastCheckTimeRef.current < MIN_CHECK_INTERVAL) {
        return;
      }

      setIsChecking(true);
      lastCheckTimeRef.current = now;

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
            (route.durationInTraffic || route.duration) < (currentRoute.durationInTraffic || currentRoute.duration) * 0.9 // 10%以上短縮される場合
          );

          if (betterRoute) {
            onRouteChange(betterRoute);
          }
        }
        // 成功したらエラーカウントをリセット
        errorCountRef.current = 0;
      } catch (error) {
        console.error('ルート変更の確認中にエラーが発生しました:', error);
        errorCountRef.current += 1;
        
        if (errorCountRef.current >= MAX_ERROR_COUNT) {
          console.log('エラー回数が上限に達したため、ルート変更の確認を停止します');
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkRouteChange();
  }, [currentRoute, trafficInfo, onRouteChange, isChecking]);
}; 