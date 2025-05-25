import React, { useState } from 'react';
import { Location } from '@/types/location';
import { Route } from '@/types/route';
import { api } from '@/utils/api';

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

  const handleRouteSelect = async (routeId: number) => {
    if (!startLocation || !endLocation) {
      setError('出発地と目的地を選択してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 実際のAPIからルート情報を取得
      const routes = await api.searchRoute(
        [startLocation.lat, startLocation.lng],
        [endLocation.lat, endLocation.lng]
      );

      // 選択されたルートを探す
      const selectedRoute = routes.find(route => route.routeId === routeId);
      if (!selectedRoute) {
        throw new Error('選択されたルートが見つかりません');
      }

      onRouteSelect(selectedRoute);
    } catch (error) {
      console.error('ルート検索エラー:', error);
      setError('ルートの検索に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

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
      </div>
    </div>
  );
};

export default RouteSelector; 