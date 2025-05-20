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
  };

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="出発地"
            className="flex-1 p-2 border rounded"
          />
          <input
            type="text"
            placeholder="目的地"
            className="flex-1 p-2 border rounded"
          />
        </div>
        <button
          onClick={handleSearch}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          ルートを検索
        </button>
      </div>

      {routes.length > 0 && (
        <div className="mt-4 space-y-4">
          {routes.map((route) => (
            <div
              key={route.routeId}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onRouteSelect(route)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">
                    {route.isTollRoad ? '有料ルート' : '無料ルート'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    距離: {route.distance}m / 所要時間: {route.duration}分
                  </p>
                </div>
                {route.isTollRoad && (
                  <div className="text-red-500 font-bold">
                    ¥{route.tollFee.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RouteSelector; 