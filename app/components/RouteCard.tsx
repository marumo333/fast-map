import React from 'react';
import { Route } from '../types/route';

type RouteCardProps = {
  route: Route;
  isSelected: boolean;
  onSelect: () => void;
};

const RouteCard: React.FC<RouteCardProps> = ({ route, isSelected, onSelect }) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;
  };

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return `${km.toFixed(1)}km`;
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 rounded-lg text-left transition-colors ${
        isSelected
          ? 'bg-blue-50 border-2 border-blue-500'
          : 'bg-white border border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {route.isTollRoad ? '有料ルート' : '無料ルート'}
          </h3>
          {route.isTollRoad && (
            <p className="text-sm text-gray-600">
              料金: {route.toll.toLocaleString()}円
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-medium text-gray-900">
            {formatDuration(route.duration)}
          </p>
          <p className="text-sm text-gray-600">
            {formatDistance(route.distance)}
          </p>
        </div>
      </div>
      {route.durationInTraffic && (
        <p className="text-sm text-gray-600">
          渋滞考慮: {formatDuration(route.durationInTraffic)}
        </p>
      )}
    </button>
  );
};

export default RouteCard; 