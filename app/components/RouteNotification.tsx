import React from 'react';
import { Route } from '../types/route';

export type NotificationType = 'congestion' | 'accident' | 'construction';

export interface RouteNotificationProps {
  type: NotificationType;
  message: string;
  onAccept: () => void;
  onDismiss: () => void;
  currentRoute?: Route;
  suggestedRoute?: Route;
}

const RouteNotification: React.FC<RouteNotificationProps> = ({
  type,
  message,
  onAccept,
  onDismiss,
  currentRoute,
  suggestedRoute
}) => {
  const getIcon = () => {
    switch (type) {
      case 'congestion':
        return '🚗';
      case 'accident':
        return '⚠️';
      case 'construction':
        return '🚧';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border-l-4 border-yellow-500">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">
            {message}
          </p>
          {currentRoute && suggestedRoute && (
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">現在のルート:</span>
                <span className="font-medium text-gray-900">
                  {Math.round((currentRoute.durationInTraffic || currentRoute.duration) / 60)}分
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">代替ルート:</span>
                <span className="font-medium text-gray-900">
                  {Math.round((suggestedRoute.durationInTraffic || suggestedRoute.duration) / 60)}分
                  <span className="text-green-600 ml-1">
                    ({Math.round((1 - (suggestedRoute.durationInTraffic || suggestedRoute.duration) / (currentRoute.durationInTraffic || currentRoute.duration)) * 100)}%短縮)
                  </span>
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">距離:</span>
                <span className="font-medium text-gray-900">
                  {(suggestedRoute.distance / 1000).toFixed(1)}km
                </span>
              </div>
            </div>
          )}
          <div className="mt-4 flex space-x-3">
            <button
              type="button"
              onClick={onAccept}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              代替ルートを表示
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteNotification; 