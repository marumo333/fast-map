import React from 'react';
import { Route } from '@/types/route';

interface RouteNotificationProps {
  currentRoute: Route;
  suggestedRoute: Route;
  reason: 'congestion' | 'accident' | 'construction';
  onAccept: (route: Route) => void;
  onDismiss: () => void;
}

export const RouteNotification: React.FC<RouteNotificationProps> = ({
  currentRoute,
  suggestedRoute,
  reason,
  onAccept,
  onDismiss
}) => {
  const handleAccept = () => {
    onAccept(suggestedRoute);
  };

  const handleDismiss = () => {
    onDismiss();
  };

  const getReasonText = () => {
    switch (reason) {
      case 'congestion':
        return '渋滞が発生しています';
      case 'accident':
        return '事故が発生しています';
      case 'construction':
        return '工事が発生しています';
      default:
        return '';
    }
  };

  const timeDifference = Math.round((suggestedRoute.duration.driving - currentRoute.duration.driving) / 60);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md mx-auto">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{getReasonText()}</h3>
          <p className="text-sm text-gray-600 mt-1">
            より良いルートが見つかりました
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-800">有料ルート</span>
          <span className="font-medium text-gray-900">{suggestedRoute.isTollRoad ? 'あり' : 'なし'}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-800">所要時間:</span>
          <span className="font-medium text-gray-900">
            {Math.round(suggestedRoute.duration.driving / 60)}分
            {timeDifference !== 0 && (
              <span className={`ml-2 ${timeDifference < 0 ? 'text-green-600' : 'text-red-600'}`}>
                ({timeDifference > 0 ? '+' : ''}{timeDifference}分)
              </span>
            )}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-800">料金:</span>
          <span className="font-medium text-gray-900">¥不明</span>
        </div>
      </div>

      <div className="mt-4 flex space-x-3">
        <button
          onClick={handleAccept}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          このルートに変更
        </button>
        <button
          onClick={handleDismiss}
          className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          現在のルートを維持
        </button>
      </div>
    </div>
  );
}; 