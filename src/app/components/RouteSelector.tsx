import React, { useState } from 'react';
import { Location } from '@/types/location';
import { Route } from '@/types/route';

type RouteSelectorProps = {
  startLocation: Location | null;
  endLocation: Location | null;
  onRouteSelect: (route: Route) => void;
};

const RouteSelector: React.FC<RouteSelectorProps> = ({
  startLocation,
  endLocation,
  onRouteSelect,
}) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

  // ルート検索のモックデータ
  const mockRoutes: Route[] = [
    {
      routeId: 1,
      path: [[35.6812, 139.7671], [35.6812, 139.7672]],
      distance: 1000,
      duration: 15,
      isTollRoad: false,
      tollFee: 0,
      estimatedTime: 15,
    },
    {
      routeId: 2,
      path: [[35.6812, 139.7671], [35.6812, 139.7672]],
      distance: 800,
      duration: 10,
      isTollRoad: true,
      tollFee: 1000,
      estimatedTime: 10,
    },
  ];

  const handleSearch = () => {
    // 実際のAPI呼び出しの代わりにモックデータを使用
    setRoutes(mockRoutes);
    setSelectedRouteId(null);
  };

  // 時間差を計算
  const getTimeDifference = (route1: Route, route2: Route) => {
    return Math.abs(route1.estimatedTime - route2.estimatedTime);
  };

  const handleRouteSelect = (route: Route) => {
    setSelectedRouteId(route.routeId);
    onRouteSelect(route);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <input
            type="text"
            placeholder="出発地"
            className="flex-1 p-3 border rounded-lg text-base"
          />
          <input
            type="text"
            placeholder="目的地"
            className="flex-1 p-3 border rounded-lg text-base"
          />
        </div>
        <button
          onClick={handleSearch}
          className="w-full bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 text-base font-medium h-[52px]"
        >
          ルートを検索
        </button>
      </div>

      {routes.length > 0 && (
        <div className="mt-4 space-y-4">
          {routes.map((route) => (
            <div
              key={route.routeId}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedRouteId === route.routeId
                  ? 'bg-blue-50 border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleRouteSelect(route)}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-lg">
                      {route.isTollRoad ? '有料ルート' : '無料ルート'}
                    </h3>
                    {route.isTollRoad && (
                      <span className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded-full">
                        有料
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    <p className="text-base text-gray-600">
                      距離: {(route.distance / 1000).toFixed(1)}km
                    </p>
                    <p className="text-base text-gray-600">
                      所要時間: {route.estimatedTime}分
                    </p>
                    {route.isTollRoad && (
                      <p className="text-base text-red-600 font-medium">
                        料金: ¥{route.tollFee.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                {routes.length > 1 && (
                  <div className="ml-4 text-base text-gray-500">
                    {route.isTollRoad ? (
                      <p>無料ルートより{getTimeDifference(route, routes[0])}分早い</p>
                    ) : (
                      <p>有料ルートより{getTimeDifference(route, routes[1])}分遅い</p>
                    )}
                  </div>
                )}
              </div>
              <button
                className={`mt-4 w-full p-3 rounded-lg text-base font-medium transition-colors ${
                  selectedRouteId === route.routeId
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRouteSelect(route);
                }}
              >
                {selectedRouteId === route.routeId ? '選択中' : 'このルートを選択'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RouteSelector; 