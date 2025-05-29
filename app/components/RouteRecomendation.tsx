import React from 'react';

type Route = {
  routeId: number;
  path: [number, number][];
  distance: number;
  duration: number;
};

type RouteRecommendationProps = {
  routes: Route[];
  onSelect: (route: Route) => void;
};

const RouteRecommendation: React.FC<RouteRecommendationProps> = ({
  routes,
  onSelect
}) => {
  const getRecommendationText = (route: Route) => {
    switch (route.routeId) {
      case 1:
        return '最短ルート - 最も早く目的地に到着できます';
      case 2:
        return '混雑回避ルート - 交通量の少ない道を優先します';
      case 3:
        return '景色の良いルート - 観光スポットを経由します';
      default:
        return 'その他のルート';
    }
  };

  return (
    <div className="route-recommendations">
      <h2 className="text-xl font-semibold mb-4">おすすめルート</h2>
      <div className="space-y-4">
        {routes.map((route) => (
          <div
            key={route.routeId}
            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => onSelect(route)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">ルート {route.routeId}</h3>
                <p className="text-sm text-gray-600">
                  {getRecommendationText(route)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">
                  距離: {(route.distance / 1000).toFixed(1)}km
                </p>
                <p className="text-sm">
                  所要時間: {Math.round(route.duration / 60)}分
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RouteRecommendation; 