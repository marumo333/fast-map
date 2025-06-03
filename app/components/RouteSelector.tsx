import React, { useState, useEffect } from 'react';
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

  // 初回マウント時にルートを取得
  useEffect(() => {
    if (!startLocation || !endLocation) return;

    const fetchRoutes = async () => {
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
      } catch (error) {
        console.error('ルート検索エラー:', error);
        setError(error instanceof Error ? error.message : 'ルートの検索に失敗しました。もう一度お試しください。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoutes();
  }, [startLocation, endLocation]);

  const handleRouteSelect = (routeId: number) => {
    const selectedRoute = routes.find(route => route.routeId === routeId);
    if (!selectedRoute) {
      setError('選択されたルートが見つかりません');
      return;
    }

    setSelectedRouteId(routeId);
    onRouteSelect(selectedRoute);
    setDismissedRoutes(prev => [...prev, routeId]);
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

      {isLoading && (
        <div className="text-center text-gray-500">
          ルートを検索中...
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {visibleRoutes.map((route) => (
          <RouteNotification
            key={route.routeId}
            type="congestion"
            message={`${route.distance.toFixed(1)}km ${Math.round(route.duration)}分`}
            onAccept={() => handleRouteSelect(route.routeId)}
            onDismiss={() => handleDismiss(route.routeId)}
            currentRoute={route}
            suggestedRoute={undefined}
          />
        ))}
      </div>

      {!isLoading && routes.length === 0 && (
        <div className="text-center text-gray-500">
          ルートを検索するには、出発地と目的地を選択してください
        </div>
      )}
    </div>
  );
};

export default RouteSelector; 