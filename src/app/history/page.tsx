'use client';
import React from 'react';
import { Route } from '@/types/route';

const HistoryPage = () => {
  // 仮の履歴データ
  const history: Route[] = [
    {
      routeId: 1,
      path: [[35.6812, 139.7671], [35.6812, 139.7671]],
      distance: 5000,
      duration: {
        driving: 1800,
        walking: 3600
      },
      duration_in_traffic: 2000,
      isTollRoad: false,
      mode: 'driving',
      trafficInfo: [
        {
          duration_in_traffic: 2000,
          traffic_level: '通常'
        }
      ],
      estimatedTime: 30
    },
    // 他の履歴データを追加
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">履歴</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {history.map((route) => (
            <li key={route.routeId}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-600 truncate">
                      ルート #{route.routeId}
                    </p>
                    <div className="mt-2 flex">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg
                          className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {(route.distance / 1000).toFixed(1)}km
                      </div>
                      <div className="ml-6 flex items-center text-sm text-gray-500">
                        <svg
                          className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {route.duration.driving ? 
                          `${Math.round(route.duration.driving / 60)}分` : 
                          '利用不可'}
                      </div>
                      {route.isTollRoad && (
                        <div className="ml-6 flex items-center text-sm text-red-500">
                          <svg
                            className="flex-shrink-0 mr-1.5 h-5 w-5 text-red-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          有料道路あり
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      type="button"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      詳細を見る
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HistoryPage; 