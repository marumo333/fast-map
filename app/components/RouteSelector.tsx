import React, { useState } from 'react';
import { Location } from '../types/location';
import { Route } from '../types/route';
import RouteNotification from './RouteNotification';

type RouteSelectorProps = {
  startLocation: Location | null;
  endLocation: Location | null;
  onRouteSelect: (route: Route) => void;
};

const RouteSelector: React.FC<RouteSelectorProps> = ({
  startLocation,
  endLocation,
  onRouteSelect
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [dismissedRoutes, setDismissedRoutes] = useState<number[]>([]);

  const handleRouteSelect = async (routeId: number) => {
    if (!startLocation || !endLocation) {
      setError('出発地と目的地を選択してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('ルート検索開始:', {
        start: [startLocation.lat, startLocation.lng],
        end: [endLocation.lat, endLocation.lng]
      });

      const response = await fetch('/api/routes/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: startLocation,
          end: endLocation
        }),
      });

      if (!response.ok) {
        throw new Error('ルートの取得に失敗しました');
      }

      const routeData = await response.json();
      console.log('取得したルート:', routeData);

      setRoutes(routeData);
      setSelectedRouteId(routeId);

      // 選択されたルートを探す
      const selectedRoute = routeData.find((route: Route) => route.routeId === routeId);
      if (!selectedRoute) {
        throw new Error('選択されたルートが見つかりません');
      }

      onRouteSelect(selectedRoute);
      // 選択したルートを非表示リストに追加
      setDismissedRoutes(prev => [...prev, routeId]);
    } catch (error) {
      console.error('ルート検索エラー:', error);
      setError(error instanceof Error ? error.message : 'ルートの検索に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = (routeId: number) => {
    setDismissedRoutes(prev => [...prev, routeId]);
  };

  // 表示するルートをフィルタリング
  const visibleRoutes = routes.filter(route => !dismissedRoutes.includes(route.routeId));

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {visibleRoutes.map((route) => (
          <RouteNotification
            key={route.routeId}
            type="congestion"
            message={route.isTollRoad ? '有料ルート' : '無料ルート'}
            onAccept={() => handleRouteSelect(route.routeId)}
            onDismiss={() => handleDismiss(route.routeId)}
            currentRoute={route}
            suggestedRoute={undefined}
          />
        ))}
      </div>

      {routes.length === 0 && (
        <div className="text-center text-gray-500">
          ルートを検索するには、出発地と目的地を選択してください
        </div>
      )}
    </div>
  );
};

export default RouteSelector; 