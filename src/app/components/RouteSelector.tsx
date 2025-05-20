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
  onRouteSelect
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRouteSelect = (routeId: number) => {
    setIsLoading(true);
    // モックデータの生成
    const mockRoute: Route = {
      routeId,
      path: [
        [35.6812, 139.7671],
        [35.6815, 139.7675],
        [35.6820, 139.7680]
      ],
      distance: 2.5,
      duration: 15,
      isTollRoad: routeId === 2
    };

    // 実際のAPIでは、ここでサーバーからルート情報を取得
    setTimeout(() => {
      onRouteSelect(mockRoute);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <input
            type="text"
            placeholder="出発地"
            className="flex-1 p-3 border rounded-lg text-base"
            readOnly
            value={startLocation ? `${startLocation.lat}, ${startLocation.lng}` : ''}
          />
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <input
            type="text"
            placeholder="目的地"
            className="flex-1 p-3 border rounded-lg text-base"
            readOnly
            value={endLocation ? `${endLocation.lat}, ${endLocation.lng}` : ''}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => handleRouteSelect(1)}
          disabled={isLoading}
          className="w-full p-4 bg-blue-500 text-white rounded-lg text-base font-medium shadow-sm hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '読み込み中...' : '最短ルート'}
        </button>
        <button
          onClick={() => handleRouteSelect(2)}
          disabled={isLoading}
          className="w-full p-4 bg-green-500 text-white rounded-lg text-base font-medium shadow-sm hover:bg-green-600 active:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '読み込み中...' : '混雑回避ルート'}
        </button>
        <button
          onClick={() => handleRouteSelect(3)}
          disabled={isLoading}
          className="w-full p-4 bg-purple-500 text-white rounded-lg text-base font-medium shadow-sm hover:bg-purple-600 active:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '読み込み中...' : '景色の良いルート'}
        </button>
      </div>
    </div>
  );
};

export default RouteSelector; 