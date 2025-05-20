import React, { useState } from 'react';

type Location = {
  lat: number;
  lng: number;
};

type Route = {
  routeId: number;
  path: [number, number][];
  distance: number;
  duration: number;
};

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
  const [routes, setRoutes] = useState<Route[]>([]);

  const fetchRoutes = async () => {
    if (!startLocation || !endLocation) {
      console.log('出発地または目的地が設定されていません');
      return;
    }

    console.log('ルート取得開始:', {
      start: startLocation,
      end: endLocation,
      timestamp: new Date().toISOString()
    });

    setIsLoading(true);
    setError(null);

    try {
      const startTime = performance.now();
      const response = await fetch(
        `/api/route?startLat=${startLocation.lat}&startLng=${startLocation.lng}&endLat=${endLocation.lat}&endLng=${endLocation.lng}`
      );

      if (!response.ok) {
        throw new Error('ルートの取得に失敗しました');
      }

      const data = await response.json();
      const endTime = performance.now();
      
      console.log('ルート取得完了:', {
        processingTime: `${(endTime - startTime).toFixed(2)}ms`,
        routesCount: data.routes?.length || 0,
        fromCache: data.fromCache
      });
      
      if (Array.isArray(data.routes) && data.routes.length > 0) {
        setRoutes(data.routes);
        
        // 最初のルートを自動選択
        if (onRouteSelect) {
          onRouteSelect(data.routes[0]);
        }
      } else {
        setError('ルートが見つかりませんでした');
      }
    } catch (err) {
      console.error('ルート取得エラー:', err);
      setError(err instanceof Error ? err.message : 'ルートの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {isLoading && <div>ルートを検索中...</div>}
      {routes.length > 0 && (
        <div className="routes">
          {routes.map((route) => (
            <div
              key={route.routeId}
              className="route"
              onClick={() => {
                const startTime = performance.now();
                console.log('ルート選択開始:', {
                  routeId: route.routeId,
                  timestamp: new Date().toISOString()
                });
                onRouteSelect(route);
                const endTime = performance.now();
                console.log('ルート選択完了:', {
                  routeId: route.routeId,
                  processingTime: `${(endTime - startTime).toFixed(2)}ms`
                });
              }}
              style={{
                borderLeft: `4px solid ${getRouteColor(route.routeId)}`,
                padding: '10px',
                margin: '10px 0',
                cursor: 'pointer',
                backgroundColor: '#f5f5f5'
              }}
            >
              <h3>ルート {route.routeId}</h3>
              <p>距離: {(route.distance / 1000).toFixed(1)}km</p>
              <p>所要時間: {Math.round(route.duration / 60)}分</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getRouteColor = (routeId: number): string => {
  switch (routeId) {
    case 1: return '#FF0000'; // 赤 - 最短ルート
    case 2: return '#00FF00'; // 緑 - 混雑回避ルート
    case 3: return '#0000FF'; // 青 - 景色の良いルート
    default: return '#808080';
  }
};

export default RouteSelector; 