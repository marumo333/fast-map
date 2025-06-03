import React, { useState } from 'react';

type Route = {
  routeId: number;
  path: [number, number][];
  distance: number;
  duration: number;
};

type RouteRecommendationProps = {
  routes: Route[];
  onSelect: (route: Route) => void;
  onClose?: () => void;
};

const RouteRecommendation: React.FC<RouteRecommendationProps> = ({
  routes,
  onSelect,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  const getRecommendationText = (route: Route) => {
    switch (route.routeId) {
      case 1:
        return '最短ルート - 最も早く目的地に到着できます';
      case 2:
        return '混雑回避ルート - 交通量の少ない道を優先します';
      default:
        return 'その他のルート';
    }
  };

  return (
    <div className="route-recommendations relative">
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="閉じる"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
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