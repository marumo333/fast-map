import React from 'react';
import { Route } from '@/types/route';

type RouteNotificationProps = {
  currentRoute: Route;
  suggestedRoute: Route;
  reason: 'congestion' | 'accident' | 'clear';
  onAccept: () => void;
  onDismiss: () => void;
};

const RouteNotification: React.FC<RouteNotificationProps> = ({
  currentRoute,
  suggestedRoute,
  reason,
  onAccept,
  onDismiss,
}) => {
  const getReasonText = () => {
    switch (reason) {
      case 'congestion':
        return '渋滞が発生しています';
      case 'accident':
        return '事故が発生しています';
      case 'clear':
        return '渋滞が解消されました';
      default:
        return '';
    }
  };

  const getTimeDifference = () => {
    return Math.abs(suggestedRoute.estimatedTime - currentRoute.estimatedTime);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-50">
      <div className="flex flex-col space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">
              {reason === 'clear' ? '元のルートに戻れます' : '新しいルートを提案'}
            </h3>
            <p className="text-gray-600 mt-1">{getReasonText()}</p>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">
                {suggestedRoute.isTollRoad ? '有料ルート' : '無料ルート'}
              </p>
              <p className="text-sm text-gray-600">
                所要時間: {suggestedRoute.estimatedTime}分
                {reason !== 'clear' && (
                  <span className="text-green-600 ml-2">
                    ({getTimeDifference()}分早い)
                  </span>
                )}
              </p>
            </div>
            {suggestedRoute.isTollRoad && (
              <p className="text-red-600 font-medium">
                ¥{suggestedRoute.tollFee.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onAccept}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            {reason === 'clear' ? '元のルートに戻る' : 'このルートに変更'}
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            現在のルートを維持
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteNotification; 