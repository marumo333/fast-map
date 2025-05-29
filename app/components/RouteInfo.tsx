'use client';

import React from 'react';

export type RouteInfo = {
  distance: number;  // メートル単位
  duration: {
    driving: number;  // 秒単位
    walking: number;  // 秒単位
  };
  isTollRoad: boolean;
};

interface RouteInfoProps {
  routeInfo: RouteInfo;
}

const RouteInfo: React.FC<RouteInfoProps> = ({ routeInfo }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">ルート情報</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-800">距離:</span>
          <span className="font-medium text-gray-900">{(routeInfo.distance / 1000).toFixed(1)}km</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-800">車での所要時間:</span>
          <span className="font-medium text-gray-900">{Math.round(routeInfo.duration.driving / 60)}分</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-800">徒歩での所要時間:</span>
          <span className="font-medium text-gray-900">{Math.round(routeInfo.duration.walking / 60)}分</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-800">有料道路:</span>
          <span className="font-medium text-gray-900">{routeInfo.isTollRoad ? 'あり' : 'なし'}</span>
        </div>
      </div>
    </div>
  );
};

export default RouteInfo; 